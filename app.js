

// Imports
var express = require('express');
var http = require('http');
var io = require('socket.io')(http);
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var connect = require('connect');
var session = require('express-session');
var jade = require("jade");


// Express setup
var app = express();

// Set the settings
try {
   require('./config/config-server.js');
} catch(e) {
   console.log('There doesn\'t appear to be a server config settings file in place');
   console.log('');
   console.log('If this is a new installation you can copy a config file from the examples folder; run the following command:');
   console.log('');
   console.log('    mkdir '+ __dirname +'/config; cp '+ __dirname +'/config_examples/config-server.js '+ __dirname +'/config/config-server.js');
   console.log('');
   console.log('Exiting application, bye   o/');
   console.log('');
   process.exit();
}


// set up Redis as the session store
var redisSetup = require('./app/lib/redissetup.js');
var redisClient = redisSetup.startRedis(app, config);
var redisStore = require('connect-redis')(session);

app.set('sessionStore', new redisStore({client: redisClient}));

// Configure Express app with:
// * Cookie parser
app.use(cookieParser(config.session.secret));
// * Session manager
app.use(session({
   key: 'GISportal',
   secret: config.session.secret, 
   store: app.get('sessionStore'),
   cookie: {
      maxAge: 3600 
   },
   saveUninitialized: false, // don't create session until something stored,
   resave: false // don't save session if unmodified
}));

// template engine
app.set('view engine', 'jade');

// Passport settings
var passportConfig = require('./app/lib/passport.js');
passportConfig.init(config);

var passport = require('passport');
   passport.serializeUser(function(user, done) {
    console.log('app serialize:\n' +JSON.stringify(user));
    done(null, user);
   });

   passport.deserializeUser(function(user, done) {
    console.log('app deserialize:\n'+JSON.stringify(user));
    done(null, user);
   });

//var passport = require('passport');
app.use(passport.initialize());

// Configure routes
var routes = require('./app/lib/routes.js');
app.use('/', routes);


// Start listening...
server = http.createServer(app)
server.listen(config.app.port, function() {
	console.log('GISportal server listening on port %d', config.app.port)
});
io = io.listen(server);

// the collaboration websocket stuff
var collaboration = require('./app/lib/collaboration.js');
collaboration.init(io, app, config);

/*
 * Catch uncaught exceptions
 */

app.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
