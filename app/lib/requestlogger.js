/**
 * This module handles logging of all requests to the portal.
 */

var fs = require('fs');
var json2csv = require('json2csv');
var mkdirp = require('mkdirp');
var path = require('path');
var winston = require('winston');
var winstonRotate = require('winston-daily-rotate-file');
var apiAuth = require('./apiauth.js');
var user = require('./user.js');
var utils = require('./utils.js');

var requestLogger = {};
module.exports = requestLogger;

var DO_NOT_AUTO_LOG = ['/api/1/admin/extras/point_extract', '/app/plotting/upload_csv'];

// Loggers for each domain that the portal is hosting
var domainLoggers = {};

/**
 * Initialise loggers for each domain that the portal is hosting.
 * @param  {string} domain A domain
 */
requestLogger.init = function(domain) {
   var logDir = path.join(__dirname, '/../../', global.config[domain].logDir);
   if (!utils.directoryExists(logDir)) {
      mkdirp.sync(logDir);
      console.log('Created log directory: ' + global.config[domain].logDir);
   }
   domainLoggers[domain] = new winston.Logger({
      transports: [new winstonRotate({
         filename: path.join(logDir, '.csv'),
         datePattern: 'yyyy-MM-dd',
         prepend: true,
         json: false,
         formatter: formatter
      })]
   });
   console.log('Initialised requestLogger for ' + domain);
};

/**
 * Log a request as long as it isn't in the DO_NOT_AUTO_LOG array.
 * @param  {object}   req  Express request object
 * @param  {object}   res  Express response object
 * @param  {Function} next Next function to call in the routing chain
 */
requestLogger.autoLog = function(req, res, next) {
   if (!utils.arrayIncludes(DO_NOT_AUTO_LOG, req.originalUrl)) {
      requestLogger.log(req, res, next);
   } else {
      next();
   }
};

/**
 * Log a request.
 * @param  {object}   req  Express request object
 * @param  {object}   res  Express response object
 * @param  {Function} next Next function to call in the routing chain
 */
requestLogger.log = function(req, res, next) {
//    console.time('log');
   var api = req.originalUrl.startsWith('/api/');
   //    var apiParamsSet = req.params.version && req.params.token ? true : false;
   if (!api || api && req.params.token) {
      var domain = utils.getDomainName(req);
      buildMeta(req, api, function(meta) {
         domainLoggers[domain].log('info', 'Request', meta);
      });
   }
//    console.timeEnd('log');
   return next();
};

/**
 * Build the meta object with the data to log
 * @param  {object}  req Express router request
 * @param  {boolean} api True if this is an API request
 * @return {object}      The meta object
 */
function buildMeta(req, api, next) {
   var meta = {
      date: new Date().toISOString(),
      host: req.headers['x-forwarded-for'],
      path: getPath(req, api),
      user: getUsername(req, api),
   };
   if (req.file) {
      getNumLines(req, function(numLines) {
         meta.uploadNumLines = numLines;
         return next(meta);
      });
   } else {
      return next(meta);
   }
}

function getNumLines(req, next) {
   var i;
   var count = 0;
   fs.createReadStream(req.file.path)
      .on('data', function(chunk) {
         for (i = 0; i < chunk.length; ++i)
            if (chunk[i] == 10) count++;
      })
      .on('end', function() {
         return next(count);
      });
}

/**
 * Get the path that was requested and remove the token if it was an API request.
 * @param  {object}  req Express router request
 * @param  {boolean} api True if this is an API request
 * @return {string}      The path that was requested
 */
function getPath(req, api) {
   if (api) {
      return req.originalUrl.replace('/api/' + req.params.version + '/' + req.params.token, '/api/' + req.params.version + '/TOKEN');
   } else {
      return req.originalUrl;
   }
}

/**
 * Get the username of the user that made the request
 * @param  {object}  req Express router request
 * @param  {boolean} api True if this is an API request
 * @return {string}      The username of the user that made the request
 */
function getUsername(req, api) {
   if (api) {
      return apiAuth.getUsername(req);
   } else if (req.session.passport) {
      return user.getUsername(req);
   } else {
      return "";
   }
}

/**
 * Format the log output to convert it from json to CSV
 * @param  {object} options The logging options and data
 * @return {string}         The CSV formatted line to log
 */
function formatter(options) {
   try {
      var csv = json2csv({
         data: options.meta,
         hasCSVColumnTitle: false
      });
      return csv;
   } catch (err) {
      return 'Log formatter error: ' + err.message;
   }
}