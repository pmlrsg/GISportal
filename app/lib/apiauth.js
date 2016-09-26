var utils = require('./utils.js');

var apiAuth = {};
module.exports = apiAuth;

apiAuth.authenticateToken = function(req, res, next) {
   var token = req.params.token;
   var domain = utils.getDomainName(req);
   var config = global.config[domain] || global.config;
   var tokens = config.tokens;

   if (tokens) {
      if (tokens.indexOf(token) != -1) {
         return next();
      } else {
         res.status(401).send('Unauthorised token!');
      }
   }
};