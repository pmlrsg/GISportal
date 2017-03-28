var async = require('async');
var child_process = require('child_process');
var ON_DEATH = require('death');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('path');
var randomatic = require('randomatic');
var request = require('request');
var sha1 = require('sha1');
var _ = require('underscore');
var url = require('url');
var xml2js = require('xml2js');
var settingsApi = require('./settingsapi.js');
var utils = require('./utils.js');

var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

var MAXWIDTH = 1920;
var MAXHEIGHT = 1080;

/**
 * Frozen PlotStatus object for use as enum
 */
var PlotStatus = Object.freeze({
   initialising: 'initialising',
   extracting: 'extracting',
   rendering: 'rendering',
   complete: 'complete',
   failed: 'failed'
});

var animation = {};
module.exports = animation;

/**
 * Produce a video animation from a single WMS data layer
 * @param  {object}   plotRequest The plot request object
 * @param  {string}   plotDir     The directory to output the plot files to
 * @param  {string}   downloadDir The directory to download tiles (frames) to and use as a cache
 * @param  {string}   logDir      The directory to log requests to
 * @param  {Function} next        The function to call with the request hash
 */
animation.animate = function(plotRequest, plotDir, downloadDir, logDir, next) {
   /** Variable that will hold the function to disable the ON_DEATH hook */
   var OFF_DEATH = null;

   /** @type {string} sha1 hash of the request object */
   var hash = sha1(JSON.stringify(plotRequest));
   /** @type {object} The current status object */
   var status = null;
   /** @type {QueueObject} Queue for saving status file updates */
   var saveStatusQueue = async.queue(saveStatus, 1);

   /** @type {Object} The border options from the request */
   var bordersOptions = plotRequest.plot.countryBorders;
   /** @type {Object} The data options from the request */
   var dataOptions = plotRequest.plot.data.series[0].data_source;
   /** @type {Object} The map options from the request */
   var mapOptions = plotRequest.plot.baseMap;

   /** @type {string} The hash of the data layer WMS url, used for cache file naming */
   var dataUrlHash = null;
   /** @type {Array} Unique array of time slices */
   var slices = [];

   /** @type {number} Width of the images and video */
   var width = 0;
   /** @type {number} Height of the images and video */
   var height = 0;

   readStatus(function(status) {
      if (!status || status.state == PlotStatus.failed) {
         // If this is a new plot or has previously failed
         fs.writeFile(path.join(plotDir, hash + '-request.json'), JSON.stringify(plotRequest));

         // Setup the handler to gracefully cleanup if the progam is killed
         OFF_DEATH = ON_DEATH(function(signal) {
            updateStatus(PlotStatus.failed, 'Program was killed while processing.', null, null, null, function() {
               cleanup(function() {
                  process.kill(process.pid, signal);
               });
            });
         });

         updateStatus(PlotStatus.initialising, null, null, null, null, function(err) {
            // Once the status file has been created/updated, call next with the hash
            next(err, hash);
         });

         // Load the time slices and make them unique
         slices = _.uniq(dataOptions.timesSlices);

         // Check that the bbox isn't irregular
         if (dataOptions.bbox.substr(0, 7) == 'POLYGON') {
            return handleError('Animation doesn\'t support irregular polygons');
         }

         // Do all the processing
         getResolution(function() {
            getAutoScale(function() {
               downloadTiles(function(err) {
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
                        updateStatus(PlotStatus.complete);
                        logComplete();
                        cleanup();
                     });
                  });
               });
            });
         });
      } else {
         // Else it's a previously completed plot so just return the hash and finish
         return next(null, hash);
      }
   });

   /**
    * Get the maximum supported resolution from the map, borders and data layer and
    * calculate the resolution for the video.
    * @param  {Function} next           Function to call when done
    */
   function getResolution(next) {
      var maxWidth = MAXWIDTH;
      var maxHeight = MAXHEIGHT;
      var mapDone = false;
      var bordersDone = false;
      var dataDone = false;

      // Get the map capabilities
      if (mapOptions) {
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
      } else {
         mapDone = true;
      }

      // Get the border capabilities
      if (bordersOptions) {
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

      // Get the data layer capabilities
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

      /**
       * Handles making a request and updating the max width and height as required
       * @param  {string}   wmsUrl The WMS url to request
       * @param  {Function} next   Function to call when done
       */
      function makeRequest(wmsUrl, next) {
         request({
            url: wmsUrl,
            timeout: 5000
         }, function(err, response, body) {
            if (err) {
               next(err);
            } else {
               xml2js.parseString(body, {
                  async: true,
                  tagNameProcessors: [settingsApi.stripPrefix],
                  attrNameProcessors: [settingsApi.stripPrefix]
               }, function(err, result) {
                  if (err) {
                     return next(err);
                  }
                  if (result && result.WMS_Capabilities && result.WMS_Capabilities.Service) {
                     // If WMS_Capabilities and WMS_Capabilities.Service are defined
                     if (result.WMS_Capabilities.Service[0].MaxWidth) {
                        // Update the max width if it needs to be reduced
                        var layerMaxWidth = result.WMS_Capabilities.Service[0].MaxWidth[0];
                        if (layerMaxWidth < maxWidth) {
                           maxWidth = layerMaxWidth;
                        }
                     }
                     if (result.WMS_Capabilities.Service[0].MaxHeight) {
                        // Update the max height if it needs to be reduced
                        var layerMaxHeight = result.WMS_Capabilities.Service[0].MaxHeight[0];
                        if (layerMaxHeight < maxHeight) {
                           maxHeight = layerMaxHeight;
                        }
                     }
                  }
                  return next();
               });
            }
         });
      }

      /**
       * Called when a GetCapabilities request is complete
       * Calls next when map, borders and data layer are all done
       */
      function done() {
         if (mapDone && bordersDone && dataDone) {
            // Calculate the image width and height from the bbox and maximum allowed
            var bboxArr = dataOptions.bbox.split(',');
            var bboxWidth = bboxArr[2] - bboxArr[0];
            var bboxHeight = bboxArr[3] - bboxArr[1];

            if ((bboxHeight / bboxWidth) <= maxHeight / maxWidth) {
               height = 2 * Math.round(((bboxHeight / bboxWidth) * maxWidth) / 2);
               width = maxWidth;
            } else {
               height = maxHeight;
               width = 2 * Math.round(((bboxWidth / bboxHeight) * maxHeight) / 2);
            }
            next();
         }
      }
   }

   /**
    * If autoScale is enabled, get the min and max data values for all slices in the range.
    * @param  {Function} next Function to call when done
    */
   function getAutoScale(next) {
      if (!dataOptions.autoScale) {
         return next();
      }

      var slicesDone = 0;
      var min = null;
      var max = null;

      var dataURL = url.parse(dataOptions.wmsUrl, true);
      dataURL.search = undefined;
      dataURL.query = {
         SERVICE: 'WMS',
         VERSION: dataOptions.wmsParams.VERSION,
         REQUEST: 'GetMetadata',
         item: 'minmax',
         LAYERS: dataOptions.wmsParams.LAYERS,
         SRS: dataOptions.wmsParams.SRS,
         WIDTH: width,
         HEIGHT: height,
         BBOX: dataOptions.bbox,
         ELEVATION: dataOptions.depth
      };
      utils.deleteNullProperies(dataURL.query);

      var queue = async.queue(makeRequest, 10);

      for (var i = 0; i < slices.length; i++) {
         dataURL.query.TIME = slices[i];
         queue.push({
            uri: url.format(dataURL)
         }, done);
      }

      function makeRequest(options, next) {
         request({
            url: url.format(options.uri),
            timeout: 5000
         }, function(err, response, body) {
            if (err) {
               next(err);
            } else {
               var json = JSON.parse(body);
               if (json && json.min && json.max) {
                  if (min === null || json.min < min) {
                     min = json.min;
                  }
                  if (max === null || json.max > max) {
                     max = json.max;
                  }
               }
               return next();
            }
         });
      }

      function done() {
         slicesDone++;

         if (slicesDone == slices.length) {
            dataOptions.wmsParams.colorscalerange = min + ',' + max;
            return next();
         }
      }
   }

   /**
    * Handles downloading all the tiles/images for the map, borders, and data layer
    * @param  {Function} next           Function to call when done
    */
   function downloadTiles(next) {
      /** @type {Object} Object for recording download retries */
      var retries = {};
      /** @type {QueueObject} Queue for managing downloads */
      var downloadQueue = async.queue(download, 10);
      /** @type {string} Hash temporary directory path for this requests images to be stored */
      var hashDir = path.join(downloadDir, hash);
      /** @type {Object} The child process that handles adding a timestamp to each image */
      var timeStamper = setupTimeStamper();

      var mapDownloaded = false;
      var bordersDownloaded = false;
      var slicesDownloaded = 0;

      // Setup the map request url
      var mapUrl;
      if (mapOptions) {
         mapUrl = url.parse(mapOptions.wmsUrl);
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
            BBOX: dataOptions.bbox
         };
         utils.deleteNullProperies(mapUrl.query);
      }

      // Setup the borders request url
      var bordersUrl;
      if (bordersOptions) {
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
            SRS: bordersOptions.wmsParams.SRS,
            WIDTH: width,
            HEIGHT: height,
            BBOX: dataOptions.bbox
         };
         if (mapOptions) {
            bordersUrl.query.wrapDateLine = mapOptions.wmsParams.wrapDateLine;
         }
         utils.deleteNullProperies(bordersUrl.query);
      }

      // Setup the data layer request url
      var dataURL = url.parse(dataOptions.wmsUrl, true);
      dataURL.search = undefined;
      dataURL.query = {
         SERVICE: 'WMS',
         VERSION: dataOptions.wmsParams.VERSION,
         REQUEST: 'GetMap',
         FORMAT: 'image/png',
         TRANSPARENT: true,
         LAYERS: dataOptions.wmsParams.LAYERS,
         wrapDateLine: dataOptions.wmsParams.wrapDateLine,
         SRS: dataOptions.wmsParams.SRS,
         STYLES: dataOptions.wmsParams.STYLES,
         NUMCOLORBANDS: dataOptions.wmsParams.NUMCOLORBANDS,
         ABOVEMAXCOLOR: dataOptions.wmsParams.ABOVEMAXCOLOR,
         BELOWMINCOLOR: dataOptions.wmsParams.BELOWMINCOLOR,
         colorscalerange: dataOptions.wmsParams.colorscalerange,
         logscale: dataOptions.wmsParams.logscale,
         WIDTH: width,
         HEIGHT: height,
         BBOX: dataOptions.bbox,
         ELEVATION: dataOptions.depth
      };
      utils.deleteNullProperies(dataURL.query);

      // Generate a hash from the data layer url for use in the image filenames
      dataUrlHash = sha1(url.format(dataURL));

      updateStatus(PlotStatus.extracting, 'Downloading time slices');

      // Create the hash directory
      fs.mkdirs(hashDir, function(err) {
         if (err) {
            return next(err);
         }
         // Push the map to the download queue
         if (mapOptions) {
            downloadQueue.push({
               uri: url.format(mapUrl),
               dir: hashDir,
               filename: 'map.jpg',
               id: 'map'
            }, downloadComplete);
         }

         // Push the borders to the download queue
         if (bordersOptions) {
            downloadQueue.push({
               uri: url.format(bordersUrl),
               dir: hashDir,
               filename: 'borders.png',
               id: 'borders'
            }, downloadComplete);
         }

         // Push all the data layer slices to the download queue
         for (var i = 0; i < slices.length; i++) {
            dataURL.query.TIME = slices[i];
            var filename = dataUrlHash + '_' + slices[i].replace(/\:/, '-') + '.png';
            downloadQueue.push({
               uri: url.format(dataURL),
               dir: downloadDir,
               filename: filename,
               id: slices[i],
               isDataLayer: true
            }, downloadComplete);
         }
      });

      /**
       * Setup the timeStamper child process and handler for images that have been stamped
       * @return {Object} The timeStamper
       */
      function setupTimeStamper() {
         timeStamper = child_process.fork(path.join(__dirname, '../scripts/animation-timestamper.js'));

         // Handler for images that have been stamped
         timeStamper.on('message', function(options) {
            if (options.err) {
               return handleError(options.err);
            }
            // Rename the image from it's tempPath
            fs.rename(options.tempPath, options.filePath, function(err) {
               if (err) {
                  return handleError(err);
               }
               // Link the image in the hashdir (NOT symlink to avoid issues with simultaneous similar animations)
               fs.link(options.filePath, path.join(hashDir, options.filename), function(err) {
                  if (err) {
                     return handleError(err);
                  }
                  imageReady(options);
               });
            });
         });
         return timeStamper;
      }

      /**
       * Download an image
       * @param  {Object}   options The download options
       * @param  {Function} next    Function to call when done
       */
      function download(options, next) {
         options.filePath = path.join(options.dir, options.filename);
         if (options.isDataLayer) {
            // If this download is a data layer tile
            if (utils.fileExists(options.filePath)) {
               // If it already exists, no need to download it again
               options.existing = true;
               done();
            } else {
               // If it doesn't exist, download to a temporary path for time stamping
               options.existing = false;
               options.tempPath = path.join(options.dir, 'temp_' + randomatic('aA0', 32) + '.png');
               makeRequest(options.tempPath);
            }
         } else {
            options.existing = false;
            makeRequest(options.filePath);
         }

         /**
          * Make the download request
          * @param  {string} path The path to write the file to
          */
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

      /**
       * Called when a download has completed
       * Keeps track of overall download progress and calls timestamper on new data layer tiles
       * @param  {object} err     Any error or null
       * @param  {object} options Download options
       */
      function downloadComplete(err, options) {
         if (err) {
            // If there was an error, retry the download up to 4 times
            if (retries[options.id] === undefined) {
               retries[options.id] = 1;
               return downloadQueue.push(options, downloadComplete);
            } else if (retries[options.id] < 4) {
               retries[options.id]++;
               return downloadQueue.push(options, downloadComplete);
            } else {
               return done(err);
            }
         }

         if (options.id == 'map') {
            mapDownloaded = true;
            done();
         } else if (options.id == 'borders') {
            bordersDownloaded = true;
            done();
         } else {
            if (options.existing) {
               // If the tile was already downloaded, just link it in the hash directory
               // (NOT symlink to avoid issues with simultaneous similar animations)
               fs.link(options.filePath, path.join(hashDir, options.filename), done);
            } else {
               // Else send the image to the timestamper
               if (timeStamper.connected) {
                  timeStamper.send(options);
               }
            }
         }

         function done(err) {
            if (err) {
               return handleError(err);
            }
            imageReady(options);
         }
      }

      /**
       * Called when an image is ready to be used by the renderer
       * Keeps track of progress and calls next when all images are ready
       * @param  {object} options The image options
       */
      function imageReady(options) {
         if (options.id != 'map' && options.id != 'borders') {
            slicesDownloaded++;
            if (!options.existing && slicesDownloaded % 10 === 0) {
               updateStatus(PlotStatus.extracting, 'Downloading time slices<br>' + slicesDownloaded + '/' + slices.length);
            }
         }
         if ((!mapOptions || mapDownloaded) && (!bordersOptions || bordersDownloaded) && slicesDownloaded == slices.length) {
            updateStatus(PlotStatus.extracting, 'Downloading time slices<br>' + slicesDownloaded + '/' + slices.length);
            timeStamper.kill();
            next();
         }
      }

      /**
       * If there was an error, kill the queue and timestamper and call next with the error
       * @param  {object} err The error
       */
      function handleError(err) {
         downloadQueue.kill();
         timeStamper.kill();
         next(err);
      }
   }

   /**
    * Render the video in MP4 and WebM
    * @param  {Function} next Function to call when done
    */
   function render(next) {
      updateStatus(PlotStatus.rendering, 'Rendering');

      var videoPathMP4 = path.join(plotDir, hash + '-video.mp4');
      var videoPathWebM = path.join(plotDir, hash + '-video.webm');
      var inputFPS = plotRequest.plot.framerate || 1;

      if (inputFPS > 1) {
         // Only allow integer values above 1 FPS
         inputFPS = Math.round(inputFPS);
      }

      var outputFPS = inputFPS;

      // Determine the correct output framerate based on the input framerate
      // A minimum of 10 FPS is used as lower values can cause playback issues
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

      // Calculate the total number of frames for progress calculation
      var numFrames = (outputFPS / inputFPS) * slices.length;

      // Determine the maximum bitrate for WebM based on the input framerate
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

      // Setup the renderer with the map and data layer inputs
      var renderer = ffmpeg();

      if (mapOptions) {
         renderer = renderer.input(path.join(downloadDir, hash, 'map.jpg'))
            .inputOptions(['-loop 1', '-framerate ' + inputFPS]);
      }

      renderer = renderer.input(path.join(downloadDir, hash, dataUrlHash + '_' + '*' + '.png'))
         .inputOptions(['-pattern_type glob', '-thread_queue_size 512', '-framerate ' + inputFPS]);

      if (bordersOptions) {
         renderer = renderer
            .input(path.join(downloadDir, hash, 'borders.png'))
            .inputOptions(['-loop 1', '-framerate ' + inputFPS]);
      }

      if (mapOptions && bordersOptions) {
         // If borders then setup the borders input and complex filter
         renderer = renderer
            .complexFilter('overlay=shortest=1,overlay=shortest=1,split=2[out1][out2]');
      } else if (mapOptions || bordersOptions) {
         // Else just setup the complex filter
         renderer = renderer.complexFilter('overlay=shortest=1,split=2[out1][out2]');
      } else {
         renderer = renderer.complexFilter('split=2[out1][out2]');
      }

      // Set up the output options and start the renderer
      renderer
         .output(videoPathMP4)
         .videoCodec('libx264')
         .outputOptions(['-map [out1]', '-crf 23', '-threads 1', '-preset medium', '-pix_fmt yuv420p', '-movflags +faststart'])
         .outputFPS(outputFPS)
         .noAudio()
         .output(videoPathWebM)
         .videoCodec('libvpx')
         .outputOptions(['-map [out2]', '-b:v ' + maxWebMBitrate, '-crf 15', '-threads 1', '-speed 1', '-quality good', '-pix_fmt yuv420p'])
         .outputFPS(outputFPS)
         .noAudio()
         .on('end', next)
         .on('error', next)
         .on('progress', function(progress) {
            var percentage = Math.round((progress.frames / numFrames) * 99);
            updateStatus(PlotStatus.rendering, 'Rendering<br>' + percentage + '%', percentage);
         })
         .run();
   }

   /**
    * Build the plot html file
    * @param  {Function} next Function to call when done
    */
   function buildHtml(next) {
      var htmlPath = path.join(plotDir, hash + '-plot.html');
      var video = '<video controls><source src="plots/' + hash + '-video.mp4" type="video/mp4"/><source src="plots/' + hash + '-video.webm" type="video/webm"></video>';
      var html = '<!DOCTYPE html><html lang="en-US"><body><div id="plot">' + video + '</div></body></html>';
      fs.writeFile(htmlPath, html, 'utf8', function(err) {
         next(err);
      });
   }

   /**
    * Handle an error by setting the status to failed and calling cleanup
    * @param  {object} err The error
    */
   function handleError(err) {
      readStatus(function(status) {
         var message = '';
         if (status) {
            message = 'Failed ' + status.state + '.';
         } else {
            message = 'Failed creating animation.';
         }
         updateStatus(PlotStatus.failed, message, null, null, err);
         cleanup();
      });
   }

   /**
    * Cleanup temporary files after rendering has finished or failed
    * @param  {Function} next Function to call when done
    */
   function cleanup(next) {
      OFF_DEATH();
      var i = 0;
      var numFiles = 0;

      glob(path.join(downloadDir, 'temp_*'), function(err, files) {
         if (err) {
            return done();
         }
         numFiles = files.length;
         if (numFiles > 0) {
            files.forEach(function(file) {
               fs.remove(file, done);
            });
         } else {
            done();
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

   /**
    * Read the status file
    * @param  {Function} next Function to call with the status file
    */
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

   /**
    * Update the status file
    * @param  {string}   state        The plot state
    * @param  {string}   message      An optional message
    * @param  {string}   percentage   Percentage complete
    * @param  {number}   minRemaining Number of minutes remaining
    * @param  {object}   traceback    The traceback or error message of an error
    * @param  {Function} next         Function to call when done
    */
   function updateStatus(state, message, percentage, minRemaining, traceback, next) {
      var statusPath = path.join(plotDir, hash + '-status.json');

      if (!status) {
         status = {
            job_id: hash,
            completed: false,
         };
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

   /**
    * Save the status file to disk
    * @param  {object}   options Options containing statuspath and status
    * @param  {Function} next    Function to call when done
    */
   function saveStatus(options, next) {
      fs.writeFile(options.statusPath, JSON.stringify(options.status), 'utf8', function(err) {
         next(err);
      });
   }

   /**
    * Log a completed animation
    * @param  {Function} next Function to call when done
    */
   function logComplete(next) {
      if (logDir) {
         fs.mkdirs(logDir);
         var datetime = new Date().toISOString().substring(0, 19);
         var date = new Date().toISOString().substring(0, 10);

         var line = [datetime, hash, 'animation', status.state, slices.length];
         line = line.join(',') + '\n';
         fs.appendFile(path.join(logDir, date + '.csv'), line, function(err) {
            if (next) {
               next(err);
            }
         });
      }
   }
};