
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = passport;

passport.init = function(config) {
   for(domain in config){
      if(config[domain].auth){
         passport.use(domain,new GoogleStrategy({
            clientID: config[domain].auth.google.clientid,
            clientSecret: config[domain].auth.google.clientsecret,
            callbackURL: config[domain].auth.google.callback,
            scope: config[domain].auth.google.scope,
            prompt: config[domain].auth.google.prompt
            },
            function(token, tokenSecret, profile, done) {
               return done(null, profile);
            }
         ));
      }
   }

   passport.serializeUser(function(user, done) {
    done(null, user);
   });

   passport.deserializeUser(function(user, done) {
    done(null, user);
   });
}

