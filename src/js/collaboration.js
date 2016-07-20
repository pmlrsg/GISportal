
collaboration = {};


// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration';							// the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console';						// the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.statusMessage = '.js-collaboration-status-msg';					// element where the status message is displayed
collaboration.statusIcon = '.js-collaboration-status-icon';                // element where the status icon is displayed
collaboration.displayLog = true;                                           // if true the history is shown in `collaboration.historyConsole
collaboration.diverged = false; 

collaboration.active = false;
collaboration.role = '';

collaboration.initDOM = function() {     
   if(gisportal.config.collaborationFeatures){
      collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false; // indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible
   }else{
      gisportal.config.collaborationFeatures = {};
   }

   if(!collaboration.enabled){
      return;
   }
   collaboration.videoEnabled = gisportal.config.collaborationFeatures.videoEnabled || false;
   
   if(!collaboration.videoEnabled){
      $('[data-panel-name="collab-video"]').remove();
   }

   collaboration.owner = false;
   $('.notifyjs-gisportal-collab-notification-base').parent().remove();

	$('[data-panel-name="collaboration"]').toggleClass('hidden', false);

   var rendered = gisportal.templates.collaboration();
   $('.js-collaboration-holder').html('');
   $('#collaborationPanel .js-collaboration-holder').html(rendered);

   // if there's a room querystring parameter show the collaboration panel; they'll be put in the room if they are logged in already, otherwise prompt for login
   var roomId = gisportal.utils.getURLParameter('room');
   
   $.ajax({
      url: gisportal.middlewarePath + '/collaboration/dashboard',
      statusCode: {
         401: function() {    // the user isn't currently login so direct them at the login page instead
            $.ajax({
               url: gisportal.middlewarePath + '/collaboration',
               success: function(data) {
                  $('#collab-content').html(data);
                  $('.js-google-auth-button').click(function() {
                     var authWin = window.top.open(gisportal.middlewarePath + '/user/auth/google','authWin','left=20,top=20,width=700,height=700,toolbar=1');
                  }); 
               },
            });
         },
      },
      success: function(data) {
         $('#collab-content').html(data);
      },

   });

   if (roomId !== null && !collaboration.active) {
      gisportal.panels.showPanel('collaboration');
      gisportal.stopLoadState = true;
      $('.js-collab-message')
         .toggleClass('hidden', false)
         .toggleClass('alert-warning', true)
         .html('You have been invited to join room '+ roomId.toUpperCase() +'; please login to enter the room');
   }

   if(!window.onfocus){
      window.onfocus = function(){
         if(collaboration.activePanel == "collab-chat" && $('.messages').length > 0 && $('.messages').scrollTop() + $('.messages').innerHeight() >= $('.messages')[0].scrollHeight){
            if(!$('.collaboration-panel').hasClass('hidden')){
               gisportal.pageTitleNotification.Off();
            }
         }
      };
   }

   $('.js-collab-notifications-toggle').off('click');
   $('.js-collab-notifications-toggle').on('click', function() {
      var log = $(this).prop('checked');
      collaboration.displayLog = log;
      if(log === false){
         $('.notifyjs-gisportal-collab-notification-base').parent().remove();
      }
   });

};

collaboration.addVideoActionListeners = function(){
   $('.js-video-fullscreen').off('click');
   $('.js-video-mute-toggle').off('click');
   $('.js-video-fullscreen').on('click', function(){
      var video = $(this).siblings('video');
      if(video.length > 0){
         video.fullScreen();
      }
   });
   $('.js-video-mute-toggle').on('click', function(){
      var video = $(this).siblings('video');
      var _this = this;
      video.each(function(){
         var vid = this;
         if(vid.muted){
            // Make sure this actually mutes and unmuted the videos
            vid.removeAttribute('muted');
            vid.muted = false;
            $(_this).toggleClass('off-btn', false).toggleClass('on-btn', true).attr('title', "Mute");
         }else{
            vid.setAttribute('muted', true);
            vid.muted = true;
            $(_this).toggleClass('off-btn', true).toggleClass('on-btn', false).attr('title', "Un-mute");
         }
      });
   });
   $('.remoteVideo, .localVideo').off('dblclick');
   $('.remoteVideo, .localVideo').on('dblclick', function(){
      if($(this).attr('fullscreen') == "false"){
         $(this).fullScreen();
      }else{
         $(this).exitFullScreen();
      }
   });

   // Makes sure that the fullscreen attribute is changed when videos are changed to and from full screen
   $("video").bind('webkitfullscreenchange mozfullscreenchange msfullscreenchange fullscreenchange', function(e) {
      var state = document.fullScreen || document.mozFullScreen || document.msFullScreen || document.webkitIsFullScreen;
      $(this).attr('fullscreen', state);
   });
   // Makes sure that the muted attribute is changed when videos are muted
   $("video").bind('volumechange', function(e) {
      if(this.muted){
         this.setAttribute('muted', true);
         $(this).siblings('.js-video-mute-toggle').toggleClass('off-btn', true).toggleClass('on-btn', false).attr('title', "Un-mute");
      }else{
         this.removeAttribute('muted');
         $(this).siblings('.js-video-mute-toggle').toggleClass('off-btn', false).toggleClass('on-btn', true).attr('title', "Mute");
      }
   });
};



