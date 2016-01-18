
var cookie = require('cookie');
var cookieParser = require('cookie-parser');

var user = {}
module.exports = user;

user.isLoggedIn = function(req, res, next) {
   var cookies = cookieParser.signedCookies(cookie.parse(req.headers.cookie), GLOBAL.config.session.secret);
   var sid = cookies['GISportal'];

   var sessionStore = req.app.get('sessionStore');
   sessionStore.load(sid, function(err, session) {
      if(err || !session) {
         res.send(401, 'User not authenticated');
      }
      return next();
   });
}

user.isAdmin = function(req, res, next) {
var cookies = cookieParser.signedCookies(cookie.parse(req.headers.cookie), GLOBAL.config.session.secret);
   var sid = cookies['GISportal'];

   var sessionStore = req.app.get('sessionStore');
   sessionStore.load(sid, function(err, session) {
      if(err || !session) {
         res.send(401, 'User not authenticated');
      }
      var admins = GLOBAL.config.admins;
      for (var i = 0; i < admins.length; i++) {
         if (admins[i] == session.passport.user.emails[0].value) {
            return next();      
         }
      }
      console.log(session.passport.user.emails[0].value +' is not an admin');
      res.send(401, 'User is not an administrator');
   });
}
