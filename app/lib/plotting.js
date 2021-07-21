var child_process = require('child_process');
var express = require('express');
var fs = require("fs");
var multer = require('multer');
var ogr2ogr = require('ogr2ogr');
var path = require('path');
var plottingApi = require('./plottingapi.js');
var requestLogger = require('./requestlogger.js');
var user = require('./user.js');
var utils = require('./utils.js');

var USER_CACHE_PREFIX = "user_";
var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var EXTRACTOR_PATH = path.join(__dirname, "../../plotting/data_extractor/data_extractor_cli.py");
var TEMP_UPLOADS_PATH = __dirname + "/../../uploads/";

var upload = multer({
   dest: TEMP_UPLOADS_PATH
});

var router = express.Router();
module.exports = router;

router.use(function(req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

router.all('/app/plotting/plot', function(req, res) {
   var request = req.body.request;
   console.log("");
   console.log("app/plotting/plot");

   plottingApi.plot(req, request, function(err, hash) {
      if (err) {
         utils.handleError(err, res);
      } else if (hash) {
         try {
            res.send({
               hash: hash
            });
         } catch (e) {}
      }
   });
});

router.all('/app/plotting/check_plot', function(req, res) {
   var body = req.body;

   var series_data = body.data_source;

   (function() {
      var childProcess = require("child_process");
      var oldSpawn = childProcess.spawn;
      function mySpawn() {
          console.log('spawn called');
          console.log(arguments);
          var result = oldSpawn.apply(this, arguments);
          return result;
      }
      childProcess.spawn = mySpawn;
  })();

   console.log("body: ", body);
   console.log("");
   console.log("series_data: ", series_data);

   file_path_python = "/mnt/c/Users/blondu112/Documents/Projects/PMLplacement/Projects/GISportal/plotting/data_extractor/data_extractor_cli.py";

   var process_info = [file_path_python, "-t", "WFS", "-url", series_data.threddsUrl, "-var", series_data.coverage[0], series_data.coverage[1], series_data.coverage[2], "-time", series_data.t_bounds[0]];

   console.log("");
   console.log("process_info: ", process_info);

   if (series_data.bbox.indexOf("POLYGON") > -1) {
      process_info.push("-g");
      process_info.push(series_data.bbox);
   } else {
      process_info.push('-b=' + series_data.bbox);
   }

   console.log("");
   console.log("process_info after if statement: ", process_info);

   var child = child_process.spawn('python3.8', process_info);
   //console.log("child", child);

   child.stdout.on('data', function(data) {
      console.log(data);
      data = JSON.parse(data);
      console.log("data child.stdout.on", data);
      res.send({
         time: data.time_diff,
         size: data.file_size,
         layer_id: series_data.layer_id
      });
   });
   var error;
   child.stderr.on('data', function(data) {
      console.log("child.stderr", data)
      error += data.toString();
   });
   child.on('exit', function() {
      if (error) {
         console.log("error", error);
         utils.handleError(error, res);
      }
   });
   console.log("finished");
});

router.all('/app/plotting/upload_shape', user.requiresValidUser, upload.array('files', 3), function(req, res) {
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var file_list = req.files; // Gets the data given

   var shape_file;
   for (var file in file_list) {
      var this_file = file_list[file];
      if (this_file.originalname.endsWith('.shp')) {
         shape_file = this_file;
      }
      fs.renameSync(this_file.path, path.join(this_file.destination, this_file.originalname));
   }

   var geoJSON_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, shape_file.originalname + ".geojson");
   var stream = fs.createWriteStream(geoJSON_path);

   var shape_path = path.join(shape_file.destination, shape_file.originalname);
   var geoJSON = ogr2ogr(shape_path);
   try {
      geoJSON.stream().pipe(stream);
   } catch (e) {
      utils.handleError(e, res);
   }

   // Once the Geojsonhas been created the temp files are deleted
   stream.on('finish', function() {
      for (var file in file_list) {
         this_file = file_list[file];
         fs.unlinkSync(path.join(this_file.destination, this_file.originalname));
      }
      var geoJSONData = fs.readFileSync(geoJSON_path);
      geoJSONData = JSON.parse(geoJSONData);
      try {
         res.send({
            shapeName: shape_file.originalname.replace(".shp", ""),
            geojson: geoJSONData
         });
      } catch (err) {
         utils.handleError(err, res);
      }
   });
});

router.get('/app/plotting/get_shapes', user.requiresValidUser, function(req, res) {
   var username = user.getUsername(req);
   var domain = utils.getDomainName(req); // Gets the given domain

   var shape_list = [];
   var user_cache_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username);
   var user_list = fs.readdirSync(user_cache_path); // Gets all the user files
   user_list.forEach(function(filename) {
      var file_path = path.join(user_cache_path, filename);
      if (utils.fileExists(file_path) && path.extname(filename) == ".geojson") {
         shape_list.push(filename.replace(".geojson", ""));
      }
   });
   // TODO change to res.json
   res.send(JSON.stringify({
      list: shape_list
   })); // Returns the list to the browser.
});

