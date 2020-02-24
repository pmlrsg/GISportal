/**
 * This module provides the settings functions that are shared by the API and the front end.
 */

var fs = require("fs");
var path = require('path');
var request = require('request');
var titleCase = require('to-title-case');
var _ = require("underscore");
var xml2js = require('xml2js');

const moment = require('moment');

const durationjs = require('durationjs')


var utils = require('./utils.js');
var proxy = require('./proxy.js');

var USER_CACHE_PREFIX = "user_";
var GROUP_CACHE_PREFIX = "group_";
var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var LAYER_CONFIG_PATH = MASTER_CONFIG_PATH + "layers/";

var settingsApi = {};
module.exports = settingsApi;

settingsApi.get_cache = function(username, domain, permission) {
   var usernames = [username];
   var groups = [];
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
               if (filename.startsWith(USER_CACHE_PREFIX)) {
                  // If you are an admin, add all of the usernames from this domain to the variable
                  usernames.push(filename.replace(USER_CACHE_PREFIX, ""));
               }
            }
         });
      }
      usernames = _.uniq(usernames); // Makes the list unique (admins will have themselves twice)

      // Load the cache for each username
      cache = cache.concat(loadCache(username, permission, usernames, master_path, USER_CACHE_PREFIX));

      // Find groups the user is a member of
      master_list.forEach(function(filename) {
         if (utils.directoryExists(path.join(master_path, filename))) {
            if (filename.startsWith(GROUP_CACHE_PREFIX)) {
               if (permission == "admin") {
                  // If the user is an admin, add all groups from this domain
                  groups.push(filename);
               } else {
                  var filePath = path.join(master_path, filename, 'members.json');
                  // Currently no need to JSON.parse the file, just see if it contains the username
                  var members = fs.readFileSync(filePath, 'utf8');
                  if (members.indexOf(username) != -1) {
                     groups.push(filename);
                  }
               }
            }
         }
      });

      // Load the cache for each group
      cache = cache.concat(loadCache(username, permission, groups, master_path, ''));
   }
   return cache;
};

/**
 * Load user or group caches
 * @param  {String} username    The requesting user
 * @param  {String} permission  The requesting user's permission
 * @param  {Array}  names       Array of username or groups to load
 * @param  {String} master_path The master path to the site config
 * @param  {String} cachePrefix The cache prefix to use for folders
 * @return {Array}              Array of servers loaded
 */
function loadCache(username, permission, names, master_path, cachePrefix) {
   var cache = [];
   // Files to ignore
   var ignoreFileNames = ['dictionary.json', 'members.json'];
   for (var i = 0; i < names.length; i++) {
      var cache_path = path.join(master_path, cachePrefix + names[i]);
      if (!utils.directoryExists(cache_path)) {
         utils.mkdirpSync(cache_path); // Creates the directory if it doesn't already exist
      }
      var file_list = fs.readdirSync(cache_path); // Gets all the files from the directory
      for (var j = 0; j < file_list.length; j++) {
         var filename = file_list[j];
         var file_path = path.join(cache_path, filename);
         if (utils.fileExists(file_path) && path.extname(filename) == ".json" &&
            filename.substring(filename.length - 17, filename.length) != "_walkthrough.json" &&
            !ignoreFileNames.includes(filename)) {
            // If the file exists, is json, is not a walkthrough, and isn't in the ignored list
            var json_data = JSON.parse(fs.readFileSync(file_path));
            if (permission != "admin" && username != filename.replace(cachePrefix, "")) {
               // If the user isn't an admin and this isn't their cache, remove layers with include: false
               json_data.server.Layers = json_data.server.Layers.filter(function(val) {
                  return val.include === true || typeof(val.include) === "undefined";
               });
            }
            json_data.owner = names[i]; // Adds the owner to the file (for the server list)
            if (json_data.wmsURL) {
               cache.push(json_data); // Adds each file to the cache to be returned
            }
         }
      }
   }
   return cache;
}

