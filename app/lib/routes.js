
var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('./user.js');

module.exports = router;

// default path; check for cookie and if it's not there send them to the login page
router.get('/app', function(req, res) {
   res.render('index', {
      title: 'GISportal collaboration'
   });
});

router.get('/app/dashboard', function(req, res) { //, user.requiresValidUser
   var userId = req._passport.session.user.id;
   var displayName = req._passport.session.user.displayName;
   var userEmail = req._passport.session.user.emails[0].value;
   var userPicture = req._passport.session.user._json.picture;
   
   res.render('dashboard', {
      title: 'Collaboration Dashboard',
      userId: userId,
      displayName: displayName,
      userEmail: userEmail,
      userPicture: userPicture
   })
});

router.get('/app/auth/google', passport.authenticate('google'));

router.get('/app/auth/google/callback', 
   passport.authenticate('google', {
     successRedirect: '/app/authorised',
     failureRedirect: '/app/auth-failed'
   })
 );

router.get('/app/authorised', function(req, res) {
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.render('authorised', {});
})

router.get('/app/logout', function(req, res) {
   req._passport = null;
   res.redirect('/app');
})

router.get('/app/user/get', function(req, res) {
   var email = user.getUsername(req);
   var permission = user.getAccessLevel(req);
   var info ={
      "email":email,
      "permission": permission
   }
   res.send(info);
})
