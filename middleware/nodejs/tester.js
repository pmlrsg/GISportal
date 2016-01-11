var http = require('http');
var express = require('express');
var path = require('path');
var fs = require("fs");
var _ = require("underscore");
var S = require("underscore.string.fp");

var USER_CACHE_PREFIX = "user_";
var CURRENT_PATH = path.dirname(process.argv[1]);
var MASTER_CACHE_PATH = CURRENT_PATH + "/../../html/cache/";
var LAYER_CACHE_PATH = MASTER_CACHE_PATH + "layers/";

//console.log(fs.readdirSync(LAYER_CACHE_PATH));

/**
 * @param  {String} string The string to be evaluated
 * @param  {String} prefix The prefix to be looked for
 * @return {boolean} If the given string has the given prefix
 */
function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}

var app = express();

 app.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

app.get('/get_cache', function(req, res){
   var usernames = [req.query.username];
   var permission = req.query.permission;
   var domain = "pmpc1310.npm.ac.uk";//req.get('origin').replace("http://", "").replace("https://", "");;

   var cache = [];
   var master_path = path.join(MASTER_CACHE_PATH, domain);

   var master_list = fs.readdirSync(master_path);
   master_list.forEach(function(filename){
      var file_path = path.join(master_path, filename);
      if(fs.lstatSync(file_path).isFile()){
         var json_data = JSON.parse(fs.readFileSync(file_path));
         json_data.owner = domain;
         cache.push(json_data);
      }
   });
   if(permission != "guest"){
      if(permission == "admin"){
         master_list.forEach(function(filename){
            if(fs.lstatSync(path.join(master_path, filename)).isDirectory()){
               if(stringStartsWith(filename, USER_CACHE_PREFIX)){
                  usernames.push(filename.replace(USER_CACHE_PREFIX, ""));
               }
            }
         });
      }
      usernames = _.uniq(usernames);
      for(username in usernames){
         var user_cache_path = path.join(master_path, USER_CACHE_PREFIX + usernames[username]);
         if(!fs.lstatSync(user_cache_path).isDirectory()){
            fs.mkdirSync(user_cache_path);
         }
         var user_list = fs.readdirSync(user_cache_path);
         user_list.forEach(function(filename){
            var file_path = path.join(user_cache_path, filename);
            if(fs.lstatSync(file_path).isFile()){
               var json_data = JSON.parse(fs.readFileSync(file_path));
               json_data.owner = domain;
               cache.push(json_data);
            }
         });
      }
   }

   res.send(JSON.stringify(cache));
   
});
app.all('/', function(req, res){
   res.send("Sorry you have provided no route!");
});

app.listen(1310);
console.log("app serving on 127.0.0.1:1310");