var async = require('async');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs-extra');
var Jimp = require('jimp');
var path = require('path');
var request = require('request');
var sha1 = require('sha1');
var url = require('url');
var yazl = require('yazl');
var utils = require('./utils.js');

var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

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
   console.log('Animation called');
   var bbox;
   var borders = false;
   var hash = sha1(JSON.stringify(plotRequest));
   var layerID;
   var saveStatusQueue = async.queue(saveStatus, 1);

   readStatus(function(status) {
      if (!status || status.state == PlotStatus.failed) {
         fs.writeFile(path.join(plotDir, hash + '-request.json'), JSON.stringify(plotRequest));

         updateStatus(PlotStatus.initialising, null, null, null, null, function(err) {
            next(err, hash);
         });

         downloadTiles(function() {
            render(function(err, stdout, stderr) {
               console.log('err: \n' + err);
               console.log('stdout: \n' + stdout);
               console.log('stderr: \n' + stderr);

               if (!err) {
                  buildHtml(function(err) {
                     if (!err) {
                        buildZip(function() {
                           updateStatus(PlotStatus.complete);
                           console.log('Finished rendering! ^_^');
                           cleanup();
                        });
                     } else {
                        updateStatus(PlotStatus.failed, null, null, null, err);
                        cleanup();
                     }
                  });
               } else {
                  updateStatus(PlotStatus.failed, null, null, null, err);
                  console.log('Failed rendering! ;_;');
                  // console.log(err);
                  cleanup();
               }
            });
         });
      } else {
         next(null, hash);
      }
   });

   function downloadTiles(next) {
      console.log('starting download');
      var maxWidth = 1024;
      var maxHeight = 1024;

      var mapOptions = plotRequest.plot.baseMap;

      var bordersOptions;
      if (plotRequest.plot.countryBorders) {
         bordersOptions = plotRequest.plot.countryBorders;
      }

      var dataOptions = plotRequest.plot.data.series[0].data_source;
      layerID = dataOptions.layer_id;
      var wmsUrl = dataOptions.wmsUrl;
      var params = dataOptions.wmsParams;
      var slices = dataOptions.timesSlices;

      bbox = dataOptions.bbox;
      var bboxArr = bbox.split(',');
      var bboxWidth = bboxArr[2] - bboxArr[0];
      var bboxHeight = bboxArr[3] - bboxArr[1];

      var height;
      var width;

      if ((bboxHeight / bboxWidth) <= 1) {
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
      var slicesDownloaded = [];

      var downloadQueue = async.queue(download, 10);

      updateStatus(PlotStatus.extracting);

      fs.mkdirs(path.join(downloadDir, domain, hash), function(err) {
         if (!err) {
            downloadDir = path.join(downloadDir, domain);
            downloadQueue.push({
               uri: url.format(mapUrl),
               filepath: path.join(downloadDir, hash, 'map.jpg'),
               id: 'map'
            }, downloadComplete);

            if (borders) {
               downloadQueue.push({
                  uri: url.format(bordersUrl),
                  filepath: path.join(downloadDir, hash, 'borders.png'),
                  id: 'borders'
               }, downloadComplete);
            }

            for (var i = 0; i < slices.length; i++) {
               dataURL.query.TIME = slices[i];
               var filename = layerID + '_' + bbox.replace(/\,/, '-') + '_' + slices[i].replace(/\:/, '-') + '.png';
               var filepath = path.join(downloadDir, filename);
               downloadQueue.push({
                  uri: url.format(dataURL),
                  filename: filename,
                  filepath: filepath,
                  id: slices[i]
               }, downloadComplete);
            }
         }
      });

      var retries = {};

      function download(options, next) {
         if (utils.fileExists(options.filepath)) {
            options.existing = true;
            done();
         } else {
            options.existing = false;
            request(options.uri, {
                  timeout: 60000
               })
               .on('error', done)
               .pipe(fs.createWriteStream(options.filepath))
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
               downloadQueue.push({
                  uri: options.uri,
                  filepath: options.filepath,
                  id: options.id
               }, downloadComplete);
            } else {
               console.error(err);
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
                  fs.copy(options.filepath, path.join(downloadDir, hash, options.filename), done);
               } else {
                  Jimp.read(options.filepath, function(err, image) {
                     Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(function(fontB) {
                        Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function(fontW) {
                           image.print(fontB, 10, 10, options.id);
                           image.print(fontW, 11, 11, options.id);
                           image.write(options.filepath, function() {
                              fs.copy(options.filepath, path.join(downloadDir, hash, options.filename), done);
                           });
                        });
                     });
                  });
               }
            }
         }

         function done(err) {
            if (err) {
               console.error(err);
            }
            if (options.id != 'map' && options.id != 'borders') {
               slicesDownloaded.push(options.filepath);
               console.log('downloaded: ' + slicesDownloaded.length + ' of ' + slices.length);
            }
            if (mapDownloaded && (!borders || bordersDownloaded) && slicesDownloaded.length == slices.length) {
               next();
            }
         }
      }
   }

   function render(next) {
      updateStatus(PlotStatus.rendering);
      console.log('Rendering');

      var videoPathMP4 = path.join(plotDir, hash + '-video.mp4');
      var videoPathWebM = path.join(plotDir, hash + '-video.webm');

      var renderer = ffmpeg({
            stdoutLines: 0
         })
         .input(path.join(downloadDir, hash, 'map.jpg'))
         .input(path.join(downloadDir, hash, layerID + '_' + bbox.replace(/\,/, '-') + '_' + '*' + '.png'))
         .inputOption('-pattern_type glob')
         .inputFPS(1);

      if (borders) {
         renderer = renderer
            .input(path.join(downloadDir, hash, 'borders.png'))
            .complexFilter('overlay,overlay,split=2[out1][out2]');
      } else {
         renderer = renderer.complexFilter('overlay,split=2[out1][out2]');
      }

      renderer
         .output(videoPathMP4)
         .videoCodec('libx264')
         .outputOptions(['-map [out1]', '-crf 23', '-preset medium', '-pix_fmt yuv420p', '-movflags +faststart'])
         .outputFPS(10)
         .noAudio()
         .output(videoPathWebM)
         .videoCodec('libvpx-vp9')
         .outputOptions(['-map [out2]', '-crf 20', '-b:v 0', '-pix_fmt yuv420p'])
         .outputFPS(10)
         .noAudio()
         .on('end', next)
         .on('error', next)
         .run();
   }

   function cleanup() {
      fs.remove(path.join(downloadDir, hash));
   }

   function buildHtml(next) {
      var htmlPath = path.join(plotDir, hash + '-plot.html');
      var video = '<video controls><source src="/plots/' + hash + '-video.webm" type="video/webm"><source src="/plots/' + hash + '-video.mp4" type="video/mp4"/></video>';
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
            // :(
         });

      zip.addFile(path.join(plotDir, hash + '-video.mp4'), hash + '-video.mp4');
      zip.addFile(path.join(plotDir, hash + '-video.webm'), hash + '-video.webm');
      zip.end();
   }

   function readStatus(next) {
      var statusPath = path.join(plotDir, hash + '-status.json');

      if (utils.fileExists(statusPath)) {
         fs.readFile(statusPath, 'utf8', function(err, statusString) {
            if (!err) {
               next(JSON.parse(statusString));
            } else {
               next(null);
            }
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
                  // :'(
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