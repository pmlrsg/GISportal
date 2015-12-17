

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
require('./config/index.js')(app);
var config = app.get('config');

// set up Redis as the session store
var redisSetup = require('./lib/redissetup.js');
var redisClient = redisSetup.startRedis(app, config);
var redisStore = require('connect-redis')(session);

app.set('sessionStore', new redisStore({client: redisClient}));

// Configure Express app with:
// * Cookie parser
app.use(cookieParser(config.session.secret));
// * Session manager
app.use(session({
   key: 'collaboration',
   secret: config.session.secret, 
   store: app.get('sessionStore'),
      cookie: {
         maxAge: config.session.age || null
      }
   })
);

// template engine
app.set('view engine', 'jade');

// Passport settings
var passportConfig = require('./lib/passport.js');
passportConfig.init(config);

var passport = require('passport');
app.use(passport.initialize());

// Configure routes
var routes = require('./lib/routes.js');
app.use('/', routes);


// Start listening...
server = http.createServer(app)
server.listen(config.app.port, function() {
	console.log('collaboration-suite listening on port %d', config.app.port)
});
io = io.listen(server);

// the collaboration websocket stuff
var collaboration = require('./lib/collaboration.js');
collaboration.init(io, app, config);

/*
 * Catch uncaught exceptions
 */

app.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
