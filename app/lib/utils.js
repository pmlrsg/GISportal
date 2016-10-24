var utils = {};
var fs = require("fs");
var path = require("path");
var bunyan = require('bunyan');

module.exports = utils;

var log = bunyan.createLogger({name: "Portal Middleware"});

utils.arrayIncludes = function(array, searchElement, fromIndex) {
   'use strict';
   if (array === null) {
      throw new TypeError('utils.arrayIncludesy called on null or undefined');
   }

   var O = Object(array);
   var len = parseInt(O.length, 10) || 0;
   if (len === 0) {
      return false;
   }
   var n = parseInt(fromIndex, 10) || 0;
   var k;
   if (n >= 0) {
      k = n;
   } else {
      k = len + n;
      if (k < 0) {
         k = 0;
      }
   }
   var currentElement;
   while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
         return true;
      }
      k++;
   }
   return false;
};

utils.fileExists = function(filePath)
{
   try
   {
      return fs.statSync(filePath).isFile();
   }
   catch (err)
   {
      return false;
   }
};

utils.directoryExists = function(filePath)
{
   try
   {
      return fs.statSync(filePath).isDirectory();
   }
   catch (err)
   {
      return false;
   }
};

utils.getDomainName = function(req){
   var domain = req.headers.host;
   if(req.SUBFOLDER){
      domain += "_" + req.SUBFOLDER;
   }
   return utils.nicifyDomain(domain);
};

utils.nicifyDomain = function(domain){
   return domain.replace("http://", "").replace("https://", "").replace(/\/$/, '').replace(/\//g, '_');
};

utils.mkdirpSync = function (dirpath) {
   var parts = dirpath.split(path.sep);
   for( var i = 1; i <= parts.length; i++ ) {
      var part_path = path.join.apply(null, parts.slice(0, i));
      part_path = "/" + part_path;
      if(!utils.directoryExists(part_path)){
         fs.mkdirSync( part_path );
      }
   }
};


utils.handleError = function(err, res){
   try{
      res.status(err.status || 500);
      res.send({message: err.message});
      log.error(err);
   }catch(e){
   }
};