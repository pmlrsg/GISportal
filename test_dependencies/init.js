var fs = require('fs-extra');
var path = require('path');

global.test = {
   appPath: path.join(__dirname, '../'),
   dependPath: path.join(__dirname, '../test_dependencies/'),
   expectedPath: path.join(__dirname, '../test_dependencies/expected/')
};

fs.mkdirsSync(global.test.appPath + '/config/site_settings');

var configSource = global.test.dependPath + '/config/site_settings/127.0.0.1\:6789';
var configDestination = global.test.appPath + '/config/site_settings/127.0.0.1\:6789';

try {
   if (fs.statSync(configDestination).isDirectory()) {
      global.test.configExists = true;
      console.error(' ---------------------------------------------------------------- ');
      console.error('|   Error: config/site_settings/127.0.0.1:6789 already exists!   |');
      console.error('|   Please move the folder to run the tests.                     |');
      console.error(' ---------------------------------------------------------------- ');
      console.error();
      process.exit(1);
   }
} catch (e) {
   fs.copySync(configSource, configDestination, {
      clobber: false
   });
   global.test.configExists = false;
   global.test.configDir = configDestination;
}
