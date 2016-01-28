var xml2js = require('xml2js')
var et = require('elementtree');
var request = require('request');
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var _ = require("underscore");
var S = require("underscore.string.fp");
var gm = require("gm");
var jimp = require("jimp");
var bodyParser = require('body-parser');
var titleCase = require('to-title-case');
var user = require('./user.js');

var USER_CACHE_PREFIX = "user_";
var CURRENT_PATH = __dirname;
var MASTER_CACHE_PATH = CURRENT_PATH + "/../../html/cache/";
var LAYER_CACHE_PATH = MASTER_CACHE_PATH + "layers/";

var WMS_NAMESPACE = '{http://www.opengis.net/wms}'

module.exports = router;

/**
 * Returns true or false depending if a string stars with another string.
 * @param  {String} string The string to be evaluated
 * @param  {String} prefix The prefix to be looked for
 * @return {boolean} If the given string has the given prefix
 */
function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}

function fileExists(filePath)
{
    try
    {
        return fs.statSync(filePath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

function directoryExists(filePath)
{
    try
    {
        return fs.statSync(filePath).isDirectory();
    }
    catch (err)
    {
        return false;
    }
}

router.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));

router.get('/app/settings/get_cache', function(req, res) {
   var usernames = [user.getUsername(req)];
   var permission = user.getAccessLevel(req);
   var domain = "pmpc1310.npm.ac.uk";//req.get('origin').replace("http://", "").replace("https://", "");;

   var cache = []; // The list of cache deatils to be returned to the browser
   var master_path = path.join(MASTER_CACHE_PATH, domain); // The path for the domain cache

   var master_list = fs.readdirSync(master_path); // The list of files and folders in the master_cache folder
   master_list.forEach(function(filename){
      var file_path = path.join(master_path, filename);
      if(fileExists(file_path) && path.extname(filename) == ".json"){
         var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
         json_data.owner = domain; // Adds the owner to the file (for the server list)
         cache.push(json_data); // Adds each file to the cache to be returned
      }
   });
   if(permission != "guest"){
      if(permission == "admin"){
         master_list.forEach(function(filename){
            if(directoryExists(path.join(master_path, filename))){
               if(stringStartsWith(filename, USER_CACHE_PREFIX)){
                  usernames.push(filename.replace(USER_CACHE_PREFIX, "")); // If you are an admin, add all of the usernames from this domain to the variable
               }
            }
         });
      }
      usernames = _.uniq(usernames); // Makes the list unique (admins will have themselves twice) 
      // Eventually should just remove all admins here!
      for(username in usernames){ // Usernames is now a list of all users or just the single loggeed in user.
         var user_cache_path = path.join(master_path, USER_CACHE_PREFIX + usernames[username]);
         if(!directoryExists(user_cache_path)){
            fs.mkdirSync(user_cache_path); // Creates the directory if it doesn't already exist
         }
         var user_list = fs.readdirSync(user_cache_path); // Gets all the user files
         user_list.forEach(function(filename){
            var file_path = path.join(user_cache_path, filename);
            if(fileExists(file_path) && path.extname(filename) == ".json"){
               var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
               json_data.owner = usernames[username]; // Adds the owner to the file (for the server list)
               cache.push(json_data); // Adds each file to the cache to be returned
            }
         });
      }
   }

   res.send(JSON.stringify(cache)); // Returns the cache to the browser.
});

router.all('/app/settings/rotate', function(req, res){
   var angle = parseInt(req.query.angle); // Gets the given angle
   var url = req.query.url // Gets the given URL
   if(angle == "undefined" || angle == "" || typeof(angle) != "number"){
      angle = 0; // Sets angle to 0 if its not set to a number
   }
   angle = Math.round(angle/90)*90; // Rounds the angle to the neerest 90 degrees
   jimp.read(url, function(err, image){ // Gets the image file from the URL
      if (err) throw err;
      image.rotate(angle); // Rotates the image *clockwise!*
      //image.resize( width, jimp.AUTO);
      image.getBuffer(jimp.MIME_PNG, function(err, image){ // Buffers the image so it sends correctly
         if(err) throw err;
         res.setHeader('Content-type', 'image/png'); // Makes sure its a png
         res.send(image); // Sends the image to the browser.
      });
   });   
});

router.get('/app/settings/remove_server_cache', function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var permission = user.getAccessLevel(req); // Gets the user permission
   var domain = req.query.domain; // Gets the given domain
   var filename = req.query.filename; // Gets the given filename
   var owner = req.query.owner; // Gets the given owner
   filename += ".json"; // Adds the file extension to the filename
   var base_path = path.join(MASTER_CACHE_PATH, domain, USER_CACHE_PREFIX + owner); // The path if the owner is not a domain
   var master_list = fs.readdirSync(MASTER_CACHE_PATH); // The list of files and folders in the master_cache folder
   master_list.forEach(function(value){
      if(value == username){
         base_path = path.join(MASTER_CACHE_PATH,domain);
         return;
      }
   });
   var file_path = path.join(base_path, filename); // The current file path
   var delete_path = path.join(base_path, "deleted_cache"); // The directory to be moved to (so it can be created if needs be)
   var delete_file_path = path.join(delete_path, filename); // The full path to be moved to
   if(owner == username || permission == "admin"){
      if(!directoryExists(delete_path)){
         fs.mkdirSync(delete_path); // Creates the directory if it doesn't already exist
      }
      fs.rename(file_path, delete_file_path, function(err){ // Moves the file to the deleted cache
         if(err) throw err;
         res.send(delete_file_path); // Returns the file path so it can be replaced if the user undoes the delete
      });
   }
});

