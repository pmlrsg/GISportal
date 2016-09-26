var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var bodyParser = require('body-parser');
var user = require('./user.js');
var utils = require('./utils.js');
var settings = require('./settings.js');


var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/../../config/site_settings/";
var SOCKETIO_FILE_PATH = CURRENT_PATH + "/../../node_modules/socket.io/node_modules/socket.io-client/socket.io.js";

module.exports = router;

router.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-Modified-Since');
   next();
});

router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));

router.get('/app/settings/proxy', settings.proxy);

router.get('/app/settings/img_proxy', settings.img_proxy);

router.get('/app/settings/config', settings.config);

router.get('/app/settings/email_setup', settings.email_setup);

router.get('/app/settings/view', settings.view);

router.get('/app/settings/walkthrough', settings.walkthrough);

router.get('/app/settings/delete_walkthrough', settings.delete_walkthrough);

router.get('/app/settings/get_views', settings.get_views);

router.get('/app/settings/get_walkthroughs', settings.get_walkthroughs);

router.get('/app/settings/get_owners', settings.get_owners);

router.get('/app/settings/get_dictionary', settings.get_dictionary);

router.all('/app/settings/add_to_dictionary', user.requiresValidUser, settings.add_to_dictionary);

router.get('/app/cache/*?', function(req, res) {
   var config_path = path.join(MASTER_CONFIG_PATH, req.params[0]);// Gets the given path
   res.sendFile(config_path, function (err) {
      if (err) {
         utils.handleError(err, res);
      }
   });
});

router.get('/app/socket.io/', function(req, res) {
   var socket_file = fs.readFileSync(SOCKETIO_FILE_PATH);
   res.send(socket_file);
});

router.get('/resources/*?', function(req, res) {
   var domain = utils.getDomainName(req); // Gets the given domain
   var config_path = path.join(MASTER_CONFIG_PATH, domain, "resources", req.params[0]);// Gets the given path
   if(!utils.fileExists(config_path)){
      res.status(404).send();
      return;
   }
   res.sendFile(config_path, function (err) {
      if (err) {
         utils.handleError(err, res);
      }
   });
});

router.get('/app/settings/get_cache', settings.get_cache);

router.all('/app/settings/rotate', settings.rotate);

router.get('/app/settings/remove_server_cache', settings.remove_server_cache);

router.get('/app/settings/add_wcs_url', settings.add_wcs_url);

router.all('/app/settings/restore_server_cache', settings.restore_server_cache);

router.all('/app/settings/update_layer', settings.update_layer);

router.all('/app/settings/add_user_layer', settings.add_user_layer);

router.get('/app/settings/load_data_values', settings.load_data_values);


router.get('/app/settings/load_new_wms_layer', settings.load_new_wms_layer);

router.all('/app/settings/create_share', settings.create_share);

router.get('/app/settings/get_share', settings.get_share);

router.all('/app/settings/get_markdown_metadata', settings.get_markdown_metadata);

router.all('/app/settings/save_walkthrough', settings.save_walkthrough);