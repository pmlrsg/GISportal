

// Imports
var express = require('express');
var http = require('http');
var io = require('socket.io')(http);
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var connect = require('connect');
var session = require('express-session');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var app = express();

// Set the settings
require('./config')(app);
var config = app.get('config');

// Redis config 
var url = require('url');
var redis = require('redis')
var RedisStore = require('connect-redis')(session)

var redisConfig = url.parse(config.redisURL);
var redisClient = redis.createClient(redisConfig.port, redisConfig.hostname);

redisClient
	.on('error', function(err) {
		console.log('Error connecting to redis %j', err);
	}).on('connect', function() {
		console.log('Connected to redis.');
	}).on('ready', function() {
		console.log('Redis client ready.');
	});

app.set('sessionStore', new RedisStore({client: redisClient}));


// Configure Express app with:
// * Cookie parser
// * Session manager
app.use(cookieParser(config.session.secret));
app.use(session({
	key: 'collaboration',
	secret: config.session.secret, 
	store: app.get('sessionStore'),
    cookie: {
        maxAge: config.session.age || null
    }
}));

app.use(passport.initialize());

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

// Configure Paths
// -----------------------------------------------------------------------------

app.get('/auth/google', passport.authenticate('google'));

app.get('/auth/google/callback', 
   passport.authenticate('google', {
     successRedirect: '/authorised',
     failureRedirect: '/auth-failed'
   })
 );

app.get('/authorised', function(req, res) {
	res.send('authorised');
	console.log(typeof(req.cookies) +': '+req.cookies);
})


// Start listening...
server = http.createServer(app)
server.listen(config.app.port, function() {
	console.log('collaboration-suite listening on port %d', config.app.port)
});
io = io.listen(server);

io.set('authorization', function (handshakeData, accept) {
   // check if there's a cookie header
   if (handshakeData.headers.cookie) {
   	try {
      	var cookies = cookieParser.signedCookies(cookie.parse(handshakeData.headers.cookie), config.session.secret);
		   var sid = cookies['collaboration'];
		
			var sessionStore = app.get('sessionStore');
			sessionStore.load(sid, function(err, session) {
				if(err || !session) {
	         	return accept('Error retrieving session!', false);
	        	}

	        	console.log(session);
			});

      } catch(e) {
      	console.log(e);
      }
      

   } else {
      // if there isn't, turn down the connection with a message
      // and leave the function.
      return accept('No cookie transmitted.', false);
   } 
   // accept the incoming connection
   accept(null, true);
}); 

io.on('connection', function(socket){
	console.log('user connected');

	socket.on('disconnect', function(){
		console.log('user disconnected');
	})

	// sets the value of an element using the ID as the selector
	socket.on('setValueById', function(data) {
      console.log(data.logmsg);
      io.emit('setValueById', {
         // nickname: nickname,
         // provider: provider,
         "params" : data
      });
   });  

	// sets the value of an element using the class as the selector
   socket.on('setValueByClass', function(data) {
      console.log(data.logmsg);
      io.emit('setValueByClass', {
   	   // nickname: nickname,
         // provider: provider,
         "params" : data
      });
   });  

   // moves the map to new lat/lon centre point
   socket.on('mapMove', function(data) {
      console.log(data.logmsg);
      io.emit('mapMove', {
        	// nickname: nickname,
         // provider: provider,
         "params" : data
      });
   });  

   // sets the zoom level of the map
   socket.on('mapZoom', function(data) {
      console.log(data.logmsg);
      io.emit('mapZoom', {
         // nickname: nickname,
         // provider: provider,
         "params" : data
      });
   });  
});

/*
 * Catch uncaught exceptions
 */

app.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
