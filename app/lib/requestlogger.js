/**
 * This module handles logging of all requests to the portal.
 */

var json2csv = require('json2csv');
var path = require('path');
var winston = require('winston');
var winstonRotate = require('winston-daily-rotate-file');
var apiAuth = require('./apiauth.js');
var user = require('./user.js');
var utils = require('./utils.js');
// var fs = require('fs');
var mkdirp = require('mkdirp');

var requestLogger = {};
module.exports = requestLogger;

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
 * Log a request.
 * @param  {object}   req  Express request object
 * @param  {object}   res  Express response object
 * @param  {Function} next Next function to call in the routing chain
 */
requestLogger.log = function(req, res, next) {
   var api = req.originalUrl.startsWith('/api/');
   var apiParamsSet = req.params.version && req.params.token ? true : false;
   if (!api || api && apiParamsSet) {
      var domain = utils.getDomainName(req);
      var meta = buildMeta(req, api);
      domainLoggers[domain].log('info', 'Request', meta);
   }
   next();
};

/**
 * Build the meta object with the data to log
 * @param  {object}  req Express router request
 * @param  {boolean} api True if this is an API request
 * @return {object}      The meta object
 */
function buildMeta(req, api) {
   var meta = {
      date: new Date().toISOString(),
      host: req.headers['x-forwarded-for'],
      path: getPath(req, api),
      user: getUsername(req, api),
      uploadSize: null
   };
   return meta;
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