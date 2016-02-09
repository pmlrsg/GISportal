var utils = {}
var fs = require("fs");
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
   return req.headers.host;
}

module.exports = utils