settingsApi.load_new_wms_layer = function(wmsURL, refresh, domain, next) {
   wmsURL = wmsURL.trim();
   wmsURL = wmsURL.replace(/\?.*/g, "") + "?";
   var data = null;
   var serverName = utils.URLtoServerName(wmsURL);
   var filename = serverName + ".json";
   var directory = path.join(MASTER_CONFIG_PATH, domain, "temporary_cache");
   if (!utils.directoryExists(directory)) {
      utils.mkdirpSync(directory); // Creates the directory if it doesn't already exist
   }
   var file_path = path.join(directory, filename);

   if (refresh === true || !utils.fileExists(file_path)) {
      request(wmsURL + "service=WMS&request=GetCapabilities", function(err, response, body) {
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
                     var provider = "Not Configured";
                     var contact_info = {};
                     // var contact_person = [];
                     // var contact_organization = [];
                     // all the below needs to be made optional and dependencies later on fixed
                     if ("ContactInformation" in result.WMS_Capabilities.Service[0]) {
                        var contact_data = result.WMS_Capabilities.Service[0].ContactInformation[0];
                        if ("ContactPersonPrimary" in contact_data){
                           var contact_person = utils.getParamWithDefault(contact_data.ContactPersonPrimary[0], "ContactPerson", "Not Provided");
                           var contact_organization = utils.getParamWithDefault(contact_data.ContactPersonPrimary[0], "ContactOrganization", "Not Provided");
                        }
                        var contact_position = utils.getParamWithDefault(contact_data, "ContactPosition", "Not Provided");
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
                        var contact_phone = utils.getParamWithDefault(contact_data, "ContactVoiceTelephone", "Not Provided");
                        var contact_email = utils.getParamWithDefault(contact_data, "ContactElectronicMailAddress", "Not Provided");

                        if (contact_person && typeof contact_person != "string" && contact_person[0].length > 0) {
                           contact_info.person = contact_person[0];
                        }
                        if (contact_organization && typeof(contact_organization[0]) == 'string') {
                           provider = contact_organization[0];
                        }
                        if (contact_position && typeof contact_position != "string" && contact_position[0].length > 0) {
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
                        if (contact_phone && typeof contact_phone != "string" && contact_phone[0].length > 0) {
                           contact_info.phone = contact_phone[0];
                        }
                        if (contact_email && typeof contact_email != "string" && contact_email[0].length > 0) {
                           contact_info.email = contact_email[0];
                        }
                        if (address.length > 0) {
                           contact_info.address = address;
                        }
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
                        sub_master_cache.wmsURL = wmsURL;
                        sub_master_cache.serverName = serverName;
                        sub_master_cache.contactInfo = contact_info;
                        sub_master_cache.provider = provider.replace(/&amp;/g, '&');
                        
                        sub_master_cache.timeStamp = new Date();

                        data = JSON.stringify(sub_master_cache);
                        fs.writeFileSync(file_path, data);
                     }
                     proxy.addToProxyWhitelist(wmsURL, function() {
                        next(null, data);
                     });
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
   filename = filename.replace(/\.\./g, "_dotdot_"); // Clean the filename to remove ..
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
               if (dateTime.search("-") == 4 && dateTime.search("Z/P") == -1) {
                  newDates.push(dateTime);
               }
               if (dateTime.search("Z/P") !== -1){
                  // period date, use function to generate array of dates
                  getArrayFromPeriod(dateTime, newDates);

               }
            }
            if (newDates.length > 0) {
               dimensions.firstDate = null;
               dimensions.lastDate = null;

               for (var i = 0; i < newDates.length; i++) {
                  if (dimensions.firstDate === null || newDates[i] < dimensions.firstDate) {
                     dimensions.firstDate = newDates[i];
                  }
                  if (dimensions.lastDate === null || newDates[i] > dimensions.lastDate) {
                     dimensions.lastDate = newDates[i];
                  }
               }
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


// populates the outputArray with dates based on the input periodString
// example period string : 1998-07-01T00:00:00.000Z/1998-09-01T00:00:00.000Z/P31D
function getArrayFromPeriod(periodString, outputArray){
   var period_chunks = periodString.split('/');
   var period = period_chunks[2];
   var day_interval = new durationjs(period).inHours();
   var currDate = moment.utc(period_chunks[0]);
   var lastDate = moment.utc(period_chunks[1]);
   var temp_holder = []
   while(currDate.add(day_interval , 'hours').diff(lastDate) <= 0) {
      outputArray.push(currDate.toISOString())
   }
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
