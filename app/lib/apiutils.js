/**
 * This module provides functions shared by different parts of the api and api modules
 */

var apiAuth = require('./apiauth.js');
var settingsApi = require('./settingsapi.js');
var utils = require('./utils.js');

var apiUtils = {};
module.exports = apiUtils;

apiUtils.getCache = function(req) {
   var username = apiAuth.getUsername(req);
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = apiAuth.getAccessLevel(req, domain);
   return settingsApi.get_cache(username, domain, permission);
};

apiUtils.findServerURL = function(req, serverName, cache) {
   if (!cache && req) {
      cache = apiUtils.getCache(req);
   }
   if (cache) {
      for (var i = 0; i < cache.length; i++) {
         if (cache[i].serverName == serverName) {
            return cache[i].wmsURL;
         }
      }
   }
};
