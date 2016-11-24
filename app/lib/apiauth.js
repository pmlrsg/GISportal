/**
 * This module provides the functions for API authentication.
 */

var utils = require('./utils.js');

var apiAuth = {};
module.exports = apiAuth;

/**
 * For use in Express routing chains to authenticate an api token.
 * @param  {object}   req  Express router request
 * @param  {object}   res  Express router reqsponse
 * @param  {Function} next The next function in the chain
 * @return                 next() or a 401 not authorised response
 */
apiAuth.authenticateToken = function(req, res, next) {
   var token = req.params.token;
   var domain = utils.getDomainName(req);
   console.log('domain: ' + domain);
   var config = global.config[domain] || global.config;
   var tokens = config.tokens;
   console.log(tokens);

   if (tokens) {
      if (tokens[token] !== undefined) {
         return next();
      } else {
         res.status(401).send('Unauthorised token!');
      }
   } else {
      res.status(403).send('No API tokens available.');
   }
};

/**
 * Checks the access level of the api user.
 * @param  {object} req    Express router request
 * @param  {string} domain The domain the user is accessing
 * @return {string}        The user's access level
 */
apiAuth.getAccessLevel = function(req, domain) {
   var level = 'guest';

   // If they aren't using the guest token
   if (apiAuth.getUsername(req) != 'guest') {
      level = 'user';
      domain = domain || req.query.domain;
      var config = GLOBAL.config[domain] || GLOBAL.config;
      var admins = config.admins;
      if (admins) {
         for (var i = 0; i < admins.length; i++) {
            if (admins[i] == apiAuth.getUsername(req)) {
               level = 'admin';
               break;
            }
         }
      }
   }
   return level;
};

/**
 * Gets the username of the api user from their token.
 * @param  {object} req Express router request
 * @return {string}     The user's username
 */
apiAuth.getUsername = function(req) {
   var token = req.params.token;
   var domain = utils.getDomainName(req);
   var config = global.config[domain] || global.config;
   var tokens = config.tokens;
   var username = tokens[token];

   return username;
};

/**
 * For use in Express routing chains to deny guest users.
 * @param  {object}   req  Exress router request
 * @param  {object}   res  Express router response
 * @param  {Function} next The next function in the chain
 * @return                 next() or a 401 not authorised response
 */
apiAuth.denyGuest = function(req, res, next) {
   var level = apiAuth.getAccessLevel(req);
   if (level != 'guest') {
      return next();
   } else {
      res.status(401).send('Guests cannot do this!');
   }
};