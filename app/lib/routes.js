
var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('./user.js');
var utils = require('./utils.js');
var path = require('path');

var html_dir = __dirname + "/../../html";
module.exports = router;

router.get('/', function(req, res){
   var domain = utils.getDomainName(req);
   var config = global.config[domain] || global.config;
   if ('auth' in config && 'requireAuthBeforeAccess' in config.auth) {
      // check is user is logged in
      if (typeof(req.session.passport.user) == 'undefined') {
         res.redirect('/app/user/login');
      }
      // if only specific users allowed, are they on the list
      if ('specificUsersOnly' in config.auth) {
         let allowedUsers = config.auth.specificUsersOnly;
         if ('admins' in config) {
            allowedUsers = allowedUsers.concat(config.admins)
         }
         let userEmail = req.session.passport.user.emails[0].value
         if (!allowedUsers.includes(userEmail)) {
            res.redirect('/app/user/login?err=notAllowed');
         }
      }
   }
   res.sendFile(path.join(html_dir, 'application', '/index.html'));
});

router.get('/css/:mode', function(req, res) {
   var mode = req.params.mode;
   var domain = utils.getDomainName(req);
   var config = GLOBAL.config[domain] || GLOBAL.config;

   var min = "";

   if(mode != "dev"){
      min = ".min";
   }

   if(config.cssFile){
      res.sendFile(path.join(html_dir, "css", config.cssFile.replace(".css", "") + min + ".css"));
   }else{
      res.sendFile(path.join(html_dir, "css/GISportal" + min + ".css"));
   }
});

// default path; check for cookie and if it's not there send them to the login page
router.get('/app/user', function(req, res) {
   res.render('index', {});
});

router.get('/app/user/dashboard', user.requiresValidUser, function(req, res) {
   var userId = req._passport.session.user.id;
   var displayName = req._passport.session.user.displayName;
   var userEmail = req._passport.session.user.emails[0].value;
   var userPicture = req._passport.session.user._json.picture;
   
   res.render('dashboard', {
      title: 'User Dashboard',
      userId: userId,
      displayName: displayName,
      userEmail: userEmail,
      userPicture: userPicture
   });
});

router.get('/app/user/login', function(req, res, info) {
   var domain = utils.getDomainName(req);
   var config = GLOBAL.config[domain] || GLOBAL.config;
   var data = {}
   if ('auth' in config && 'google' in config.auth) {
      data['google'] = {
         'clientid': config.auth.google.clientid,
      }
   };
   if ('auth' in config && 'saml' in config.auth) {
      data['saml'] = {}
   };
   if (Object.keys(data).length == 0) {
      data.messageText = "No authentication providers have been configured"
      data.messageStatus = "error"
   }
   if (req.query != '') {
      if (req.query.err == 'notAllowed') {
         data.messageText = "Your User ID is not authorised to use this application"
         data.messageStatus = "error"
      }
   }
   res.render('login', data);
});

router.get('/app/user/auth/google', function(req, res, next) {

   var domain = utils.getDomainName(req);

   // generate the authenticate method and pass the req/res
   passport.authenticate(domain, function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.redirect('/'); }

      // req / res held in closure
      req.logIn(user, function(err) {
         if (err) { return next(err); }
         return res.send(user);
      });

   })(req, res, next);

});

router.get('/app/user/auth/google/callback', function(req, res, next){
   var domain = utils.getDomainName(req);

   // generate the authenticate method and pass the req/res
   passport.authenticate(domain, function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.redirect('../../auth-failed'); }

      // req / res held in closure
      req.logIn(user, function(err) {
         if (err) { return next(err); }
         return res.redirect('../../authorised');
      });

   })(req, res, next);
});

router.get('/app/user/authorised', function(req, res) {
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.render('authorised', {});
});

router.get('/app/user/logout', function(req, res) {
   req.session.passport = {};
   res.sendStatus(200);
});

router.get('/app/collaboration', function(req, res) {
   res.render('collaboration-index', {
      title: 'Collaboration Dashboard'
   });
});

router.get('/app/collaboration/dashboard', user.requiresValidUser, function(req, res) {
   res.render('collaboration-dashboard', {
      title: 'Collaboration Dashboard'
   });
});
router.get('/app/user/get', function(req, res) {
   var email = user.getUsername(req);
   var domain = utils.getDomainName(req);
   var permission = user.getAccessLevel(req, domain);
   var info ={
      "email":email,
      "permission": permission   
   };
   res.send(info);
});
