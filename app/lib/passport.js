
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const SamlStrategy = require('passport-saml').Strategy

module.exports = passport;

passport.init = function(config) {
   console.log();
   console.log("List of domains with Google authentication settings:");
   for(var domain in config){
      if(config[domain].auth){
         console.log(domain.replace(/_/g, "/"));
         // Google OAuth
         // if(config[domain].auth.google) {
         //    passport.use(domain,new GoogleStrategy({
         //       clientID: config[domain].auth.google.clientid,
         //       clientSecret: config[domain].auth.google.clientsecret,
         //       callbackURL: config[domain].auth.google.callback,
         //       scope: config[domain].auth.google.scope,
         //       prompt: config[domain].auth.google.prompt
         //       },
         //       function(token, tokenSecret, profile, done) {
         //          return done(null, profile);
         //       }
         //    ));
         // }
         // SAML
         if(config[domain].auth.saml) {
            passport.use(domain, new SamlStrategy({
               entryPoint: config[domain].auth.saml.entryPoint,
               issuer: config[domain].auth.saml.issuer,
               callbackUrl: config[domain].auth.saml.callbackUrl,
               cert: config[domain].auth.saml.cert
            },
            function (profile, done) {
               return done(null, profile)
            }
         ))
         }

      }
   }
   console.log();

   passport.serializeUser(function(user, done) {
    done(null, user);
   });

   passport.deserializeUser(function(user, done) {
    done(null, user);
   });
};

