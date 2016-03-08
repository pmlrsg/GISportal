
var cookie = require('cookie');
var cookieParser = require('cookie-parser');

var user = {}
module.exports = user;
var utils = require('./utils.js');

/**
 * requiresValidUser is to be used as a chained router function; if the current user has an
 * active session then the next function in the chain is called, and if not a 401 Not authorised
 * response is sent instead and the chain stops
 * 
 * @param  {Object}   req  Express router request object
 * @param  {Object}   res  Express router response object
 * @param  {Function} next The next function in the chain to be called
 * @return {Function}      `next()` or a 401 Not authorised response  
 */
user.requiresValidUser = function(req, res, next) {
   var level = user.getAccessLevel(req, utils.getDomainName(req));

   if (level != "guest") {
      return next();
   } else {
      res.sendStatus(401);
   }
}

/**
 * requiresAdminUser is to be used as a chained router function; if the current user is an
 * administrator then the next function in the chain is called, and if not a 401 Not authorised
 * response is sent instead and the chain stops
 * 
 * @param  {Object}   req  Express router request object
 * @param  {Object}   res  Express router response object
 * @param  {Function} next The next function in the chain to be called
 * @return {Function}      `next()` or a 401 Not authorised response  
 */
user.requiresAdminUser = function(req, res, next) {
   var level = user.getAccessLevel(req);

   if (level == "admin") {
      return next();
   } else {
      console.log(session.passport.user.emails[0].value +' is not an admin');
      res.sendStatus(401);
   }
}

/**
 * getAccessLevel checks the request user cookie against the session object stored in Redis
 * and returns the users access level as string
 * @param  {Object} req    Express router request object
 * @return {String}        [guest|user|admin]
 */
user.getAccessLevel = function(req, domain) {
   var level = "guest";

   if(typeof(req.session.passport.user) != 'undefined') {
      // there is a valid session so they are a logged in user
      level = "user";
      domain = domain || req.query.domain
      var config = GLOBAL.config[domain] || GLOBAL.config
      // check to see if they are an admin
      var admins = config.admins;
      for (var i = 0; i < admins.length; i++) {
         if (admins[i] == req.session.passport.user.emails[0].value) {
            level = "admin";
            break;
         }
      }
   }
   return level;
}

/**
 * getUsername checks the request user cookie against the session object stored in Redis
 * and returns the users username as string
 * @param  {Object} req    Express router request object
 * @return {String}        [guest|email address of user]
 */
user.getUsername = function(req) {
   var username = "";
   if(typeof(req.session.passport.user) != 'undefined') {
      username = req.session.passport.user.emails[0].value;
   }
   return username;
}