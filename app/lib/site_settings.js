var xml2js = require('xml2js'); // Added
var request = require('request');
var express = require('express'); // Added
var router = express.Router();
var util = require('util');
var path = require('path');
var fs = require("fs");
var _ = require("underscore");
var jimp = require("jimp");
var bodyParser = require('body-parser');
var titleCase = require('to-title-case');
var user = require('./user.js');
var utils = require('./utils.js');

var child_process = require('child_process');

var USER_CACHE_PREFIX = "user_";
var CURRENT_PATH = __dirname;
var EXAMPLE_CONFIG_PATH = CURRENT_PATH + "/../../config_examples/config.js";
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var METADATA_PATH = CURRENT_PATH + "/../../markdown/";
var LAYER_CONFIG_PATH = MASTER_CONFIG_PATH + "layers/";

var WMS_NAMESPACE = '{http://www.opengis.net/wms}'


// This is for the xml2js parsing, it removes any silly namespaces.
var prefixMatch = new RegExp(/(?!xmlns)^.*:/);
var stripPrefix = function(str) {
   return str.replace(prefixMatch, '');
};

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

function sortLayersList(data, param){
   var byParam = data.slice(0);
   for(layer in byParam){
      if(!byParam[layer][param]){
         return byParam;
      }
   }
   byParam.sort(function(a,b) {
       var x = a[param].toLowerCase();
       var y = b[param].toLowerCase();
       return x < y ? -1 : x > y ? 1 : 0;
   });
   return byParam;
}

router.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-Modified-Since');
   next();
});

router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));

router.get('/app/settings/proxy', function(req, res) {
   var url = decodeURI(req.query.url) // Gets the given URL
   request(url, function(err, response, body){
      if(err){
         utils.handleError(err, res);
      }else{
         res.status(response.statusCode);
         var content_type = response.headers['content-type']
         if(content_type){
            if(content_type == "WMS_XML"){ // TODO: see if there is a smaller brick to crack this walnut
               content_type = "text/xml"
            }
            res.setHeader("content-type", content_type.split("; subtype=gml")[0]); // res.send has a tantrum if the subtype is GML!
         }
         res.send(body);
      }
   });
});

router.get('/app/settings/config', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var config_path = path.join(MASTER_CONFIG_PATH, domain, "config.js");
   var js_file;
   try{
      js_file = fs.readFileSync(config_path);
   }catch(e){
      js_file = fs.readFileSync(EXAMPLE_CONFIG_PATH);
   }
   res.send(js_file);
});

router.get('/app/settings/view', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var view_name = req.query.view;
   var view_path = path.join(MASTER_CONFIG_PATH, domain, "views", view_name + ".json");
   var view_file;
   if(utils.fileExists(view_path)){
      view_file = fs.readFileSync(view_path);
      res.send(view_file);
   }else{
      res.status(404).send();
   }
});

router.get('/app/settings/get_views', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain

   var views_path = path.join(MASTER_CONFIG_PATH, domain, "views");

   if(!utils.directoryExists(views_path)){
      res.status(404).send();
      return;
   }

   var views_obj = {};
   var views_list = fs.readdirSync(views_path); // The list of files and folders in the master_cache folder
   views_list.forEach(function(filename){
      var view_path = path.join(views_path, filename);

      if(utils.fileExists(view_path)){
         view_file = fs.readFileSync(view_path);
         try{
            var niceName = filename.replace('.json', "")
            views_obj[niceName] = JSON.parse(view_file).title || niceName;
         }catch(e){};
      }
   });

   res.send(views_obj);

});

router.get('/app/settings/get_owners', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var username = user.getUsername(req);
   var permission = user.getAccessLevel(req, domain);
   var owners = [];
   owners.push(username);

   if(permission == "admin"){
      var domain_path = path.join(MASTER_CONFIG_PATH, domain);
      var domain_folder = fs.readdirSync(domain_path); // The list of files and folders in the domain folder
      domain_folder.forEach(function(folder){
         var folder_name = path.join(domain_path, folder);
         if(utils.directoryExists(folder_name) && stringStartsWith(folder, USER_CACHE_PREFIX)){
            var folder_owner = folder.replace(USER_CACHE_PREFIX, "");
            if(folder_owner != username){
               owners.push(folder_owner);
            }
         }
      });
      owners.push(domain);
   }
   res.send({owners:owners});
});

