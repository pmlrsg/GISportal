/**
 * This module handles proxying requests
 */

var fs = require("fs-extra");
var jimp = require("jimp");
var path = require('path');
var request = require('request');
var readline = require('readline');
var minimatch = require('minimatch');
var url = require('url');

var utils = require('./utils.js');

var WHITELIST_FILE = path.join(__dirname, '/../../config', 'proxy-whitelist.txt');

var proxy = {};
module.exports = proxy;

/** @type {Boolean} If the whitelist has been loaded from the file */
var whitelistLoaded = false;
/** @type {Boolean} If the whitelist is currenlty being loaded */
var whitelistLoading = false;
/** @type {Array} The proxy whitelist */
var proxyWhitelist = [];

/**
 * Add a trusted URL to the whitelist
 * @param {String}   trustedURL The URL to add
 * @param {Function} next       The function to call when done
 */
proxy.addToProxyWhitelist = function(trustedURL, next) {
   checkProxyWhitelist(trustedURL, function(trusted) {
      if (trusted) {
         // If already trusted
         next();
      } else {
         // If not already trusted
         add();
      }
   });

   function add() {
      // Reload the whitelist to avoid overwriting any changes
      proxy.loadWhitelist(function() {
         trustedURL = cleanURL(trustedURL);

         proxyWhitelist.push(trustedURL);
         proxyWhitelist.sort();

         var file = fs.createWriteStream(WHITELIST_FILE);
         for (var i = 0; i < proxyWhitelist.length; i++) {
            file.write(proxyWhitelist[i] + '\n');
         }
         file.end();
         next();
      });
   }
};

/**
 * Load the whitelist from the file
 * @param  {Function} next Function to call when done
 */
proxy.loadWhitelist = function(next) {
   whitelistLoading = true;
   whitelistLoaded = false;
   proxyWhitelist = [];

   // Ensure the whitelist file exists
   fs.ensureFile(WHITELIST_FILE, function(err) {
      if (err) {
         console.error(err);
         return done();
      }

      var file = fs.createReadStream(WHITELIST_FILE);

      file.on('error', function(err) {
         console.error(err);
         return done();
      });

      var rl = readline.createInterface({
         input: file
      });

      rl.on('line', function(line) {
         line = line.split('#')[0].split(' ')[0];
         if (line !== '') {
            proxyWhitelist.push(line);
         }
      }).on('close', function() {
         return done();
      });
   });

   function done() {
      whitelistLoaded = true;
      whitelistLoading = false;
      if (next) {
         next();
      }
   }
};

/**
 * Proxy a request for a URL
 * @param  {Object} req Express request object
 * @param  {Object} res Express response object
 */
proxy.proxy = function(req, res) {
   var url = decodeURI(req.query.url); // Gets the given URL
   checkProxyWhitelist(url, function(trusted) {
      if (trusted) {
         request(url, function(err, response, body) {
            if (err) {
               utils.handleError(err, res);
            } else {
               res.status(response.statusCode);
               var content_type = response.headers['content-type'];
               if (content_type) {
                  if (content_type == "WMS_XML") { // TODO: see if there is a smaller brick to crack this walnut
                     content_type = "text/xml";
                  }
                  res.setHeader("content-type", content_type.split("; subtype=gml")[0]); // res.send has a tantrum if the subtype is GML!
               }
               res.send(body);
            }
         });
      } else {
         res.status(401).send();
      }
   });
};

/**
 * Proxy a request for an image
 * @param  {Object} req Express request object
 * @param  {Object} res Express respponse object
 */
proxy.img_proxy = function(req, res) {
   var url = decodeURI(req.query.url); // Gets the given URL
   checkProxyWhitelist(url, function(trusted) {
      if (trusted) {
         jimp.read(url, function(err, image) { // Gets the image file from the URL
            if (err) {
               utils.handleError(err, res);
            } else if (image) {
               image.getBuffer(jimp.MIME_PNG, function(err2, image2) { // Buffers the image so it sends correctly
                  if (err2) {
                     utils.handleError(err2, res);
                  } else {
                     res.setHeader('Content-type', 'image/png'); // Makes sure its a png
                     res.send(image2); // Sends the image to the browser.
                  }
               });
            } else {
               res.status(404).send();
            }
         });
      } else {
         res.status(401).send();
      }
   });
};

/**
 * Download and rotate an image from the provided URL
 * @param  {Object} req Express request object
 * @param  {Object} res Express response object
 */
proxy.rotate = function(req, res) {
   var angle = parseInt(req.query.angle); // Gets the given angle
   var url = req.query.url; // Gets the given URL
   checkProxyWhitelist(url, function(trusted) {
      if (trusted) {
         if (angle == "undefined" || angle === "" || typeof(angle) != "number") {
            angle = 0; // Sets angle to 0 if its not set to a number
         }
         angle = Math.round(angle / 90) * 90; // Rounds the angle to the neerest 90 degrees
         jimp.read(url, function(err, image) { // Gets the image file from the URL
            if (err) {
               utils.handleError(err, res);
            } else if (image) {
               image.rotate(angle); // Rotates the image *clockwise!*
               //image.resize( width, jimp.AUTO);
               image.getBuffer(jimp.MIME_PNG, function(err2, image2) { // Buffers the image so it sends correctly
                  if (err2) {
                     utils.handleError(err2, res);
                  } else {
                     res.setHeader('Content-type', 'image/png'); // Makes sure its a png
                     res.send(image2); // Sends the image to the browser.
                  }
               });
            } else {
               res.status(404).send();
            }
         });
      } else {
         res.status(401).send();
      }
   });
};

/**
 * Check if a URL is allowed by the whitelist
 * @param  {String}   testUrl The url to check
 * @param  {Function} next    Function to call with the result when done
 */
function checkProxyWhitelist(testUrl, next) {
   if (!whitelistLoaded) {
      if (!whitelistLoading) {
         // If not loaded and not loading, load it
         return proxy.loadWhitelist(function() {
            checkProxyWhitelist(testUrl, next);
         });
      } else {
         // If not loaded, but loading, try again after 10ms
         return setTimeout(function() {
            checkProxyWhitelist(testUrl, next);
         }, 10);
      }
   }

   testUrl = cleanURL(testUrl);

   var trusted = false;

   for (var i = 0; i < proxyWhitelist.length; i++) {
      if (minimatch(testUrl, proxyWhitelist[i])) {
         trusted = true;
         break;
      }
   }

   next(trusted);
}

/**
 * Clean a URL for saving in the whitelist or testing against the whitelist
 * @param  {String} dirtyURL The URL to clean
 * @return {String}          The cleaned URL
 */
function cleanURL(dirtyURL) {
   var cleanedURL = url.parse(dirtyURL);
   cleanedURL.search = undefined;
   cleanedURL.hash = undefined;
   cleanedURL = url.format(cleanedURL);
   cleanedURL = cleanedURL.replace("http://", "").replace("https://", "");
   return cleanedURL;
}