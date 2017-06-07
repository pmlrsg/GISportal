/**
 * This module provides the functions to handle settings access from the front end.
 */

var crypto = require('crypto');
var fs = require("fs-extra");
var jimp = require("jimp");
var path = require('path');
var redis = require('redis');
var request = require('request');
var titleCase = require('to-title-case');
var _ = require("underscore");
var xml2js = require('xml2js');

var settingsApi = require('./settingsapi.js');
var user = require('./user.js');
var utils = require('./utils.js');

var client = redis.createClient();

var USER_CACHE_PREFIX = "user_";
var GROUP_CACHE_PREFIX = "group_";
var CURRENT_PATH = __dirname;
var EXAMPLE_CONFIG_PATH = CURRENT_PATH + "/../../config_examples/config.js";
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";

var settings = {};
module.exports = settings;

settings.proxy = function(req, res) {
   var url = decodeURI(req.query.url); // Gets the given URL
   request(url, function(err, response, body) {
      if (err) {
         utils.handleError(err, res);
      } else {
         res.status(response.statusCode);
         var content_type = response.headers['content-type'];
         if (content_type) {
            if (content_type == "WMS_XML") { // TODO: see if there is a smaller brick to crack this walnut
               content_type = "text/xml";
            }
            res.setHeader("content-type", content_type.split("; subtype=gml")[0]); // res.send has a tantrum if the subtype is GML!
         }
         res.send(body);
      }
   });
};

settings.img_proxy = function(req, res) {
   var url = decodeURI(req.query.url); // Gets the given URL
   jimp.read(url, function(err, image) { // Gets the image file from the URL
      if (err) {
         utils.handleError(err, res);
      } else {
         image.getBuffer(jimp.MIME_PNG, function(err2, image2) { // Buffers the image so it sends correctly
            if (err2) {
               utils.handleError(err2, res);
            } else {
               res.setHeader('Content-type', 'image/png'); // Makes sure its a png
               res.send(image2); // Sends the image to the browser.
            }

         });
      }
   });
};

settings.config = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var config_path = path.join(MASTER_CONFIG_PATH, domain, "config.js");
   var js_file;
   try {
      js_file = fs.readFileSync(config_path);
   } catch (e) {
      js_file = fs.readFileSync(EXAMPLE_CONFIG_PATH);
   }
   res.send(js_file);
};

settings.email_setup = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var email_config = global.config[domain].email;
   var email_setup = false;
   if (email_config.method == "mailgun") {
      if (email_config.mailgun_api_key && email_config.mailgun_domain) {
         email_setup = true;
      }
   }
   if (email_config.method == "smtp") {
      if ("smtp_email" in email_config && "smtp_pass" in email_config && "smtp_host" in email_config && "smtp_ssl" in email_config) {
         email_setup = true;
      }
   }
   res.send(email_setup);
};

settings.view = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var view_name = req.query.view;
   var view_path = path.join(MASTER_CONFIG_PATH, domain, "views", view_name + ".json");
   var view_file;
   if (utils.fileExists(view_path)) {
      view_file = fs.readFileSync(view_path);
      res.send(view_file);
   } else {
      res.status(404).send();
   }
};

settings.walkthrough = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var walkthrough = req.query.walkthrough;
   var owner = req.query.owner;

   var file_path;
   if (owner == domain) {
      file_path = path.join(MASTER_CONFIG_PATH, domain, walkthrough + "_walkthrough.json");
   } else {
      file_path = path.join(MASTER_CONFIG_PATH, domain, "user_" + owner, walkthrough + "_walkthrough.json");
   }
   var walkthrough_file;
   if (utils.fileExists(file_path)) {
      walkthrough_file = fs.readFileSync(file_path);
      res.send(walkthrough_file);
   } else {
      res.status(404).send();
   }
};

settings.delete_walkthrough = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var walkthrough = req.query.walkthrough;
   var owner = req.query.owner;

   var file_path;
   if (owner == domain) {
      file_path = path.join(MASTER_CONFIG_PATH, domain, walkthrough + "_walkthrough.json");
   } else {
      file_path = path.join(MASTER_CONFIG_PATH, domain, "user_" + owner, walkthrough + "_walkthrough.json");
   }
   // var walkthrough_file; // NOT USED
   if (utils.fileExists(file_path)) {
      fs.unlinkSync(file_path);
      res.send({});
   } else {
      res.status(404).send();
   }
};

