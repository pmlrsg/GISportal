var utils = require('./utils.js');

var apiAuth = {};
module.exports = apiAuth;

apiAuth.authenticateToken = function(req, res, next) {
   var token = req.params.token;
   var domain = utils.getDomainName(req);
   var config = global.config[domain] || global.config;
   var tokens = config.tokens;

   if (tokens) {
      if (tokens[token] !== undefined) {
         return next();
      } else {
         res.status(401).send('Unauthorised token!');
      }
   }
};

apiAuth.getAccessLevel = function(req, domain) {
   var level = "guest";

   if(apiAuth.getUsername(req) != 'guest') {
      // If they aren't using the guest token
      level = "user";
      domain = domain || req.query.domain;
      var config = GLOBAL.config[domain] || GLOBAL.config;
      // Check to see if they are an admin
      var admins = config.admins;
      if(admins){
         // If there are any admins
         for (var i = 0; i < admins.length; i++) {
            if (admins[i] == apiAuth.getUsername(req)) {
               level = "admin";
               break;
            }
         }
      }
   }
   return level;
};

apiAuth.getUsername = function(req) {
   var token = req.params.token;
   var domain = utils.getDomainName(req);
   var config = global.config[domain] || global.config;
   var tokens = config.tokens;

   return tokens[token];
};
