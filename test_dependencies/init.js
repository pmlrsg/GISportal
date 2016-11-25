var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

mkdirp.sync(path.join(__dirname, '../config/site_settings'));

var configSource = path.join(__dirname, '../test_dependencies/config/site_settings/127.0.0.1\:6789');
var configDestination = path.join(__dirname, '../config/site_settings/127.0.0.1\:6789');

try {
   if (fs.statSync(configDestination).isDirectory) {
      global.configExists = true;
   }
} catch (e) {
   fs.symlinkSync(configSource, configDestination);
   global.configExists = false;
}