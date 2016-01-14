var http = require('http');
var express = require('express');
var path = require('path');
var fs = require("fs");
var _ = require("underscore");
var S = require("underscore.string.fp");
var gm = require("gm");
var jimp = require("jimp");
var bodyParser = require('body-parser');

var USER_CACHE_PREFIX = "user_";
var CURRENT_PATH = path.dirname(process.argv[1]);
var MASTER_CACHE_PATH = CURRENT_PATH + "/../../html/cache/";
var LAYER_CACHE_PATH = MASTER_CACHE_PATH + "layers/";

//console.log(fs.readdirSync(LAYER_CACHE_PATH));

/**
 * Returns true or false depending if a string stars with another string.
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

app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));

app.get('/get_cache', function(req, res){
   var usernames = [req.query.username];
   var permission = req.query.permission;
   var domain = "pmpc1310.npm.ac.uk";//req.get('origin').replace("http://", "").replace("https://", "");;

   var cache = []; // The list of cache deatils to be returned to the browser
   var master_path = path.join(MASTER_CACHE_PATH, domain); // The path for the domain cache

   var master_list = fs.readdirSync(master_path); // The list of files and folders in the master_cache folder
   master_list.forEach(function(filename){
      var file_path = path.join(master_path, filename);
      if(fs.lstatSync(file_path).isFile() && path.extname(filename) == ".json"){
         var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
         json_data.owner = domain; // Adds the owner to the file (for the server list)
         cache.push(json_data); // Adds each file to the cache to be returned
      }
   });
   if(permission != "guest"){
      if(permission == "admin"){
         master_list.forEach(function(filename){
            if(fs.lstatSync(path.join(master_path, filename)).isDirectory()){
               if(stringStartsWith(filename, USER_CACHE_PREFIX)){
                  usernames.push(filename.replace(USER_CACHE_PREFIX, "")); // If you are an admin, add all of the usernames from this domain to the variable
               }
            }
         });
      }
      usernames = _.uniq(usernames); // Makes the list unique (admins will have themselves twice) 
      // Eventually should just remove all admins here!
      for(username in usernames){ // Usernames is now a list of all users or just the single loggeed in user.
         var user_cache_path = path.join(master_path, USER_CACHE_PREFIX + usernames[username]);
         if(!fs.lstatSync(user_cache_path).isDirectory()){
            fs.mkdirSync(user_cache_path); // Creates the directory if it doesn't already exist
         }
         var user_list = fs.readdirSync(user_cache_path); // Gets all the user files
         user_list.forEach(function(filename){
            var file_path = path.join(user_cache_path, filename);
            if(fs.lstatSync(file_path).isFile() && path.extname(filename) == ".json"){
               var json_data = JSON.parse(fs.readFileSync(file_path)); // Reads all the json files
               json_data.owner = usernames[username]; // Adds the owner to the file (for the server list)
               cache.push(json_data); // Adds each file to the cache to be returned
            }
         });
      }
   }

   res.send(JSON.stringify(cache)); // Returns the cache to the browser.
   
});

app.all('/rotate', function(req, res){
   var angle = parseInt(req.query.angle); // Gets the given angle
   var url = req.query.url // Gets the given URL
   if(angle == "undefined" || angle == "" || typeof(angle) != "number"){
      angle = 0; // Sets angle to 0 if its not set to a number
   }
   angle = Math.round(angle/90)*90; // Rounds the angle to the neerest 90 degrees
   jimp.read(url, function(err, image){ // Gets the image file from the URL
      if (err) throw err;
      image.rotate(angle); // Rotates the image *clockwise!*
      //image.resize( width, jimp.AUTO);
      image.getBuffer(jimp.MIME_PNG, function(err, image){ // Buffers the image so it sends correctly
         if(err) throw err;
         res.setHeader('Content-type', 'image/png'); // Makes sure its a png
         res.send(image); // Sends the image to the browser.
      });
   });   
});

app.all('/remove_server_cache', function(req, res){
   var username = req.query.username; // Gets the given username
   var permission = req.query.permission; // Gets the given permission
   var domain = req.query.domain; // Gets the given domain
   var filename = req.query.filename; // Gets the given filename
   filename += ".json"; // Adds the file extension to the filename
   var base_path = path.join(MASTER_CACHE_PATH, domain, USER_CACHE_PREFIX + username); // The path if the owner is not a domain
   var master_list = fs.readdirSync(MASTER_CACHE_PATH); // The list of files and folders in the master_cache folder
   console.log(master_list);
   console.log(username);
   master_list.forEach(function(value){
      if(value == username){
         base_path = path.join(MASTER_CACHE_PATH,domain);
         return;
      }
   });
   var file_path = path.join(base_path, filename); // The current file path
   var delete_path = path.join(base_path, "deleted_cache"); // The directory to be moved to (so it can be created if needs be)
   var delete_file_path = path.join(delete_path, filename); // The full path to be moved to
   if(!fs.lstatSync(delete_path).isDirectory()){
      fs.mkdirSync(delete_path); // Creates the directory if it doesn't already exist
   }
   fs.rename(file_path, delete_file_path, function(err){ // Moves the file to the deleted cache
      if(err) throw err;
      res.send(delete_file_path); // Returns the file path so it can be replaced if the user undoes the delete
   });
});

app.all('/update_layer', function(req, res){
   var username = req.query.username; // Gets the given username
   var permission = req.query.permission; // Gets the given permission
   var domain = req.query.domain; // Gets the given domain
   var data = JSON.parse(req.body.data); // Gets the data given
   var filename = data.serverName + ".json";
   var base_path = path.join(MASTER_CACHE_PATH, domain);
   if(!username == domain){
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   fs.writeFile(this_path, JSON.stringify(data), function(err){
      if(err) throw err;
      res.send("");
   });
});

app.all('/add_wcs_url', function(req, res){
   var username = req.query.username; // Gets the given username
   var permission = req.query.permission; // Gets the given permission
   var domain = req.query.domain; // Gets the given domain
   var url = req.query.url; // Gets the url given
   var filename = data.serverName + ".json";
   var base_path = path.join(MASTER_CACHE_PATH, domain);
   if(!username == domain){
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   fs.writeFile(this_path, JSON.stringify(data), function(err){
      if(err) throw err;
      res.send("");
   });
});


app.all('/', function(req, res){
   res.send("Sorry you have provided no route!");
});

app.listen(1310);
console.log("app serving on 127.0.0.1:1310");

app.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});