settings.get_views = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain

   var views_path = path.join(MASTER_CONFIG_PATH, domain, "views");

   if (!utils.directoryExists(views_path)) {
      res.status(404).send();
      return;
   }

   var views_obj = {};
   var views_list = fs.readdirSync(views_path); // The list of files and folders in the master_cache folder
   views_list.forEach(function(filename) {
      var view_path = path.join(views_path, filename);

      if (utils.fileExists(view_path)) {
         var view_file = fs.readFileSync(view_path);
         try {
            var niceName = filename.replace('.json', "");
            views_obj[niceName] = JSON.parse(view_file).title || niceName;
         } catch (e) {}
      }
   });

   res.send(views_obj);

};

settings.get_walkthroughs = function(req, res) {
   var this_username = user.getUsername(req);
   var usernames = [this_username];
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain);

   var walkthrough_list = [];

   var master_path = path.join(MASTER_CONFIG_PATH, domain); // The path for the domain cache

   if (!utils.directoryExists(master_path)) {
      utils.mkdirpSync(master_path); // Creates the directory if it doesn't exist
   }

   var master_list = fs.readdirSync(master_path); // The list of files and folders in the master_cache folder
   master_list.forEach(function(filename) {
      var file_path = path.join(master_path, filename);
      if (utils.fileExists(file_path) && filename.substring(filename.length - 17, filename.length) == "_walkthrough.json") {
         var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
         walkthrough_list.push({
            'title': json_data.title,
            'owner': json_data.owner
         });
      }
   });
   if (permission != "guest") {
      if (permission == "admin") {
         master_list.forEach(function(filename) {
            if (utils.directoryExists(path.join(master_path, filename))) {
               if (filename.startsWith(USER_CACHE_PREFIX)) {
                  usernames.push(filename.replace(USER_CACHE_PREFIX, "")); // If you are an admin, add all of the usernames from this domain to the variable
               }
            }
         });
      }
      usernames = _.uniq(usernames); // Makes the list unique (admins will have themselves twice) 
      // Eventually should just remove all admins here!
      for (var username in usernames) { // Usernames is now a list of all users or just the single loggeed in user.
         var user_config_path = path.join(master_path, USER_CACHE_PREFIX + usernames[username]);
         if (!utils.directoryExists(user_config_path)) {
            utils.mkdirpSync(user_config_path); // Creates the directory if it doesn't already exist
         }
         var user_list = fs.readdirSync(user_config_path); // Gets all the user files
         user_list.forEach(function(filename) {
            var file_path = path.join(user_config_path, filename);
            if (utils.fileExists(file_path) && filename.substring(filename.length - 17, filename.length) == "_walkthrough.json") {
               var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
               walkthrough_list.push({
                  'title': json_data.title,
                  'owner': json_data.owner
               });
            }
         });
      }
   }
   // TODO change to res.json
   res.send(JSON.stringify(walkthrough_list)); // Returns the cache to the browser.

};

settings.get_owners = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var username = user.getUsername(req);
   var permission = user.getAccessLevel(req, domain);
   var owners = [];
   owners.push(username);

   if (permission == "admin") {
      var domain_path = path.join(MASTER_CONFIG_PATH, domain);
      var domain_folder = fs.readdirSync(domain_path); // The list of files and folders in the domain folder
      domain_folder.forEach(function(folder) {
         var folder_name = path.join(domain_path, folder);
         if (utils.directoryExists(folder_name) && folder.startsWith(USER_CACHE_PREFIX)) {
            var folder_owner = folder.replace(USER_CACHE_PREFIX, "");
            if (folder_owner != username) {
               owners.push(folder_owner);
            }
         } else if (utils.directoryExists(folder_name) && folder.startsWith(GROUP_CACHE_PREFIX)) {
            owners.push(folder);
         }
      });
      owners.push(domain);
   }
   res.send({
      owners: owners
   });
};