router.all('/app/settings/update_layer', function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var permission = user.getAccessLevel(req); // Gets the user permission
   var domain = req.query.domain; // Gets the given domain
   var data = JSON.parse(req.body.data); // Gets the data given
   var filename = data.serverName + ".json"; // Gets the given filename
   var base_path = path.join(MASTER_CACHE_PATH, domain); // The base path of 
   if(username != domain){
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   fs.writeFile(this_path, JSON.stringify(data), function(err){
      if(err) throw err;
      res.send("");
   });
});

router.get('/app/settings/add_wcs_url', function(req, res){
   var url = req.query.url.split('?')[0] + "?"; // Gets the given url
   var username = user.getUsername(req); // Gets the given username
   var permission = user.getAccessLevel(req); // Gets the user permission
   var domain = req.query.domain; // Gets the given domain
   var filename = req.query.filename + ".json"; // Gets the given filename

   var base_path = path.join(MASTER_CACHE_PATH, domain);
   if(username != domain){
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   json_data = JSON.parse(fs.readFileSync(this_path));
   json_data.wcsURL = url;
   fs.writeFileSync(this_path, JSON.stringify(json_data));
   res.send(this_path);
});

router.all('/app/settings/add_user_layer', function(req, res){
   var layers_list = JSON.parse(req.body.layers_list); // Gets the given layers_list
   var server_info = JSON.parse(req.body.server_info); // Gets the given server_info
   var domain = req.body.domain; // Gets the given domain
   var username = server_info.owner; // Gets the given username

   if('provider' in server_info && 'server_name' in server_info){ // Checks that all the required fields are in the object
      var filename = server_info.server_name + '.json';
      if(domain == username){
         // If is is a global file it is refreshed from the URL
         var cache_path = path.join(MASTER_CACHE_PATH, domain);
         var save_path = path.join(MASTER_CACHE_PATH, domain, filename);
      }else{
         // If it is to be a user file the data is retrieved from the temorary cache
         var cache_path = path.join(MASTER_CACHE_PATH, domain, "temporary_cache");
         var save_path = path.join(MASTER_CACHE_PATH, domain, USER_CACHE_PREFIX + username, filename);
      }
      if(!directoryExists(cache_path)){
         fs.mkdirSync(cache_path); // Creates the directory if it doesn't already exist
      }
      var cache_file = path.join(cache_path, filename); // Adds the filename to the path
      var data = JSON.parse(fs.readFileSync(cache_file)); // Gets the data from the file
      var new_data = []; // The list for the new data to go into
      for(new_layer in layers_list){ // Loops through each new layer.
         var this_new_layer = layers_list[new_layer];
         if('abstract' in this_new_layer && 'id' in this_new_layer && 'list_id' in this_new_layer && 'nice_name' in this_new_layer && 'tags' in this_new_layer){ // Checks that the layer has the required fields
            var found = false;
            for(old_layer in data.server.Layers){ // Loops through each old layer to be compared.
               if(data.server.Layers[old_layer].Name == this_new_layer.original_name){ // When the layers match
                  if(this_new_layer.include){ // As long as it should be included
                     var new_data_layer = data.server.Layers[old_layer]; // 
                     new_data_layer.Title = titleCase(this_new_layer.nice_name);
                     new_data_layer.Abstact = this_new_layer.abstract;
                     for(key in this_new_layer.tags){
                        var val = this_new_layer.tags[key];
                        if(val && val.length > 0){
                           new_data_layer.tags[key] = val;
                        }
                     }
                     if(server_info.provider.length > 0){
                        new_data_layer.tags.data_provider = server_info.provider;
                        var clean_provider = server_info.provider.replace(/&amp/g,"and").replace(/ /g, "_").replace(/\\/g, "_").replace(/\//g, "_").replace(/\./g, "_").replace(/\,/g, "_").replace(/\(/g, "_").replace(/\)/g, "_").replace(/\:/g, "_").replace(/\;/g, "_");
                        data.options.providerShortTag = clean_provider;
                     }
                     new_data_layer.tags.niceName = this_new_layer.nice_name;
                     new_data_layer.LegendSettings = this_new_layer.legendSettings;
                     new_data.push(new_data_layer);
                     found = true;
                     break;
                  }
               }
            }
            if(!found){
               console.log(this_new_layer.original_name + " is currently not included.");
            }
         }
      }
      // Adds all of the broader information to the JSON object.
      data.server.Layers = new_data;
      if(data.contactInfo){
         data.contactInfo.address = server_info.address.replace("\n", "<br/>") || "";
         data.contactInfo.email = server_info.email || "";
         data.contactInfo.person = server_info.person || "";
         data.contactInfo.phone = server_info.phone || "";
         data.contactInfo.position = server_info.position || "";
      }
      data.wcsURL = server_info.wcsURL || "";
      fs.writeFileSync(save_path, JSON.stringify(data));
      res.send("");
   }else{
      res.send("Error");
   }
});

router.get('/app/settings/load_data_values', function(req, res){
   var url = req.query.url; // Gets the given URL
   var name = req.query.name; // Gets the given name
   var units = req.query.units; // getst the given units

   request(url + '&INFO_FORMAT=text/xml', function(err, response, body){
      if(err) throw err;
      var content_type = response.headers['content-type'];
      var response_text = "Sorry, could not calculate a value for: " + name;

      if(content_type == 'application/xml;charset=UTF-8'){
         xml2js.parseString(body, function (err, result) {
            if(err) throw err;
            try{
               response_text = name + ": " + result.FeatureInfoResponse.FeatureInfo[0].value[0] + " " + units;
            }catch(e){
               response_text = "Sorry, could not calculate a value for: " + name
            }
            res.send(response_text);
         });
      }else{
         request(url, function(err2, response2, body2){
            if(err2) throw err2;
            content_type = response2.headers['content-type'].replace(';charset=UTF-8', '');
            if(content_type == "text/xml"){
               xml2js.parseString(body2, function (err, result) {
                  if(err) throw err;
                  var output = name + ":"
                  try{
                     for(key in result.FeatureInfoResponse.FIELDS[0].$){
                        output += "<br/>" + key + ": " + result.FeatureInfoResponse.FIELDS[0].$[key];
                     }
                  }catch(e){
                     output += "<br/>no data found at this point";
                  }
                  response_text = output;
               });
            }else if(content_type == "text/plain" || content_type == "text/html"){
               response_text = name + ":<br/>" + body2.replace(/(?:\r\n|\r|\n)/g, '<br />');
            }
            res.send(response_text);
         });
      }
   });
});


router.get('/app/settings/load_new_wms_layer', function(req, res){
   var url = req.query.url.replace(/\?/g, "") + "?"; // Gets the given url
   var refresh = req.query.refresh; // Gets the given refresh
   var domain = req.query.domain; // Gets the given domain

   var sub_master_cache = {};
   sub_master_cache.server = {};
   var clean_url = url.replace("http://", "").replace("https://", "").replace(/\//g, "-").replace(/\?/g, "");
   var contact_info = {};
   var address = "";

   var filename = clean_url + ".json";
   var directory = path.join(MASTER_CACHE_PATH, domain, "temporary_cache");
   if(!directoryExists(directory)){
      fs.mkdirSync(directory); // Creates the directory if it doesn't already exist
   }
   var file_path = path.join(directory, filename);

   if(refresh == "true" || !fileExists(file_path)){
      request(url + "service=WMS&request=GetCapabilities", function(error, response, body){
         if(error) throw error;
         xml2js.parseString(body, function (err, result) {
            if(err) throw err;
            var contact_data = result.WMS_Capabilities.Service[0].ContactInformation[0];
            var contact_person = contact_data.ContactPersonPrimary[0].ContactPerson;
            var contact_organization = contact_data.ContactPersonPrimary[0].ContactOrganization;
            var contact_position = contact_data.ContactPosition;
            var contact_address;
            var contact_city;
            var contact_state;
            var contact_post_code;
            var contact_country;
            var address_block = contact_data.ContactAddress;
            if(address_block){
               contact_address = address_block[0].Address;
               contact_city = address_block[0].City;
               contact_state = address_block[0].StateOrProvince;
               contact_post_code = address_block[0].PostCode;
               contact_country = address_block[0].Country;
            }
            var contact_phone = contact_data.ContactVoiceTelephone;
            var contact_email = contact_data.ContactElectronicMailAddress;

            if(contact_person[0].length > 0){
               contact_info.person = contact_person[0];
            }
            if(typeof(contact_organization[0]) == 'string'){
               var provider = contact_organization[0];
            }
            if(contact_position && contact_position[0].length > 0){
               contact_info.position = contact_position[0];
            }
            if(contact_address && contact_address[0].length > 0){
               address += contact_address[0] + "<br/>";
            }
            if(contact_city && contact_city[0].length > 0){
               address += contact_city[0] + "<br/>";
            }
            if(contact_state && contact_state[0].length > 0){
               address += contact_state[0] + "<br/>";
            }
            if(contact_post_code && contact_post_code[0].length > 0){
               address += contact_post_code[0] + "<br/>";
            }
            if(contact_country && contact_country[0].length > 0){
               address += contact_country[0] + "<br/>";
            }
            if(contact_phone && contact_phone[0].length > 0){
               contact_info.phone = contact_phone[0];
            }
            if(contact_email && contact_email[0].length > 0){
               contact_info.email = contact_email[0];
            }
            if(address.length > 0){
               contact_info.address = address;
            }

            for(index in result.WMS_Capabilities.Capability[0].Layer){
               var parent_layer = result.WMS_Capabilities.Capability[0].Layer[index]
               var layers = [];
               var name;
               var service_title;
               var title;
               var abstract;
               var bounding_boxes;
               var dimensions = {};
               var style;

               var title_elem = parent_layer.Title;
               var abstract_elem = parent_layer.Abstract;
               var ex_bounding_elem = parent_layer.EX_GeographicBoundingBox;
               var bounding_elem = parent_layer.BoundingBox;
               var style_elem = parent_layer.Style;

               if(title_elem && typeof(title_elem[0]) == "string"){
                  service_title = title_elem[0].replace(/ /g,"_").replace(/\(/g,"_").replace(/\)/g,"_").replace(/\//g,"_");
               }
               if(abstract_elem && typeof(abstract_elem[0]) == "string"){
                  abstract = abstract_elem[0];
               }
               if(typeof(bounding_elem) != "undefined" && typeof(ex_bounding_elem) != "undefined"){
                  bounding_boxes = createBoundingBoxes(parent_layer);
               }
               if(style_elem){
                  style = createStylesArray(parent_layer);
                  if(style.length == 0){
                     style = undefined;
                  }
               }

               digForLayers(parent_layer, name, service_title, title, abstract, bounding_boxes, style, dimensions, clean_url, layers, provider);
            }
            if(layers.length > 0){
               sub_master_cache.server.Layers = layers;
               sub_master_cache.options = {"providerShortTag": "UserDefinedLayer"};
               sub_master_cache.wmsURL = url;
               sub_master_cache.serverName = clean_url;
               sub_master_cache.contactInfo = contact_info;
               sub_master_cache.provider = provider.replace(/&amp;/g, '&');
               sub_master_cache.timeStamp = new Date();

               var data = JSON.stringify(sub_master_cache)
               fs.writeFileSync(file_path, data);
               res.send(data);
            }else{
               res.send({"Error": "Could not find any loadable layers in the <a href='" + url + "service=WMS&request=GetCapabilities'>WMS file</a> you provided"});
            }
         });
      });
   }else{
      res.send(fs.readFileSync(file_path));
   }
});

function digForLayers(parent_layer, name, service_title, title, abstract, bounding_boxes, style, dimensions, clean_url, layers, provider){
   for(index in parent_layer.Layer){
      var layer = parent_layer.Layer[index]

      var name_elem = layer.Name;
      var title_elem = layer.Title;
      var abstract_elem = layer.Abstract;
      var ex_bounding_elem = layer.EX_GeographicBoundingBox;
      var bounding_elem = layer.BoundingBox;
      var dimension_elem = layer.Dimension;
      var style_elem = layer.Style;

      if(name_elem && typeof(name_elem[0]) == "string"){
         name = name_elem[0];
      }
      if(title_elem && typeof(title_elem[0]) == "string"){
         title = title_elem[0];
      }
      if(abstract_elem && typeof(abstract_elem[0]) == "string"){
         abstract = abstract_elem[0];
      }

      if(dimension_elem){
         dimensions = createDimensionsArray(layer)
      }

      if(typeof(bounding_elem) != "undefined" && typeof(ex_bounding_elem) != "undefined"){
         bounding_boxes = createBoundingBoxes(layer);
      }
      if(style_elem){
         style = createStylesArray(layer);
         if(style.length == 0){
            style = undefined;
         }
      }
      if(name && service_title && title && bounding_boxes && style){
         layers.push({"Name": name, "Title": title, "tags":{ "indicator_type": [ service_title.replace(/_/g, " ")],"niceName": titleCase(title), "data_provider" : provider}, "Abstract": abstract, "FirstDate": dimensions.firstDate, "LastDate": dimensions.lastDate, "EX_GeographicBoundingBox": bounding_boxes.exGeographicBoundingBox, "MoreIndicatorInfo" : false})
         var layer_data = {"FirstDate": dimensions.firstDate, "LastDate": dimensions.lastDate, "EX_GeographicBoundingBox": bounding_boxes['exGeographicBoundingBox'], "BoundingBox": bounding_boxes['boundingBox'], "Dimensions": dimensions.dimensions || [], "Styles": style};
         var save_path = path.join(LAYER_CACHE_PATH, clean_url + "_" + name + ".json");
         fs.writeFileSync(save_path, JSON.stringify(layer_data));
         style = undefined;
      }else{
         digForLayers(layer, name, service_title, title, abstract, bounding_boxes, style, dimensions, clean_url, layers, provider);
      }

   }

}

function createBoundingBoxes(layer){
   var bounding_boxes = {};
   function bBox(bounding){
      return {
            "CRS":bounding.CRS,
            "MinX":bounding.minx,
            "MaxX":bounding.maxx,
            "MinY":bounding.miny,
            "MaxY":bounding.maxy
         };
   }

   var boundingBox;
   for(index in layer.BoundingBox){
      bounding_elem = layer.BoundingBox[index].$
      if(bounding_elem.CRS == "EPSG:4326"){
         boundingBox = bBox(bounding_elem);
         break;
      }else if(bounding_elem.CRS == "EPSG:3857"){
         boundingBox = bBox(bounding_elem);
      }else if(bounding_elem.CRS == "CRS:84" && _.size(boundingBox) == 0){
         boundingBox = bBox(bounding_elem);
      }
   }
   
   bounding_elem = layer.EX_GeographicBoundingBox[0]
   var exGeographicBoundingBox = {
      "WestBoundLongitude": bounding_elem.westBoundLongitude[0],
      "EastBoundLongitude": bounding_elem.eastBoundLongitude[0],
      "SouthBoundLatitude": bounding_elem.southBoundLatitude[0],
      "NorthBoundLatitude": bounding_elem.northBoundLatitude[0]
   };
   bounding_boxes.exGeographicBoundingBox = exGeographicBoundingBox;
   bounding_boxes.boundingBox = boundingBox;
   return bounding_boxes;
}

function createStylesArray(layer){
   var styles = [];
   for(index in layer.Style){
      var style_tag = layer.Style[index];
      var name = style_tag.Name;
      var legend = style_tag.LegendURL;

      if(name && legend){
         name = name[0];
         legend = legend[0];
         styles.push({
            "Name": name,
            "LegendURL": legend.OnlineResource[0].$['xlink:href'],
            "Width": legend.$.width,
            "Height": legend.$.height
         });
      }
   }
   return styles;
}

function createDimensionsArray(layer){
   var dimensions = {};
   dimensions.dimensions = [];
   dimensions.temporal = false;
   dimensions.firstDate;
   dimensions.lastDate;

   for(index in layer.Dimension){
      var dimension = layer.Dimension[index];
      var dimensionList = dimension._.split(",");
      var dimensionValue = dimension._.trim();

      if(dimension.$.name == "time"){
         dimensions['temporal'] = true;
         var newDates = []
         for(dimension_index in dimensionList){
            var dimension_str = dimensionList[dimension_index];
            var dateTime = dimension_str.trim();
            if(dateTime.search("-") == 4){
               newDates.push(dateTime);
            }
         }
         if(newDates.length > 0){
            dimensions.firstDate = newDates[0].trim().substring(0, 10);
            dimensions.lastDate = newDates[newDates.length-1].trim().substring(0, 10);
         }
         dimensionValue = newDates.join().trim();
      }
      dimensions.dimensions.push({
         "Name" : dimension.$.name,
         "Units" : dimension.$.units,
         "Default" : dimension.$.default,
         "Value" : dimensionValue
      });
   }
   return dimensions;
}