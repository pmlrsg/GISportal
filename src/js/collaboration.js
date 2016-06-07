
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
   collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false; // indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible

   if(!collaboration.enabled){
      return;
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
   var maxWidth = parseInt($(document).width()*0.48);
   $('.main-collaboration-video').draggable({containment: "document"});
   $('.video-div').resizable({containment: "document", "aspectRatio": true, "minWidth": 130, "maxWidth": maxWidth, handles:"se"});
   $('#remoteVideo, #localVideo').on('dblclick', function(){
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

   var idleMouseTimer = {};
   var forceControlsDivHide = {'remoteVideo':false, 'localVideo': false};
   $(".display-div").off('mousemove click');
   $(".display-div").on('mousemove click', function(ev) {
      var id = $(this).find('video').attr('id');
      var controls = $(this).find('.video-controls');
      if(!forceControlsDivHide[id]) {
         clearTimeout(idleMouseTimer[id]);
         if(!controls.hasClass('fadeIn')){
            controls.toggleClass('fadeIn', true).toggleClass('hidden', false).toggleClass('fadeOut', false);
         }
         idleMouseTimer[id] = setTimeout(function() {
            if(!controls.hasClass('fadeOut')){
               controls.toggleClass('fadeOut', true).toggleClass('fadeIn', false);
            }

            forceControlsDivHide[id] = true;
            setTimeout(function() {
               forceControlsDivHide[id] = false;
            }, 200);
         }, 1000);
      }
   });
   $(".collab-videos-minimize").off('click');
   $(".collab-videos-minimize").on('click', function(ev) {
      $('.main-collaboration-video').toggleClass('overlay-minimized', true)
         .toggleClass('overlay-maximized', false)
         .attr('title', "Click to Maximize")
         .draggable('destroy');

      // Makes sure it is not activated straight away.
      setTimeout(function(){
         $('.main-collaboration-video.overlay-minimized').off('click');
         // Makes sure that it is only called once
         $('.main-collaboration-video.overlay-minimized').one('click', function(){
            $('.main-collaboration-video').toggleClass('overlay-minimized', false)
               .toggleClass('overlay-maximized', true)
               .attr('title', "")
               .draggable({containment: "document"});
            setTimeout(function(){
               $('.main-collaboration-video').toggleClass('overlay-maximized', false);
            }, 500);
         });
      },200);

   });
   collaboration.addVideoActionListeners();
};

collaboration.addVideoActionListeners = function(){
   $('.js-video-fullscreen').on('click', function(){
      var video = $(this).closest('.display-div').find('video');
      video.fullScreen();
   });
   $('.js-video-mute-toggle').on('click', function(){
      var video = $(this).closest('.display-div').find('video');
      var muted = video.is('[muted]');
      if(muted){
         // Make sure this actually mutes and unmuted the videos
         video[0].removeAttribute('muted');
         $(this).toggleClass("icon-volume-medium-1", true).toggleClass("icon-volume-mute-1", false).attr('title', "Mute");
      }else{
         video[0].setAttribute('muted', true);
         $(this).toggleClass("icon-volume-mute-1", true).toggleClass("icon-volume-medium-1", false).attr('title', "Un-mute");
      }
   });
};



collaboration.initSession = function() {

	// get the socket.io script and open a connection
	$.getScript(gisportal.middlewarePath + "/socket.io/")
		.done(function( script, textStatus ) {
         socket = io.connect('/', {
		   	"connect timeout": 1000
		  	});

         $('.collaboration-pulltab').off('click').toggleClass('open', false);
         $('.collaboration-pulltab').on('click', function(){
            var pulltab = $(this);
            var panel = $('.collaboration-panel');
            if(pulltab.hasClass('open')){
               pulltab.toggleClass('open', false);
               panel.toggleClass('hidden', true);
            }else{
               pulltab.toggleClass('open', true);
               panel.toggleClass('hidden', false);
               if($('.messages').scrollTop() + $('.messages').innerHeight() >= $('.messages')[0].scrollHeight){
                  gisportal.pageTitleNotification.Off();
               }
            }
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
            $('.js-collab-message').html('Room '+ data.toUpperCase() +' does not exist, please try again.');
         });
         
         socket.on('room.created', function(data) {
		  		var roomId = data.roomId;
            console.log('Room created: '+ data.roomId);
		  		collaboration.roomId = data.roomId;
            
            collaboration.setStatus('connected', 'Connected. You are the presenter of room '+ data.roomId.toUpperCase());
            $('.collab-overlay').toggleClass('hidden', true);
            collaboration.owner = true;
            collaboration.log("Welcome to collaboration " + data.owner);

            // load the room template
            collaboration.buildMembersList(data);
		  	});

         socket.on('room.member-joined', function(data) {
            // is this confirmation that I have joined?
            if (data.sessionId == socket.io.engine.id) { // yes, so set the role, status and show the room details
               collaboration.roomId = data.roomId;
               collaboration.role = 'member';
               collaboration.setStatus('connected', 'Connected. You are in room '+ data.roomId.toUpperCase());
               $('.collab-overlay').toggleClass('hidden', false);
            }

            // if I am the presenter send my state so that the new member can catch up
            if (collaboration.role == 'presenter') {
               if(gisportal.panels.activePanel != "refine-indicator"){
                  $('.dd-container').ddslick('close');
               }
               var state = gisportal.saveState();
               var params = {
                  "event": "room.presenter-state-update",
                  "state": state,
                  "joining-member": data.user.email
               };
               collaboration._emit('c_event', params);
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
               collaboration.log(name + " has joined.");
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
               collaboration.log(data.divergent + " has diverged from your room");
            }
            collaboration.buildMembersList(data);
         });

         socket.on('room.member-merged', function(data) {
            if (collaboration.role == 'presenter') {
               if(gisportal.panels.activePanel != "refine-indicator"){
                  $('.dd-container').ddslick('close');
               }
               var state = gisportal.saveState();
               var params = {
                  "event": "room.presenter-state-update",
                  "state": state,
                  "joining-member": data.email
               };
               collaboration._emit('c_event', params);
               collaboration.log(data.merger + " has merged back with your room");
            }else{
               for (var p in data.people) {
                  var person = data.people[p];
                  if (!person.diverged && person.id == socket.io.engine.id) {
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
            message_data.message = data.message;
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
                  var this_person = data.people[person];
                  if(!me){
                     message_data.email = this_person.name || this_person.email;
                  }
                  message_data.image = this_person.image;
               }
            }
            var rendered = gisportal.templates['collaboration-message'](message_data);
            var showNotification = false;
            var collab_panel = $(".messages").closest('.collaboration-panel');
            var hidden = collab_panel.hasClass('hidden');
            var re_scroll = false;
            if(($(".messages").scrollTop() + $(".messages").innerHeight() >= $(".messages")[0].scrollHeight || me) && !$('.collaboration-panel').hasClass('hidden') &&  document.visibilityState == 'visible'){
               re_scroll = true;
            }else{
               // Need to make sure that the panel is not hidden to check if the messages has a scrollbar
               if(hidden){
                  collab_panel.toggleClass('hidden', false);
               }
               if(this.scrollHeight > this.clientHeight){
                  showNotification = true;
                  $(".messages").siblings(".new-message-popup").toggleClass('hidden', false);
               }
               if(hidden){
                  collab_panel.toggleClass('hidden', true);
               }
            }
            var last_message = $(".messages").find('div.outer-div:last');

            if(last_message.data('sender') == message_data.email){
               last_message.find('p').append('<br/>' + message_data.message);
            }else{
               $(".messages").append(gisportal.templates['collaboration-message'](message_data));
            }
            if(re_scroll){
               $(".messages").scrollTop($(".messages")[0].scrollHeight);
            }

            if(showNotification || document.visibilityState != 'visible' || $('.collaboration-panel').hasClass('hidden')){
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
               collaboration.log(data.departed +' has left the room');
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
                  collaboration.setStatus('connected', 'Connected. You are the presenter of room '+ data.roomId.toUpperCase());
                  gisportal.showModalMessage('You are now the presenter');
                  $('.collab-overlay').toggleClass('hidden', true);
               } else {
                  if(collaboration.role == "presenter"){
                     gisportal.showModalMessage('You are no longer the presenter');
                  }
                  collaboration.role = "member";
                  collaboration.setStatus('connected', 'Connected. You are in room '+ data.roomId.toUpperCase());
                  if(!collaboration.diverged){
                     $('.collab-overlay').toggleClass('hidden', false);
                  }
               }
            }
            var pName = presenter.name || presenter.email;
            collaboration.log("Presenter changed to " + pName);
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
               var div = $('#configurePanel');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('mapsettingspanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var div = $('#mapSettingsPanel');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('addLayersForm.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var div = $('.overlay-container-form');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('slideout.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var div = $('.js-slideout-content');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('refinePanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var div = $('.indicator-select');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('addLayerServer.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var layer = data.params.layer;
            var server = data.params.server;
            var add_elem = $('.js-add-layer-server[data-layer="' + layer + '"][data-server="' + server + '"]');
            if (collaboration.role == "member") {
               if(add_elem.length > 0){
                  collaboration.highlightElement(add_elem);
                  add_elem.trigger('click');
               }
            }
         });

         socket.on('addLayersForm.input', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var input = data.params.inputValue;
               var field = data.params.field;
               var input_elem = $('textarea[data-field="' + field + '"],input[data-field="' + field + '"]');
               var highlight_elem = input_elem;
               if(field == "Rotation"){
                  input_elem = input_elem.filter('[value="' + input + '"]');
                  highlight_elem = input_elem.parent();
               }else if(input_elem.is(':checkbox')){
                  input_elem.prop('checked', input);
               }else{
                  // Makes sure the element is only highlighted if there has been a change
                  if(input_elem.val() == input){
                     highlight_elem = undefined;
                  }
                  input_elem.val(input);
               }
               input_elem.trigger('change');
               if(highlight_elem){
                  collaboration.highlightElement(highlight_elem);
               }
            }
         });

         socket.on('addLayersForm.autoScale-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var select_elem = $('select[data-field="originalAutoScale"]');
               select_elem.val(data.params.value).trigger('change');
               collaboration.highlightElement(select_elem);
            }
         });

         socket.on('addLayersForm.aboveMaxColor-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var select_elem = $('select[data-field="defaultAboveMaxColor"]');
               select_elem.val(data.params.value).trigger('change');
               collaboration.highlightElement(select_elem);
            }
         });

         socket.on('addLayersForm.belowMinColor-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var select_elem = $('select[data-field="defaultBelowMinColor"]');
               select_elem.val(data.params.value).trigger('change');
               collaboration.highlightElement(select_elem);
            }
         });

         socket.on('addLayersForm.defaultStyle-changed', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var select_elem = $('select[data-field="defaultStyle"]');
               select_elem.val(data.params.value).trigger('change');
               collaboration.highlightElement(select_elem);
            }
         });

         socket.on('addLayersForm.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': Add Layers Form Closed');
            if (collaboration.role == "member") {
               $('span.js-layer-form-close').trigger('click');
            }
         });

         socket.on('body.keydown', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var keyCode = data.params.code;

            if (collaboration.role == "member") {
               var e = jQuery.Event("keydown");
               e.which = keyCode; // # Some key code value
               e.keyCode = keyCode;
               document.activeElement.blur();
               $('body').trigger(e);
            }
            var keyName;
            switch(keyCode){
               case 27:
                  keyName = "Esc";
                  break;
               case 37:
                  keyName = "LEFT Arrow";
                  break;
               case 39:
                  keyName = "RIGHT Arrow";
                  break;
            }
            collaboration.log(data.presenter +': Keydown: '+ keyName);
         });

         socket.on('date.selected', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var date = new Date(data.params.date);

            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-current-date'));
               if(gisportal.timeline && gisportal.timeline.timebars && gisportal.timeline.timebars.length > 0){
                  gisportal.timeline.setDate(date);
               }
            }
            collaboration.log(data.presenter +': Date changed to '+ moment(date).format('YYYY-MM-DD hh:mm'));
         });

         socket.on('date.zoom', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var startDate = new Date(data.params.startDate);
            var endDate = new Date(data.params.endDate);

            if (collaboration.role == "member") {
               collaboration.highlightElement($('#timeline'));
               if(gisportal.timeline && gisportal.timeline.timebars && gisportal.timeline.timebars.length > 0){
                  gisportal.timeline.zoomDate(startDate, endDate);
               }
            }
         });

         socket.on('ddslick.open', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var obj = $('#' + data.params.obj);
            if (collaboration.role == "member") {
               collaboration.highlightElement(obj);
               obj.ddslick('open');
            }
         });

         socket.on('ddslick.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var obj = $('#' + data.params.obj);
            if (collaboration.role == "member") {
               obj.ddslick('close');
            }
         });

         socket.on('ddslick.selectValue', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var obj = $('#' + data.params.obj);
            var value = data.params.value;
            if (collaboration.role == "member") {
               obj.ddslick('select', { "value": value });
            }
         });

   	  	socket.on('indicatorspanel.scroll', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
               var div = $('#indicatorsPanel');
               var scrollPercent = data.params.scrollPercent;
               // This stops the animation that scrolls to a layer
               div.trigger('mousewheel');
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         // layer hidden
         socket.on('layer.hide', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': Layer hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
               var id = data.params.id;
               gisportal.indicatorsPanel.hideLayer(id);
               collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
            }
         });

         // panel hidden
         socket.on('panel.hide', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': Panel hidden');
            if (collaboration.role == "member") {
               $('.js-hide-panel').trigger('click');
            }
         });

         // panel shown
         socket.on('panel.show', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': Panel shown');
            if (collaboration.role == "member") {
               $('.js-show-tools').trigger('click');
            }
         });

         // layer selected
		  	socket.on('layer.remove', function(data) {
            if(collaboration.diverged){
               return true;
            }
		  		collaboration.log(data.presenter +': Layer removed - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.indicatorsPanel.removeFromPanel(data.params.id);
            }
		  	});

         // layer order changed
         socket.on('layer.reorder', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var newLayerOrder = data.params.newLayerOrder;
            var ul = $('ul.js-indicators');

            collaboration.log(data.presenter +': Layers re-ordered: '+ newLayerOrder);
            if (collaboration.role == "member") {
               for (var i = newLayerOrder.length; i > -1; i--) {
                  var li = $('.indicator-header').parent('[data-id="'+ newLayerOrder[i] +'"]');
                  li.remove();                            // take it out of its current position 
                  ul.prepend(li).hide().slideDown();      // and put it back at the start of the list
               }
               gisportal.indicatorsPanel.reorderLayers();
            }
         });

         // layer shown
		  	socket.on('layer.show', function(data) {
            if(collaboration.diverged){
               return true;
            }
		  		collaboration.log(data.presenter +': Layer un-hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
               var id = data.params.id;
            	gisportal.indicatorsPanel.showLayer(id);
               collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
            }
		  	});
                        
         // map Move
         socket.on('map.move', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var params = data.params;
            if (collaboration.role == "member") {
               var view = map.getView();
               if (view) {
                  if (params.zoom) view.setZoom(params.zoom);
                  if (params.centre) view.setCenter(params.centre);
               }
            }
         });

         // panel selected/shown
         socket.on('panels.showpanel', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var p = data.params.panelName;
            var nicePanelName = data.params.panelName;
            var panel_div = $('.js-show-panel[data-panel-name="'+ nicePanelName +'"]');
            if(panel_div.find('span').length > 0){
               nicePanelName = panel_div.find('span').attr('title');
            }else if(panel_div.html() && panel_div.html().length > 0){
               nicePanelName = panel_div.html();
            }
            collaboration.log(data.presenter +': Panel selected - '+ nicePanelName);
            if (collaboration.role == "member") {
               collaboration.highlightElementShake($('[data-panel-name="' + p + '"].tab'));
               gisportal.panels.showPanel(p);
            }
         });

         socket.on('refinePanel.cancel', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': "Cancel" clicked');
            if (collaboration.role == "member") {
               $('.js-refine-configure').trigger('click');
            }
         });

         socket.on('refinePanel.removeCat', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var cat = data.params.cat;
            var nice_cat = gisportal.browseCategories[cat] || cat;
            collaboration.log(data.presenter +': Category removed: ' + nice_cat);
            if (collaboration.role == "member") {
               $('.refine-remove[data-cat="' + cat + '"]').trigger('click');
            }
         });

		  	// autoscale
         socket.on('scalebar.autoscale', function(data) {
            if(collaboration.diverged){
               return true;
            }
            if (collaboration.role == "member") {
            	gisportal.scalebars.autoScale(data.params.id, data.params.force);
            }
		  	});

         // autoscale checkbox clicked
         socket.on('scalebar.autoscale-checkbox', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            var isChecked = data.params.isChecked;
            collaboration.log(data.presenter +': Autoscale set to ' + isChecked + ' - '+ id);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-auto[data-id="' + id + '"]'));
               $('.js-auto[data-id="' + id + '"]').prop( 'checked', isChecked ).trigger('change');
            }
         });

         // Logarithmis checkbox clicked
         socket.on('scalebar.log-set', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            var isLog = data.params.isLog;
            collaboration.log(data.presenter +': Logarithmic set to ' + isLog + ' - '+ id);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-indicator-is-log[data-id="' + id + '"]'));
               $('.js-indicator-is-log[data-id="' + id + '"]').prop( 'checked', isLog ).trigger('change');
            }
         });

         // Maximum scalebar value set
         socket.on('scalebar.max-set', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            var value = data.params.value;
            collaboration.log(data.presenter +': Max set to ' + value + ' - '+ id);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-scale-max[data-id="' + id + '"]'));
               $('.js-scale-max[data-id="' + id + '"]').val(value).change();
            }
         });

         // Minimum scalebar value set
         socket.on('scalebar.min-set', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            var value = data.params.value;
            collaboration.log(data.presenter +': Min set to ' + value + ' - '+ id);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-scale-min[data-id="' + id + '"]'));
               $('.js-scale-min[data-id="' + id + '"]').val(value).change();
            }
         });

         // Layer opacity value changed
         socket.on('scalebar.opacity', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            var value = data.params.value;

            if (typeof value != 'undefined') {
               var opacity = value * 100;
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('#tab-' + id + '-opacity'));
                  
                  $('#tab-' + id + '-opacity').val(opacity);
                  gisportal.layers[id].setOpacity(value);
               }
            }
         });

         // Layer colorbands value changed
         socket.on('scalebar.colorbands', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.id;
            var value = data.params.value;

            if (typeof value != 'undefined') {
               var colorbands = value;
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('#tab-' + id + '-colorbands'));
                  collaboration.highlightElement($('#tab-' + id + '-colorbands-value'));
                  
                  $('#tab-' + id + '-colorbands-value').val(colorbands).trigger('change');
               }
            }
         });

         // reset scalebar
         socket.on('scalebar.reset', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': Scalebar was reset');
            if (collaboration.role == "member") {
               var elem = $('.js-reset[data-id="'+ data.params.id +'"]');
               collaboration.highlightElement(elem);
               elem.click();
            }
         });

         // apply changes
         socket.on('scalebar.apply-changes', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': Changes Applied');
            if (collaboration.role == "member") {
               var elem = $('.js-apply-changes[data-id="'+ data.params.id +'"]');
               collaboration.highlightElement(elem);
               elem.click();
            }
         });

         // search value changed
         socket.on('search.typing', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var searchValue = data.params.searchValue;
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-search'));
               $('.js-search').val(searchValue);
               gisportal.configurePanel.search(searchValue);
            }
         });

         // wms value changed
         socket.on('wms.typing', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var eType = data.params.eType;
            var typedValue = data.params.typedValue;
            collaboration.log(data.presenter +': WMS entry: ' + typedValue);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('input.js-wms-url'));
               $('input.js-wms-url').val(typedValue).trigger(eType);
            }
         });

         // refresh cache value changed
         socket.on('refreshCacheBox.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var checked = data.params.checked;
            collaboration.log(data.presenter +': refreshCacheBox: ' + checked);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('#refresh-cache-box'));
               $('#refresh-cache-box')[0].checked = checked;
            }
         });

         // wms submitted
         socket.on('wms.submitted', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': WMS submitted');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('button.js-wms-url'));
               $('button.js-wms-url').trigger('click');
            }
         });

         // more info clicked
         socket.on('moreInfo.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': more info clicked');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.more-info'));
               $('.more-info').trigger('click');
            }
         });

         // reset list clicked
         socket.on('resetList.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': "Reset" clicked');
            if (collaboration.role == "member") {
               $('button#reset-list').trigger('click');
            }
         });

         // add layers form clicked
         socket.on('addLayersForm.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': "Add layers" clicked');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('button#js-add-layers-form'));
               $('button#js-add-layers-form').trigger('click');
            }
         });

         // search cancelled
         socket.on('search.cancel', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': search cancelled');
            if (collaboration.role == "member") {
               $('.js-search-results').css('display', 'none');
            }
         });

         // search value changed
         socket.on('search.resultselected', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var searchResult = data.params.searchResult;
            collaboration.log(data.presenter +': search result selected: ' + searchResult);
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
            collaboration.log(data.presenter +': ' + tabName + ' tab selected for ' + layerId);
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
            collaboration.log(data.presenter +': Page ' + data.params.page + ' selected');
            if (collaboration.role == "member") {
               $('.js-go-to-form-page').find('a[data-page="' + data.params.page + '"]').trigger('click');
            }
         });

         socket.on('zoomToData.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var id = data.params.layer;
            collaboration.log(data.presenter +': Zoom to data clicked: ' + id);
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
            collaboration.log(data.presenter +': "Submit Layers" clicked');
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
            collaboration.log(data.presenter +': "Cancel Changes" clicked');
            if (collaboration.role == "member") {
               $('.js-layers-form-cancel').trigger('click');
            }
         });

         socket.on('toggleAllLayers.clicked', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': "Copy to all" clicked');
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
            collaboration.log(data.presenter +': "Add to all" clicked');
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
            collaboration.log(data.presenter +': "Add to all" clicked');
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
            collaboration.log(data.presenter +': "Add Scale Points to all" clicked');
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
            collaboration.log(data.presenter +': "Add Another Tag" clicked');
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
            collaboration.log(data.presenter +': User feedback closed');
            if (collaboration.role == "member") {
               $('.js-user-feedback-close').trigger('click');
            }
         });

         socket.on('userFeedback.submit', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter +': User feedback submitted');
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
            collaboration.log(data.presenter +': "Draw Polygon" Clicked');
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
            collaboration.log(data.presenter +': "Draw Irregular Polygon" Clicked');
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
            collaboration.log(data.presenter +': "Select Existing Polygon" Clicked');
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
            collaboration.log(data.presenter +': "Delete Selected Polygon" Clicked');
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
            collaboration.log(data.presenter +': Coordinates value set to: "' + value + '"');
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
            collaboration.log(data.presenter +': "Clear Selection" Clicked');
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
            collaboration.log(data.presenter +': Polygon drawn');
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
            collaboration.log(data.presenter +': Polygon hover: ' + id);
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
            collaboration.log(data.presenter +': Polygon selected: ' + id);
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
            collaboration.log(data.presenter +': Save Coordinates clicked');
            if (collaboration.role == "member") {
               $('.js-add-coordinates-to-profile').trigger('click');
            }
         });

         socket.on('featureOverlay.removeType', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var overlayType = data.params.overlayType;
            collaboration.log(data.presenter +': Remove ' + overlayType);
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
            collaboration.log(data.presenter +': "Make new graph" Clicked');
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
            collaboration.log(data.presenter +': "Add to graph" Clicked');
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
            collaboration.log(data.presenter +': Closed Plot');
            if (collaboration.role == "member") {
               gisportal.graphs.deleteActiveGraph();
            }
         });

         socket.on('slideout.togglePeak', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var slideoutName = data.params.slideoutName;
            collaboration.log(data.presenter +': Show panel: ' + slideoutName);
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
            collaboration.log(data.presenter +': Close panel: ' + slideoutName);
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
            collaboration.log(data.presenter +': More Info: ' + id);
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
            collaboration.log(data.presenter +': Title value set to: "' + value + '"');
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
            var nice_val = input_elem.find(':selected').html() || value;
            collaboration.log(data.presenter +': Graph type set to: "' + nice_val + '"');
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
            collaboration.log(data.presenter +': Layer Depth set to: "' + nice_val + '"');
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
            collaboration.log(data.presenter +': Graph date range set to: "' + dates.join(' - ') + '"');
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
            collaboration.log(data.presenter +': ' + title + ' removed"');
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
            collaboration.log(data.presenter +': ' + title + ': axis changed to "' + select_value);
         });

         socket.on('graphStartDate.change', function(data) {
            if(collaboration.diverged){
               return true;
            }
            var value = new Date(data.params.value).toISOString().split("T")[0];
            var date_elem = $('.js-active-plot-start-date');
            collaboration.log(data.presenter +': Graph start date set to: "' + value + '"');
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
            collaboration.log(data.presenter +': Graph end date set to: "' + value + '"');
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
            collaboration.log(data.presenter +': "Create Graph" clicked');
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
            collaboration.log(data.presenter + ': "' + title + '": "Open" clicked');
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
            collaboration.log(data.presenter + ': "' + title + '": "Copy/Edit" clicked');
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
            collaboration.log(data.presenter + ': "' + title + '": "Delete" clicked');
            if (collaboration.role == "member") {
               delete_elem.trigger('click');
            }
         });

         socket.on('graphPopup.close', function(data) {
            if(collaboration.diverged){
               return true;
            }
            collaboration.log(data.presenter + ': Plot closed');
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
            console.log('Client received message:', data.message);
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

collaboration.startNewRoom = function() {
   collaboration.role = 'presenter';
   collaboration._emit('room.new');
};

collaboration.joinRoom = function(roomId) {
   collaboration._emit('room.join', roomId.toLowerCase(), true);
};

collaboration.buildMembersList = function(data) {
   if(!window.onfocus){
      window.onfocus = function(){
         if($('.messages').scrollTop() + $('.messages').innerHeight() >= $('.messages')[0].scrollHeight){
            if(!$('.collaboration-panel').hasClass('hidden')){
               gisportal.pageTitleNotification.Off();
            }
         }
      };
   }
   for(var people in data.people){
      person = data.people[people];
      if(!person.name || person.name === ""){
         person.name = person.email;
      }
   }
   if(webRTC){
      data.AVEnabled = webRTC.isChannelReady;
   }
   var message = $('.message-input').val();
   var scrollTop = $('.messages').scrollTop();
   var messages_data = $('.messages').html();
   var rendered = gisportal.templates['collaboration-room'](data);
   var new_message_popup = false;
   if($('.new-message-popup').length > 1){
      if(!$('.new-message-popup').hasClass('hidden')){
         new_message_popup = true;
      }
   }
   $('.js-collaboration-holder').html('').html(rendered);
   // Makes sure there is only one messenger
   $('#collaborationPanel .js-collaboration-holder .messenger').remove();
   $('.collaboration-pulltab').toggleClass('hidden', false);
   if(message){
      $('.message-input').val(message);
   }
   if(new_message_popup){
      $('.new-message-popup').toggleClass('hidden', false);
   }

   $('.js-collab-notifications-toggle').prop('checked', collaboration.displayLog);

   // add events to the various action links
   $('.js-leave-room').click(function() {
      $('.collaboration-panel').toggleClass('hidden', true);
      $('.collab-overlay').toggleClass('hidden', true);
      $('.collaboration-pulltab').toggleClass('hidden', true);
      hangup();
      socket.disconnect();
      collaboration.roomId = null;
      collaboration.owner = false;
      $('.notifyjs-gisportal-collab-notification-base').parent().remove();

      var rendered = gisportal.templates.collaboration();
      $('.js-collaboration-holder').html('');
      $('#collaborationPanel .js-collaboration-holder').html(rendered);

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
         var msg = input.val().replace(/<\/?[^>]+(>|$)/g, "");
         $('.message-input').val("");
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
      $('.js-collab-room-url').val(top.location.origin +'/?room='+ collaboration.roomId.toUpperCase());
      $('.js-collab-room-url').focus(function() { $(this).select(); } ).on('mouseup cut paste', function (e) {e.preventDefault();}).on('keydown', function(){$(this).select();});
   });

   $('.js-collab-notifications-toggle').click(function() {
      var log = $(this).prop('checked');
      collaboration.displayLog = log;
      if(log === false){
         $('.notifyjs-gisportal-collab-notification-base').parent().remove();
      }
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
         var video, mic;
         if(localStreams){
            video = localStreams.getVideoTracks()[0];
            mic = localStreams.getAudioTracks()[0];
         }else{
            video = {};
            mic = {};
         }
         var on_class = "off";
         title = "Un-mute";
         if(mic.enabled){
            on_class = "on";
            title = "Mute";
         }
         link = $('<span class="icon-microphone-2 collab-btn js-toggle-microphone btn pull-right collaboration-video ' + on_class + '-btn" title="' + title + '"></span>');
         $(this).prepend(link);
         on_class = "off";
         title = "Enable Webcam";
         if(video.enabled){
            on_class = "on";
            title = "Disable Webcam";
         }
         link = $('<span class="icon-camera-symbol-3 collab-btn js-toggle-webcam btn pull-right collaboration-video ' + on_class + '-btn" title="' + title + '"></span>');
         $(this).prepend(link);
         $('.collaboration-video').toggleClass('hidden', !webRTC.isStarted);
         if(collaboration.role != 'presenter'){
            if(divergents.indexOf(id) >= 0){
               link = $('<span class="icon-link-1 collab-btn js-collab-merge pull-right" title="Merge with collaboration"></span>');
               $(this).prepend(link);
            }else{
               link = $('<span class="icon-link-broken-1 collab-btn js-collab-diverge pull-right" title="Diverge from collaboration"></span>');
               $(this).prepend(link);
            }
         }
      }else if(my_data && my_data.dataEnabled){
         if(this_person && this_person.dataEnabled){
            link = $('<span class="icon-call-1 js-webrtc-online collab-btn pull-right" title="Call ' + $(this).find('p').html() + '"></span>');
            $(this).prepend(link);
         }
      }
      if(collaboration.role == 'presenter' || collaboration.owner){
         if(presenter != id && divergents.indexOf(id) == -1){
            link = $('<span class="js-make-presenter collab-btn icon-profile-4 pull-right" title="' + title + '" data-id="' + id + '"></span>');
            $(this).prepend(link);
         }
      }

      $('.js-collab-diverge').on('click', function(){
         collaboration._emit('room.diverge', socket.io.engine.id, force=true);
      });

      $('.js-collab-merge').on('click', function(){
         collaboration._emit('room.merge', socket.io.engine.id, force=true);
      });

      $('.js-make-presenter').click(function() {
         var id = $(this).data('id');
         collaboration._emit('room.make-presenter', id, force = true);
      });
   });
   $('.messages').html(messages_data);
   $('.messages').scrollTop(scrollTop);

   if(me_selectors.length > 0){
      // Makes sure that your person div(s) is at the top of the list
      for(var i in me_selectors){
         var parent_selector = me_selectors[i].parent();
         me_selectors[i].detach().insertAfter(parent_selector.children('p'));
      }
   }
   // Enable/Disable webRTC media
   $('.js-toggle-rtc').click(function() {
      var enabled = webRTC.isChannelReady || false;
      if (!enabled) {
         webRTC.initMedia();
         $(this).find('.btn-value').text('Disable Video/Audio');
      } else {
         webRTC.deinitMedia();
         $('.js-webrtc-online').toggleClass('hidden', true);
         $(this).find('.btn-value').text('Enable Video/Audio');
      }
   });

   $('.js-webrtc-online').on('click', function() {
      webRTC.isInitiator = true;
      maybeStart();
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
         button.attr('title', 'Mute');
         button.toggleClass('off-btn', false).toggleClass('on-btn', true);
      } else {
         button.attr('title', 'Un-mute');
         button.toggleClass('off-btn', true).toggleClass('on-btn', false);
      }
   });
};

collaboration.divergeAlert = function(){
   var pulltab = $('.collaboration-pulltab');
   var panel = $('.collaboration-panel');
   var person = panel.find('div[data-id="' + socket.io.engine.id + '"]');
   pulltab.toggleClass('open', true);
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

// This is the function actually sends the message if the collaboration is active and the user is the presenter
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
	
   //collaboration.initSession();
   if(gisportal.config.collaborationFeatures.enabled){
      collaboration.initDOM();
   }
   gisportal.user.initDOM();
 	return true;
};

collaboration.log = function(msg) {
   if (collaboration.displayLog) {
      var notificationText = $(".notifyjs-gisportal-collab-notification-base div.title");

      if(notificationText.length === 0){
         $.notify({'title':msg, "hide-text":"Hide"},{style:"gisportal-collab-notification", autoHide:false});
      }else{
         notificationText.html(msg);
      }
      $(document).off('click', '.notifyjs-gisportal-collab-notification-base .hide-opt');
      $(document).one('click', '.notifyjs-gisportal-collab-notification-base .hide-opt', function(e) {
         e.preventDefault();
         $('.js-collab-notifications-toggle').prop('checked', false);
         collaboration.displayLog = false;
      });
   }

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