settings.get_groups = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain);

   var groups = [];

   if (permission == 'admin') {
      var domainPath = path.join(MASTER_CONFIG_PATH, domain);
      var domainFolder = fs.readdirSync(domainPath); // The list of files and folders in the domain folder
      for (var i = 0; i < domainFolder.length; i++) {
         var folder = domainFolder[i];
         var folderPath = path.join(domainPath, folder);
         if (utils.directoryExists(folderPath) && folder.startsWith(GROUP_CACHE_PREFIX)) {
            var groupName = folder.replace(GROUP_CACHE_PREFIX, '');
            var members = [];

            var membersFilePath = path.join(folderPath, 'members.json');
            var membersFile = JSON.parse(fs.readFileSync(membersFilePath));
            for (var j = 0; j < membersFile.length; j++) {
               members.push(membersFile[j].username);
            }

            groups.push({
               groupName: groupName,
               members: members
            });
         }
      }
      res.json(groups);
   } else {
      res.status(401).send();
   }
};

settings.save_group = function(req, res, next) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain);

   if (permission == 'admin') {
      var group = req.body;
      // Clean the groupName to remove .. \ /, and replace whitespace with underscore
      var groupName = group.groupName.replace(/\.\.|\\|\//g, '').replace(/\s/g, '_');

      var domainPath = path.join(MASTER_CONFIG_PATH, domain);
      var groupFolder = path.join(domainPath, GROUP_CACHE_PREFIX + groupName);

      if (!utils.directoryExists(groupFolder)) {
         utils.mkdirpSync(groupFolder);
      }

      var membersFile = [];

      for (var i = 0; i < group.members.length; i++) {
         membersFile.push({
            username: group.members[i]
         });
      }

      membersFile = JSON.stringify(membersFile);

      fs.writeFile(path.join(groupFolder, 'members.json'), membersFile, function() {
         next();
      });
   } else {
      res.status(401).send();
   }
};

settings.delete_group = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain);

   if (permission == 'admin') {
      var groupName = req.query.groupname;
      // Clean the groupName to remove .. \ /, and replace whitespace with underscore
      groupName = groupName.replace(/\.\.|\\|\//g, '').replace(/\s/g, '_');

      var domainPath = path.join(MASTER_CONFIG_PATH, domain);
      var groupFolder = path.join(domainPath, GROUP_CACHE_PREFIX + groupName);

      if (utils.directoryExists(groupFolder)) {
         fs.remove(groupFolder, function(err) {
            if (err) {
               res.status(500).send();
            } else {
               res.send();
            }
         });
      } else {
         res.status(404).send();
      }
   } else {
      res.status(401).send();
   }
};

settings.get_dictionary = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var username = user.getUsername(req);
   var dict_path = path.join(MASTER_CONFIG_PATH, "dictionary.json");
   var user_dict_path = path.join(MASTER_CONFIG_PATH, domain, "user_" + username, "dictionary.json");

   if (utils.fileExists(dict_path)) {
      var dict_file = JSON.parse(fs.readFileSync(dict_path));
      if (utils.fileExists(user_dict_path)) {
         var user_dict_file = JSON.parse(fs.readFileSync(user_dict_path));
         _.extend(dict_file, user_dict_file);
      }
      res.send(dict_file);
   } else {
      res.send({});
   }
};

settings.add_to_dictionary = function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var standard_name = req.query.standard_name;
   var display_name = req.query.display_name;
   var username = user.getUsername(req);
   var permission = user.getAccessLevel(req, domain);
   var tags = req.body; // Gets the data (tags)

   var path_gutts = "";
   if (permission != "admin") {
      path_gutts = path.join(domain, "user_" + username);
   }
   var dict_path = path.join(MASTER_CONFIG_PATH, path_gutts, "dictionary.json");
   var dict;
   if (!utils.fileExists(dict_path)) {
      if (standard_name && display_name) {
         dict = '{"' + standard_name + '":{"displayName":["' + display_name + '"], "tags":[' + JSON.stringify(tags) + ']}}';
      } else {
         dict = "{}";
      }
      fs.writeFileSync(dict_path, dict);
   } else {
      dict = JSON.parse(fs.readFileSync(dict_path));
      if (!dict[standard_name]) {
         dict[standard_name] = {};
      }
      if (!dict[standard_name].displayName) {
         dict[standard_name].displayName = [];
      }
      if (!dict[standard_name].tags) {
         dict[standard_name].tags = [];
      }
      if (dict[standard_name].displayName.indexOf(display_name) < 0) {
         dict[standard_name].displayName.push(display_name);
      }
      if (dict[standard_name].tags.indexOf(tags) < 0) {
         dict[standard_name].tags.push(tags);
      }
      fs.writeFileSync(dict_path, JSON.stringify(dict));
   }
   res.status(200).send();
};

