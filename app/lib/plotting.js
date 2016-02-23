var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var utils = require('./utils.js');

var child_process = require('child_process');

var PLOTTING_PATH = path.join(__dirname, "../../plotting/plots.py");
var PLOT_DESTINATION = path.join(__dirname, "../../html/plots/");
var EXTRACTOR_PATH = path.join(__dirname, "../../../data_extractor/data_extractor.py");

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



      var temp_status_file = path.join(PLOT_DESTINATION, hash + "-status.json")
      fs.writeFileSync(temp_status_file, JSON.stringify({"message": "Any Message you Like!", "state": "processing", "completed":false}));




      res.send({hash:hash});
   });

   child.stdin.write(JSON.stringify(data.request));
   child.stdin.end();

   child.stderr.on('data', function (data) {
      utils.handleError(data, res);
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
      utils.handleError(data, res);
   });
});