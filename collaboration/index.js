

// Imports
var express = require('express');
var http = require('http');
var io = require('socket.io')(http);
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var connect = require('connect');
var session = require('express-session');
var crypto = require("crypto");
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





// stuff for managing rooms and users (should be in redis)
rooms = {}

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

   socket.room = '';
   
	var cookies = cookieParser.signedCookies(cookie.parse(socket.request.headers.cookie), config.session.secret);
   var sid = cookies['collaboration'];

   var user = {};
   var sessionStore = app.get('sessionStore');
	sessionStore.load(sid, function(err, session) {
      if (!session || !session.passport.user || err) {
         console.log(session);
         return 'no passport';
		}
      
      var emails = session.passport.user.emails;

		user.email = emails[0].value;
		user.name = session.passport.user.displayName;
		user.provider = session.passport.user.provider;
		
		console.log(user.email +' connected: '+sid);
	});
	
   socket.on('disconnect', function(){
   	//redisClient.del('sess:'+sid);    can't delete the session on disconnect because joining a room causes users to disconnect (but perphaps it shouldn't?)
		console.log('user disconnected');

      var leavingUserId = socket.id;
      var roomId = socket.room;
      var people = rooms[roomId];
      var departed = '';
      var reassignPresenter = false;
      var newPresenterId = null;

      if (typeof people != 'undefined') {
         for (var i = 0; i < people.length; i++) {
            if (people[i].id == leavingUserId) {
               // is the person disconnecting either the current presenter or the owner?
               if (people[i].presenter == true) {
                  reassignPresenter = true;
               }
               // get their name so others can be warned that `departed` has left the building
               departed = people[i].name;
               // take the user out of the people array
               rooms[roomId].splice(i, 1);
               break;
            }
         }
         if (reassignPresenter) { // give the presenter role to the room owner (who started the room)
            for (var i = 0; i < people.length; i++) {
               if (people[i].owner == true) {
                  people[i].presenter = true;
                  newPresenterId = people[i].id
                  break;
               }
            }
         }
         io.sockets.in(socket.room).emit('room.member-left', {
            "roomId": roomId,
            "people": rooms[roomId],
            "departed" : departed
         });

         if (newPresenterId !== null) {
            io.sockets.in(socket.room).emit('room.presenter-changed', {
               "roomId": socket.room,
               "people": people
            });
         }
      }
	})

	socket.on('room.new', function() {
	   console.log('starting room');
      var shasum = crypto.createHash('sha1');
	   shasum.update(Date.now().toString());
	   var roomId = shasum.digest('hex').substr(0,6);

      rooms[roomId] = [{
         "id": socket.id,
         "email": user.email,
         "name": user.name,
         "presenter": true,
         "owner": true
      }]
      socket.room = roomId;
	   socket.join(socket.room, function() {
         io.sockets.in(socket.room).emit('room.created', {
            "roomId": roomId,
            "people": rooms[roomId]
         });
      });
	   console.log(user.email +' is now is room '+ roomId);
      
	})

   socket.on('room.join', function(roomId) {
      console.log(user.email +' is joining room '+ roomId);
      // does the room actually exist
      if (rooms[roomId]) { // yes, add the user to it and let everyone in the room know
         socket.room = roomId;
         socket.join(socket.room, function() {
            // add the new user to the room's members array
            var member = {
               "id": socket.id,
               "email": user.email,
               "name": user.name,
               "presenter": false,
               "owner": false
            }
            rooms[roomId].push(member);

            io.sockets.in(socket.room).emit('room.member-joined', {
               "roomId": roomId,
               "sessionId": socket.id,
               "user": user,
               "people": rooms[roomId]
            })
         })
      } else { // no, tell the user
         console.log(roomId +' does not exist')
         io.sockets.connected[socket.id].emit('room.invalid-id');
      }
   });

   socket.on('room.make-presenter', function(id) {
      console.log('changing presenter to '+ id)
      
      var people = rooms[socket.room];
      for (var p in people) {
         if (people[p].id == id) {
            people[p].presenter = true;
         } else {
            people[p].presenter = false;
         }
      }

      io.sockets.in(socket.room).emit('room.presenter-changed', {
         "roomId": socket.room,
         "people": people
      });
   });

	// sets the value of an element using the ID as the selector
	socket.on('setValueById', function(data) {
      console.log(data.logmsg);
      io.sockets.in(socket.room).emit('setValueById', {
         "presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

	// sets the value of an element using the class as the selector
   socket.on('setValueByClass', function(data) {
      console.log(data.logmsg);
      io.sockets.in(socket.room).emit('setValueByClass', {
   	   "presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

   socket.on('setSavedState', function(data) {
      console.log(data);
      io.sockets.in(socket.room).emit('setSavedState', {
   	   "presenter": user.email,
         "provider": user.provider,
         "params" : data
      });
   });  

   // a simple collaboration event; just echo back what was sent with details of who sent it
   socket.on('c_event', function(data) {
      console.log(data);
      io.sockets.in(socket.room).emit(data.event, {
         "presenter": user.email,
         "provider": user.provider,
         "params" : data
      })
   }) 


});


/*
 * Catch uncaught exceptions
 */

app.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
