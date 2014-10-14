

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
	})
);

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

app.get('/node/auth/google', passport.authenticate('google'));

app.get('/node/auth/google/callback', 
   passport.authenticate('google', {
     successRedirect: '/node/authorised',
     failureRedirect: '/node/auth-failed'
   })
 );

app.get('/node/authorised', function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.sendFile(__dirname +'/html/authorised.html');
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

	        	//console.log(session);
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

	var cookies = cookieParser.signedCookies(cookie.parse(socket.request.headers.cookie), config.session.secret);
   var sid = cookies['collaboration'];

   var user = {};
   var sessionStore = app.get('sessionStore');
	sessionStore.load(sid, function(err, session) {
		if (err || !session) {
			return 'no passport';
		}

		var emails = session.passport.user.emails;

		user.email = emails[0].value;
		user.name = session.passport.user.displayName;
		user.provider = session.passport.user.provider;
		
		console.log(user.email +' connected: '+sid);
	});
	
   socket.on('disconnect', function(){
   	redisClient.del('sess:'+sid);
		console.log('user disconnected');
	})

	socket.on('startNewRoom', function() {
	   var shasum = crypto.createHash('sha1');
	   shasum.update(Date.now().toString());
	   var roomId = shasum.digest('hex').substr(0,6);

	   socket.join(roomId);
	   console.log(user.email +' is now is room '+ roomId);

	   io.sockets.in(roomId).emit('roomCreated', {
	   	"roomId": roomId
	   });
	})

	// sets the value of an element using the ID as the selector
	socket.on('setValueById', function(data) {
      console.log(data.logmsg);
      io.emit('setValueById', {
         "presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

	// sets the value of an element using the class as the selector
   socket.on('setValueByClass', function(data) {
      console.log(data.logmsg);
      io.emit('setValueByClass', {
   	   "presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

   socket.on('setSavedState', function(data) {
      console.log(data);
      io.emit('setSavedState', {
   	   "presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

   // moves the map to new lat/lon centre point
   socket.on('mapMove', function(data) {
      console.log(data);
      io.emit('mapMove', {
        	"presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

   // sets the zoom level of the map
   socket.on('mapZoom', function(data) {
      console.log(data);
      io.emit('mapZoom', {
         "presenter": user.email,
         "provider": user.provider,
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
