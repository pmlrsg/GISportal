/**
 * This module provides the functions to handle API requests.
 */

var fs = require('fs');
var path = require('path');
var _ = require('underscore'); // Could change to lodash later
var apiAuth = require('./apiauth.js');
var apiUtils = require('./apiutils.js');
var settingsApi = require('./settingsapi.js');
var utils = require('./utils.js');

var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var USER_CACHE_PREFIX = "user_";

var api = {};
module.exports = api;

/**
 * Get all the cache files the user has access to in a JSON string.
 * @param  {object} req Express router request
 * @param  {object} res Express router response
 * @return  JSON string
 */
api.get_cache = function(req, res) {
   var cache = apiUtils.getCache(req);
   res.json(cache);
};

/**
 * Get the important details of each cache file (server) the user has access to with or without a summary of their layers in a JSON string.
 * @param  {object} req Express router request
 * @param  {object} res Express router response
 * @return  JSON string
 */
api.get_cache_list = function(req, res) {
   // Check if the user requested just servers or servers and layers
   var layers = false;
   if (req.params.type === 'layers') {
      layers = true;
   }
   var cache = apiUtils.getCache(req);
   var list = [];

   for (var i = 0; i < cache.length; i++) {
      var serverTemp = cache[i];
      var server = {};
      server.wmsURL = serverTemp.wmsURL;
      server.wcsURL = serverTemp.wcsURL || "";
      server.serverName = serverTemp.serverName;
      server.contactInfo = serverTemp.contactInfo;
      server.provider = serverTemp.provider;
      server.timeStamp = serverTemp.timeStamp;
      server.owner = serverTemp.owner;
      if (layers) {
         server.server = {};
         server.server.Layers = [];
         for (var j = 0; j < serverTemp.server.Layers.length; j++) {
            var layerTemp = serverTemp.server.Layers[j];
            var layer = {};
            layer.Name = layerTemp.Name;
            layer.Title = layerTemp.Title;
            layer.Abstract = layerTemp.Abstract;
            layer.FirstDate = layerTemp.FirstDate;
            layer.LastDate = layerTemp.LastDate;
            layer.EX_GeographicBoundingBox = layerTemp.EX_GeographicBoundingBox;
            server.server.Layers.push(layer);
         }
      }
      list.push(server);
   }

   res.json(list);
};

/**
 * Refresh the api user's cache file for the provided WMS url. Admins may refresh global cache files or other user's
 *    cache files by specifying a username.
 * @param  {object} req Express router request
 * @param  {object} res Express router response
 */
api.refresh_wms_cache = function(req, res) {
   if (req.query.server) {
      req.query.url = apiUtils.findServerURL(req, req.query.server);
   }
   if (req.query.url) {
      var url = req.query.url; // Gets the given url
      var domain = utils.getDomainName(req); // Gets the given domain
      var username;

      if (req.query.user) {
         if (apiAuth.getAccessLevel(req, domain) === 'admin') {
            if (req.query.user === 'global') {
               username = domain;
            } else {
               username = req.query.user;
            }
         } else {
            return res.status(401).send("Error: You must be an admin to refresh another user's config!");
         }
      } else {
         username = apiAuth.getUsername(req);
      }
      refreshCache(url, domain, username, function(err, status, message) {
         if (err) {
            utils.handleError(err, res);
         } else {
            res.status(status).send(message);
         }
      });
   } else {
      return res.status(400).send("Error: url wasn't specified or provided server name not found.");
   }
};

api.refresh_all_wms_cache = function(req, res) {
   var cache = apiUtils.getCache(req);
   var domain = utils.getDomainName(req);
   var globalServerCount = 0;

   for (var i = 0; i < cache.length; i++) {
      var server = cache[i];
      if (server.owner == domain) {
         globalServerCount += 1;
         var url = server.wmsURL;
         refreshCache(url, domain, domain, cacheRefreshed);
      }
   }

   var failedServers = [];
   var refreshedServers = [];

   function cacheRefreshed(err, status, message, serverName) {
      if (err || status != 200) {
         failedServers.push(serverName);
      } else {
         refreshedServers.push(serverName);
      }

      if (failedServers.length + refreshedServers.length == globalServerCount) {
         done();
      }
   }

   function done() {
      if (failedServers.length > 0) {
         res.status(500).json({
            failedServers: failedServers,
            refreshedServers: refreshedServers
         });
      } else {
         res.status(200).json({
            failedServers: failedServers,
            refreshedServers: refreshedServers
         });
      }
   }
};

