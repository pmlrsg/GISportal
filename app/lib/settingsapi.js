/**
 * This module provides the settings functions that are shared by the API and the front end.
 */

var fs = require("fs");
var path = require('path');
var request = require('request');
var titleCase = require('to-title-case');
var _ = require("underscore");
var xml2js = require('xml2js');

var utils = require('./utils.js');

var USER_CACHE_PREFIX = "user_";
var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var LAYER_CONFIG_PATH = MASTER_CONFIG_PATH + "layers/";

var settingsApi = {};
module.exports = settingsApi;

settingsApi.get_cache = function(username, domain, permission) {
   var usernames = [username];
   var cache = []; // The list of cache deatils to be returned to the browser
   var master_path = path.join(MASTER_CONFIG_PATH, domain); // The path for the domain cache

   if (!utils.directoryExists(master_path)) {
      utils.mkdirpSync(master_path); // Creates the directory if it doesn't exist
   }

   var master_list = fs.readdirSync(master_path); // The list of files and folders in the master_cache folder
   master_list.forEach(function(filename) {
      var file_path = path.join(master_path, filename);
      if (utils.fileExists(file_path) && path.extname(filename) == ".json" && filename != "vectorLayers.json" && filename.substring(filename.length - 17, filename.length) != "_walkthrough.json") {
         var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
         if (permission != "admin") { // The Layers list is filtered .
            json_data.server.Layers = json_data.server.Layers.filter(function(val) {
               return val.include === true || typeof(val.include) === "undefined";
            });
         }
         json_data.owner = domain; // Adds the owner to the file (for the server list)
         if (json_data.wmsURL) {
            cache.push(json_data); // Adds each file to the cache to be returned
         }
      }
   });
   if (permission != "guest") {
      if (permission == "admin") {
         master_list.forEach(function(filename) {
            if (utils.directoryExists(path.join(master_path, filename))) {
               // if (stringStartsWith(filename, USER_CACHE_PREFIX)) {
               if (filename.startsWith(USER_CACHE_PREFIX)) {
                  usernames.push(filename.replace(USER_CACHE_PREFIX, "")); // If you are an admin, add all of the usernames from this domain to the variable
               }
            }
         });
      }
      usernames = _.uniq(usernames); // Makes the list unique (admins will have themselves twice) 
      // Eventually should just remove all admins here!
      for (var i = 0; i < usernames.length; i++) { // Usernames is now a list of all users or just the single loggeed in user.
         var user_cache_path = path.join(master_path, USER_CACHE_PREFIX + usernames[i]);
         if (!utils.directoryExists(user_cache_path)) {
            utils.mkdirpSync(user_cache_path); // Creates the directory if it doesn't already exist
         }
         var user_list = fs.readdirSync(user_cache_path); // Gets all the user files
         user_list.forEach(function(filename) {
            var file_path = path.join(user_cache_path, filename);
            if (utils.fileExists(file_path) && path.extname(filename) == ".json" && filename != "dictionary.json" && filename.substring(filename.length - 17, filename.length) != "_walkthrough.json") {
               var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
               if (permission != "admin" && username != filename.replace(USER_CACHE_PREFIX, "")) { // The Layers list is filtered.
                  json_data.server.Layers = json_data.server.Layers.filter(function(val) {
                     return val.include === true || typeof(val.include) === "undefined";
                  });
               }
               json_data.owner = usernames[i]; // Adds the owner to the file (for the server list)
               if (json_data.wmsURL) {
                  cache.push(json_data); // Adds each file to the cache to be returned
               }
            }
         });
      }
   }
   return cache;
};

