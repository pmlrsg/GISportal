
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = passport;

passport.init = function(config) {
   console.log()
   console.log("List of domains with Google authentication settings:")
   for(domain in config){
      if(config[domain].auth){
         console.log(domain);
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
   console.log();

   passport.serializeUser(function(user, done) {
    done(null, user);
   });

   passport.deserializeUser(function(user, done) {
    done(null, user);
   });
}

