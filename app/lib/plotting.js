var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var utils = require('./utils.js');
var ogr2ogr = require('ogr2ogr');
var csv = require('csv-parser');
var moment = require('moment');

var multer  = require('multer')
var upload = multer({ dest: TEMP_UPLOADS_PATH })

var child_process = require('child_process');

var PLOTTING_PATH = path.join(__dirname, "../../plotting/plots.py");
var PLOT_DESTINATION = path.join(__dirname, "../../html/plots/");
var EXTRACTOR_PATH = path.join(__dirname, "../../plotting/data_extractor/data_extractor_cli.py");

module.exports = router;

router.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

router.all('/app/plotting/plot', function(req, res){
   var data = req.body;

   var child = child_process.spawn('python', ["-u", PLOTTING_PATH, "-c", "execute", "-d", PLOT_DESTINATION]);

   var hash;
   child.stdout.on('data', function(data){
      hash = data.toString().replace(/\n|\r\n|\r/g, '');
      try{
         res.send({hash:hash});
      }catch(e){}
   });

   child.stdin.write(JSON.stringify(data.request));
   child.stdin.end();

   child.stderr.on('data', function (data) {
      utils.handleError(data.toString(), res);
   });
});

router.all('/app/plotting/check_plot', function(req, res){
   var body = req.body;

   var series_data = body.data_source;

   var process_info = [EXTRACTOR_PATH, "-t", "single", "-url", series_data.threddsUrl, "-var", series_data.coverage, "-time", series_data.t_bounds[0]];
   if(series_data.bbox.indexOf("POLYGON") > -1){
      process_info.push("-g");
      process_info.push(series_data.bbox);
   }else{
      process_info.push('-b=' + series_data.bbox);
   }
   var child = child_process.spawn('python', process_info)

   child.stdout.on('data', function(data){
      data = JSON.parse(data);
      res.send({time:data.time_diff, size:data.file_size, layer_id:series_data.layer_id});
   });

   child.stderr.on('data', function (data) {
      utils.handleError(data.toString(), res);
   });
});

router.all('/app/settings/upload_shape', user.requiresValidUser, upload.array('files', 3), function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var file_list = req.files; // Gets the data given

   var shape_file;
   for(var file in file_list){
      var this_file = file_list[file];
      if(this_file.mimetype == "application/x-esri-shape"){
         shape_file = this_file;
      }
      fs.renameSync(this_file.path, path.join(this_file.destination, this_file.originalname));
   }

   var geoJSON_path =   path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, shape_file.originalname + ".geojson");
   var stream = fs.createWriteStream(geoJSON_path);

   var shape_path = path.join(shape_file.destination, shape_file.originalname);
   var geoJSON = ogr2ogr(shape_path);
   try{
      geoJSON.stream().pipe(stream);
   }catch(e){
      utils.handleError(e, res);
   }

   // Once the Geojsonhas been created the temp files are deleted
   stream.on('finish', function() {
      for(var file in file_list){
         this_file = file_list[file];
         fs.unlinkSync(path.join(this_file.destination, this_file.originalname));
      }
      var geoJSONData = fs.readFileSync(geoJSON_path);
      geoJSONData = JSON.parse(geoJSONData);
      try{
         res.send({shapeName: shape_file.originalname.replace(".shp", ""), geojson:geoJSONData})
      }catch(err){
         utils.handleError(err, res);
      }
   });
});

router.get('/app/settings/get_shapes', user.requiresValidUser, function(req, res) {
   var username = user.getUsername(req);
   var domain = utils.getDomainName(req); // Gets the given domain

   var shape_list = [];
   var user_cache_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username);
   var user_list = fs.readdirSync(user_cache_path); // Gets all the user files
   user_list.forEach(function(filename){
      var file_path = path.join(user_cache_path, filename);
      if(utils.fileExists(file_path) && path.extname(filename) == ".geojson"){
         shape_list.push(filename.replace(".geojson", ""));
      }
   });
   res.send(JSON.stringify({list:shape_list})); // Returns the list to the browser.
});

router.all('/app/settings/upload_csv', user.requiresValidUser, upload.single('files'), function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var csv_file = req.file; // Gets the data given

   if(csv_file.mimetype != "text/csv"){
      res.status(415).send('Please upload a CSV file');
   }

   var csv_path = path.join(csv_file.destination, csv_file.originalname);

   fs.renameSync(csv_file.path, csv_path);
   var features_list = [];
   var line_number = 1;
   var error_lines = [];

   fs.createReadStream(csv_path)
      .pipe(csv())
      .on('data', function(data) {
         line_number ++;
         if(data.Date && data.Longitude && data.Latitude){
            if(!moment(data.Date, "DD/MM/YYYY HH:mm", true).isValid()){
               error_lines.push(line_number);
            }else{
               var longitude = parseFloat(data.Longitude);
               var latitude = parseFloat(data.Latitude);
               var geoJSON_data = {"type":"Feature", "properties":{"Date":data.Date, "Longitude":longitude.toFixed(3), "Latitude":latitude.toFixed(3)}, "geometry": {"type": "Point", "coordinates": [longitude, latitude]}}
               features_list.push(geoJSON_data);
            }
         }else{
            return res.status(400).send('The CSV headers are invalid \n Please correct the errors and upload again')
         }
      })
      .on('error', function(err){
         utils.handleError(err, res);
      })
      .on('finish', function(){
         if(error_lines.length > 0){
            res.status(400).send('The data on CSV line(s) ' + error_lines.join(", ") + ' is invalid \n Please correct the errors and upload again');
         }else{
            res.send({geoJSON :{ "type": "FeatureCollection", "features": features_list}, filename: csv_path});
         }   
      });
   
});

router.all('/app/settings/save_geoJSON', function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var filename = req.query.filename;
   var data = JSON.parse(req.body.data); // Gets the data given


   var geoJSON_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, filename + ".geojson");

   fs.writeFile(geoJSON_path, JSON.stringify(data), function(err){
      if(err){
            utils.handleError(err, res);
         }else{
            res.send(filename);
         }
   });
});