var fs = require('fs');
var path = require('path');

var moduleLoader = {};
module.exports = moduleLoader;

moduleLoader.loadModules = function() {
   var directories = getDirectories('../modules');
   var modules = {};
   for (var i = 0; i < directories.length; i++) {
      var modName = path.basename(directories[i]);
      modules[modName] = require(directories[i]);
   }
   return modules;
};

function getDirectories(srcpath) {
   var absPath = path.resolve(__dirname, srcpath);
   var dir =  fs.readdirSync(absPath).filter(function(file) {
      var filePath = path.join(absPath, file);
      return fs.statSync(filePath).isDirectory();
   });
   for (var i = 0; i < dir.length; i++) {
      dir[i] = path.join(absPath, dir[i]);
   }
   return dir;
}
