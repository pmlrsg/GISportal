
collaboration = {};


// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration';							// the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console';						// the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.historyConsole = '.js-collaboration-history';						// a div that historical message log is appended to
collaboration.statusMessage = '.js-collaboration-status-msg';					// element where the status message is displayed
collaboration.statusIcon = '.js-collaboration-status-icon';                // element where the status icon is displayed
collaboration.displayLog = true;                                           // if true the history is shown in `collaboration.historyConsole`

collaboration.active = false;
collaboration.role = '';

collaboration.initDOM = function() {
      
   collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false; // indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible

	$('[data-panel-name="collaboration"]').toggleClass('hidden', false);

   var rendered = gisportal.templates.collaboration();
   $('.js-collaboration-holder').html(rendered);

   // if there's a room querystring parameter show the collaboration panel; they'll be put in the room if they are logged in already, otherwise prompt for login
   var roomId = gisportal.utils.getURLParameter('room');
   
   $.ajax({
      url: gisportal.middlewarePath + '/collaboration/dashboard/?domain=' + gisportal.niceDomainName,
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
      $('.js-collab-message')
         .toggleClass('hidden', false)
         .toggleClass('alert-warning', true)
         .html('You have been invited to join room '+ roomId.toUpperCase() +'; please login to enter the room');
   }
};



collaboration.initSession = function() {

	// get the socket.io script and open a connection
	$.getScript("/socket.io/socket.io.js")
		.done(function( script, textStatus ) {
         socket = io.connect('/', {
		   	"connect timeout": 1000
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
		   	collaboration.setStatus('error', 'Unexpectedly disconnected, trying to reconnect...');
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
					window.open('/auth/google');
		   	} else {
		   		collaboration.setStatus('error', 'The connection failed; '+reason);	
               // reset the iframe
               var rendered = gisportal.templates.collaboration();
               $('.js-collaboration-holder').html('').html(rendered);
		   	}
		   	
		  	});

		  	// -------------------------------------------------
		  	// room and user management
		  	// -------------------------------------------------
		  	
         socket.on('room.invalid-id', function(data) {
            console.log('invalid Room Id requested');
            var iframe = $('iframe');
            $('.js-room-id-message', iframe.contents()).html('The collaboration room ID does not exist, please check and try again').removeClass('hidden').addClass('error');
            $('#roomId', iframe.contents()).addClass('error');

            // if there's a `room` url parameter alter the warning message
            var roomId = gisportal.utils.getURLParameter('room');
            if (roomId !== null) {
               $('.js-collab-message')
                  .toggleClass('hidden', false)
                  .toggleClass('alert-danger', true)
                  .html('The requested room does not exist; the room may have been closed by the organiser, or the link you clicked on could be wrong.');
            }
         });
         
         socket.on('room.created', function(data) {
		  		var roomId = data.roomId;
            console.log('Room created: '+ data.roomId);
		  		collaboration.roomId = data.roomId;
            
            collaboration.setStatus('connected', 'Connected. You are the Presenter');

            // load the room template
            collaboration.buildMembersList(data);
		  	});

         socket.on('room.member-joined', function(data) {
            console.log('member joined room');
            
            // is this confirmation that I have joined?
            if (data.sessionId == socket.io.engine.id) { // yes, so set the role, status and show the room details
               collaboration.roomId = data.roomId;
               collaboration.role = 'member';
               collaboration.setStatus('connected', 'Connected. You are in room '+ data.roomId.toUpperCase());
            }

            // if I am the presenter send my state so that the new member can catch up
            if (collaboration.role == 'presenter') {
               var state = gisportal.saveState();
               var params = {
                  "event": "room.presenter-state-update",
                  "state": state
               };
               collaboration._emit('c_event', params);
            }
            // load/update the member listings
            collaboration.buildMembersList(data);
         });

         socket.on('room.member-left', function(data) {
            console.log(data.departed +' has left the room');
            collaboration.buildMembersList(data);
         });

         socket.on('room.presenter-changed', function(data) {
            console.log('change of presenter');
            // am I now the presenter?
            for (var p in data.people) {
               if (data.people[p].presenter && data.people[p].id == socket.io.engine.id) {
                  collaboration.role = "presenter";
                  collaboration.setStatus('connected', 'Connected. You are the presenter');
                  gisportal.showModalMessage('You are now the presenter');
                  break;
               } else {
                  collaboration.role = "member";
                  collaboration.setStatus('connected', 'Connected. .....');
               }
            }
            collaboration.buildMembersList(data);
         });

         socket.on('room.presenter-state-update', function(data) {
            var state = data.params.state;
            if (collaboration.role == "member") {
               gisportal.loadState(state);
            }
         });

 		  	// -------------------------------------------------
    		// socket collaboration event functions
    		// -------------------------------------------------
		  	
		  	// sets the value of an element using the element's id
		  	socket.on('setValueById', function(data) {
		  		var params = data.params;
		  		collaboration.log(data.presenter +': '+params.logmsg);
		   	if (collaboration.role == "member") {
		   		//console.log('setting value by id');
		   		$('#'+params.id).val(params.value);
		   		$('#'+params.id).trigger('change');
		   	}
		  	});

         socket.on('configurepanel.scroll', function(data) {
            if (collaboration.role == "member") {
               $('#configurePanel').scrollTop(data.params.scrollTop);
            }
         });

         socket.on('date.selected', function(data) {
            var date = new Date(data.params.date);

            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-current-date'));
               gisportal.timeline.setDate(date); 
            }
            collaboration.log('Date changed to '+ date);
         });

         socket.on('date.zoom', function(data) {
            var startDate = new Date(data.params.startDate);
            var endDate = new Date(data.params.endDate);

            if (collaboration.role == "member") {
               collaboration.highlightElement($('#timeline'));
               gisportal.timeline.zoom(startDate, endDate); 
            }
            collaboration.log('Timeline zoom changed');
         });

         socket.on('ddslick.open', function(data) {
            var obj = $('#' + data.params.obj);
            if (collaboration.role == "member") {
               collaboration.highlightElement(obj);
               obj.ddslick('open');   
            }
            collaboration.log(obj +' drop down opened');
         });

         socket.on('ddslick.close', function(data) {
            var obj = $('#' + data.params.obj);
            if (collaboration.role == "member") {
               collaboration.highlightElement(obj);
               obj.ddslick('close');   
            }
            collaboration.log(obj +' drop down closed');
         });

         socket.on('ddslick.selectIndex', function(data) {
            var obj = $('#' + data.params.obj);
            var index = data.params.index;
            if (collaboration.role == "member") {
               collaboration.highlightElement(obj.find('li:nth-of-type('+ index +')'));
               obj.ddslick('select', { "index": index });   
            }
            collaboration.log(obj +' selectedIndex: ' + index);
         });

   	  	socket.on('indicatorspanel.scroll', function(data) {
            if (collaboration.role == "member") {
               $('#indicatorsPanel').scrollTop(data.params.scrollTop);
            }
         });

         // layer added
		  	socket.on('layer.addtopanel', function(data) {
		  		//console.log('layer.addtopanel received');
		  		//console.log(data);
            if (collaboration.role == "member") {	
		  			gisportal.indicatorsPanel.addToPanel(data.params.layer);
            }
		  	});

         // layer hidden
         socket.on('layer.hide', function(data) {
            collaboration.log(data.presenter +': Layer hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
               gisportal.indicatorsPanel.hideLayer(data.params.id);
            }
         });

         // layer selected
		  	socket.on('layer.remove', function(data) {
		  		console.log('layer.remove received');
		  		console.log(data);

		  		collaboration.log(data.presenter +': Layer removed - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.indicatorsPanel.removeFromPanel(data.params.id);
            }
		  	});

         // layer order changed
         socket.on('layer.reorder', function(data) {
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

         // layer selected
         socket.on('layer.select', function(data) {
            // console.log('layer.select received');
            // console.log(data);
            
            collaboration.log(data.presenter +': New layer added - '+ data.params.layerName);
            if (collaboration.role == "member") {
               gisportal.indicatorsPanel.selectLayer(data.params.id);
            }
         });

         // layer shown
		  	socket.on('layer.show', function(data) {
		  		collaboration.log(data.presenter +': Layer un-hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.indicatorsPanel.showLayer(data.params.id);
            }
		  	});
                        
         // map Move
         socket.on('map.move', function(data) {
            var params = data.params;
            collaboration.log(data.presenter +': Map centred to '+params.centre+', with a zoom of '+params.zoom);
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
            var p = data.params.panelName;
		  		collaboration.log(data.presenter +': Panel selected - '+ data.params.layerName);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('[data-panel-name="' + p + '"].tab'));
            	gisportal.panels.showPanel(p);
            }
		  	});  

		  	// autoscale
         socket.on('scalebar.autoscale', function(data) {
		  		$(collaboration.historyConsole).prepend(data.presenter +': Auto Scale - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.scalebars.autoScale(data.params.id, data.params.force);
            }
		  	});

         // autoscale checkbox clicked
         socket.on('scalebar.autoscale-checkbox', function(data) {
            var id = data.params.id;
            var isChecked = data.params.isChecked;

            $(collaboration.historyConsole).prepend(data.presenter +': Auto Scale checkbox checked: '+ isChecked);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-auto[data-id="' + id + '"]').parent());
               $('.js-auto[data-id="' + id + '"]').prop( 'checked', isChecked );
            }
         });

         // Logarithmis checkbox clicked
         socket.on('scalebar.log-set', function(data) {
            var id = data.params.id;
            var isLog = data.params.isLog;

            $(collaboration.historyConsole).prepend(data.presenter +': Logarithmic checkbox checked: '+ isLog);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-indicator-is-log[data-id="' + id + '"]').parent());
               $('.js-indicator-is-log[data-id="' + id + '"]').prop( 'checked', isLog );
            }
         });

         // Maximum scalebar value set
         socket.on('scalebar.max-set', function(data) {
            var id = data.params.id;
            var value = data.params.value;

            $(collaboration.historyConsole).prepend(data.presenter +': Maximum set to '+ value);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-scale-max[data-id="' + id + '"]'));
               $('.js-scale-max[data-id="' + id + '"]').val(value).change();
            }
         });

         // Minimum scalebar value set
         socket.on('scalebar.min-set', function(data) {
            var id = data.params.id;
            var value = data.params.value;

            $(collaboration.historyConsole).prepend(data.presenter +': Minimum set to '+ value);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-scale-min[data-id="' + id + '"]'));
               $('.js-scale-min[data-id="' + id + '"]').val(value).change();
            }
         });

         // Layer opacity value changed
         socket.on('scalebar.opacity', function(data) {
            var id = data.params.id;
            var value = data.params.value;

            if (typeof value != 'undefined') {
               var opacity = value * 100;

               $(collaboration.historyConsole).prepend(data.presenter +': Opacity set to '+ value);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('#tab-' + id + '-opacity'));
                  
                  $('#tab-' + id + '-opacity').val(opacity);
                  gisportal.layers[id].setOpacity(value);
               }
            }
            
         });

		  	// reset scalebar
         socket.on('scalebar.reset', function(data) {
		  		collaboration.log(data.presenter +': Scalebar was reset');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-reset[data-id="'+ data.params.id +'"]'));
            	$('.js-reset[data-id="'+ data.params.id +'"] span').click();
            }
		  	});            

         // search value changed
         socket.on('search.typing', function(data) {
            var searchValue = data.params.searchValue;
            collaboration.log(data.presenter +': search term: ' + searchValue);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-search'));
               $('.js-search').val(searchValue);
               gisportal.configurePanel.search(searchValue);
            }
         });

         // search cancelled
         socket.on('search.cancel', function(data) {
            collaboration.log(data.presenter +': search cancelled');
            if (collaboration.role == "member") {
               $('.js-search-results').css('display', 'none');
            }
         });

         // search value changed
         socket.on('search.resultselected', function(data) {
            var searchResult = data.params.searchResult;
            collaboration.log(data.presenter +': search result selected: ' + searchResult);
            if (collaboration.role == "member") {
               gisportal.configurePanel.toggleIndicator(searchResult, '');
               $('.js-search-results').css('display', 'none');
            }
         });

        // Layer tab selected
         socket.on('tab.select', function(data) {
            var layerId = data.params.layerId;
            var tabName = data.params.tabName;
            collaboration.log(data.presenter +': ' + tabName + ' selected for ' + layerId);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('[data-tab-name="'+ tabName +'"]'));
               gisportal.indicatorsPanel.selectTab( layerId, tabName );
            }
         });

			// User saved state
			socket.on('setSavedState', function(data) {
		  		console.log(data);
		  		
		  		collaboration.log('State restored');
		   	if (collaboration.role == "member") {
		   		map.zoomToScale(data.params.zoomlevel);
		   	}
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
   var rendered = gisportal.templates['collaboration-room'](data);
   $('.js-collaboration-holder').html('').html(rendered);

   // add events to the various action links
   $('.js-leave-room').click(function() {
      socket.disconnect();
      collaboration.roomId = null;

      var rendered = gisportal.templates.collaboration();
      $('.js-collaboration-holder').html('').html(rendered);

      collaboration.setStatus('error', 'You have left the room');
      setTimeout(function() {
         $('.collaboration-status').remove();
      }, 3000);
   });

   $('.js-invite-people').click(function() {
      $('.js-collab-invite').toggleClass('hidden');
      $('.js-collab-room-url').val(top.location.origin +'/?room='+ collaboration.roomId.toUpperCase());
      $('.js-collab-room-url').focus(function() { $(this).select(); } ).mouseup(function (e) {e.preventDefault(); });
   });

   if (collaboration.role == 'presenter') { 
      // add a link to other members to allow you to make them presenter
      $('.person').each(function() {
         var id = $(this).data('id');
         var link = $('<a href="javascript:void(0)" class="js-make-presenter" title="Make this person the presenter" data-id="' + id + '"></a>');
         $(this).prepend(link);
      });

      $('.js-make-presenter').click(function() {
         var id = $(this).data('id');
         collaboration._emit('room.make-presenter', id);
      });
   }
};

collaboration.setValueById = function(id, value, logmsg) {
	var params = {
		"id" : id,
		"value" : value,
		"logmsg" : logmsg
	};
	collaboration._emit('setValueById', params);
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
   $('.js-collaboration-holder').html('').html(rendered); 
	
   //collaboration.initSession();
   if(gisportal.config.collaborationFeatures.enabled){
      collaboration.initDOM();
   }
   gisportal.user.initDOM();
 	return true;
};

collaboration.log = function(msg) {
   if (collaboration.displayLog) {
      $(collaboration.historyConsole).prepend('<p>' + msg + '</p>');
   }

};

collaboration.highlightElement = function(element) {
   element.addClass('highlight-click');
   setTimeout(function() { element.removeClass('highlight-click'); }, 500);
};

collaboration.setStatus = function(icon, message) {
   if ($('.collaboration-status').length === 0) {
      var statusMsg = gisportal.templates['collaboration-status'];
      $('.ol-overlaycontainer').append(statusMsg);   
   }
   
   if (icon == 'connected') {
      $(collaboration.statusIcon).toggleClass('error', false);
      $(collaboration.statusIcon).toggleClass('connected', true);
   }
   if (icon == 'error') {
      $(collaboration.statusIcon).toggleClass('error', true);
      $(collaboration.statusIcon).toggleClass('connected', false);
   }
   $(collaboration.statusMessage).html(message);
};
