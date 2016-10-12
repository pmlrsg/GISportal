// Imports
// var connect = require('connect');
// var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var express = require('express');
var session = require('express-session');
var fs = require("fs");
var http = require('http');
// var jade = require("jade");
var path = require('path');
var io = require('socket.io')(http);
var utils = require('./app/lib/utils.js');
require('./app/lib/polyfills.js');


var CURRENT_PATH = __dirname;
var MASTER_CONFIG_PATH = CURRENT_PATH + "/config/site_settings/";


// Express setup
var app = express();

// Set the settings
var found = false;
try {
   require('./config/global-config-server.js');
   found = true;
} catch (e) {}
var site_setings_path = path.join(__dirname, "config/site_settings");
if (!utils.directoryExists(site_setings_path)) {
   var layers_path = path.join(site_setings_path, "layers");
   utils.mkdirpSync(site_setings_path);
   utils.mkdirpSync(layers_path);
}
var site_setings_list = fs.readdirSync(site_setings_path); // The list of files and folders in the site_settings folder
site_setings_list.forEach(function(foldername) {
   var folder_path = path.join(site_setings_path, foldername);
   if (utils.directoryExists(folder_path) && foldername != "layers" && foldername.substr(-4) !== ".bak") {
      var config_path = path.join(folder_path, "config-server.js");
      if (utils.fileExists(config_path)) {
         try {
            require(config_path);
            found = true;
         } catch (e) {}
      }
   }
});
if (!found) {
   try {
      fs.writeFileSync('./config/global-config-server.js', fs.readFileSync('./config_examples/global-config-server.js'));
      require('./config/global-config-server.js');
   } catch (e) {
      console.log('There doesn\'t appear to be a server config settings file in place');
      console.log('');
      console.log('If this is a new installation you can copy a config file from the examples folder; run the following command:');
      console.log('');
      console.log('    mkdir ' + __dirname + '/config; cp ' + __dirname + '/config_examples/global-config-server.js ' + __dirname + '/config/global-config-server.js');
      console.log('');
      console.log('Exiting application, bye   o/');
      console.log('');
      process.exit();
   }
}

// set up Redis as the session store
var redisSetup = require('./app/lib/redissetup.js');
var redisClient = redisSetup.startRedis(app, global.config);
var redisStore = require('connect-redis')(session);

app.set('sessionStore', new redisStore({
   client: redisClient
}));

// Configure Express app with:
// * Cookie parser
app.use(cookieParser(global.config.session.secret));
// * Session manager
app.use(session({
   key: 'GISportal',
   secret: global.config.session.secret,
   store: app.get('sessionStore'),
   cookie: {
      maxAge: global.config.session.age || null
   },
   saveUninitialized: false, // don't create session until something stored,
   resave: false // don't save session if unmodified
}));

// template engine
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'html')));

// Passport settings
var passportConfig = require('./app/lib/passport.js');
passportConfig.init(global.config);
var passport = require('passport');
app.use(passport.initialize());

// Load additional modules
var moduleLoader = require('./app/lib/moduleloader.js');
var modules = moduleLoader.loadModules();

// Configure routes
var routes = require('./app/lib/routes.js');
var apiRoutes = require('./app/lib/apiroutes.js');
var settingsRoutes = require('./app/lib/settingsroutes.js');
var plotting = require('./app/lib/plotting.js');
app.use('/', routes);
app.use('/', apiRoutes);
app.use('/', settingsRoutes);
app.use('/', plotting);
for (var mod in modules) {
   app.use('/', modules[mod]);
}
app.param('subfolder', function(req, res, next, subfolder) {
   if (subfolder != "app") {
      req.SUBFOLDER = subfolder;
      var domain = utils.getDomainName(req);
      if (utils.directoryExists(path.join(MASTER_CONFIG_PATH, domain))) {
         next();
      } else if (subfolder === 'api') {
         res.status(400).send("Invalid API request");
      } else {
         res.status(404).send('Sorry, This portal doesn\'t exist, try running the install script');
      }
   } else {
      res.send();
   }
});
app.use('/:subfolder', express.static(path.join(__dirname, 'html')));
app.use('/:subfolder', routes);
app.use('/:subfolder', apiRoutes);
app.use('/:subfolder', settingsRoutes);
app.use('/:subfolder', plotting);
for (var mod in modules) {
   app.use('/:subfolder', modules[mod]);
}

// Start listening...
var server = http.createServer(app);
server.listen(global.config.appPort, function() {
   console.log('GISportal server listening on port %d', global.config.appPort);
});
io = io.listen(server);

// the collaboration websocket stuff
var collaboration = require('./app/lib/collaboration.js');
collaboration.init(io, app, global.config);

/*
 * Catch uncaught exceptions
 */

app.on('uncaughtException', function(err) {  
   console.log('Exception: ' + err.stack);
});