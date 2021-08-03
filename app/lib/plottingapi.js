/**
 * This module provides plotting functions that are shared by the API and the front end.
 */

var child_process = require('child_process');
var csv = require('csv-parser');
var fs = require("fs");
var moment = require('moment');
var path = require('path');
var utils = require('./utils.js');
var md5 = require('md5');
var animation = require('./animation.js');

var PLOTTING_PATH = path.join(__dirname, "../../plotting/plots.py");
var PLOT_DESTINATION = path.join(__dirname, "../../html/plots/");
var PLOT_DIRECTORY = '/plots/';
var PLOT_DOWNLOAD_DIRECTORY = '/tmp/';

var plottingApi = {};
module.exports = plottingApi;

plottingApi.getPlotDirUrl = function(req) {
   var url = req.protocol + '://' + req.headers.host + req.originalUrl;
   if (url.includes('/api/')) {
      url = url.split('/api/')[0];
   } else {
      url = url.split('/app/')[0];
   }
   url += PLOT_DIRECTORY;
   return url;
};

plottingApi.plot = function(req, request, next) {
   var domain = utils.getDomainName(req);
   var downloadDir = PLOT_DOWNLOAD_DIRECTORY;
   var logDir = "";
   if (global.config[domain]) {
      if (global.config[domain].plottingDownloadDir && utils.directoryExists(global.config[domain].plottingDownloadDir)) {
         downloadDir = global.config[domain].plottingDownloadDir;
      }
      if (global.config[domain].logDir) {
         logDir = path.join(__dirname, '../..', global.config[domain].logDir, "plotting");
      }
   }

   if (request.plot.type == 'animation') {
      animation.animate(request, PLOT_DESTINATION, downloadDir, logDir, function(err, hash) {
         next(err, hash);
      });
   } else {
      var url = plottingApi.getPlotDirUrl(req);
      var child = child_process.spawn('python3', ["-u", PLOTTING_PATH, "-c", "execute", "-d", PLOT_DESTINATION, "-u", url, "-dd", downloadDir, "-ld", logDir]);

      var hash;
      child.stdout.on('data', function(data) {
         hash = data.toString().replace(/\n|\r\n|\r/g, '');
         next(null, hash);
      });

      child.stdin.write(JSON.stringify(request));
      child.stdin.end();

      var error;
      child.stderr.on('data', function(data) {
         error += data.toString();
      });
      child.on('exit', function() {
         if (error) {
            next(error, null);
         }
      });
   }
};

plottingApi.processCSV = function(req, res, next) {
   var csvFile = req.file; // Gets the data given

   // we use the file's extension to identifty type rather than `this_file.mimetype` as machines that have
   // Microsoft Excel installed will identify these as `application/vnd.mx-excel` rather than `text\csv`
   if (!csvFile.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(415).send('Please upload a CSV file');
   }

   fs.readFile(csvFile.path, function(err, buffer) {
      if (err) {
         utils.handleError(err, res);
      } else {
         var hash = md5(buffer);

         var csvPath = path.join(csvFile.destination, 'cache', hash + '.csv');
         if (utils.fileExists(csvPath)) {
            fs.unlink(csvFile.path, function(err) {
               if (err) {
                  console.error(err);
               }
            });
         } else {
            fs.renameSync(csvFile.path, csvPath);
         }

         var archivePath = path.join(csvFile.destination, 'archive', new Date().toISOString() + '_' + csvFile.originalname);
         // copyFile(csvFile.path, archivePath);
         fs.link(csvPath, archivePath, function(err) {
            if (err) {
               console.error(err);
            }
         });

         var featuresList = [];
         var lineNumber = 1;
         var errorLines = [];
         var is_match_up = false;

         fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', function(data) {
               lineNumber++;

               if (data.Date && data.Latitude && data.Longitude) {
                  var longitude = parseFloat(data.Longitude);
                  var latitude = parseFloat(data.Latitude);


                  if ((!moment(data.Date, "DD/MM/YYYY HH:mm", true).isValid() && !moment(data.Date, "DD/MM/YYYY HH:mm:ss", true).isValid() && !moment(data.Date, "DD/MM/YYYY", true).isValid()) ||
                     isNaN(latitude) || isNaN(longitude)) {
                     errorLines.push(lineNumber);
                  } else {
                     var geoJSON_data = {
                        "type": "Feature",
                        "properties": {
                           "Date": data.Date,
                           "Longitude": longitude.toFixed(3),
                           "Latitude": latitude.toFixed(3)
                        },
                        "geometry": {
                           "type": "Point",
                           "coordinates": [longitude, latitude]
                        }
                     };
                     if (data.data_point) {
                        is_match_up = true;
                        geoJSON_data.properties["Data Point"] = data.data_point;
                     }
                     featuresList.push(geoJSON_data);
                  }
               } else {
                  errorLines.push(lineNumber);
               }
            })
            .on('error', function(err) {
               utils.handleError(err, res);
            })
            .on('finish', function() {
               if (errorLines.length > 0) {
                  var err = {
                     errorLines: errorLines
                  };
                  if (utils.arrayIncludes(errorLines, 2)) {
                     err.message = 'The data on line 2 is invalid or the CSV headers are invalid or missing; they should be set to \n\nLatitude, Longitude, Date \n\nin that order. There may be an optional 4th column titled data_point for match up files. \n Dates can be in one the following formats \n\nDD/MM/YYYY \nDD/MM/YYYY HH:mm \nDD/MM/YYYY HH:mm:ss \n\n Please correct the errors and upload again';
                  } else {
                     err.message = 'The data on CSV line(s) ' + errorLines.join(", ") + ' is invalid.\nPlease correct the errors and upload again';
                  }
                  err.status = 400;
                  return next(err);
               } else {
                  return next(null, featuresList, csvPath, is_match_up);
               }
            });
      }
   });
};