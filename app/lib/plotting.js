var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var utils = require('./utils.js');

var child_process = require('child_process');

var PLOTTING_PATH = path.join(__dirname, "../../plotting/plots.py");
var PLOT_DESTINATION = path.join(__dirname, "../../html/plots/");

module.exports = router;

router.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

router.all('/app/plotting/plot', function(req, res){
   var data = req.body;

   //res.send({hash:"3a1587bb2006563674a4d0f4783de806079357aa"});

   var child = child_process.spawn('python', ["-u", PLOTTING_PATH, "-c", "execute", "-d", PLOT_DESTINATION]);

   var hash;
   child.stdout.on('data', function(data){
      hash = data.toString().replace(/\n|\r\n|\r/g, '');
      res.send({hash:hash});
   });

   child.stdin.write(JSON.stringify(data.request));
   child.stdin.end();

   child.stderr.on('data', function (data) {
      //utils.handleError(data);
   });
});