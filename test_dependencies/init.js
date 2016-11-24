var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

mkdirp.sync(path.join(__dirname, '../config/site_settings'));

var configSource = path.join(__dirname, '../test_dependencies/config/site_settings/127.0.0.1\:6789');
var configDestination = path.join(__dirname, '../config/site_settings/127.0.0.1\:6789');

fs.symlinkSync(configSource, configDestination);
