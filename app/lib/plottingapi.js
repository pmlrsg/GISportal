/**
 * This module provides plotting functions that are shared by the API and the front end.
 */

var child_process = require('child_process');
var csv = require('csv-parser');
var fs = require("fs");
var moment = require('moment');
var path = require('path');
var utils = require('./utils.js');

var PLOTTING_PATH = path.join(__dirname, "../../plotting/plots.py");
var PLOT_DESTINATION = path.join(__dirname, "../../html/plots/");

var plottingApi = {};
module.exports = plottingApi;

plottingApi.plot = function(request, cb) {
   var child = child_process.spawn('python', ["-u", PLOTTING_PATH, "-c", "execute", "-d", PLOT_DESTINATION]);

   var hash;
   child.stdout.on('data', function(data) {
      hash = data.toString().replace(/\n|\r\n|\r/g, '');
      cb(null, hash);
   });

   child.stdin.write(JSON.stringify(request));
   child.stdin.end();

   var error;
   child.stderr.on('data', function(data) {
      error += data.toString();
   });
   child.on('exit', function() {
      if (error) {
         cb(error, null);
      }
   });
};

plottingApi.processCSV = function(req, res, cb) {
   // var username = user.getUsername(req); // Gets the given username NOT USED
   // var domain = utils.getDomainName(req); // Gets the given domain NOT USED
   var csvFile = req.file; // Gets the data given

   // we use the file's extension to identifty type rather than `this_file.mimetype` as machines that have
   // Microsoft Excel installed will identify these as `application/vnd.mx-excel` rather than `text\csv`
   if (!csvFile.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(415).send('Please upload a CSV file');
   }

   var csvPath = path.join(csvFile.destination, csvFile.originalname);
   fs.renameSync(csvFile.path, csvPath);

   var featuresList = [];
   var lineNumber = 1;
   var errorLines = [];

   fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', function(data) {
         lineNumber++;
         if (data.Date && data.Longitude && data.Latitude) {
            if (!moment(data.Date, "DD/MM/YYYY HH:mm", true).isValid()) {
               errorLines.push(lineNumber);
            } else {
               var longitude = parseFloat(data.Longitude);
               var latitude = parseFloat(data.Latitude);
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
            return res.status(400).send('The CSV headers are invalid or missing; they should be set to \'Longitude\', \'Latitude\', \'Date\' in that order. \n Please correct the errors and upload again');
         }
      })
      .on('error', function(err) {
         utils.handleError(err, res);
      })
      .on('finish', function() {
         if (errorLines.length > 0) {
            return res.status(400).send('The data on CSV line(s) ' + errorLines.join(", ") + ' is invalid \n Please correct the errors and upload again');
         } else {
            cb(featuresList, csvPath);
         }
      });
};