collaboration.initSession = function() {
   $.ajax({
      url: "js-libs/webrtc_adapter/adapter.js",
      dataType: 'script',
      success: function(script){
         eval(script);
         $('#collab-chatPanel div.panel-container-solid-backdrop').html('').html(gisportal.templates["collaboration-messenger"]);
         $('#collab-videoPanel div.panel-container-solid-backdrop').html('').html(gisportal.templates["collaboration-video"]({"insecure": window.location.protocol != "https:", compatable: adapter.browserDetails.version && adapter.browserDetails.version >= adapter.browserDetails.minVersion}));
         webRTC.pc_config = { 
            'iceServers': [
               {
                  'urls': 'stun:stun.l.google.com:19302'
               }
            ]
         };
         // Enable/Disable webRTC media
         $('.js-toggle-rtc').click(function() {
            var enabled = webRTC.isChannelReady || false;
            if (!enabled) {
               webRTC.initMedia();
            } else {
               webRTC.deinitMedia();
               $('.js-webrtc-call').toggleClass('hidden', true);
            }
         });
         if(adapter.browserDetails.browser == "firefox"){
            sdpConstraints = {
               'offerToReceiveAudio': true,
               'offerToReceiveVideo': true
            };
         }
            $(".video-people-list").sortable({
               cancel: "span,video",
               cursor: "move",
               items: '.person:not(:first)',
               stop : function(event, ui) {
                  var pid = $(ui.item).data('id');
                  if(webRTC.isStarted && webRTC.peerId == pid){
                     addRemoteVideoStream($(ui.item).data('id'));
                  }
               }
            });

   $('.message-input').on({
      input: function(){
         counter = 0;
         while($(this).css('height') != $(this).prop('scrollHeight') && counter < 20){
            $(this).css({'height':$(this).prop('scrollHeight')});
            counter ++;
         }
         if(parseInt($(this).css('height')) >= 170){
            $(this).css({'height':"170px", 'overflow':"auto"});
         }else{
            $(this).css({'overflow':"hidden"});
         }
      },
      keypress: function(e){
         if(e.which == 13 && !e.shiftKey){
            e.preventDefault();
            $('.js-submit-message').trigger('click');
         }
      }
   });
     }
   });

	// get the socket.io script and open a connection
	$.getScript(gisportal.middlewarePath + "/socket.io/")
		.done(function( script, textStatus ) {
         socket = io.connect('/', {
		   	"connect timeout": 1000
		  	});

         $('.js-show-collaboration').off('click').toggleClass('open', false);
         $('.js-hide-collaboration').off('click').toggleClass('open', false);
         $('.js-show-collaboration').on('click', function(){
            $(this).toggleClass('hidden', true);
            $('.collaboration-panel').toggleClass('hidden', false);
            if(collaboration.activePanel == "collab-chat"){
               $('.message-input').select();
               if($('.messages').scrollTop() + $('.messages').innerHeight() >= $('.messages')[0].scrollHeight){
                  gisportal.pageTitleNotification.Off();
               }
            }
         });
         $('.js-hide-collaboration').on('click', function(){
            $('.collaboration-panel').toggleClass('hidden', true);
            $('.js-show-collaboration').toggleClass('hidden', false);
         });

         var idleMouseTimer;
         var forceMouseHide = false;
         $(".collab-overlay").off('mousemove click');
         $(".collab-overlay").on('mousemove click', function(ev) {
            if(!forceMouseHide) {
               $(".collab-overlay").css('cursor', '');

               clearTimeout(idleMouseTimer);

               idleMouseTimer = setTimeout(function() {
                  $(".collab-overlay").css('cursor', 'none');

                  forceMouseHide = true;
                  setTimeout(function() {
                     forceMouseHide = false;
                  }, 200);
               }, 1000);
            }
            if(ev.type == "click"){
               collaboration.divergeAlert();
            }
         });

    		// -------------------------------------------------
    		// socket core event functions
    		// -------------------------------------------------
		  	socket.on('connect', function (){
		  		collaboration.active = true;
            collaboration.setStatus('connected', 'Ready');

            // if there's a room querystring parameter get the user into the room
            var roomId = gisportal.utils.getURLParameter('room');
            if (roomId !== null && typeof collaboration.roomId == 'undefined') { // the collaboration.roomId is set to `null` when leaving a room
               collaboration.roomId = roomId;
            }

            if (typeof collaboration.roomId !== 'undefined' && collaboration.roomId !== null) {
               collaboration.joinRoom(collaboration.roomId);
            }
		  	});

		  	socket.on('connect_error', function (reason){
		   	collaboration.setStatus('error', 'Could not connect to server; '+ reason);
		  	});

		  	socket.on('disconnect', function (reason){
		  		collaboration.active = false;
            collaboration.role = "";
            collaboration.diverged = false;
		   	collaboration.setStatus('warning', 'Unexpectedly disconnected, trying to reconnect...');
		  	});

		  	// doesn't appear to work as the reconnect timeout is incrementally increased with each attempt; might have to monitor it outside of socket.io
		  	socket.on('reconnect_error', function (reason){
		   	collaboration.setStatus('error', 'Could not re-establish a connection, sorry');
		  	});

		  	socket.on('error', function (reason){
		   	collaboration.active = false;
		   	if (reason == 'handshake error') { // user not logged into Google
		   		$(collaboration.consoleWrapper).toggleClass('hidden', true);
		   		$(collaboration.authenticationWrapper).toggleClass('hidden', false);
					window.open('auth/google');
		   	} else {
		   		collaboration.setStatus('error', 'The connection failed; '+reason);	
               // reset the iframe
               var rendered = gisportal.templates.collaboration();
               $('.js-collaboration-holder').html('');
               $('#collaborationPanel .js-collaboration-holder').html(rendered);
		   	}
		   	
		  	});

		  	// -------------------------------------------------
		  	// room and user management
		  	// -------------------------------------------------
		  	
         socket.on('room.invalid-id', function(data) {
            $('.js-collab-message')
               .toggleClass('hidden', false)
               .toggleClass('alert-warning', true)
               .html('The collaboration room ID does not exist, please check and try again');
         });
         
         socket.on('room.created', function(data) {
            var roomId = data.roomId;
            console.log('Room created: '+ data.roomId);
            collaboration.roomId = data.roomId;
            
            collaboration.setStatus('connected', 'You are the presenter of room '+ data.roomId.toUpperCase());
            $('.collab-overlay').toggleClass('hidden', true);
            $('.collab-extent-overlay').toggleClass('hidden', false);
            collaboration.owner = true;
            $('.show-collaboration').toggleClass('hidden', true);
            $('.collaboration-panel').toggleClass('hidden', false);

            // load the room template
            collaboration.buildMembersList(data);
         });
         
         socket.on('room.invite', function(data) {
            var domain = data.domain;
            if(domain != gisportal.domainName){
               return false;
            }
            var rendered = gisportal.templates['collaboration-invite'](data);
            gisportal.showModalMessage(rendered, 20000); // user has 20 seconds to answer
            $('.js-accept-invite').click(function() { 
               // hide the message
               gisportal.hideModalMessage();
               collaboration.joinRoom($(this).data("room"));
            });
            $('.js-reject-invite').click(function() { 
               gisportal.hideModalMessage();
            });
         });

         socket.on('room.member-joined', function(data) {
            // is this confirmation that I have joined?
            if (data.sessionId == socket.io.engine.id) { // yes, so set the role, status and show the room details
               collaboration.roomId = data.roomId;
               collaboration.role = 'member';
               collaboration.setStatus('connected', 'You are in room '+ data.roomId.toUpperCase());
               $('.collab-overlay').toggleClass('hidden', false);
               $('.show-collaboration').toggleClass('hidden', true);
               $('.collaboration-panel').toggleClass('hidden', false);
               $('.js-toggle-rtc').find('.btn-value').text('Enable Audio/Video');
            }

            // if I am the presenter send my state so that the new member can catch up
            if (collaboration.role == 'presenter') {
               if(gisportal.panels.activePanel != "refine-indicator"){
                  $('.dd-container').ddslick('close');
               }
               var minimumExtent = collaboration.getMinimumExtent(data.people);
               $('.collab-extent-overlay').css({width: minimumExtent[0] + "px", height: minimumExtent[1] + "px"});
               var state = gisportal.saveState();
               var params = {
                  "event": "room.presenter-state-update",
                  "state": state,
                  "joining-member": data.user.email
               };
               gisportal.events.trigger('room.presenter-state-update', params);
            }
            // set the owner variable
            if(data.owner && data.user.email == gisportal.user.info.email){
               collaboration.owner = true;
            }
            // set the presenter
            if(data.presenter && data.user.email == gisportal.user.info.email){
               collaboration._emit('room.make-presenter', data.sessionId, force=true);
            }
            var name = data.user.name || data.user.email;
            if(data.user.email != gisportal.user.info.email){
               collaboration.log(collaboration.nameOrAvatar(name, data.user.image) + " has joined.");
            }
            // load/update the member listings
            collaboration.buildMembersList(data);
         });

         socket.on('room.member-diverged', function(data) {
            for (var p in data.people) {
               var person = data.people[p];
               if (person.diverged && person.id == socket.io.engine.id) {
                  collaboration.setStatus('warning', 'Diverged. You are diverged from room '+ data.roomId.toUpperCase());
                  collaboration.diverged = true;
                  $('.collab-overlay').toggleClass('hidden', true);
                  break;
               }
            }
            if (collaboration.role == 'presenter') {
               collaboration.log(collaboration.nameOrAvatar(data.divergent, data.image) + " has diverged from your room");
               var minimumExtent = collaboration.getMinimumExtent(data.people);
               $('.collab-extent-overlay').css({width: minimumExtent[0] + "px", height: minimumExtent[1] + "px"});
            }
            collaboration.buildMembersList(data);
         });

         socket.on('extent.changed', function(data) {
            if (collaboration.role == 'presenter') {
               var minimumExtent = collaboration.getMinimumExtent(data.people);
               $('.collab-extent-overlay').css({width: minimumExtent[0] + "px", height: minimumExtent[1] + "px"});
            }
         });

         socket.on('room.member-merged', function(data) {
            if (collaboration.role == 'presenter') {
               var minimumExtent = collaboration.getMinimumExtent(data.people);
               $('.collab-extent-overlay').css({width: minimumExtent[0] + "px", height: minimumExtent[1] + "px"});
               if(gisportal.panels.activePanel != "refine-indicator"){
                  $('.dd-container').ddslick('close');
               }
               var state = gisportal.saveState();
               var params = {
                  "event": "room.presenter-state-update",
                  "state": state,
                  "joining-member": data.email
               };
               gisportal.events.trigger('room.presenter-state-update', params);
               collaboration.log(collaboration.nameOrAvatar(data.merger, data.image) + " has merged back with your room");
            }else{
               for (var p in data.people) {
                  var person = data.people[p];
                  if (!person.diverged && person.id == socket.io.engine.id && data.email == person.email) {
                     collaboration.setStatus('connected', 'Merged. You have been merged back into room '+ data.roomId.toUpperCase());
                     collaboration.diverged = false;
                     $('.collab-overlay').toggleClass('hidden', false);
                     break;
                  }
               }
            }
            collaboration.buildMembersList(data);
         });

         socket.on('message.recieved', function(data) {
            // This builds the message and adds it to the collaboration messages object and to the div
            var message_data = {};
            message_data.message = data.message.replace(/\n/g, "<br/>");
            message_data.side = "left";
            message_data.email = "You";
            var id = data.sender;
            var me = false;
            var this_message_div = "";
            if(id == socket.io.engine.id){
               me = true;
               message_data.side = "right";
            }
            var this_person;
            for(var person in data.people){
               if(data.people[person].id == id){
                  this_person = data.people[person];
                  if(!me){
                     message_data.email = this_person.name || this_person.email;
                  }
                  message_data.image = this_person.image;
               }
            }
            var showNotification = false;
            var chat_panel = $("#collab-chatPanel");
            var hidden = !chat_panel.hasClass('active');
            var re_scroll = false;
            if(($(".messages").scrollTop() + $(".messages").innerHeight() >= $(".messages")[0].scrollHeight || me) && $('#collab-chatPanel').hasClass('active') &&  document.visibilityState == 'visible'){
               re_scroll = true;
            }else{
               // Need to make sure that the panel is active to check if the messages has a scrollbar
               if(hidden){
                  chat_panel.toggleClass('active', true);
               }
               if($(".messages")[0].scrollHeight > $(".messages")[0].clientHeight){
                  showNotification = true;
                  $(".messages").siblings(".new-message-popup").toggleClass('hidden', false);
               }
               if(hidden){
                  chat_panel.toggleClass('active', false);
               }
            }
            var last_message = $(".messages").find('div.outer-div:last');

            if(last_message.data('sender') == message_data.email){
               last_message.find('p').append('<br/><span class="individual-message">' + message_data.message + '<span/>');
            }else{
               $(".messages").append(gisportal.templates['collaboration-message'](message_data));
            }
            if(re_scroll){
               $(".messages").scrollTop($(".messages")[0].scrollHeight);
            }

            if(showNotification || document.visibilityState != 'visible' || hidden){
               gisportal.pageTitleNotification.On("New Message", null, true);
            }
         });

         socket.on('members.update', function(data) {
            collaboration.buildMembersList(data);
         });

         socket.on('room.double-login', function(data) {
            $('.js-leave-room').trigger('click');
            $('.js-collab-message').toggleClass('hidden', false).toggleClass('alert-warning', true).html("You account has logged in from elsewhere, you have been taken out of the room");
         });

         socket.on('room.member-left', function(data) {
            if(data.departed){
               collaboration.log(collaboration.nameOrAvatar(data.departed, data.image) + ' has left the room');
            }
            if(webRTC.peerId == data.departedId && webRTC.isStarted){
               handleRemoteHangup('User Unavailable');
            }
            collaboration.buildMembersList(data);
            var presenterFound = false;
            for(var person in data.people){
               var user = data.people[person];
               if(user.presenter === true){
                  presenterFound = true;
               }
            }
            if(!presenterFound && gisportal.user.info.email == data.people[0].email){
               collaboration._emit('room.make-presenter', data.people[0].id, force=true);
            }
            if(collaboration.role == "presenter"){
               var minimumExtent = collaboration.getMinimumExtent(data.people);
               $('.collab-extent-overlay').css({width: minimumExtent[0] + "px", height: minimumExtent[1] + "px"});
            }
         });

         socket.on('room.presenter-changed', function(data) {
            // am I now the presenter?
            var presenter;
            for (var p in data.people) {
               var person = data.people[p];
               if(person.presenter && person.id){
                  presenter = person;
               }
               if (person.presenter && person.id == socket.io.engine.id) {
                  collaboration.role = "presenter";
                  collaboration.setStatus('connected', 'You are the presenter of room '+ data.roomId.toUpperCase());
                  gisportal.showModalMessage('You are now the presenter');
                  $('.collab-overlay').toggleClass('hidden', true);
                  $('.collab-extent-overlay').toggleClass('hidden', false);
                  var minimumExtent = collaboration.getMinimumExtent(data.people);
                  $('.collab-extent-overlay').css({width: minimumExtent[0] + "px", height: minimumExtent[1] + "px"});
                  break;
               } else {
                  if(collaboration.role == "presenter"){
                     gisportal.showModalMessage('You are no longer the presenter');
                     $('.collab-extent-overlay').toggleClass('hidden', true);
                  }
                  collaboration.role = "member";
                  collaboration.setStatus('connected', 'You are in room '+ data.roomId.toUpperCase());
                  if(!collaboration.diverged){
                     $('.collab-overlay').toggleClass('hidden', false);
                  }
               }
            }
            var pName = presenter.name || presenter.email;
            collaboration.log("Presenter changed to " + collaboration.nameOrAvatar(pName, presenter.image));
            collaboration.buildMembersList(data);
         });

 		  	// -------------------------------------------------
    		// socket collaboration event functions
    		// -------------------------------------------------


         socket.on('main_event', function(data) {
            if(collaboration.diverged && !data.ignoreDivergence){
               return true;
            }
            if(data.params.collabLog){
               collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api[data.event](data, {describeOnly: true}));
            }
            if (collaboration.role == "member") {
               gisportal.api[data.event](data.params, {highlight: true});
            }
         });

         // User saved state
         socket.on('setSavedState', function(data) {
            
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['setSavedState'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['setSavedState'](data, {highlight: true});
            }
         });

         // WebRTC gubbins...
         socket.on('webrtc_event', function(data) {
            var params_msg = data.params.message;
            if(params_msg && params_msg.type){
               params_msg = params_msg.type;
            }
            var log = data.message || params_msg;
            console.log('Client received message:', log);
            webRTC.messageCallback(data);
         });

		  	// control whether the user is a presenter or a member
			$('#btn-presenter').click(function() {
				collaboration.role = 'presenter';
			});

			$('#btn-member').click(function() {
				collaboration.role = 'member';
			});


  		})
  		.fail(function( jqxhr, settings, exception ) {
    		$(collaboration.statusMessage).html('Could not connect to server; the response was \''+ exception+'\' - <a href="javascript:collaboration.initSession();">try again</a>');
	   });
};