settings.get_cache = function(req, res) {
   var username = user.getUsername(req);
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain);

   var cache = settingsApi.get_cache(username, domain, permission);

   // TODO change to res.json(cache) and test
   res.send(JSON.stringify(cache)); // Returns the cache to the browser.
};

settings.rotate = function(req, res) {
   var angle = parseInt(req.query.angle); // Gets the given angle
   var url = req.query.url; // Gets the given URL
   if (angle == "undefined" || angle === "" || typeof(angle) != "number") {
      angle = 0; // Sets angle to 0 if its not set to a number
   }
   angle = Math.round(angle / 90) * 90; // Rounds the angle to the neerest 90 degrees
   jimp.read(url, function(err, image) { // Gets the image file from the URL
      if (err) {
         utils.handleError(err, res);
      } else {
         image.rotate(angle); // Rotates the image *clockwise!*
         //image.resize( width, jimp.AUTO);
         image.getBuffer(jimp.MIME_PNG, function(err2, image2) { // Buffers the image so it sends correctly
            if (err2) {
               utils.handleError(err2, res);
            } else {
               res.setHeader('Content-type', 'image/png'); // Makes sure its a png
               res.send(image2); // Sends the image to the browser.
            }

         });
      }
   });
};

settings.remove_server_cache = function(req, res) {
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain); // Gets the user permission
   var filename = req.query.filename; // Gets the given filename
   var owner = req.query.owner; // Gets the given owner
   filename += ".json"; // Adds the file extension to the filename
   var base_path;
   if (owner.startsWith(GROUP_CACHE_PREFIX)) {
      // The path if the owner is a group
      base_path = path.join(MASTER_CONFIG_PATH, domain, owner);
   } else {
      base_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + owner); // The path if the owner is not a domain
   }
   var master_list = fs.readdirSync(MASTER_CONFIG_PATH); // The list of files and folders in the master_cache folder
   master_list.forEach(function(value) {
      if (value == owner) {
         base_path = path.join(MASTER_CONFIG_PATH, domain);
         return;
      }
   });
   var file_path = path.join(base_path, filename); // The current file path
   var delete_path = path.join(base_path, "deleted_cache"); // The directory to be moved to (so it can be created if needs be)
   var delete_file_path = path.join(delete_path, filename); // The full path to be moved to
   if (owner == username || permission == "admin") {
      if (!utils.directoryExists(delete_path)) {
         utils.mkdirpSync(delete_path); // Creates the directory if it doesn't already exist
      }
      fs.rename(file_path, delete_file_path, function(err) { // Moves the file to the deleted cache
         if (err) {
            utils.handleError(err, res);
         } else {
            // TODO change to res.json
            res.send(JSON.stringify({
               'path': delete_file_path,
               'owner': owner
            })); // Returns the file path so it can be replaced if the user undoes the delete
         }
      });
   }
};

