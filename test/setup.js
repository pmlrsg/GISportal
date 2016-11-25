var fs = require('fs');
var path = require('path');

var configDestination = path.join(__dirname, '../config/site_settings/127.0.0.1:6789');

after(function() {
   if (!global.configExists) {
      fs.unlinkSync(configDestination);
   }
});