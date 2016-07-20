
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

         socket.on('room.presenter-state-update', function(data) {
            var state = data.params.state;
            if (collaboration.role == "member" && data.params['joining-member'] == gisportal.user.info.email) {
               gisportal.stopLoadState = false;
               gisportal.loadState(state);
            }
         });

 		  	// -------------------------------------------------
    		// socket collaboration event functions
    		// -------------------------------------------------

         socket.on('configurepanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['configurepanel.scroll'](data);
            }
         });

         socket.on('mapsettingspanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['mapsettingspanel.scroll'](data);
            }
         });

         socket.on('addLayersForm.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.scroll'](data);
            }
         });

         socket.on('slideout.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['slideout.scroll'](data);
            }
         });

         socket.on('refinePanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['refinePanel.scroll'](data);
            }
         });

         socket.on('addLayerServer.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayerServer.clicked'](data, {highlight: true});
            }
         });

         socket.on('addLayersForm.input', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.input'](data, {highlight: true});
            }
         });

         socket.on('addLayersForm.autoScale-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.autoScale-changed'](data, {highlight: true});
            }
         });

         socket.on('addLayersForm.aboveMaxColor-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.aboveMaxColor-changed'](data, {highlight: true});
            }
         });

         socket.on('addLayersForm.belowMinColor-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.belowMinColor-changed'](data, {highlight: true});
            }
         });

         socket.on('addLayersForm.defaultStyle-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.defaultStyle-changed'](data, {highlight: true});
            }
         });

         socket.on('addLayersForm.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['addLayersForm.close'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.close'](data);
            }
         });

         socket.on('body.keydown', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['body.keydown'](data);
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['body.keydown'](data, {describeOnly: true}));
         });

         socket.on('date.selected', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['date.selected'](data, {highlight: true});
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['date.selected'](data, {describeOnly: true}));
         });

         socket.on('date.zoom', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['date.zoom'](data, {highlight: true});
            }
         });

         socket.on('ddslick.open', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['ddslick.open'](data, {highlight: true});
            }
         });

         socket.on('ddslick.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['ddslick.open'](data, {highlight: true});
            }
         });

         socket.on('ddslick.selectValue', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['ddslick.selectValue'](data, {highlight: true});
            }
         });

         socket.on('view.loaded', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['view.loaded'](data);
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['view.loaded'](data, {describeOnly: true}));
         });

         socket.on('view.removed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['view.removed'](data);
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['view.removed'](data, {describeOnly: true}));
         });

   	  	socket.on('indicatorspanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['indicatorspanel.scroll'](data);
            }
         });

         // layer hidden
         socket.on('layer.hide', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['layer.hide'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['layer.hide'](data, {highlight: true});
            }
         });

         // panel hidden
         socket.on('panel.hide', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['panel.hide'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['panel.hide'](data);
            }
         });

         // panel shown
         socket.on('panel.show', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['panel.hide'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['panel.show'](data);
            }
         });

         // layer selected
		  	socket.on('layer.remove', function(data) {
            if(collaboration.diverged){
               return true;
            }
		  		collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['layer.remove'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
            	gisportal.api['layer.remove'](data);
            }
		  	});

         // layer order changed
         socket.on('layer.reorder', function(data) {
            if(collaboration.diverged){
               return true;
            }

            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['layer.reorder'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['layer.reorder'](data);
            }
         });

         // layer shown
		  	socket.on('layer.show', function(data) {
            if(collaboration.diverged){
               return true;
            }
		  		collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' ' + gisportal.api['layer.show'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['layer.show'](data, {highlight: true});
            }
		  	});
                        
         // map Move
         socket.on('map.move', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['map.move'](data);
            }
         });

         // panel selected/shown
         socket.on('panels.showpanel', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['panels.showpanel'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['panels.showpanel'](data, {highlight: true});
            }
         });

         socket.on('refinePanel.cancel', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['refinePanel.cancel'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['refinePanel.cancel'](data);
            }
         });

         socket.on('refinePanel.removeCat', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['refinePanel.removeCat'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['refinePanel.removeCat'](data);
            }
         });

		  	// autoscale
         socket.on('scalebar.autoscale', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
            	gisportal.api['scalebar.autoscale'](data);
            }
		  	});

         // autoscale checkbox clicked
         socket.on('scalebar.autoscale-checkbox', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['scalebar.autoscale-checkbox'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['scalebar.autoscale-checkbox'](data, {highlight: true});
            }
         });

         // Logarithmis checkbox clicked
         socket.on('scalebar.log-set', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['scalebar.log-set'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['scalebar.log-set'](data, {highlight: true});
            }
         });

         // Maximum scalebar value set
         socket.on('scalebar.max-set', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['scalebar.max-set'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['scalebar.max-set'](data, {highlight: true});
            }
         });

         // Minimum scalebar value set
         socket.on('scalebar.min-set', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['scalebar.min-set'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['scalebar.min-set'](data, {highlight: true});
            }
         });

         // Layer opacity value changed
         socket.on('scalebar.opacity', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['scalebar.opacity'](data, {highlight: true});
            }
         });

         // Layer colorbands value changed
         socket.on('scalebar.colorbands', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['scalebar.colorbands'](data, {highlight: true});
            }
         });

         // reset scalebar
         socket.on('scalebar.reset', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['scalebar.reset'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['scalebar.reset'](data, {highlight: true});
            }
         });

         // apply changes
         socket.on('scalebar.apply-changes', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['scalebar.apply-changes'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['scalebar.reset'](data, {highlight: true});
            }
         });

         // search value changed
         socket.on('search.typing', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.api['search.typing'](data, {highlight: true});
            }
         });

         // wms value changed
         socket.on('wms.typing', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['wms.typing'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['wms.typing'](data, {highlight: true});
            }
         });

         // refresh cache value changed
         socket.on('refreshCacheBox.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['refreshCacheBox.clicked'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['refreshCacheBox.clicked'](data, {highlight: true});
            }
         });

         // wms submitted
         socket.on('wms.submitted', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['wms.submitted'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['wms.submitted'](data, {highlight: true});
            }
         });

         // more info clicked
         socket.on('moreInfo.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['moreInfo.clicked'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['moreInfo.clicked'](data, {highlight: true});
            }
         });

         // reset list clicked
         socket.on('resetList.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['resetList.clicked'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['resetList.clicked'](data, {highlight: true});
            }
         });

         // add layers form clicked
         socket.on('addLayersForm.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' ' + gisportal.api['addLayersForm.clicked'](data, {describeOnly: true}));
            if (collaboration.role == "member") {
               gisportal.api['addLayersForm.clicked'](data, {highlight: true});
            }
         });

         // search value changed
         socket.on('search.resultselected', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var searchResult = data.params.searchResult;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' search result selected: ' + searchResult);
            if (collaboration.role == "member") {
               gisportal.configurePanel.toggleIndicator(searchResult, '');
               $('.js-search-results').css('display', 'none');
            }
         });

        // Layer tab selected
         socket.on('tab.select', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var layerId = data.params.layerId;
            var tabName = data.params.tabName;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' ' + tabName + ' tab selected for ' + layerId);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]'));
               gisportal.indicatorsPanel.selectTab( layerId, tabName );
            }
         });

        // Layer tab closed
         socket.on('layerTab.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var layerId = data.params.layerId;
            var tabName = data.params.tabName;
            if (collaboration.role == "member") {
               var tab_elem = $('[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]');
               var button_elem = $('#'+$(tab_elem).attr('for'));
               button_elem.removeAttr('checked');
               tab_elem.removeClass('active');
            }
         });

         socket.on('paginator.selected', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Page ' + data.params.page + ' selected');
            if (collaboration.role == "member") {
               $('.js-go-to-form-page').find('a[data-page="' + data.params.page + '"]').trigger('click');
            }
         });

         socket.on('zoomToData.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.layer;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Zoom to data clicked: ' + id);
            if (collaboration.role == "member") {
               var zoom_elem = $('.js-zoom-data[data-id="' + id + '"]');
               collaboration.highlightElement(zoom_elem);
               zoom_elem.trigger('click');
            }
         });

         socket.on('submitLayers.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Submit Layers" clicked');
            if (collaboration.role == "member") {
               var submit_elem = $('.js-layers-form-submit');
               collaboration.highlightElement(submit_elem);
               submit_elem.trigger('click');
            }
         });

         socket.on('cancelChanges.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Cancel Changes" clicked');
            if (collaboration.role == "member") {
               $('.js-layers-form-cancel').trigger('click');
            }
         });

         socket.on('toggleAllLayers.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Copy to all" clicked');
            if (collaboration.role == "member") {
               var toggle_all_elem = $('.toggle-all-layers');
               collaboration.highlightElement(toggle_all_elem);
               toggle_all_elem.trigger('click');
            }
         });

         socket.on('logToAllLayers.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Add to all" clicked');
            if (collaboration.role == "member") {
               var toggle_all_elem = $('.log-to-all-layers');
               collaboration.highlightElement(toggle_all_elem);
               toggle_all_elem.trigger('click');
            }
         });

         socket.on('addToAll.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Add to all" clicked');
            if (collaboration.role == "member") {
               var field = data.params.field;
               var add_to_all_elem = $('.add-to-all-layers[data-field="' + field + '"]');
               collaboration.highlightElement(add_to_all_elem);
               add_to_all_elem.trigger('click');
            }
         });

         socket.on('addScalePointsToAll.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Add Scale Points to all" clicked');
            if (collaboration.role == "member") {
               var add_to_all_elem = $('.scale-to-all-layers');
               collaboration.highlightElement(add_to_all_elem);
               add_to_all_elem.trigger('click');
            }
         });

         socket.on('addTagInput.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Add Another Tag" clicked');
            if (collaboration.role == "member") {
               var add_tag_elem = $('.add-tag-input');
               collaboration.highlightElement(add_tag_elem);
               add_tag_elem.trigger('click');
            }
         });

         socket.on('userFeedback.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' User feedback closed');
            if (collaboration.role == "member") {
               $('.js-user-feedback-close').trigger('click');
            }
         });

         socket.on('userFeedback.submit', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' User feedback submitted');
            if (collaboration.role == "member") {
               $('.js-user-feedback-submit').trigger('click');
            }
         });

         socket.on('userFeedback.input', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var input = data.params.inputValue;
               var input_elem = $('.user-feedback-input');
               input_elem.val(input);
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('drawBox.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Draw Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-draw-box');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('drawPolygon.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Draw Irregular Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-draw-polygon');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('selectPolygon.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Select Existing Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-draw-select-polygon');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('removeGeoJSON.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Delete Selected Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-remove-geojson');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('jsCoordinate.edit', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var eType = data.params.eventType;
            var value = data.params.value;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Coordinates value set to: "' + value + '"');
            if (collaboration.role == "member") {
               var input_elem = $('.js-coordinates');
               input_elem.val(value);
               input_elem.trigger(eType);
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('clearSelection.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Clear Selection" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-clear-selection');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('olDraw.click', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var coordinate = data.params.coordinate;
            if (collaboration.role == "member") {
               gisportal.drawingPoints.push(coordinate);

               // Makes sure that this is not the last (completion) click
               var drawOverlay = true;
               if(gisportal.vectorLayer.getSource().getFeatures().length > 0){
                  drawOverlay = false;
               }

               gisportal.drawingOverlaySource.clear();
               var geom;
               if(gisportal.drawingPoints.length === 2){
                  // Only if drawing a polygon
                  if($('.js-draw-polygon').hasClass('drawInProgress')){
                     geom = new ol.geom.LineString(gisportal.drawingPoints);
                  }
               }
               if(gisportal.drawingPoints.length > 2){
                  var polygon_array = _.clone(gisportal.drawingPoints);
                  polygon_array.push(polygon_array[0]);
                  geom = new ol.geom.Polygon([polygon_array]);
               }
               if(geom && drawOverlay){
                  gisportal.drawingOverlaySource.addFeature(new ol.Feature({geometry:geom}));
               }
               for(var point in gisportal.drawingPoints){
                  gisportal.drawingOverlaySource.addFeature(new ol.Feature({geometry:new ol.geom.Point(gisportal.drawingPoints[point])}));
               }
            }
         });

         socket.on('olDraw.drawstart', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.vectorLayer.getSource().clear();
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
            }
         });

         socket.on('olDraw.drawend', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var coordinates = data.params.coordinates;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Polygon drawn');
            if (collaboration.role == "member") {
               var sketch = new ol.Feature({geometry:new ol.geom.Polygon(coordinates)});
               gisportal.selectionTools.ROIAdded(sketch);
               gisportal.vectorLayer.getSource().addFeature(sketch);
            }
         });

         socket.on('selectPolygon.hover', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var coordinate = data.params.coordinate;
            var id = data.params.id;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Polygon hover: ' + id);
            if (collaboration.role == "member") {
               var pixel = map.getPixelFromCoordinate(coordinate);
               var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                  // Gets the first vector layer it finds
                  if(feature.getKeys().length !== 1 && feature.getId() && feature.getId() == id){
                     return feature;
                  }
               });
               gisportal.hoverFeature(feature);
            }
         });

         socket.on('selectPolygon.select', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var coordinate = data.params.coordinate;
            var id = data.params.id;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Polygon selected: ' + id);
            if (collaboration.role == "member") {
               var pixel = map.getPixelFromCoordinate(coordinate);
               var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                  // Gets the first vector layer it finds
                  if(feature.getKeys().length !== 1 && feature.getId() && feature.getId() == id){
                     return feature;
                  }
               });
               gisportal.selectFeature(feature);
            }
         });

         socket.on('coordinates.save', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Save Coordinates clicked');
            if (collaboration.role == "member") {
               $('.js-add-coordinates-to-profile').trigger('click');
            }
         });

         socket.on('featureOverlay.removeType', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var overlayType = data.params.overlayType;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Remove ' + overlayType);
            if (collaboration.role == "member") {
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, overlayType);
            }
         });

         socket.on('dataPopup.display', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var pixel = map.getPixelFromCoordinate(data.params.coordinate);
            if (collaboration.role == "member") {
               gisportal.displayDataPopup(pixel);
            }
         });

         socket.on('dataPopup.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               gisportal.dataReadingPopupCloser.click();
            }
         });

         socket.on('newPlot.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Make new graph" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-make-new-plot[data-id="' + id + '"]');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('addToPlot.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Add to graph" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-add-to-plot[data-id="' + id + '"]');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('graphs.deleteActive', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Closed Plot');
            if (collaboration.role == "member") {
               gisportal.graphs.deleteActiveGraph();
            }
         });

         socket.on('slideout.togglePeak', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var slideoutName = data.params.slideoutName;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Show panel: ' + slideoutName);
            if (collaboration.role == "member") {
               var clicked_elem = $('[data-slideout-name="' + slideoutName + '"] .js-slideout-toggle-peak');
               gisportal.panelSlideout.togglePeak(slideoutName);
               collaboration.highlightElement(clicked_elem);
            }
         });

         socket.on('slideout.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var slideoutName = data.params.slideoutName;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Close panel: ' + slideoutName);
            if (collaboration.role == "member") {
               var clicked_elem = $('[data-slideout-name="' + slideoutName + '"] .js-slideout-close');
               gisportal.panelSlideout.closeSlideout(slideoutName);
               collaboration.highlightElement(clicked_elem);
            }
         });

         socket.on('more-info.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.layerId;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' More Info: ' + id);
            if (collaboration.role == "member") {
               var clicked_elem = $('.show-more[data-id="' + id + '"]').trigger('click');
               collaboration.highlightElement(clicked_elem);
            }
         });

         socket.on('graphTitle.edit', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = data.params.value;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Title value set to: "' + value + '"');
            if (collaboration.role == "member") {
               var input_elem = $('.js-active-plot-title');
               input_elem.val(value);
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('graphType.edit', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = data.params.value;
            var input_elem = $('.js-active-plot-type');
            var nice_val = input_elem.find('[value="' + value + '"]').html() || value;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Graph type set to: "' + nice_val + '"');
            if (collaboration.role == "member") {
               input_elem.val(value);
               input_elem.trigger('change');
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('layerDepth.change', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = data.params.value;
            var input_elem = $('.js-analysis-elevation');
            var nice_val = input_elem.find(':selected').html() || value;
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Layer Depth set to: "' + nice_val + '"');
            if (collaboration.role == "member") {
               input_elem.val(value);
               input_elem.trigger('change');
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('graphRange.change', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = data.params.value;
            var start_date_elem = $('.js-active-plot-start-date');
            var end_date_elem = $('.js-active-plot-end-date');
            var slider_elem = $('.js-range-slider');
            var dates = value.map(Number).map(function(stamp){ return new Date(stamp).toISOString().split("T")[0];});
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Graph date range set to: "' + dates.join(' - ') + '"');
            if (collaboration.role == "member") {
               start_date_elem.val(dates[0]);
               start_date_elem.trigger('change');
               end_date_elem.val(dates[1]);
               end_date_elem.trigger('change');
               slider_elem.val(value);
               collaboration.highlightElement(slider_elem);
            }
         });

         socket.on('graphComponent.remove', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var index = data.params.index;
            var tr_elem = $('.js-components tr:eq(' + index + ')');
            var title = tr_elem.find('td span').html() || "Component";
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' ' + title + ' removed"');
            if (collaboration.role == "member") {
               var del_elem = tr_elem.find('.js-close-acitve-plot-component');
               del_elem.trigger('click');
            }
         });

         socket.on('graphComponent.axisChange', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var index = data.params.index;
            var value = data.params.value;
            var tr_elem = $('.js-components tr:eq(' + index + ')');
            var title = tr_elem.find('td span').html() || "Component";
            var select_elem = tr_elem.find('.js-y-axis');
            if (collaboration.role == "member") {
               select_elem.val(value);
               select_elem.trigger('click');
               collaboration.highlightElement(select_elem);
            }
            var select_value = select_elem.find("option:selected").text();
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' ' + title + ': axis changed to "' + select_value);
         });

         socket.on('graphStartDate.change', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = new Date(data.params.value).toISOString().split("T")[0];
            var date_elem = $('.js-active-plot-start-date');
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Graph start date set to: "' + value + '"');
            if (collaboration.role == "member") {
               date_elem.val(value);
               date_elem.trigger('change');
               collaboration.highlightElement(date_elem);
            }
         });

         socket.on('graphEndDate.change', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = new Date(data.params.value).toISOString().split("T")[0];
            var date_elem = $('.js-active-plot-end-date');
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' Graph end date set to: "' + value + '"');
            if (collaboration.role == "member") {
               date_elem.val(value);
               date_elem.trigger('change');
               collaboration.highlightElement(date_elem);
            }
         });

         socket.on('graph.submitted', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) +' "Create Graph" clicked');
            if (collaboration.role == "member") {
               $('.js-create-graph').trigger('click');
            }
         });

         socket.on('graph.open', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var hash = data.params.hash;
            var open_elem = $('.js-graph-status-open[data-hash="' + hash + '"]');
            var title = open_elem.data('title');
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' "' + title + '": "Open" clicked');
            if (collaboration.role == "member") {
               open_elem.trigger('click');
            }
         });

         socket.on('graph.copy', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var hash = data.params.hash;
            var copy_elem = $('.js-graph-status-copy[data-hash="' + hash + '"]');
            var title = copy_elem.data('title');
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' "' + title + '": "Copy/Edit" clicked');
            if (collaboration.role == "member") {
               copy_elem.trigger('click');
            }
         });

         socket.on('graph.delete', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var hash = data.params.hash;
            var delete_elem = $('.js-graph-status-delete[data-hash="' + hash + '"]');
            var title = delete_elem.data('title') || "Graph";
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' "' + title + '": "Delete" clicked');
            if (collaboration.role == "member") {
               delete_elem.trigger('click');
            }
         });

         socket.on('graphPopup.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(collaboration.nameOrAvatar(data.presenter, data.image) + ' Plot closed');
            if (collaboration.role == "member") {
               collaboration.forcePopupClose = true;
               $('.js-plot-popup-close').trigger('click');
            }
         });

         // User saved state
         socket.on('setSavedState', function(data) {
            
            collaboration.log('State restored');
            if (collaboration.role == "member") {
               map.zoomToScale(data.params.zoomlevel);
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
}; // end initSession
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

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

collaboration.setUserSavedState = function() {
	var params = gisportal.saveState();
	console.log(params);
	collaboration._emit('setSavedState', params);
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