function refreshCache(url, domain, username, next) {
   var refresh = true;
   var serverName = utils.URLtoServerName(url);
   var basePath = path.join(MASTER_CONFIG_PATH, domain); // Gets the given path
   if (username != domain) {
      basePath = path.join(basePath, USER_CACHE_PREFIX + username);
   }
   var oldDataPath = path.join(basePath, serverName + '.json');

   if (utils.fileExists(oldDataPath)) {
      settingsApi.load_new_wms_layer(url, refresh, domain, function(err, strData) {
         if (err) {
            next(err, null, null, serverName);
         } else {
            if (strData !== null) {
               var newData = JSON.parse(strData);
               var oldData = null;
               oldData = JSON.parse(fs.readFileSync(oldDataPath, 'utf8'));
               var data = updateData(oldData, newData);
               settingsApi.update_layer(username, domain, data, function(err) {
                  if (err) {
                     next(err, null, null, serverName);
                  } else {
                     return next(null, 200, 'Successfully updated ' + serverName + ' for ' + username, serverName);
                  }
               });

            } else {
               return next(null, 400, "Error: Could not find any loadable layers in the WMS file you provided.", serverName);
            }
         }
      });
   } else {
      return next(null, 404, "Error: Can't find config for provided url. If the file isn't yours, you must specify user=global or user=username.", serverName);
   }
}

/**
 * Copy the layer settings from old wms cache data to new wms cache data.
 * @param  {object} oldData The old cache data to copy settings from
 * @param  {object} newData The new cache data to copy settings to
 * @return {object}         The updated new cache data
 */
function updateData(oldData, newData) {
   // newData layers that have been matched and updated
   var matched_layers = [];
   var provider;
   var new_server = _.keys(newData.server)[0];

   // Iterate through oldData layers
   for (var i_old = 0; i_old < oldData.server.Layers.length; i_old++) {
      var matched = false;

      // Iterate through newData layers
      var i_new = 0;
      // If the newData and oldData layers match with i_old, set i_new to i_old to avoid unnecessary iteration
      if (newData.server[new_server][i_old] &&
          oldData.server.Layers[i_old].Name == newData.server[new_server][i_old].Name) {
         i_new = i_old;
      }
      for (; i_new < newData.server[new_server].length; i_new++) {
         // If the newData layer matches the oldData layer, update it's information from the oldData layer
         if (oldData.server.Layers[i_old].Name == newData.server[new_server][i_new].Name) {
            newData.server[new_server][i_new].Abstract = oldData.server.Layers[i_old].Abstract;
            newData.server[new_server][i_new].Title = oldData.server.Layers[i_old].Title;
            newData.server[new_server][i_new].include = oldData.server.Layers[i_old].include || false;
            newData.server[new_server][i_new].autoScale = oldData.server.Layers[i_old].autoScale;
            newData.server[new_server][i_new].log = oldData.server.Layers[i_old].log;
            newData.server[new_server][i_new].defaultMinScaleVal = oldData.server.Layers[i_old].defaultMinScaleVal;
            newData.server[new_server][i_new].defaultMaxScaleVal = oldData.server.Layers[i_old].defaultMaxScaleVal;
            newData.server[new_server][i_new].defaultStyle = oldData.server.Layers[i_old].defaultStyle;
            newData.server[new_server][i_new].colorbands = oldData.server.Layers[i_old].colorbands;
            newData.server[new_server][i_new].aboveMaxColor = oldData.server.Layers[i_old].aboveMaxColor;
            newData.server[new_server][i_new].belowMinColor = oldData.server.Layers[i_old].belowMinColor;
            newData.server[new_server][i_new].tags = oldData.server.Layers[i_old].tags;
            newData.server[new_server][i_new].LegendSettings = oldData.server.Layers[i_old].LegendSettings;
            newData.server[new_server][i_new].ProviderDetails = oldData.server.Layers[i_old].ProviderDetails || undefined;
            provider = oldData.server.Layers[i_old].tags.data_provider; // The provider is saved so that it can be out into the provider variable
            matched_layers.push(newData.server[new_server][i_new].Name); // Add the newData layer to matched_layers
            matched = true;
            break;
         }
      }
   }

   // The newData options is updated so that it contains the correct provider (not 'UserDefinedLayer') and contact info
   // If present the wcsURL is also added
   newData.options = oldData.options;
   newData.contactInfo = oldData.contactInfo;
   newData.wcsURL = oldData.wcsURL || undefined;
   newData.provider = provider || oldData.options.providerShortTag;

   return newData;
}