collaboration.startNewRoom = function() {
   collaboration.role = 'presenter';
   invitees = [];
   var pageTitle;
   $('.email-list > span').each(function(){
      invitees.push($(this).find('span.email-txt').html());
   });
   if(gisportal.pageTitleNotification && gisportal.pageTitleNotification.Vars){
      pageTitle = gisportal.pageTitleNotification.Vars.OriginalTitle || document.title;
   }
   collaboration._emit('room.new', {mapSize: map.getSize(), invitees: invitees, pageTitle: pageTitle || document.title});
};

collaboration.joinRoom = function(roomId) {
   collaboration._emit('room.join', {roomId:roomId.toLowerCase(), mapSize: map.getSize()}, force=true);
};

collaboration.buildMembersList = function(data) {
   for(var people in data.people){
      person = data.people[people];
      if(!person.name || person.name === ""){
         person.name = person.email;
      }
   }
   if(webRTC){
      data.AVEnabled = webRTC.isChannelReady;
   }
   data.invite_hidden = $('.js-collab-invite').hasClass('hidden') || $('.js-collab-invite').length <= 0 ;
   data.invite_url = gisportal.domainName +'?room='+ collaboration.roomId.toUpperCase();
   var rendered = gisportal.templates['collaboration-home'](data);
   $('#collab-homePanel div.panel-container-solid-backdrop').html('').html(rendered);

   if(gisportal.panels.activePanel == "collaboration"){
      gisportal.panels.showPanel('choose-indicator');
      $('.js-show-panel[data-panel-name="collaboration"]').toggleClass('hidden', true);
   }

   // add events to the various action links
   $('.js-leave-room').click(function() {
      $('.collaboration-panel').toggleClass('hidden', true);
      $('.collab-overlay').toggleClass('hidden', true);
      $('.collab-extent-overlay').toggleClass('hidden', true);
      $('.show-collaboration').toggleClass('hidden', true);
      hangup();
      socket.disconnect();
      collaboration.roomId = null;
      collaboration.owner = false;
      $('.notifyjs-gisportal-collab-notification-base').parent().remove();

      var rendered = gisportal.templates.collaboration();
      $('.js-collaboration-holder').html('');
      $('#collaborationPanel .js-collaboration-holder').html(rendered);

      gisportal.panels.showPanel('collaboration');
      $('.js-show-panel[data-panel-name="collaboration"]').toggleClass('hidden', false);
      $.ajax({
         url: gisportal.middlewarePath + '/collaboration/dashboard',
         statusCode: {
            401: function() {    // the user isn't currently login so direct them at the login page instead
               $.ajax({
                  url: gisportal.middlewarePath + '/collaboration',
                  success: function(data) {
                     $('#collab-content').html(data);
                     $('.js-google-auth-button').click(function() {
                        var authWin = window.top.open(gisportal.middlewarePath + '/user/auth/google','authWin','left=20,top=20,width=700,height=700,toolbar=1');
                     });
                  },
               });
            },
         },
         success: function(data) {
            $('#collab-content').html(data);
            
         },

      });
   });

   $('button.js-submit-message').on('click', function(e)  {
      e.preventDefault();
      var input = $(this).siblings('.message-input');
      if(input.val().length >= 1){
         var msg = input.val().replace(/<\/?[^>]+(>|$)/g, "").replace(/^\s+|\s+$/g, '');
         $('.message-input').val("").css({'height':""});
         if(msg){
            collaboration._emit('message.sent', {message: msg, id: socket.io.engine.id}, force=true);
         }
      }
   });

   $('.new-message-popup').on('click', function(e){
      $(this).toggleClass("hidden", true);
      var messages = $(this).siblings('.messages');
      messages.scrollTop(messages[0].scrollHeight);
   });

   $('.messages').bind('scroll', function() {
      if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight){
         $(this).siblings('.new-message-popup').toggleClass("hidden", true);
         gisportal.pageTitleNotification.Off();
      }
   });

   $('.js-invite-people').click(function() {
      $('.js-collab-invite').toggleClass('hidden');
      $('.js-collab-room-url').val(gisportal.domainName +'?room='+ collaboration.roomId.toUpperCase());
      $('.js-collab-room-url').focus(function() { $(this).select(); } ).on('mouseup cut paste', function (e) {e.preventDefault();}).on('keydown', function(){$(this).select();});
   });
   var presenter, me, id;
   var divergents = [];
   // Makes sure the presenter is not an option to be set as the presenter.
   for(var persons in data.people){
      var person = data.people[persons];
      if(person.presenter){
         presenter = person.id;
      }
      if(person.email == gisportal.user.info.email){
         me = person.id;
      }
      if(person.diverged){
         divergents.push(person.id);
      }
   }

   var people_list = data.people;

   // Because there are two panels
   var me_selectors = [];

   // Adds all of the tools to the peoples list
   $('.person').each(function() {
      id = $(this).data('id');
      var this_person;
      for(var person_data in people_list){
         if(people_list[person_data].id == id){
            this_person = people_list[person_data];
         }
         if(people_list[person_data].id == me){
            my_data = people_list[person_data];
         }
      }
      var link;
      var title = "Make this person the presenter";
      if(!this_person || !this_person.email){
         $(this).remove();
      }
      if(me == id){
         // Different hover message for taking the presenter role yourself
         title = "Take the presenter role";
         me_selectors.push($(this));
         $(this).find('p').html("You");
         var localStreams;
         if(webRTC.peerConn && webRTC.peerConn.getLocalStreams()){
            localStreams = webRTC.peerConn.getLocalStreams()[0];
         }
         var video = {};
         var mic = {};
         if(localStreams){
            if(localStreams.getVideoTracks()[0]){
               video = localStreams.getVideoTracks()[0] || video;
               webRTC.hasVideo = true;
            }else{
               webRTC.hasVideo = false;
            }
            if(localStreams.getAudioTracks()[0]){
               mic = localStreams.getAudioTracks()[0] || mic;
               webRTC.hasAudio = true;
            }else{
               webRTC.hasAudio = false;
            }
            var hide = false;
            if(webRTC.peerMedia){
               hide = !webRTC.peerMedia.video;
            }
         }else{
            webRTC.hasAudio = webRTC.hasVideo = false;
         }
         if(collaboration.role != 'presenter' && $(this).parent().is('.panel-container-solid-backdrop')){
            if($(this).parent().is('.panel-container-solid-backdrop')){
               if(divergents.indexOf(id) >= 0){
                  link = $('<span class="icon-link-1 collab-btn js-collab-merge pull-right" title="Merge with collaboration"></span>');
                  $(this).prepend(link);
               }else{
                  link = $('<span class="icon-link-broken-1 collab-btn js-collab-diverge pull-right" title="Diverge from collaboration"></span>');
                  $(this).prepend(link);
               }
            }
         }
         var me_data = {
            "mic_on": mic.enabled,
            "cam_on": video.enabled,
            "person": this_person
         };
         if($('#collab-videoPanel .video-people-list [data-id="' + this_person.id + '"]').length <= 0){
            $('#collab-videoPanel .video-people-list').prepend(gisportal.templates['collaboration-person-local'](me_data));
         }
         collaboration.showVideoButtons();
         if(!my_data || !my_data.dataEnabled){
            $('#collab-videoPanel .video-people-list').find('.person[data-id="' + id + '"]').remove();
         }
      }else{
         if(this_person && this_person.dataEnabled){
            var them_data = {
               "show_call": my_data && my_data.dataEnabled && !webRTC.isStarted,
               "show_mute": webRTC.isStarted && webRTC.peerId == this_person.id,
               "person": this_person
            };
            if($('#collab-videoPanel .video-people-list [data-id="' + this_person.id + '"]').length <= 0){
               $('#collab-videoPanel .video-people-list').append(gisportal.templates['collaboration-person-remote'](them_data));
            }
            $('#collab-videoPanel .video-people-list [data-id="' + this_person.id + '"]').find('.js-video-mute-toggle').toggleClass('hidden', !them_data.show_mute);
            $('#collab-videoPanel .video-people-list [data-id="' + this_person.id + '"]').find('.js-webrtc-call').toggleClass('hidden', !them_data.show_call);
         }else if(this_person){
            $('#collab-videoPanel .video-people-list [data-id="' + this_person.id + '"]').remove();
         }
      }
      if(collaboration.role == 'presenter' || collaboration.owner){
         if(presenter != id && divergents.indexOf(id) == -1 && $(this).parent().is('.panel-container-solid-backdrop')){
            link = $('<span class="js-make-presenter collab-btn icon-profile-4 pull-right" title="' + title + '" data-id="' + id + '"></span>');
            $(this).prepend(link);
         }
      }

      $(this).find('.js-collab-diverge').on('click', function(){
         collaboration._emit('room.diverge', socket.io.engine.id, force=true);
      });

      $(this).find('.js-collab-merge').on('click', function(){
         collaboration._emit('room.merge', socket.io.engine.id, force=true);
      });

      $(this).find('.js-make-presenter').click(function() {
         var id = $(this).data('id');
         collaboration._emit('room.make-presenter', id, force = true);
      });
   });

   if(me_selectors.length > 0){
      // Makes sure that your person div(s) is at the top of the list
      for(var i in me_selectors){
         var parent_selector = me_selectors[i].parent();
         if(parent_selector.hasClass('panel-container-solid-backdrop')){
            me_selectors[i].detach().insertAfter(parent_selector.children('p'));
         }
      }
   }

   $('.js-webrtc-call').on('click', function() {
      webRTC.isInitiator = true;
      $('.js-webrtc-call').toggleClass('hidden', true);
      webRTC.peerId = $(this).parent().data('id');
      maybeStart();
      var data = {
         "callee": $(this).parent().find('p').html()
      };
      var rendered = gisportal.templates['webrtc-outbound-call'](data);
      gisportal.showModalMessage(rendered, 20000);
      $('.accpet-reject-buttons .js-end-webrtc-call').one('click', function(e){
         $('.collaboration-panel .js-end-webrtc-call').trigger('click');
      });
   });

   $('.js-toggle-webcam').off('click');
   $('.js-toggle-webcam').on('click', function() {
      var localStreams = webRTC.peerConn.getLocalStreams()[0];
      var button = $('.js-toggle-webcam');
      var video = localStreams.getVideoTracks()[0];
      video.enabled = !video.enabled;
      
      if (video.enabled) {
         button.attr('title', 'Disable Webcam');
         button.toggleClass('off-btn', false).toggleClass('on-btn', true);
      } else {
         button.attr('title', 'Enable Webcam');
         button.toggleClass('off-btn', true).toggleClass('on-btn', false);
      }
   });

   $('.js-toggle-microphone').off('click');
   $('.js-toggle-microphone').on('click', function() {
      var localStreams = webRTC.peerConn.getLocalStreams()[0];
      var button = $('.js-toggle-microphone');
      var mic = localStreams.getAudioTracks()[0];
      mic.enabled = !mic.enabled;

      if (mic.enabled) {
         button.attr('title', 'Disable Microphone');
         button.toggleClass('off-btn', false).toggleClass('on-btn', true);
      } else {
         button.attr('title', 'Enable Microphone');
         button.toggleClass('off-btn', true).toggleClass('on-btn', false);
      }
   });

   $('.js-end-webrtc-call').off('click');
   $('.js-end-webrtc-call').on('click', function() { 
      hangup();
   });
   collaboration.addVideoActionListeners();
};

