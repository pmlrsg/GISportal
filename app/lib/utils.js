var utils = {};
var fs = require("fs");
var path = require("path");
var bunyan = require('bunyan');
var mime = require('mime');

module.exports = utils;

var log = bunyan.createLogger({
   name: "Portal Middleware"
});

/**
 * Polyfill for arrayIncludes. Here instead of being a proper polyfill to avoid breaking for in loops.
 * @param  {*[]}     array         The array to search in
 * @param  {*}       searchElement The item to search for
 * @param  {int}     fromIndex     The index to start from
 * @return {boolean}               If searchElement is in array
 */
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

utils.deleteNullProperies = function(object) {
   for (var key in object) {
      if (object.hasOwnProperty(key)) {
         if (object[key] === null || object[key] === undefined) {
            delete object[key];
         }
      }
   }
};

/**
 * Convert a server URL (such as WMS/WCS) into it's name.
 * @param {string} url The server's url
 */
utils.URLtoServerName = function(url) {
   return url.replace("http://", "").replace("https://", "").replace(/\//g, "-").replace(/\?.*/g, "").replace(/\.\./g, "_dotdot_");
};

/**
 * Check if a file exists.
 * @param  {string}  filePath The file to check
 * @return {boolean}          If the file exists
 */
utils.fileExists = function(filePath) {
   try {
      return fs.statSync(filePath).isFile();
   } catch (err) {
      return false;
   }
};

/**
 * Check if directory exists.
 * @param  {string}  filePath The directory to check
 * @return {boolean}          If the directory exists
 */
utils.directoryExists = function(filePath) {
   try {
      return fs.statSync(filePath).isDirectory();
   } catch (err) {
      return false;
   }
};

/**
 * Get the domain name from a request.
 * @param  {object} req Express request
 * @return {string}     The domain name
 */
utils.getDomainName = function(req) {
   var domain = req.headers.host;
   if (req.SUBFOLDER) {
      domain += "_" + req.SUBFOLDER;
   }
   return utils.nicifyDomain(domain);
};

utils.nicifyDomain = function(domain) {
   return domain.replace("http://", "").replace("https://", "").replace(/\/$/, '').replace(/\//g, '_');
};

utils.mkdirpSync = function(dirpath) {
   var parts = dirpath.split(path.sep);
   for (var i = 1; i <= parts.length; i++) {
      var part_path = path.join.apply(null, parts.slice(0, i));
      part_path = "/" + part_path;
      if (!utils.directoryExists(part_path)) {
         fs.mkdirSync(part_path);
      }
   }
};

utils.handleError = function(err, res) {
   try {
      res.status(err.status || 500);
      res.send({
         message: err.message
      });
      log.error(err);
   } catch (e) {}
};

/**
 * Test an object for a value and return it if found
 * if not return a default value
 * @param  {object} testObj Object to be checked
 * @param  {string} testKey Key to look for
 * @param  {*}      deafultValue value to use if key not found 
 * @return {*}      The value from testObj or default
 */
utils.getParamWithDefault = function(testObj, testKey, defaultValue) {
   
   try {
      if (testKey in testObj){
         return testObj[testKey]
      }
      else {
         return defaultValue;
      }
   } catch (e) {
      return defaultValue;
   }
}

/**
 * Test a file path for it's mime type and return a security appliance friendly type for it
 *
 * Used to prevent security products (*cough* Zscaler *cough*) from rejecting valid files out of hand
 * @param {string} path to a valid local file
 */
utils.getSecurityFriendlyMimeType = function(filepath) {
   var extension =  path.extname( filepath);
   if ( extension == '.mst') {
      return 'text/html';
   }
   return( mime.lookup(filepath));
}
