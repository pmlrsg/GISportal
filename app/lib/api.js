var api = {};
module.exports = api;


api.update_layer = function(username, domain, data, filename, base_path) {
   if (username != domain) {
      base_path = path.join(base_path, USER_CACHE_PREFIX + username);
   }
   var this_path = path.join(base_path, filename);
   fs.writeFile(this_path, JSON.stringify(data), function(err) {
      if (err) {
         utils.handleError(err, res);
      } else {
         res.send("");
      }
   });
};