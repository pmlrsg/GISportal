var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var path = require('path');

mkdirp.sync(path.join(__dirname, '../config/site_settings'));

var configSource = path.join(__dirname, '../test_dependencies/config/site_settings/127.0.0.1\:6789');
var configDestination = path.join(__dirname, '../config/site_settings/127.0.0.1\:6789');

try {
   if (fs.statSync(configDestination).isDirectory) {
      global.configExists = true;
      console.error(' ---------------------------------------------------------------- ');
      console.error('|   Error: config/site_settings/127.0.0.1:6789 already exists!   |');
      console.error('|   Please move the folder to run the tests.                     |');
      console.error(' ---------------------------------------------------------------- ');
      console.error();
      process.exit(1);
   }
} catch (e) {
   fs.copySync(configSource, configDestination, {clobber: false});
   global.configExists = false;
}