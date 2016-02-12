var utils = {}
var fs = require("fs");
var path = require("path");

module.exports = utils;

utils.fileExists = function(filePath)
{
   try
   {
      return fs.statSync(filePath).isFile();
   }
   catch (err)
   {
      return false;
   }
}

utils.directoryExists = function(filePath)
{
   try
   {
      return fs.statSync(filePath).isDirectory();
   }
   catch (err)
   {
      return false;
   }
}

utils.getDomainName = function(req){
   return (req.headers.host + req.url).split("/app")[0].replace("http://", "").replace("https://", "").replace(/\/$/, '').replace(/\//g, '_');;
}

utils.mkdirpSync = function (dirpath) {
   var parts = dirpath.split(path.sep);
   for( var i = 1; i <= parts.length; i++ ) {
      var part_path = path.join.apply(null, parts.slice(0, i))
      part_path = "/" + part_path;
      if(!utils.directoryExists(part_path)){
         fs.mkdirSync( part_path );
      }
   }
}