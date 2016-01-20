
var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('./user.js');

module.exports = router;

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
   })
});

router.get('/app/user/auth/google', passport.authenticate('google'));

router.get('/app/user/auth/google/callback', 
   passport.authenticate('google', {
     successRedirect: '/app/user/authorised',
     failureRedirect: '/app/user/auth-failed'
   })
 );

router.get('/app/user/authorised', function(req, res) {
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.render('authorised', {});
})

router.get('/app/user/logout', function(req, res) {
   req.session.passport = {};
   res.sendStatus(200);
})

router.get('/app/collaboration', function(req, res) {
   res.render('collaboration-index', {
      title: 'Collaboration Dashboard'
   })
});

router.get('/app/collaboration/dashboard', user.requiresValidUser, function(req, res) {
   res.render('collaboration-dashboard', {
      title: 'Collaboration Dashboard'
   })
});