settingsApi.load_new_wms_layer = function(url, refresh, domain, next) {
   url = url.replace(/\?.*/g, "") + "?";
   var data = null;
   var serverName = utils.URLtoServerName(url);
   var filename = serverName + ".json";
   var directory = path.join(MASTER_CONFIG_PATH, domain, "temporary_cache");
   if (!utils.directoryExists(directory)) {
      utils.mkdirpSync(directory); // Creates the directory if it doesn't already exist
   }
   var file_path = path.join(directory, filename);

   if (refresh === true || !utils.fileExists(file_path)) {
      request(url + "service=WMS&request=GetCapabilities", function(err, response, body) {
         if (err) {
            next(err, data);
         } else {
            xml2js.parseString(body, {
               tagNameProcessors: [settingsApi.stripPrefix],
               attrNameProcessors: [settingsApi.stripPrefix]
            }, function(err, result) {
               if (err) {
                  next(err, data);
               } else {
                  try {
                     var provider;
                     var contact_info = {};
                     var contact_data = result.WMS_Capabilities.Service[0].ContactInformation[0];
                     var contact_person = contact_data.ContactPersonPrimary[0].ContactPerson;
                     var contact_organization = contact_data.ContactPersonPrimary[0].ContactOrganization;
                     var contact_position = contact_data.ContactPosition;
                     var contact_address;
                     var contact_city;
                     var contact_state;
                     var contact_post_code;
                     var contact_country;
                     var address = "";
                     var address_block = contact_data.ContactAddress;
                     if (address_block) {
                        contact_address = address_block[0].Address;
                        contact_city = address_block[0].City;
                        contact_state = address_block[0].StateOrProvince;
                        contact_post_code = address_block[0].PostCode;
                        contact_country = address_block[0].Country;
                     }
                     var contact_phone = contact_data.ContactVoiceTelephone;
                     var contact_email = contact_data.ContactElectronicMailAddress;

                     if (contact_person[0].length > 0) {
                        contact_info.person = contact_person[0];
                     }
                     if (typeof(contact_organization[0]) == 'string') {
                        provider = contact_organization[0];
                     }
                     if (contact_position && contact_position[0].length > 0) {
                        contact_info.position = contact_position[0];
                     }
                     if (contact_address && contact_address[0].length > 0) {
                        address += contact_address[0] + "<br/>";
                     }
                     if (contact_city && contact_city[0].length > 0) {
                        address += contact_city[0] + "<br/>";
                     }
                     if (contact_state && contact_state[0].length > 0) {
                        address += contact_state[0] + "<br/>";
                     }
                     if (contact_post_code && contact_post_code[0].length > 0) {
                        address += contact_post_code[0] + "<br/>";
                     }
                     if (contact_country && contact_country[0].length > 0) {
                        address += contact_country[0] + "<br/>";
                     }
                     if (contact_phone && contact_phone[0].length > 0) {
                        contact_info.phone = contact_phone[0];
                     }
                     if (contact_email && contact_email[0].length > 0) {
                        contact_info.email = contact_email[0];
                     }
                     if (address.length > 0) {
                        contact_info.address = address;
                     }

                     var layers = [];

                     for (var index in result.WMS_Capabilities.Capability[0].Layer) {
                        var parent_layer = result.WMS_Capabilities.Capability[0].Layer[index];
                        layers = [];
                        var name;
                        var service_title;
                        var title;
                        var abstract;
                        var bounding_box;
                        var dimensions = {};
                        var style;

                        var title_elem = parent_layer.Title;
                        var abstract_elem = parent_layer.Abstract;
                        var ex_bounding_elem = parent_layer.EX_GeographicBoundingBox;
                        var style_elem = parent_layer.Style;

                        if (title_elem && typeof(title_elem[0]) == "string") {
                           service_title = title_elem[0].replace(/ /g, "_").replace(/\(/g, "_").replace(/\)/g, "_").replace(/\//g, "_");
                        }
                        if (abstract_elem && typeof(abstract_elem[0]) == "string") {
                           abstract = abstract_elem[0];
                        }
                        if (typeof(ex_bounding_elem) != "undefined") {
                           bounding_box = createBoundingBox(parent_layer);
                        }
                        if (style_elem) {
                           style = createStylesArray(parent_layer);
                           if (style.length === 0) {
                              style = undefined;
                           }
                        }

                        digForLayers(parent_layer, name, service_title, title, abstract, bounding_box, style, dimensions, serverName, layers, provider);
                     }
                     if (layers.length > 0) {
                        var sub_master_cache = {};
                        sub_master_cache.server = {};
                        sub_master_cache.server.Layers = settingsApi.sortLayersList(layers, "Title");
                        sub_master_cache.options = {
                           "providerShortTag": "UserDefinedLayer"
                        };
                        sub_master_cache.wmsURL = url;
                        sub_master_cache.serverName = serverName;
                        sub_master_cache.contactInfo = contact_info;
                        sub_master_cache.provider = provider.replace(/&amp;/g, '&');
                        sub_master_cache.timeStamp = new Date();

                        data = JSON.stringify(sub_master_cache);
                        fs.writeFileSync(file_path, data);
                     }
                     next(null, data);
                  } catch (err) {
                     next(err, data);
                  }
               }
            });
         }
      });
   } else {
      next(null, fs.readFileSync(file_path, 'utf8'));
   }
};

settingsApi.sortLayersList = function(data, param) {
   var byParam = data.slice(0);
   for (var layer in byParam) {
      if (!byParam[layer][param]) {
         return byParam;
      }
   }
   byParam.sort(function(a, b) {
      var x = a[param].toLowerCase();
      var y = b[param].toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
   });
   return byParam;
};

settingsApi.stripPrefix = function(str) {
   // This is for the xml2js parsing, it removes any silly namespaces.
   var prefixMatch = new RegExp(/(?!xmlns)^.*:/);
   return str.replace(prefixMatch, '');
};

settingsApi.update_layer = function(username, domain, data, next) {
   var filename = data.serverName + ".json"; // Gets the given filename
   var base_path = path.join(MASTER_CONFIG_PATH, domain); // The base path of
   if (username != domain) {
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   fs.writeFile(this_path, JSON.stringify(data), function(err) {
      next(err);
   });
};

function createBoundingBox(layer) {
   var bounding_elem = layer.EX_GeographicBoundingBox[0];
   var exGeographicBoundingBox = {
      "WestBoundLongitude": bounding_elem.westBoundLongitude[0],
      "EastBoundLongitude": bounding_elem.eastBoundLongitude[0],
      "SouthBoundLatitude": bounding_elem.southBoundLatitude[0],
      "NorthBoundLatitude": bounding_elem.northBoundLatitude[0]
   };
   return exGeographicBoundingBox;
}

function createDimensionsArray(layer) {
   var dimensions = {};
   dimensions.dimensions = [];
   dimensions.temporal = false;
   // dimensions.firstDate;
   // dimensions.lastDate;

   for (var index in layer.Dimension) {
      var dimension = layer.Dimension[index];
      var dimensionList = dimension._.split(",");
      var dimensionValue = dimension._.trim();

      if (dimension.$.name == "time") {
         dimensions.temporal = true;
         var newDates = [];
         for (var dimension_index in dimensionList) {
            var dimension_str = dimensionList[dimension_index];
            var dateTime = dimension_str.trim();
            if (dateTime.search("-") == 4) {
               newDates.push(dateTime);
            }
         }
         if (newDates.length > 0) {
            dimensions.firstDate = newDates[0].trim().substring(0, 10);
            dimensions.lastDate = newDates[newDates.length - 1].trim().substring(0, 10);
         }
         dimensionValue = newDates.join().trim();
      }
      dimensions.dimensions.push({
         "Name": dimension.$.name,
         "Units": dimension.$.units,
         "Default": dimension.$.default,
         "Value": dimensionValue
      });
   }
   return dimensions;
}

function createStylesArray(layer) {
   var styles = [];
   for (var index in layer.Style) {
      var style_tag = layer.Style[index];
      var name = style_tag.Name;
      var legend = style_tag.LegendURL;

      if (name && legend) {
         name = name[0];
         legend = legend[0];
         styles.push({
            "Name": name,
            "LegendURL": legend.OnlineResource[0].$.href,
            "Width": legend.$.width,
            "Height": legend.$.height
         });
      }
   }
   return styles;
}

function digForLayers(parent_layer, name, service_title, title, abstract, bounding_box, style, dimensions, serverName, layers, provider) {
   for (var index in parent_layer.Layer) {
      var layer = parent_layer.Layer[index];

      var name_elem = layer.Name;
      var title_elem = layer.Title;
      var abstract_elem = layer.Abstract;
      var ex_bounding_elem = layer.EX_GeographicBoundingBox;
      var dimension_elem = layer.Dimension;
      var style_elem = layer.Style;

      if (name_elem && typeof(name_elem[0]) == "string") {
         name = name_elem[0];
      }
      if (title_elem && typeof(title_elem[0]) == "string") {
         title = title_elem[0];
      }
      if (abstract_elem && typeof(abstract_elem[0]) == "string") {
         abstract = abstract_elem[0];
      }

      if (dimension_elem) {
         dimensions = createDimensionsArray(layer);
      }

      if (typeof(ex_bounding_elem) != "undefined") {
         bounding_box = createBoundingBox(layer);
      }
      if (style_elem) {
         style = createStylesArray(layer);
         if (style.length === 0) {
            style = undefined;
         }
      }
      if (name && service_title && title && bounding_box) {
         layers.push({
            "Name": name,
            "Title": title,
            "tags": {
               "indicator_type": [service_title.replace(/_/g, " ")],
               "niceName": titleCase(title),
               "data_provider": provider
            },
            "Abstract": abstract,
            "FirstDate": dimensions.firstDate,
            "LastDate": dimensions.lastDate,
            "EX_GeographicBoundingBox": bounding_box
         });
         var layer_data = {
            "FirstDate": dimensions.firstDate,
            "LastDate": dimensions.lastDate,
            "EX_GeographicBoundingBox": bounding_box,
            "Dimensions": dimensions.dimensions || [],
            "Styles": style
         };
         if (!utils.directoryExists(LAYER_CONFIG_PATH)) {
            utils.mkdirpSync(LAYER_CONFIG_PATH);
         }
         var save_path = path.join(LAYER_CONFIG_PATH, serverName + "_" + name + ".json");
         fs.writeFileSync(save_path, JSON.stringify(layer_data));
         style = undefined;
      } else {
         digForLayers(layer, name, service_title, title, abstract, bounding_box, style, dimensions, serverName, layers, provider);
      }

   }

}
