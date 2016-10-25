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

var PLOTTING_PATH = path.join(__dirname, "../../plotting/plots.py");
var PLOT_DESTINATION = path.join(__dirname, "../../html/plots/");
var PLOT_DIRECTORY = '/plots/';

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
   var url = plottingApi.getPlotDirUrl(req);
   var child = child_process.spawn('python', ["-u", PLOTTING_PATH, "-c", "execute", "-d", PLOT_DESTINATION, "-u", url]);

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
};

plottingApi.processCSV = function(req, res, next) {
   // var username = user.getUsername(req); // Gets the given username NOT USED
   // var domain = utils.getDomainName(req); // Gets the given domain NOT USED
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
                  console.error('err');
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

         fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', function(data) {
               lineNumber++;
               if (data.Date && data.Latitude && data.Longitude) {
                  var longitude = parseFloat(data.Longitude);
                  var latitude = parseFloat(data.Latitude);
                  if (!moment(data.Date, "DD/MM/YYYY HH:mm", true).isValid() || isNaN(latitude) || isNaN(longitude)) {
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
                  var err = {errorLines: errorLines};
                  if (utils.arrayIncludes(errorLines, 2)) {
                     err.message = 'The data on line 2 is invalid or the CSV headers are invalid or missing; they should be set to \'Latitude\', \'Longitude\', \'Date\', in any order.\nPlease correct the errors and upload again';
                  } else {
                     err. message = 'The data on CSV line(s) ' + errorLines.join(", ") + ' is invalid.\nPlease correct the errors and upload again';
                  }
                  err.status = 400;
                  return next(err);
               } else {
                  return next(null, featuresList, csvPath);
               }
            });
      }
   });
};