
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = passport;

passport.init = function(config) {
   passport.use(new GoogleStrategy({
      clientID: config.auth.google.clientid,
      clientSecret: config.auth.google.clientsecret,
      callbackURL: config.auth.google.callback,
      scope: config.auth.google.scope,
      prompt: config.auth.google.prompt
      },
      function(token, tokenSecret, profile, done) {
         return done(null, profile);
      }
   ));


   passport.serializeUser(function(user, done) {
    done(null, user);
   });

   passport.deserializeUser(function(user, done) {
    done(null, user);
   });
   
}