settings.add_wcs_url = function(req, res) {
   var url = req.query.url.split('?')[0] + "?"; // Gets the given url
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   // var permission = user.getAccessLevel(req, domain); // Gets the user permission // NOT USED
   var filename = req.query.filename + ".json"; // Gets the given filename

   var base_path = path.join(MASTER_CONFIG_PATH, domain);
   if (username != domain) {
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   var json_data = JSON.parse(fs.readFileSync(this_path));
   json_data.wcsURL = url;
   fs.writeFileSync(this_path, JSON.stringify(json_data));
   res.send(this_path);
};

settings.restore_server_cache = function(req, res) {
   var username = user.getUsername(req); // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var permission = user.getAccessLevel(req, domain); // Gets the user permission
   var data = req.body; // Gets the data back to restore previously deleted file
   var owner = data.owner;
   var deleted_path = data.path;
   var restored_path = deleted_path.replace("deleted_cache/", "");
   if (owner == username || permission == "admin") {
      fs.rename(deleted_path, restored_path, function(err) { // Moves the file to the deleted cache
         if (err) {
            utils.handleError(err, res);
         } else {
            res.send("");
         }
      });
   }
};

settings.update_layer = function(req, res) {
   var owner = req.query.username; // Gets the given username
   var domain = utils.getDomainName(req); // Gets the given domain
   var data = JSON.parse(req.body.data); // Gets the data given

   // Check that the user has permission to do this
   var username = user.getUsername(req);
   var permission = user.getAccessLevel(req, domain);

   if (username != owner && permission != 'admin') {
      return res.status(401).send();
   }

   settingsApi.update_layer(owner, domain, data, function(err) {
      if (err) {
         utils.handleError(err, res);
      } else {
         res.send("");
      }
   });
};

settings.add_user_layer = function(req, res) {
   var layers_list = JSON.parse(req.body.layers_list); // Gets the given layers_list
   var server_info = JSON.parse(req.body.server_info); // Gets the given server_info
   var domain = utils.getDomainName(req); // Gets the given domain
   var owner = server_info.owner; // Gets the given owner
   var old_owner = server_info.old_owner; // Gets the old owner
   var cache_path;
   var save_path;

   // Check that the user has permission to do this
   var username = user.getUsername(req);
   var permission = user.getAccessLevel(req, domain);

   if (username != owner && permission != 'admin') {
      return res.status(401).send();
   }

   if ('provider' in server_info && 'server_name' in server_info) { // Checks that all the required fields are in the object
      var filename = server_info.server_name + '.json';
      filename = filename.replace(/\.\./g, "_dotdot_"); // Clean the filename to remove ..

      if (domain == owner) {
         // If is is a global file it is refreshed from the URL
         cache_path = path.join(MASTER_CONFIG_PATH, domain);
         save_path = path.join(MASTER_CONFIG_PATH, domain, filename);
      } else if (owner.startsWith(GROUP_CACHE_PREFIX)) {
         cache_path = path.join(MASTER_CONFIG_PATH, domain, "temporary_cache");
         save_path = path.join(MASTER_CONFIG_PATH, domain, owner, filename);
      } else {
         // If it is to be a user file the data is retrieved from the temorary cache
         cache_path = path.join(MASTER_CONFIG_PATH, domain, "temporary_cache");
         save_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + owner, filename);
      }
      if (old_owner == domain) {
         cache_path = path.join(MASTER_CONFIG_PATH, domain);
      }
      if (!utils.directoryExists(cache_path)) {
         utils.mkdirpSync(cache_path); // Creates the directory if it doesn't already exist
      }
      var cache_file = path.join(cache_path, filename); // Adds the filename to the path
      var data = {};
      try {
         data = JSON.parse(fs.readFileSync(cache_file)); // Gets the data from the file
      } catch (e) {
         // Tries again with the temporary cache (Perhaps an admin is adding a server to this domain)
         if (domain == owner) {
            cache_file = path.join(cache_path, "temporary_cache", filename); // Adds the filename to the path
            data = JSON.parse(fs.readFileSync(cache_file)); // Gets the data from the file
         }
      }
      if (JSON.stringify(data) == "{}") {
         return res.status(404).send();
      }
      var new_data = []; // The list for the new data to go into
      for (var new_layer in layers_list) { // Loops through each new layer.
         var this_new_layer = layers_list[new_layer];
         if ('abstract' in this_new_layer && 'id' in this_new_layer && 'list_id' in this_new_layer && 'nice_name' in this_new_layer && 'tags' in this_new_layer) { // Checks that the layer has the required fields
            var found = false;
            for (var old_layer in data.server.Layers) { // Loops through each old layer to be compared.
               if (data.server.Layers[old_layer].Name == this_new_layer.original_name) { // When the layers match
                  var new_data_layer = data.server.Layers[old_layer]; // 
                  new_data_layer.Title = titleCase(this_new_layer.nice_name);
                  new_data_layer.Abstract = this_new_layer.abstract;
                  new_data_layer.include = this_new_layer.include;
                  new_data_layer.autoScale = this_new_layer.originalAutoScale;
                  new_data_layer.defaultMinScaleVal = this_new_layer.defaultMinScaleVal;
                  new_data_layer.defaultMaxScaleVal = this_new_layer.defaultMaxScaleVal;
                  new_data_layer.defaultStyle = this_new_layer.defaultStyle;
                  new_data_layer.log = this_new_layer.defaultLog;
                  new_data_layer.colorbands = this_new_layer.defaultColorbands;
                  new_data_layer.aboveMaxColor = this_new_layer.defaultAboveMaxColor;
                  new_data_layer.belowMinColor = this_new_layer.defaultBelowMinColor;
                  for (var key in this_new_layer.tags) {
                     var val = this_new_layer.tags[key];
                     if (val && val.length > 0 && val[0] !== "") {
                        new_data_layer.tags[key] = val;
                     } else {
                        new_data_layer.tags[key] = undefined;
                     }
                  }
                  if (server_info.provider.length > 0) {
                     new_data_layer.tags.data_provider = server_info.provider;
                     var clean_provider = server_info.provider.replace(/&amp/g, "and").replace(/ /g, "_").replace(/\\/g, "_").replace(/\//g, "_").replace(/\./g, "_").replace(/\,/g, "_").replace(/\(/g, "_").replace(/\)/g, "_").replace(/\:/g, "_").replace(/\;/g, "_");
                     data.options.providerShortTag = clean_provider;
                  }
                  new_data_layer.tags.niceName = this_new_layer.nice_name;
                  new_data_layer.LegendSettings = this_new_layer.legendSettings;
                  new_data.push(new_data_layer);
                  found = true;
                  break;
               }
            }
            if (!found) {
               console.log(this_new_layer.original_name + " is currently not included.");
            }
         }
      }
      // Adds all of the broader information to the JSON object.
      data.server.Layers = settingsApi.sortLayersList(new_data, "Title");
      if (server_info) {
         if (!data.contactInfo) {
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
   } else {
      res.send("Error");
   }
};

settings.load_data_values = function(req, res) {
   var url = req.query.url; // Gets the given URL
   var name = req.query.name; // Gets the given name
   var units = req.query.units; // getst the given units

   request(url + '&INFO_FORMAT=text/xml', function(err, response, body) {
      if (err) {
         utils.handleError(err, res);
      } else {
         var content_type = response.headers['content-type'];
         var response_text = "Sorry, could not calculate a value for: " + name;

         if (content_type == 'application/xml;charset=UTF-8') {
            xml2js.parseString(body, {
               tagNameProcessors: [settingsApi.stripPrefix],
               attrNameProcessors: [settingsApi.stripPrefix]
            }, function(err, result) {
               if (err) {
                  utils.handleError(err, res);
               } else {
                  try {
                     response_text = name + ": " + result.FeatureInfoResponse.FeatureInfo[0].value[0] + " " + units;
                  } catch (e) {
                     response_text = "Sorry, could not calculate a value for: " + name;
                  }
                  res.send(response_text);
               }
            });
         } else {
            request(url, function(err, response, body) {
               if (err) {
                  utils.handleError(err, res);
               } else {
                  content_type = response.headers['content-type'].replace(';charset=UTF-8', '');
                  if (content_type == "text/xml") {
                     xml2js.parseString(body, {
                        tagNameProcessors: [settingsApi.stripPrefix],
                        attrNameProcessors: [settingsApi.stripPrefix]
                     }, function(err, result) {
                        if (err) {
                           utils.handleError(err, res);
                        } else {
                           var output = name + ":";
                           try {
                              for (var key in result.FeatureInfoResponse.FIELDS[0].$) {
                                 output += "<br/>" + key + ": " + result.FeatureInfoResponse.FIELDS[0].$[key];
                              }
                           } catch (e) {
                              output += "<br/>no data found at this point";
                           }
                           response_text = output;
                        }
                     });
                  } else if (content_type == "text/plain" || content_type == "text/html") {
                     response_text = name + ":<br/>" + body.replace(/(?:\r\n|\r|\n)/g, '<br />');
                  }
                  res.send(response_text);
               }
            });
         }
      }
   });
};

settings.load_new_wms_layer = function(req, res) {
   // var url = req.query.url.replace(/\?/g, "") + "?"; // Gets the given url
   var url = req.query.url;
   var refresh = (req.query.refresh == 'true'); // Gets the given refresh
   var domain = utils.getDomainName(req); // Gets the given domain

   settingsApi.load_new_wms_layer(url, refresh, domain, function(err, data) {
      if (err) {
         utils.handleError(err, res);
      } else {
         if (data !== null) {
            res.send(data);
         } else {
            res.send({
               "Error": "Could not find any loadable layers in the <a href='" + url + "service=WMS&request=GetCapabilities'>WMS file</a> you provided"
            });
         }
      }
   });
};

settings.create_share = function(req, res) {
   var data = req.body;
   var shasum = crypto.createHash('sha256');
   shasum.update(Date.now().toString());
   var shareId = shasum.digest('hex').substr(0, 6);
   client.set("share_" + shareId, data.state, function(err) {});
   res.send(shareId);
};

settings.get_share = function(req, res) {
   var shareId = req.query.id; // Gets the given shareId
   client.get("share_" + shareId, function(err, data) {
      if (err) {
         res.status(500).send();
      } else {
         res.send(data);
      }
   });
};

settings.get_markdown_metadata = function(req, res) {
   var markdown = require("node-markdown").Markdown;
   var domain = utils.getDomainName(req);
   var data = req.body; // Gets the data
   var tags = data.tags;
   var order = data.order;
   var html = "";
   var markdown_folder_path = path.join(MASTER_CONFIG_PATH, domain, "markdown");
   var markdown_file_path;
   var markdown_data;
   var html_data;

   function addMarkdown(tagName, deleteAfter) {
      if (tags[tagName] === undefined) {
         return false;
      }
      if (typeof(tags[tagName]) != "object") {
         tags[tagName] = [tags[tagName]];
      }
      for (var tag_name in tags[tagName]) {
         markdown_file_path = path.join(markdown_folder_path, tagName, tags[tagName][tag_name].toLowerCase().replace(/\//g, "_") + ".md");
         if (utils.fileExists(markdown_file_path)) {
            markdown_data = fs.readFileSync(markdown_file_path).toString();
            html_data = markdown(markdown_data, true, null, {
               "a": "href|target"
            });
            html += html_data;
         }
      }
      if (deleteAfter === true) {
         delete tags[tagName];
      }
   }

   var tag;
   if (order) {
      for (tag in order) {
         addMarkdown(order[tag], true);
      }
   }

   for (tag in tags) {
      addMarkdown(tag, false);
   }
   res.send(html);
};

settings.save_walkthrough = function(req, res) {
   var walkthrough = req.body; // Gets the given walkthrough
   var domain = utils.getDomainName(req); // Gets the domain
   var username = walkthrough.owner; // Gets the given owner
   var permission = user.getAccessLevel(req, domain);
   var overwrite = walkthrough.overwrite;
   // Makes sure the user is an admin if they are trying to overwrite a walkthrough
   if (permission != "admin") {
      overwrite = false;
   }

   var filename = walkthrough.title + '_walkthrough.json';
   var save_path;
   if (domain == username) {
      // If is is a global file
      save_path = path.join(MASTER_CONFIG_PATH, domain, filename);
   } else {
      // If it is to be a user file
      save_path = path.join(MASTER_CONFIG_PATH, domain, USER_CACHE_PREFIX + username, filename);
   }
   if (utils.fileExists(save_path) && !overwrite) {
      return res.status(400).send('Filename Taken');
   }
   fs.writeFileSync(save_path, JSON.stringify(walkthrough));
   res.status(200).send({
      success: true
   });
};