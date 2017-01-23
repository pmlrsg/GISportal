var async = require('async');
var child_process = require('child_process');
var ON_DEATH = require('death');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('path');
var request = require('request');
var sha1 = require('sha1');
var _ = require('underscore');
var url = require('url');
var xml2js = require('xml2js');
var yazl = require('yazl');
var settingsApi = require('./settingsapi.js');
var utils = require('./utils.js');

// Temporary inclusion to spot blocking issues
var blocked = require('blocked');
blocked(function(time) {
   console.log('Node was blocked for ' + time + ' ms');
}, {
   threshold: 5
});

var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

var MAXWIDTH = 1920;
var MAXHEIGHT = 1080;

var PlotStatus = Object.freeze({
   initialising: 'initialising',
   extracting: 'extracting',
   rendering: 'rendering',
   complete: 'complete',
   failed: 'failed'
});

var animation = {};
module.exports = animation;

animation.animate = function(plotRequest, domain, plotDir, downloadDir, logDir, next) {
   // OFF_DEATH variable that will hold the function to disable the ON_DEATH hook
   var OFF_DEATH;

   var bbox;
   var borders = false;
   var layerID;
   var maxHeight = MAXHEIGHT;
   var maxWidth = MAXWIDTH;

   var hash = sha1(JSON.stringify(plotRequest));
   var saveStatusQueue = async.queue(saveStatus, 1);

   readStatus(function(status) {
      if (!status || status.state == PlotStatus.failed) {
         fs.writeFile(path.join(plotDir, hash + '-request.json'), JSON.stringify(plotRequest));

         OFF_DEATH = ON_DEATH(function(signal) {
            console.log('\nON_DEATH called');
            updateStatus(PlotStatus.failed, null, null, null, null, function() {
               cleanup(function() {
                  process.kill(process.pid, signal);
               });
            });
         });

         updateStatus(PlotStatus.initialising, null, null, null, null, function(err) {
            next(err, hash);
         });

         var mapOptions = plotRequest.plot.baseMap;
         var dataOptions = plotRequest.plot.data.series[0].data_source;

         var bordersOptions;
         if (plotRequest.plot.countryBorders) {
            bordersOptions = plotRequest.plot.countryBorders;
         }

         getMaxResolution(mapOptions, dataOptions, bordersOptions, function() {
            downloadTiles(mapOptions, dataOptions, bordersOptions, function(err) {
               if (err) {
                  return handleError(err);
               }
               render(function(err, stdout, stderr) {
                  if (err) {
                     return handleError(stderr);
                  }
                  buildHtml(function(err) {
                     if (err) {
                        return handleError(err);
                     }
                     buildZip(function(err) {
                        if (err) {
                           return handleError(err);
                        }
                        updateStatus(PlotStatus.complete);
                        cleanup();
                     });
                  });
               });
            });
         });
      } else {
         next(null, hash);
      }
   });

   function handleError(err) {
      updateStatus(PlotStatus.failed, null, null, null, err);
      cleanup();
   }

   function getMaxResolution(mapOptions, dataOptions, bordersOptions, next) {
      var mapDone = false;
      var bordersDone = false;
      var dataDone = false;

      var mapUrl = url.parse(mapOptions.wmsUrl);
      mapUrl.search = undefined;
      mapUrl.query = {
         SERVICE: 'WMS',
         REQUEST: 'GetCapabilities'
      };
      makeRequest(url.format(mapUrl), function() {
         mapDone = true;
         done();
      });

      if (bordersOptions) {
         borders = true;
         var bordersUrl = url.parse(bordersOptions.wmsUrl);
         bordersUrl.search = undefined;
         bordersUrl.query = {
            SERVICE: 'WMS',
            REQUEST: 'GetCapabilities'
         };
         makeRequest(url.format(bordersUrl), function() {
            bordersDone = true;
            done();
         });
      } else {
         bordersDone = true;
      }

      var dataURL = url.parse(dataOptions.wmsUrl, true);
      dataURL.search = undefined;
      dataURL.query = {
         SERVICE: 'WMS',
         REQUEST: 'GetCapabilities'
      };
      makeRequest(url.format(dataURL), function() {
         dataDone = true;
         done();
      });

      function done() {
         if (mapDone && bordersDone && dataDone) {
            next();
         }
      }

      function makeRequest(wmsUrl, next) {
         request(wmsUrl, function(err, response, body) {
            if (err) {
               next(err);
            } else {
               xml2js.parseString(body, {
                  async: true,
                  tagNameProcessors: [settingsApi.stripPrefix],
                  attrNameProcessors: [settingsApi.stripPrefix]
               }, function(err, result) {
                  if (err) {
                     next(err);
                  } else {
                     if (result.WMS_Capabilities && result.WMS_Capabilities.Service) {
                        if (result.WMS_Capabilities.Service[0].MaxWidth) {
                           var layerMaxWidth = result.WMS_Capabilities.Service[0].MaxWidth[0];
                           if (layerMaxWidth < maxWidth) {
                              maxWidth = layerMaxWidth;
                           }
                        }
                        if (result.WMS_Capabilities.Service[0].MaxHeight) {
                           var layerMaxHeight = result.WMS_Capabilities.Service[0].MaxHeight[0];
                           if (layerMaxHeight < maxHeight) {
                              maxHeight = layerMaxHeight;
                           }
                        }
                     }
                     next();
                  }
               });
            }
         });
      }
   }

   function downloadTiles(mapOptions, dataOptions, bordersOptions, next) {
      layerID = dataOptions.layer_id;
      var wmsUrl = dataOptions.wmsUrl;
      var params = dataOptions.wmsParams;
      var slices = _.uniq(dataOptions.timesSlices);

      bbox = dataOptions.bbox;
      var bboxArr = bbox.split(',');
      var bboxWidth = bboxArr[2] - bboxArr[0];
      var bboxHeight = bboxArr[3] - bboxArr[1];

      var height = 0;
      var width = 0;

      if ((bboxHeight / bboxWidth) <= maxHeight / maxWidth) {
         height = 2 * Math.round(((bboxHeight / bboxWidth) * maxWidth) / 2);
         width = maxWidth;
      } else {
         height = maxHeight;
         width = 2 * Math.round(((bboxWidth / bboxHeight) * maxHeight) / 2);
      }

      var mapUrl = url.parse(mapOptions.wmsUrl);
      mapUrl.search = undefined;
      mapUrl.query = {
         SERVICE: 'WMS',
         VERSION: mapOptions.wmsParams.VERSION,
         REQUEST: 'GetMap',
         FORMAT: 'image/jpeg',
         TRANSPARENT: false,
         LAYERS: mapOptions.wmsParams.LAYERS,
         wrapDateLine: mapOptions.wmsParams.wrapDateLine,
         SRS: mapOptions.wmsParams.SRS,
         WIDTH: width,
         HEIGHT: height,
         BBOX: bbox
      };

      var bordersUrl;
      if (bordersOptions) {
         borders = true;
         bordersUrl = url.parse(bordersOptions.wmsUrl);
         bordersUrl.search = undefined;
         bordersUrl.query = {
            SERVICE: 'WMS',
            VERSION: bordersOptions.wmsParams.VERSION,
            REQUEST: 'GetMap',
            FORMAT: 'image/png',
            TRANSPARENT: true,
            LAYERS: bordersOptions.wmsParams.LAYERS,
            STYLES: bordersOptions.wmsParams.STYLES,
            wrapDateLine: mapOptions.wmsParams.wrapDateLine,
            SRS: bordersOptions.wmsParams.SRS,
            WIDTH: width,
            HEIGHT: height,
            BBOX: bbox
         };
      }

      var dataURL = url.parse(wmsUrl, true);
      dataURL.search = undefined;
      var time = new Date(params.time);

      dataURL.query = {
         SERVICE: 'WMS',
         VERSION: params.VERSION,
         REQUEST: 'GetMap',
         FORMAT: 'image/png',
         TRANSPARENT: true,
         LAYERS: params.LAYERS,
         wrapDateLine: params.wrapDateLine,
         SRS: params.SRS,
         STYLES: params.STYLES,
         NUMCOLORBANDS: params.NUMCOLORBANDS,
         TIME: time.toISOString(),
         colorscalerange: params.colorscalerange,
         logscale: params.logscale,
         WIDTH: width,
         HEIGHT: height,
         BBOX: bbox
      };

      if (params.ABOVEMAXCOLOR) {
         dataURL.query.ABOVEMAXCOLOR = params.ABOVEMAXCOLOR;
      }
      if (params.BELOWMINCOLOR) {
         dataURL.query.BELOWMINCOLOR = params.BELOWMINCOLOR;
      }

      var mapDownloaded = false;
      var bordersDownloaded = false;
      var slicesDownloaded = 0;
      var retries = {};

      var downloadQueue = async.queue(download, 10);

      updateStatus(PlotStatus.extracting);

      downloadDir = path.join(downloadDir, domain);
      var hashDir = path.join(downloadDir, hash);

      var timeStamper = null;
      setupTimeStamper();

      fs.mkdirs(hashDir, function(err) {
         if (err) {
            return next(err);
         }
         downloadQueue.push({
            uri: url.format(mapUrl),
            dir: hashDir,
            filename: 'map.jpg',
            id: 'map'
         }, downloadComplete);

         if (borders) {
            downloadQueue.push({
               uri: url.format(bordersUrl),
               dir: hashDir,
               filename: 'borders.png',
               id: 'borders'
            }, downloadComplete);
         }

         for (var i = 0; i < slices.length; i++) {
            dataURL.query.TIME = slices[i];
            var filename = layerID + '_' + bbox.replace(/\,/, '-') + '_' + slices[i].replace(/\:/, '-') + '.png';
            downloadQueue.push({
               uri: url.format(dataURL),
               dir: downloadDir,
               filename: filename,
               id: slices[i],
               cache: true
            }, downloadComplete);
         }
      });

      function setupTimeStamper() {
         timeStamper = child_process.fork(path.join(__dirname, '../scripts/animation-timestamper.js'));
         timeStamper.on('message', function(options) {
            if (options.err) return handleError(options.err);

            // Rename the image from it's tempPath
            fs.rename(options.tempPath, options.filePath, function(err) {
               if (err) return handleError(err);

               // Link the image in the hashdir (TODO replace with symlink if possible)
               fs.link(options.filePath, path.join(hashDir, options.filename), function(err) {
                  if (err) return handleError(err);

                  imageReady(options);
               });
            });

            function handleError(err) {
               // If there was an error, kill the timestamper and call next with the error
               timeStamper.kill();
               next(err);
            }
         });
      }

      function download(options, next) {
         options.filePath = path.join(options.dir, options.filename);
         if (options.cache) {
            // If this download should be cached for later usage (it is a data tile)
            if (utils.fileExists(options.filePath)) {
               // If it already exists, no need to download it again
               options.existing = true;
               done();
            } else {
               // If it doesn't exist, download to a temporary path
               options.existing = false;
               options.tempPath = path.join(options.dir, 'temp_' + options.filename);
               makeRequest(options.tempPath);
            }
         } else {
            options.existing = false;
            makeRequest(options.filePath);
         }

         function makeRequest(path) {
            request(options.uri, {
                  timeout: 60000
               })
               .on('error', done)
               .pipe(fs.createWriteStream(path))
               .on('error', done)
               .on('close', done);
         }

         function done(err) {
            next(err, options);
         }
      }

      function downloadComplete(err, options) {
         if (err) {
            if (retries[options.id] === undefined) {
               retries[options.id] = 0;
            }
            if (retries[options.id] < 4) {
               retries[options.id]++;
               downloadQueue.push(options, downloadComplete);
            } else {
               done(err);
            }
         } else {
            if (options.id == 'map') {
               mapDownloaded = true;
               done();
            } else if (options.id == 'borders') {
               bordersDownloaded = true;
               done();
            } else {
               if (options.existing) {
                  fs.link(options.filePath, path.join(hashDir, options.filename), done);
               } else {
                  timeStamper.send(options);
               }
            }
         }

         function done(err) {
            if (err) {
               timeStamper.kill();
               next(err);
            } else {
               imageReady(options);
            }
         }
      }

      function imageReady(options) {
         if (options.id != 'map' && options.id != 'borders') {
            slicesDownloaded++;
         }
         if (mapDownloaded && (!borders || bordersDownloaded) && slicesDownloaded == slices.length) {
            timeStamper.kill();
            next();
         }
      }
   }

   function render(next) {
      updateStatus(PlotStatus.rendering);

      var inputFPS = plotRequest.plot.framerate || 1;
      if (inputFPS > 1) {
         inputFPS = Math.round(inputFPS);
      }
      var outputFPS = inputFPS;

      switch (inputFPS) {
         case 1:
         case 2:
            outputFPS = 10;
            break;
         case 3:
         case 4:
            outputFPS = 12;
            break;
         default:
            if (inputFPS < 1) {
               outputFPS = 10;
            } else if (inputFPS < 10) {
               outputFPS = inputFPS * 2;
            } else {
               outputFPS = inputFPS;
            }
      }

      var maxWebMBitrate = null;
      if (inputFPS <= 5) {
         maxWebMBitrate = '12M';
      } else if (inputFPS <= 10) {
         maxWebMBitrate = '20M';
      } else if (inputFPS <= 15) {
         maxWebMBitrate = '25M';
      } else if (inputFPS <= 20) {
         maxWebMBitrate = '30M';
      } else if (inputFPS <= 25) {
         maxWebMBitrate = '35M';
      } else {
         maxWebMBitrate = '45M';
      }

      var videoPathMP4 = path.join(plotDir, hash + '-video.mp4');
      var videoPathWebM = path.join(plotDir, hash + '-video.webm');

      var renderer = ffmpeg({
            stdoutLines: 0
         })
         .input(path.join(downloadDir, hash, 'map.jpg'))
         .inputOptions(['-loop 1', '-framerate ' + inputFPS])
         .input(path.join(downloadDir, hash, layerID + '_' + bbox.replace(/\,/, '-') + '_' + '*' + '.png'))
         .inputOptions(['-pattern_type glob', '-thread_queue_size 512', '-framerate ' + inputFPS]);

      if (borders) {
         renderer = renderer
            .input(path.join(downloadDir, hash, 'borders.png'))
            .inputOptions(['-loop 1', '-framerate ' + inputFPS])
            .complexFilter('overlay=shortest=1,overlay=shortest=1,split=2[out1][out2]');
      } else {
         renderer = renderer.complexFilter('overlay=shortest=1,split=2[out1][out2]');
      }

      renderer
         .output(videoPathMP4)
         .videoCodec('libx264')
         .outputOptions(['-map [out1]', '-crf 23', '-threads 2', '-preset medium', '-pix_fmt yuv420p', '-movflags +faststart'])
         .outputFPS(outputFPS)
         .noAudio()
         .output(videoPathWebM)
         .videoCodec('libvpx')
         .outputOptions(['-map [out2]', '-b:v ' + maxWebMBitrate, '-crf 15', '-threads 2', '-speed 1', '-quality good', '-pix_fmt yuv420p'])
         .outputFPS(outputFPS)
         .noAudio()
         .on('end', next)
         .on('error', next)
         // TODO monitor progress and update status file
         // .on('progress', function(progress) {
         //    console.log(progress.timemark);
         // })
         .run();
   }

   function cleanup(next) {
      OFF_DEATH();
      var i = 0;
      var numFiles = 0;

      glob(path.join(downloadDir, 'temp_*'), function(err, files) {
         if (!err) {
            numFiles = files.length;
            if (numFiles > 0) {
               files.forEach(function(file) {
                  fs.remove(file, done);
               });
            } else {
               done();
            }
         }
      });

      function done() {
         if (numFiles > 0) {
            i++;
         }
         if (i == numFiles) {
            fs.remove(path.join(downloadDir, hash), next);
         }
      }
   }

   function buildHtml(next) {
      var htmlPath = path.join(plotDir, hash + '-plot.html');
      var video = '<video controls><source src="/plots/' + hash + '-video.mp4" type="video/mp4"/><source src="/plots/' + hash + '-video.webm" type="video/webm"></video>';
      var html = '<!DOCTYPE html><html lang="en-US"><body><div id="plot">' + video + '</div></body></html>';
      fs.writeFile(htmlPath, html, 'utf8', function(err) {
         next(err);
      });
   }

   function buildZip(next) {
      var zipPath = path.join(plotDir, hash + '.zip');
      var zip = new yazl.ZipFile();
      zip.outputStream.pipe(fs.createWriteStream(zipPath))
         .on('close', function() {
            next();
         })
         .on('error', function(err) {
            next(err);
         });

      zip.addFile(path.join(plotDir, hash + '-video.mp4'), hash + '-video.mp4');
      zip.addFile(path.join(plotDir, hash + '-video.webm'), hash + '-video.webm');
      zip.end();
   }

   function readStatus(next) {
      var statusPath = path.join(plotDir, hash + '-status.json');

      if (utils.fileExists(statusPath)) {
         fs.readFile(statusPath, 'utf8', function(err, statusString) {
            if (err) {
               return next(null);
            }
            next(JSON.parse(statusString));
         });
      } else {
         next(null);
      }
   }

   function updateStatus(state, message, percentage, minRemaining, traceback, next) {
      var statusPath = path.join(plotDir, hash + '-status.json');
      var status;

      if (utils.fileExists(statusPath)) {
         fs.readFile(statusPath, 'utf8', gotStatus);
      } else {
         status = {
            job_id: hash,
            completed: false,
         };
         gotStatus();
      }

      function gotStatus(err, statusString) {
         if (!err) {
            if (statusString) {
               status = JSON.parse(statusString);
            }
            status.message = message || '';
            status.traceback = traceback || '';
            status.state = state;

            if (state == PlotStatus.complete) {
               status.completed = true;
               status.percentage = 100;
               status.minutes_remaining = 0;
            } else if (state == PlotStatus.failed) {
               status.completed = true;
               status.percentage = 100;
               status.minutes_remaining = 0;
            } else {
               status.completed = false;
               status.percentage = percentage || 0;
               status.minutes_remaining = minRemaining || -1;
            }
            saveStatusQueue.push({
               statusPath: statusPath,
               status: status
            }, function(err) {
               if (err) {
                  console.error(err);
               }
               if (next) {
                  next(err);
               }
            });
         }
      }
   }

   function saveStatus(options, next) {
      fs.writeFile(options.statusPath, JSON.stringify(options.status), 'utf8', function(err) {
         next(err);
      });
   }
};