collaboration.showVideoButtons = function(){
   $('li[data-id="' + webRTC.peerId + '"] .collaboration-video, li[data-id="' + socket.io.engine.id + '"] .collaboration-video').toggleClass('hidden', false);
   $('li[data-id="' + webRTC.peerId + '"] .in-call-button, li[data-id="' + socket.io.engine.id + '"] .in-call-button').toggleClass('hidden', !webRTC.isStarted);
   if(!webRTC.hasAudio || webRTC.isStarted){
      $('.js-toggle-microphone').toggleClass('hidden', true);
   }
   if(!webRTC.hasVideo){
      $('.js-toggle-webcam').toggleClass('hidden', true);
   }
   if(!webRTC.peerMedia || !webRTC.isStarted || !webRTC.peerMedia.audio){
      $('.js-video-mute-toggle').toggleClass('hidden', true);
   }
};

collaboration.divergeAlert = function(){
   var pulltab = $('.show-collaboration');
   var panel = $('.collaboration-panel');
   var person = panel.find('#collab-homePanel div[data-id="' + socket.io.engine.id + '"]');
   gisportal.panels.showPanel('collab-home');
   pulltab.toggleClass('hidden', true);
   panel.toggleClass('hidden', false);
   person.find('.person-message').remove();
   person.append('<p class="person-message">Click \'<span class="icon-link-broken-1"></span>\' to diverge from the room</p>');
   person.find('p.person-message').on('click', function(){
      $(this).remove();
   });
   collaboration.highlightElementPulse($('.collaboration-panel .js-collab-diverge'));
};

