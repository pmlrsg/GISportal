var fs = require('fs');
var path = require('path');
var _ = require('underscore'); // Could change to lodash later
var apiAuth = require('./apiauth.js');
var settingsApi = require('./settingsapi.js');
var utils = require('./utils.js');

var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var USER_CACHE_PREFIX = "user_";

var api = {};
module.exports = api;

api.get_cache = function(req, res) {
   var username = apiAuth.getUsername(req);
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = apiAuth.getAccessLevel(req, domain);

   var cache = settingsApi.get_cache(username, domain, permission);
   res.send(JSON.stringify(cache));
};

api.refresh_wms_layer = function(req, res) {
   if (req.query.url) {
      var url = req.query.url.replace(/\?.*/g, "") + "?"; // Gets the given url
      var refresh = true;
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
            res.status(401).send("Error: You must be an admin to refresh another user's config!");
            return;
         }
      } else {
         username = apiAuth.getUsername(req);
      }

      settingsApi.load_new_wms_layer(url, refresh, domain, function(err, strData) {
         if (err) {
            utils.handleError(err, res);
         } else {
            if (strData !== null) {
               var newData = JSON.parse(strData);
               var oldData = null;
               var cleanPath = url.replace("http://", "").replace("https://", "").replace(/\//g, "-").replace(/\?/g, "");
               var basePath = path.join(MASTER_CONFIG_PATH, domain); // Gets the given path
               if (username != domain) {
                  basePath = path.join(basePath, USER_CACHE_PREFIX + username);
               }
               var oldDataPath = path.join(basePath, cleanPath + '.json');

               if (utils.fileExists(oldDataPath)) {
                  oldData = JSON.parse(fs.readFileSync(oldDataPath, 'utf8'));
                  var data = updateData(oldData, newData);
                  settingsApi.update_layer(username, domain, data, function(err) {
                     if (err) {
                        utils.handleError(err, res);
                     } else {
                        res.send('Successfully updated ' + cleanPath + ' for ' + username);
                     }
                  });
               } else {
                  res.status(404).send("Error: Can't find config for provided url. If the file isn't yours, you must specify user=global or user=username.");
               }
            } else {
               res.send({
                  "Error": "Could not find any loadable layers in the <a href='" + url + "service=WMS&request=GetCapabilities'>WMS file</a> you provided"
               });
            }
         }
      });
   } else {
      res.status(400).send("Error: url wasn't specified");
   }
};

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
      if (oldData.server.Layers[i_old].Name == newData.server[new_server][i_old].Name) {
         // If the newData and oldData layers match with i_old, set i_new to i_old to avoid unnecessary iteration
         i_new = i_old;
      }
      for (; i_new < newData.server[new_server].length; i_new++) {
         if (oldData.server.Layers[i_old].Name == newData.server[new_server][i_new].Name) {
            // If the newData layer matches the oldData layer, update it's information from the oldData layer
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