router.get('/app/plotting/delete_geojson', user.requiresValidUser, function(req, res) {
   var username = user.getUsername(req);
   var domain = utils.getDomainName(req); // Gets the given domain
   var filename = req.query.filename;

   var geojson_file = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, filename + ".geojson");
   fs.unlink(geojson_file, function(err) {
      if (err) {
         utils.handleError(err, res);
      } else {
         res.send(filename);
      }
   });
});

router.all('/app/plotting/upload_csv', user.requiresValidUser, upload.single('files'), requestLogger.log, function(req, res) {
   plottingApi.processCSV(req, res, function(err, featuresList, csvPath, matchup) {
      if (err) {
         res.status(err.status).send(err.message);
      } else {
         if(matchup){
            return res.send({
                  geoJSON: {
                  "type": "FeatureCollection",
                  "features": featuresList
                  },
                  filename: csvPath,
                  matchup : true
            });
         }
         else {
            return res.send({
                  geoJSON: {
                  "type": "FeatureCollection",
                  "features": featuresList
                  },
                  filename: csvPath
            });
         }
      }
   });

});

router.all('/app/plotting/save_geoJSON', function(req, res) {
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var filename = req.query.filename;
   var data = JSON.parse(req.body.data); // Gets the data given


   var geoJSON_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, filename + ".geojson");

   fs.writeFile(geoJSON_path, JSON.stringify(data), function(err) {
      if (err) {
         utils.handleError(err, res);
      } else {
         res.send(filename);
      }
   });
});

router.all('/app/prep_download', function(req, res) {
   var data = JSON.parse(req.body.data); // Gets the data given
   var baseURL = data.baseurl;
   var coverage = data.coverage;
   var time = data.time;
   var bbox = data.bbox;
   var depth = data.depth;

   var process_info = [EXTRACTOR_PATH, "-t", "file", "-url", baseURL, "-var", coverage, "-time", time, "-g", bbox, "-dest", TEMP_UPLOADS_PATH];
   if (depth) {
      process_info.push("-d");
      process_info.push(depth);
   }

   var child = child_process.spawn('python', process_info);

   child.stdout.on('data', function(data) {
      var temp_file = path.normalize(data.toString().replace("\n", ""));

      res.send({
         filename: temp_file,
         coverage: coverage
      });
   });

   var error;
   child.stderr.on('data', function(data) {
      error += data.toString();
   });
   child.on('exit', function() {
      if (error)
         utils.handleError(error, res);
   });
});

router.all('/app/download', function(req, res) {
   var filename = req.query.filename;
   var coverage = req.query.coverage;

   var temp_file = path.join(TEMP_UPLOADS_PATH, filename);

   var options = {
      dotfiles: 'deny',
      headers: {
         'Content-Disposition': "attachment; filename=extracted_" + coverage + ".nc",
         'x-timestamp': Date.now(),
         'x-sent': true
      }
   };
   res.sendFile(temp_file, options, function(err) {
      if (err) {
         utils.handleError(err, res);
      } else {
         fs.unlink(temp_file);
      }
   });
});