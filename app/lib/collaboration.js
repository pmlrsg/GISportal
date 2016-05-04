
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var crypto = require('crypto');
var redis = require('redis');
var client = redis.createClient();

var collaboration = {};

module.exports = collaboration;

collaboration.init = function(io, app, config) {
   // Makes sure that when node is restarted, all people are removed from rooms so there are no duplicates
   client.lrange("rooms_list", 0, -1, function(err, list){
      for(var index in list){
         var room = list[index];
         client.get(room, function(err, obj) {
            var data = JSON.parse(obj);
            data.people = [];
            client.set(room, JSON.stringify(data), function(err){});
         });
      }
   });

   io.set('authorization', function (handshakeData, accept) {
      // check if there's a cookie header
      if (handshakeData.headers.cookie) {
         try {
            var cookies = cookieParser.signedCookies(cookie.parse(handshakeData.headers.cookie), config.session.secret);
            var sid = cookies['GISportal'];
         
            var sessionStore = app.get('sessionStore');
            sessionStore.load(sid, function(err, session) {
               if(err || !session) {
                  return accept('Error retrieving session!', false);
               }
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
      var sid = cookies['GISportal'];

      var user = {};
      var sessionStore = app.get('sessionStore');
      sessionStore.load(sid, function(err, session) {
         if (!session || !session.passport.user || err) {
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
         
         var roomId = socket.room;
         client.get(roomId, function(err, obj) {
            if(!obj){
               return;
            }
            var room = JSON.parse(obj);
            var leavingUserId = socket.id;
            var people = room.people;
            var departed = '';
            var reassignPresenter = false;
            var newPresenterId = null;
            var newPresenterEmail = null;

            if (typeof people != 'undefined') {
               for (var i = 0; i < people.length; i++) {
                  if (people[i].id == leavingUserId) {
                     // is the person disconnecting either the current presenter?
                     if (people[i].presenter == true) {
                        reassignPresenter = true;
                     }
                     // get their name so others can be warned that `departed` has left the building
                     departed = people[i].name || people[i].email;
                     // take the user out of the people array
                     people.splice(i, 1);
                     break;
                  }
               }
               if (reassignPresenter) { // give the presenter role to the room owner (who started the room)
                  for (var i = 0; i < people.length; i++) {
                     if (people[i].owner == true) {
                        people[i].presenter = true;
                        newPresenterId = people[i].id;
                        newPresenterEmail = people[i].email;
                        break;
                     }
                  }
               }
               if (newPresenterEmail !== null) {
                  room.presenter = newPresenterEmail;
               }
               client.set(roomId, JSON.stringify(room), function(err){
                  if(!err){
                     io.sockets.in(socket.room).emit('room.member-left', {
                        "roomId": roomId,
                        "people": people,
                        "departed" : departed
                     });

                     if (newPresenterId !== null) {
                        io.sockets.in(socket.room).emit('room.presenter-changed', {
                           "roomId": socket.room,
                           "people": people
                        });
                     }
                  }
               });
            }
         })
      })

      socket.on('room.new', function() {
         console.log('starting room');
         var shasum = crypto.createHash('sha256');
         shasum.update(Date.now().toString());
         var roomId = shasum.digest('hex').substr(0,6);
         var room = {
            "people": [{
               "id": socket.id,
               "email": user.email,
               "name": user.name,
               "presenter": true,
               "owner": true,
               "diverged": false
            }],
            "owner": user.email,
            "presenter": user.email,
            "roomId": roomId
         }
         socket.room = roomId;
         // adds the room to the list of rooms
         client.rpush(["rooms_list", roomId], function(err) {});
         client.set(roomId, JSON.stringify(room), function(err){
            if(!err){
               socket.join(socket.room, function() {
                  io.sockets.in(socket.room).emit('room.created', room);
               });
            }
         });
         console.log(user.email +' is now in room '+ roomId);
         
      })

      socket.on('room.join', function(roomId) {
         client.get(roomId, function(err, obj) {
            if(!obj){
               console.log(roomId +' does not exist');
               //io.sockets.connected[socket.id].emit('room.invalid-id');
               return;
            }
            var room = JSON.parse(obj);
            console.log(user.email +' is joining room '+ roomId);

            // add the user to the room and let everyone in the room know
            socket.room = roomId;
            socket.join(socket.room, function() {
               // add the new user to the room's members array
               var owner = false;
               var presenter = false;
               if(room.owner == user.email){
                  owner = true;
               }
               if(room.presenter == user.email){
                  presenter = true;
               }
               var member = {
                  "id": socket.id,
                  "email": user.email,
                  "name": user.name,
                  "presenter": presenter,
                  "owner": owner,
                  "diverged": false
               }
               room.people.push(member);
               client.set(roomId, JSON.stringify(room), function(err){
                  if(!err){
                     io.sockets.in(socket.room).emit('room.member-joined', {
                        "roomId": roomId,
                        "sessionId": socket.id,
                        "user": user,
                        "people": room.people,
                        "owner": owner,
                        "presenter": presenter
                     })
                  }
               });
            })

         });
      });

      socket.on('room.make-presenter', function(id) {
         console.log('changing presenter to '+ id)
         var roomId = socket.room;

         client.get(roomId, function(err, obj) {
            if(!obj){
               return;
            }
            var room = JSON.parse(obj);
            var people = room.people;
            var presenterEmail;
            for (var p in people) {
               if (people[p].id == id) {
                  people[p].presenter = true;
                  people[p].diverged = false;
                  presenterEmail = people[p].email;
               } else {
                  people[p].presenter = false;
               }
            }
            room.presenter = presenterEmail;

            client.set(roomId, JSON.stringify(room), function(err){
               if(!err){
                  io.sockets.in(socket.room).emit('room.presenter-changed', {
                     "roomId": socket.room,
                     "people": people
                  });
               }
            });
         });
      });

      // sets the value of an element using the ID as the selector
      socket.on('setValueById', function(data) {
         console.log(data.logmsg);
         io.sockets.in(socket.room).emit('setValueById', {
            "presenter": user.name || user.email,
            "provider": user.provider,
            "params" : data
         });
      });  

      // sets the value of an element using the class as the selector
      socket.on('setValueByClass', function(data) {
         console.log(data.logmsg);
         io.sockets.in(socket.room).emit('setValueByClass', {
            "presenter": user.name || user.email,
            "provider": user.provider,
            "params" : data
         });
      });  

      socket.on('setSavedState', function(data) {
         console.log(data);
         io.sockets.in(socket.room).emit('setSavedState', {
            "presenter": user.name || user.email,
            "provider": user.provider,
            "params" : data
         });
      });  

      // a simple collaboration event; just echo back what was sent with details of who sent it
      socket.on('c_event', function(data) {
         console.log(data);
         io.sockets.in(socket.room).emit(data.event, {
            "presenter": user.name || user.email,
            "provider": user.provider,
            "params" : data
         })
      }) 


   });
}