router.get('/app/settings/get_dictionary', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var username = user.getUsername(req);
   var dict_path = path.join(MASTER_CONFIG_PATH, "dictionary.json");
   var user_dict_path = path.join(MASTER_CONFIG_PATH, domain, "user_" + username, "dictionary.json");

   if(utils.fileExists(dict_path)){
      var dict_file = JSON.parse(fs.readFileSync(dict_path));
      if(utils.fileExists(user_dict_path)){
         var user_dict_file = JSON.parse(fs.readFileSync(user_dict_path));
         _.extend(dict_file, user_dict_file)
      }
      res.send(dict_file);
   }else{
      res.status(404).send();
   }
});

router.get('/app/settings/add_to_dictionary', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var standard_name = req.query.standard_name;
   var display_name = req.query.display_name;
   var username = user.getUsername(req);
   var permission = user.getAccessLevel(req, domain);

   var path_gutts = "";
   if(permission != "admin"){
      path_gutts = path.join(domain, "user_" + username);
   }
   var dict_path = path.join(MASTER_CONFIG_PATH, path_gutts, "dictionary.json");
   var dict;
   if(!utils.fileExists(dict_path)){
      if(standard_name && display_name){
         dict = '{"' + standard_name + '":["' + display_name + '"]}';
      }else{
         dict = "{}";
      }
      fs.writeFileSync(dict_path, dict);
   }else{
      dict = JSON.parse(fs.readFileSync(dict_path));
      if(!dict[standard_name]){
         dict[standard_name] = [];
      }
      if(dict[standard_name].indexOf(display_name) < 0){
         dict[standard_name].push(display_name);
      }
      fs.writeFileSync(dict_path, JSON.stringify(dict));
   }
   res.status(200).send();
});


router.get('/app/cache/*?', function(req, res) {
   var config_path = path.join(MASTER_CONFIG_PATH, req.params[0]);// Gets the given path
   res.sendFile(config_path, function (err) {
      if (err) {
         utils.handleError(err, res);
      }
   });
});

router.get('/app/metadata/*?', function(req, res) {
   var html_path = path.join(METADATA_PATH, req.params[0] + ".md");// Gets the given path

   var markdown_data = fs.readFileSync(html_path).toString();


   var markdown = require( "markdown" ).markdown;

   res.send( markdown.toHTML(markdown_data) );
});