// This is the function that actually sends the message if the collaboration is active and the user is the presenter
collaboration._emit = function(cmd, params, force) {
	if (collaboration.active && (collaboration.role == "presenter" || force)) {
		socket.emit(cmd, params);	
	}
};

collaboration.userAuthorised = function() {
	console.log('user authorised');
	
	// add the collaboration template into the mix...
	var rendered = gisportal.templates.collaboration();
   $('.js-collaboration-holder').html('');
   $('#collaborationPanel .js-collaboration-holder').html(rendered); 
	
   collaboration.initSession();
   if(gisportal.config.collaborationFeatures.enabled){
      collaboration.initDOM();
   }
   gisportal.user.initDOM();
 	return true;
};

collaboration.log = function(msg) {
   if (collaboration.displayLog) {
      var notificationText = $(".notifyjs-gisportal-collab-notification-base div.title");

      $('.history-log').prepend("<p>" + msg + "</p>");
      $('.history-log :nth-child(20)').remove();
   }
};

collaboration.nameOrAvatar = function(name, img){
   if(img){
      name = '<img src="' + img + '" class="avatar-small" title="' + name + '"/>';
   }
   return name;
};

collaboration.highlightElement = function(element) {
   element.addClass('highlight-click');
   setTimeout(function() { element.removeClass('highlight-click'); }, 1000);
};

