/**
 * This module provides the routes for settings access from the front end.
 */

var express = require('express');
var fs = require("fs");
var path = require('path');
var settings = require('./settings.js');
var user = require('./user.js');
var utils = require('./utils.js');
var proxy = require('./proxy.js');

var router = express.Router();

var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var SOCKETIO_FILE_PATH = CURRENT_PATH + "/../../node_modules/socket.io-client/socket.io.js";

module.exports = router;

router.use(function(req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-Modified-Since');
   next();
});

router.get('/app/settings/proxy', proxy.proxy);

router.get('/app/settings/img_proxy', proxy.img_proxy);

router.get('/app/settings/config', settings.config);

router.get('/app/settings/email_setup', settings.email_setup);

router.get('/app/settings/view', settings.view);

router.get('/app/settings/walkthrough', settings.walkthrough);

router.get('/app/settings/delete_walkthrough', settings.delete_walkthrough);

router.get('/app/settings/get_views', settings.get_views);

router.get('/app/settings/get_walkthroughs', settings.get_walkthroughs);

router.get('/app/settings/get_owners', settings.get_owners);

router.get('/app/settings/get_groups', settings.get_groups);

router.post('/app/settings/save_group', settings.save_group, settings.get_groups);

router.get('/app/settings/delete_group', settings.delete_group);

router.get('/app/settings/get_dictionary', settings.get_dictionary);

router.all('/app/settings/add_to_dictionary', user.requiresValidUser, settings.add_to_dictionary);

router.all('/app/settings/get_overlay_list', settings.get_overlay_list);

router.all('/app/get_single_overlay/*?', settings.get_single_overlay);

router.all('/app/settings/get_project_specific_html/*?', settings.get_project_specific_html);

router.get('/app/cache/*?', function(req, res) {
   var reqPath = req.params[0];
   var cleanPath = reqPath.replace(/\.\./g, ""); // Clean the path to remove ..

   // Check the path isn't requesting something it shouldn't
   if (cleanPath.endsWith('.json') || cleanPath.endsWith('.geojson')) {
      var configPath = path.join(MASTER_CONFIG_PATH, cleanPath); // Gets the given path
      if (utils.fileExists(configPath)) {
         res.sendFile(configPath, function(err) {
            if (err) {
               utils.handleError(err, res);
            }
         });
      } else {
         res.status(404).send("Error: File not found.");
      }
   } else {
      res.status(400).send();
   }
});

router.get('/app/socket.io/', function(req, res) {
   var socket_file = fs.readFileSync(SOCKETIO_FILE_PATH);
   res.send(socket_file);
});

router.get('/resources/*?', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var reqPath = req.params[0];
   var cleanPath = reqPath.replace(/\.\./g, ""); // Clean the path to remove ..
   var configPath = path.join(MASTER_CONFIG_PATH, domain, "resources", cleanPath); // Gets the given path

   if (utils.fileExists(configPath)) {
      res.sendFile(configPath, function(err) {
         if (err) {
            utils.handleError(err, res);
         }
      });
   } else {
      // Send just 404 to avoid revealing the full server path
      res.status(404).send();
   }
});

router.get('/app/settings/get_cache', settings.get_cache);

router.all('/app/settings/rotate', proxy.rotate);

router.get('/app/settings/remove_server_cache', settings.remove_server_cache);

router.get('/app/settings/add_wcs_url', settings.add_wcs_url);

router.all('/app/settings/restore_server_cache', settings.restore_server_cache);

router.all('/app/settings/update_layer', settings.update_layer);

router.all('/app/settings/add_user_layer', settings.add_user_layer);

router.get('/app/settings/load_data_values', settings.load_data_values);

router.get('/app/settings/load_all_records', settings.load_all_records); //TODO-ORIES

router.get('/app/settings/load_new_wms_layer', settings.load_new_wms_layer);

router.all('/app/settings/create_share', settings.create_share);

router.get('/app/settings/get_share', settings.get_share);

router.all('/app/settings/get_markdown_metadata', settings.get_markdown_metadata);

router.all('/app/settings/save_walkthrough', settings.save_walkthrough);
