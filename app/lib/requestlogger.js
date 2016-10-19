var winston = require('winston');
var winstonRotate = require('winston-daily-rotate-file');
var path = require('path');
var utils = require('./utils.js');
var user = require('./user.js');
var apiAuth = require('./apiauth.js');
var json2csv = require('json2csv');

var requestLogger = {};

var domainLoggers = {};

module.exports = requestLogger;

requestLogger.init = function(domain) {
   console.log('Init requestLogger for ' + domain);
   var logDir = path.join(__dirname, '/../../', global.config[domain].logDir);
   domainLoggers[domain] = new winston.Logger({
      transports: [new winstonRotate({
         filename: path.join(logDir, '.csv'),
         datePattern: 'yyyy-MM-dd',
         prepend: true,
         json: false,
         formatter: formatter
      })]
   });
};

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

function getPath(req, api) {
   if (api) {
      return req.originalUrl.replace('/api/' + req.params.version + '/' + req.params.token, '/api/' + req.params.version + '/TOKEN');
   } else {
      return req.originalUrl;
   }
}

function getUsername(req, api) {
   if (api) {
      return apiAuth.getUsername(req);
   } else if (req.session.passport) {
      return user.getUsername(req);
   } else {
      return "";
   }
}

function formatter(options) {
   try {
      var csv = json2csv({
         data: options.meta,
         hasCSVColumnTitle: false
      });
      return csv;
   } catch (err) {
      return 'Formatter error: ' + err.message;
   }
}