collaboration.highlightElementShake = function(element) {
   if(!element.hasClass('highlight-shake')){
   element.addClass('highlight-shake');
   setTimeout(function() { element.removeClass('highlight-shake'); }, 1000);
}
};

collaboration.highlightElementShakeUp = function(element) {
   if(!element.hasClass('highlight-shake-up')){
      element.addClass('highlight-shake-up');
      setTimeout(function() { element.removeClass('highlight-shake-up'); }, 1000);
   }
};

collaboration.highlightElementPulse = function(element) {
   if(element.hasClass('pulse-attention')){
      return;
   }
   element.addClass('pulse-attention');
   setTimeout(function() { element.removeClass('pulse-attention'); }, 2000);
};

collaboration.setStatus = function(icon, message) {

   var statusMsg = gisportal.templates['collaboration-status'];
   $('.collaboration-status').toggleClass('hidden', false).html(statusMsg);
   
   if (icon == 'connected') {
      $(collaboration.statusIcon).toggleClass('error', false);
      $(collaboration.statusIcon).toggleClass('warning', false);
      $(collaboration.statusIcon).toggleClass('connected', true);
   }
   if (icon == 'error') {
      $(collaboration.statusIcon).toggleClass('error', true);
      $(collaboration.statusIcon).toggleClass('warning', false);
      $(collaboration.statusIcon).toggleClass('connected', false);
   }
   if (icon == 'warning') {
      $(collaboration.statusIcon).toggleClass('error', false);
      $(collaboration.statusIcon).toggleClass('warning', true);
      $(collaboration.statusIcon).toggleClass('connected', false);
   }
   $(collaboration.statusMessage).html(message);
};

collaboration.getMinimumExtent = function(people){
   var width, height;
   for (var p in people) {
      var person = people[p];
      if(!person.diverged){
         if(!width || width > person.mapSize[0]){
            width = person.mapSize[0];
         }
         if(!height || height > person.mapSize[1]){
            height = person.mapSize[1];
         }
      }
   }
   return [width, height];
};