router.get('/app/settings/get_cache', function(req, res) {
   var this_username = user.getUsername(req);
   var usernames = [this_username];
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain);

   var cache = []; // The list of cache deatils to be returned to the browser
   var master_path = path.join(MASTER_CONFIG_PATH, domain); // The path for the domain cache

   if(!utils.directoryExists(master_path)){
      utils.mkdirpSync(master_path); // Creates the directory if it doesn't exist
   }

   var master_list = fs.readdirSync(master_path); // The list of files and folders in the master_cache folder
   master_list.forEach(function(filename){
      var file_path = path.join(master_path, filename);
      if(utils.fileExists(file_path) && path.extname(filename) == ".json" && filename != "vectorLayers.json"){
         var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
         if(permission != "admin"){ // The Layers list is filtered .
            json_data.server.Layers = json_data.server.Layers.filter(function(val){
               return val.include === true || typeof(val.include) === "undefined";
            });
         }
         json_data.owner = domain; // Adds the owner to the file (for the server list)
         if(json_data.wmsURL){
            cache.push(json_data); // Adds each file to the cache to be returned
         }
      }
   });
   if(permission != "guest"){
      if(permission == "admin"){
         master_list.forEach(function(filename){
            if(utils.directoryExists(path.join(master_path, filename))){
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
         if(!utils.directoryExists(user_cache_path)){
            utils.mkdirpSync(user_cache_path); // Creates the directory if it doesn't already exist
         }
         var user_list = fs.readdirSync(user_cache_path); // Gets all the user files
         user_list.forEach(function(filename){
            var file_path = path.join(user_cache_path, filename);
            if(utils.fileExists(file_path) && path.extname(filename) == ".json" && filename != "dictionary.json"){
               var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
               if(permission != "admin" && this_username != filename.replace(USER_CACHE_PREFIX, "")){ // The Layers list is filtered.
                  json_data.server.Layers = json_data.server.Layers.filter(function(val){
                     return val.include === true || typeof(val.include) === "undefined";
                  });
               }
               json_data.owner = usernames[username]; // Adds the owner to the file (for the server list)
               if(json_data.wmsURL){
                  cache.push(json_data); // Adds each file to the cache to be returned
               }
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
      if (err){
         utils.handleError(err, res);
      }else{
         image.rotate(angle); // Rotates the image *clockwise!*
         //image.resize( width, jimp.AUTO);
         image.getBuffer(jimp.MIME_PNG, function(err2, image2){ // Buffers the image so it sends correctly
            if(err2){
               utils.handleError(err2, res);
            }else{
               res.setHeader('Content-type', 'image/png'); // Makes sure its a png
               res.send(image2); // Sends the image to the browser.
            }
            
         });
      }
   });   
});

router.get('/app/settings/remove_server_cache', function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain); // Gets the user permission
   var filename = req.query.filename; // Gets the given filename
   var owner = req.query.owner; // Gets the given owner
   filename += ".json"; // Adds the file extension to the filename
   var base_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + owner); // The path if the owner is not a domain
   var master_list = fs.readdirSync(MASTER_CONFIG_PATH); // The list of files and folders in the master_cache folder
   master_list.forEach(function(value){
      if(value == owner){
         base_path = path.join(MASTER_CONFIG_PATH,domain);
         return;
      }
   });
   var file_path = path.join(base_path, filename); // The current file path
   var delete_path = path.join(base_path, "deleted_cache"); // The directory to be moved to (so it can be created if needs be)
   var delete_file_path = path.join(delete_path, filename); // The full path to be moved to
   if(owner == username || permission == "admin"){
      if(!utils.directoryExists(delete_path)){
         utils.mkdirpSync(delete_path); // Creates the directory if it doesn't already exist
      }
      fs.rename(file_path, delete_file_path, function(err){ // Moves the file to the deleted cache
         if(err){
            utils.handleError(err, res);
         }else{
            res.send(JSON.stringify({'path':delete_file_path, 'owner':owner})); // Returns the file path so it can be replaced if the user undoes the delete
         }
      });
   }
});

router.get('/app/settings/add_wcs_url', function(req, res){
   var url = req.query.url.split('?')[0] + "?"; // Gets the given url
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain); // Gets the user permission
   var filename = req.query.filename + ".json"; // Gets the given filename

   var base_path = path.join(MASTER_CONFIG_PATH, domain);
   if(username != domain){
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   json_data = JSON.parse(fs.readFileSync(this_path));
   json_data.wcsURL = url;
   fs.writeFileSync(this_path, JSON.stringify(json_data));
   res.send(this_path);
});

router.all('/app/settings/restore_server_cache', function(req, res){
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain); // Gets the user permission
   var data = req.body; // Gets the data back to restore previously deleted file
   var owner = data.owner;
   var deleted_path = data.path;
   var restored_path = deleted_path.replace("deleted_cache/", "");
   if(owner == username || permission == "admin"){
      fs.rename(deleted_path, restored_path, function(err){ // Moves the file to the deleted cache
         if(err){
            utils.handleError(err, res);
         }else{
            res.send("");
         }
      });
   }
});

router.all('/app/settings/update_layer', function(req, res){
   var username = req.query.username; // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain); // Gets the user permission
   var data = JSON.parse(req.body.data); // Gets the data given
   var filename = data.serverName + ".json"; // Gets the given filename
   var base_path = path.join(MASTER_CONFIG_PATH, domain); // The base path of 
   if(username != domain){
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   fs.writeFile(this_path, JSON.stringify(data), function(err){
      if(err){
            utils.handleError(err, res);
         }else{
            res.send("");
         }
   });
});

router.all('/app/settings/add_user_layer', function(req, res){
   var layers_list = JSON.parse(req.body.layers_list); // Gets the given layers_list
   var server_info = JSON.parse(req.body.server_info); // Gets the given server_info
   var domain = utils.getDomainName(req); // Gets the given domain
   var username = server_info.owner; // Gets the given username


   if('provider' in server_info && 'server_name' in server_info){ // Checks that all the required fields are in the object
      var filename = server_info.server_name + '.json';
      if(domain == username){
         // If is is a global file it is refreshed from the URL
         var cache_path = path.join(MASTER_CONFIG_PATH, domain);
         var save_path = path.join(MASTER_CONFIG_PATH, domain, filename);
      }else{
         // If it is to be a user file the data is retrieved from the temorary cache
         var cache_path = path.join(MASTER_CONFIG_PATH, domain, "temporary_cache");
         var save_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, filename);
      }
      if(!utils.directoryExists(cache_path)){
         utils.mkdirpSync(cache_path); // Creates the directory if it doesn't already exist
      }
      var cache_file = path.join(cache_path, filename); // Adds the filename to the path
      var data = {};
      try{
         data = JSON.parse(fs.readFileSync(cache_file)); // Gets the data from the file
      }catch(e){
         // Tries again with the temporary cache (Perhaps an admin is adding a server to this domain)
         if(domain == username){
            cache_file = path.join(cache_path, "temporary_cache", filename); // Adds the filename to the path
            data = JSON.parse(fs.readFileSync(cache_file)); // Gets the data from the file
         }
      }
      var new_data = []; // The list for the new data to go into
      for(new_layer in layers_list){ // Loops through each new layer.
         var this_new_layer = layers_list[new_layer];
         if('abstract' in this_new_layer && 'id' in this_new_layer && 'list_id' in this_new_layer && 'nice_name' in this_new_layer && 'tags' in this_new_layer){ // Checks that the layer has the required fields
            var found = false;
            for(old_layer in data.server.Layers){ // Loops through each old layer to be compared.
               if(data.server.Layers[old_layer].Name == this_new_layer.original_name){ // When the layers match
                  var new_data_layer = data.server.Layers[old_layer]; // 
                  new_data_layer.Title = titleCase(this_new_layer.nice_name);
                  new_data_layer.Abstract = this_new_layer.abstract;
                  new_data_layer.include = this_new_layer.include;
                  for(key in this_new_layer.tags){
                     var val = this_new_layer.tags[key];
                     if(val && val.length > 0 && val[0] != ""){
                        new_data_layer.tags[key] = val;
                     }else{
                        new_data_layer.tags[key] = undefined;
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
            if(!found){
               console.log(this_new_layer.original_name + " is currently not included.");
            }
         }
      }
      // Adds all of the broader information to the JSON object.
      data.server.Layers = sortLayersList(new_data, "Title");
      if(server_info){
         if(!data.contactInfo){
            data.contactInfo = {};
         }
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
      if(err){
         utils.handleError(err, res);
      }else{
         var content_type = response.headers['content-type'];
         var response_text = "Sorry, could not calculate a value for: " + name;

         if(content_type == 'application/xml;charset=UTF-8'){
            xml2js.parseString(body,{tagNameProcessors:[stripPrefix], attrNameProcessors: [stripPrefix]}, function (err, result) {
               if(err){
                  utils.handleError(err, res);
               }else{
                  try{
                     response_text = name + ": " + result.FeatureInfoResponse.FeatureInfo[0].value[0] + " " + units;
                  }catch(e){
                     response_text = "Sorry, could not calculate a value for: " + name
                  }
                  res.send(response_text);
               }
            });
         }else{
            request(url, function(err, response, body){
               if(err){
                  utils.handleError(err, res);
               }else{
                  content_type = response.headers['content-type'].replace(';charset=UTF-8', '');
                  if(content_type == "text/xml"){
                     xml2js.parseString(body,{tagNameProcessors:[stripPrefix], attrNameProcessors: [stripPrefix]}, function (err, result) {
                        if(err){
                           utils.handleError(err, res);
                        }else{
                           var output = name + ":"
                           try{
                              for(key in result.FeatureInfoResponse.FIELDS[0].$){
                                 output += "<br/>" + key + ": " + result.FeatureInfoResponse.FIELDS[0].$[key];
                              }
                           }catch(e){
                              output += "<br/>no data found at this point";
                           }
                           response_text = output;
                        }
                     });
                  }else if(content_type == "text/plain" || content_type == "text/html"){
                     response_text = name + ":<br/>" + body.replace(/(?:\r\n|\r|\n)/g, '<br />');
                  }
                  res.send(response_text); 
               }
            });
         }
      }
   });
});


router.get('/app/settings/load_new_wms_layer', function(req, res){
   var url = req.query.url.replace(/\?/g, "") + "?"; // Gets the given url
   var refresh = req.query.refresh; // Gets the given refresh
   var domain = utils.getDomainName(req); // Gets the given domain

   var sub_master_cache = {};
   sub_master_cache.server = {};
   var clean_url = url.replace("http://", "").replace("https://", "").replace(/\//g, "-").replace(/\?/g, "");
   var contact_info = {};
   var address = "";

   var filename = clean_url + ".json";
   var directory = path.join(MASTER_CONFIG_PATH, domain, "temporary_cache");
   if(!utils.directoryExists(directory)){
      utils.mkdirpSync(directory); // Creates the directory if it doesn't already exist
   }
   var file_path = path.join(directory, filename);

   if(refresh == "true" || !utils.fileExists(file_path)){
      request(url + "service=WMS&request=GetCapabilities", function(error, response, body){
         if(error){
            utils.handleError(error, res);
         }else{
            xml2js.parseString(body,{tagNameProcessors:[stripPrefix], attrNameProcessors: [stripPrefix]}, function (err, result) {
               if(err){
                  utils.handleError(err, res);
               }else{
                  try{
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
                        var bounding_box;
                        var dimensions = {};
                        var style;

                        var title_elem = parent_layer.Title;
                        var abstract_elem = parent_layer.Abstract;
                        var ex_bounding_elem = parent_layer.EX_GeographicBoundingBox;
                        var style_elem = parent_layer.Style;

                        if(title_elem && typeof(title_elem[0]) == "string"){
                           service_title = title_elem[0].replace(/ /g,"_").replace(/\(/g,"_").replace(/\)/g,"_").replace(/\//g,"_");
                        }
                        if(abstract_elem && typeof(abstract_elem[0]) == "string"){
                           abstract = abstract_elem[0];
                        }
                        if(typeof(ex_bounding_elem) != "undefined"){
                           bounding_box = createBoundingBox(parent_layer);
                        }
                        if(style_elem){
                           style = createStylesArray(parent_layer);
                           if(style.length == 0){
                              style = undefined;
                           }
                        }

                        digForLayers(parent_layer, name, service_title, title, abstract, bounding_box, style, dimensions, clean_url, layers, provider);
                     }
                     if(layers.length > 0){
                        sub_master_cache.server.Layers = sortLayersList(layers, "Title");
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
                  }catch(e){
                     utils.handleError(e, res);
                  }
               }
            });
         }
      });
   }else{
      res.send(fs.readFileSync(file_path));
   }
});

function digForLayers(parent_layer, name, service_title, title, abstract, bounding_box, style, dimensions, clean_url, layers, provider){
   for(index in parent_layer.Layer){
      var layer = parent_layer.Layer[index]

      var name_elem = layer.Name;
      var title_elem = layer.Title;
      var abstract_elem = layer.Abstract;
      var ex_bounding_elem = layer.EX_GeographicBoundingBox;
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

      if(typeof(ex_bounding_elem) != "undefined"){
         bounding_box = createBoundingBox(layer);
      }
      if(style_elem){
         style = createStylesArray(layer);
         if(style.length == 0){
            style = undefined;
         }
      }
      if(name && service_title && title && bounding_box){
         layers.push({"Name": name, "Title": title, "tags":{ "indicator_type": [ service_title.replace(/_/g, " ")],"niceName": titleCase(title), "data_provider" : provider}, "Abstract": abstract, "FirstDate": dimensions.firstDate, "LastDate": dimensions.lastDate, "EX_GeographicBoundingBox": bounding_box, "MoreIndicatorInfo" : false})
         var layer_data = {"FirstDate": dimensions.firstDate, "LastDate": dimensions.lastDate, "EX_GeographicBoundingBox": bounding_box, "Dimensions": dimensions.dimensions || [], "Styles": style};
         if(!utils.directoryExists(LAYER_CONFIG_PATH)){
            utils.mkdirpSync(LAYER_CONFIG_PATH);
         }
         var save_path = path.join(LAYER_CONFIG_PATH, clean_url + "_" + name + ".json");
         fs.writeFileSync(save_path, JSON.stringify(layer_data));
         style = undefined;
      }else{
         digForLayers(layer, name, service_title, title, abstract, bounding_box, style, dimensions, clean_url, layers, provider);
      }

   }

}

function createBoundingBox(layer){   
   bounding_elem = layer.EX_GeographicBoundingBox[0]
   var exGeographicBoundingBox = {
      "WestBoundLongitude": bounding_elem.westBoundLongitude[0],
      "EastBoundLongitude": bounding_elem.eastBoundLongitude[0],
      "SouthBoundLatitude": bounding_elem.southBoundLatitude[0],
      "NorthBoundLatitude": bounding_elem.northBoundLatitude[0]
   }
   return exGeographicBoundingBox;
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
            "LegendURL": legend.OnlineResource[0].$['href'],
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