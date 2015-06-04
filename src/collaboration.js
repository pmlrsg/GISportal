
collaboration = {};

collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false;	// indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible

// socket.io location settings
collaboration.protocol = gisportal.config.collaborationFeatures.protocol || 'http'; 	// 'http' or 'https'; the connection is automagically upgraded to a websocket connection
collaboration.host = gisportal.config.collaborationFeatures.host || 'localhost';
collaboration.port = gisportal.config.collaborationFeatures.port || '';
collaboration.path = gisportal.config.collaborationFeatures.path || '';				// optional path; must start with a /

// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration';							// the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console';						// the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.historyConsole = '.js-collaboration-history';						// a div that historical message log is appended to
collaboration.statusMessage = '.js-collaboration-status-msg';					// element where the status message is displayed
collaboration.displayLog = true;                                           // if true the history is shown in `collaboration.historyConsole`

collaboration.active = false;
collaboration.role = 'member';

collaboration.initDOM = function() {
	// line up the URL 
	collaboration.socket_url = collaboration.protocol+'://'+collaboration.host+':'+collaboration.port + collaboration.path;

	$('[data-panel-name="collaboration"]').toggleClass('hidden', false);
	$('.js-google-auth-button').click(function() {
		var authWin = window.open(collaboration.socket_url +'/node/auth/google','authWin','left=20,top=20,width=700,height=700,toolbar=1');	
	});

}	



collaboration.initSession = function() {
	// hide the start button and show the options
	$(collaboration.startButton).toggleClass('hidden', true);
	$(collaboration.consoleWrapper).toggleClass('hidden', false);

	// get the socket.io script and open a connection
	$.getScript(collaboration.socket_url+"/node/socket.io/socket.io.js")
		.done(function( script, textStatus ) {
    		socket = io.connect(collaboration.socket_url+'/', {
		   	"connect timeout": 1000
		  	});

    		// -------------------------------------------------
    		// socket core event functions
    		// -------------------------------------------------
		  	socket.on('connect', function (){
		  		collaboration.active = true;
		   	$(collaboration.statusMessage).html('Succuessfully connected.');
		  	});

		  	socket.on('connect_error', function (reason){
		   	$(collaboration.statusMessage).html('Could not connect to server; '+ reason);
		  	});

		  	socket.on('disconnect', function (reason){
		  		collaboration.active = false;
		   	$(collaboration.statusMessage).html('Unexpectedly disconnected, trying to reconnect...');
		  	});

		  	// doesn't appear to work as the reconnect timeout is incrementally increased with each attempt; might have to monitor it outside of socket.io
		  	socket.on('reconnect_error', function (reason){
		   	$(collaboration.statusMessage).html('Could not re-establish a connection, sorry');
		  	});

		  	socket.on('error', function (reason){
		   	collaboration.active = false;
		   	if (reason == 'handshake error') { // user not logged into Google
		   		$(collaboration.consoleWrapper).toggleClass('hidden', true);
		   		$(collaboration.authenticationWrapper).toggleClass('hidden', false);
					window.open(collaboration.socket_url +'/auth/google');
		   	} else {
		   		$(collaboration.statusMessage).html('The connection failed; '+reason);	
		   	}
		   	
		  	});

		  	// -------------------------------------------------
		  	// room and user management
		  	// -------------------------------------------------
		  	socket.on('roomCreated', function(data) {
		  		var roomId = data.roomId;
		  		collaboration.log('<p>A new session has been created; your collaboration reference is '+params.roomId);
		  	})

		  	// -------------------------------------------------
    		// socket collaboration event functions
    		// -------------------------------------------------
		  	
		  	// sets the value of an element using the element's id
		  	socket.on('setValueById', function(data) {
		  		var params = data.params;
		  		collaboration.log('<p>'+data.presenter +': '+params.logmsg);
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
         })

         socket.on('ddslick.open', function(data) {
            if (collaboration.role == "member") {
               var obj = $('#' + data.params.obj);
               collaboration.highlightElement(obj);
               obj.ddslick('open');   
            }
            collaboration.log(obj +' drop down opened');
         })

         socket.on('ddslick.close', function(data) {
            if (collaboration.role == "member") {
               var obj = $('#' + data.params.obj);
               collaboration.highlightElement(obj);
               obj.ddslick('close');   
            }
            collaboration.log(obj +' drop down closed');
         })

         socket.on('ddslick.selectIndex', function(data) {
            if (collaboration.role == "member") {
               var obj = $('#' + data.params.obj);
               var index = data.params.index;
               collaboration.highlightElement(obj.find('li:nth-of-type('+ index +')'));
               obj.ddslick('select', { "index": index });   
            }
            collaboration.log(obj +' selectedIndex: ' + index);
         })

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

		  	// layer added
		  	socket.on('layer.addtopanel', function(data) {
		  		//console.log('layer.addtopanel received');
		  		//console.log(data);
            if (collaboration.role == "member") {	
		  			gisportal.indicatorsPanel.addToPanel(data.params.layer);
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
                        
         // layer selected
		  	socket.on('layer.remove', function(data) {
		  		console.log('layer.remove received');
		  		console.log(data);

		  		collaboration.log(data.presenter +': Layer removed - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.indicatorsPanel.removeFromPanel(data.params.id);
            }
		  	});
                        
         // layer hidden
		  	socket.on('layer.hide', function(data) {
		  		collaboration.log(data.presenter +': Layer hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.indicatorsPanel.hideLayer(data.params.id);
            }
		  	});
                        
         // layer shown
		  	socket.on('layer.show', function(data) {
		  		collaboration.log(data.presenter +': Layer un-hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.indicatorsPanel.showLayer(data.params.id);
            }
		  	});
                        
         // panel selected/shown
         socket.on('panels.showpanel', function(data) {
            var p = data.params.panelName
		  		collaboration.log(data.presenter +': Panel selected - '+ data.params.layerName);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('[data-panel-name="' + p + '"].tab'))
            	gisportal.panels.showPanel(p);
            }
		  	});  

		  	// autoscale
         socket.on('scalebar.autoscale', function(data) {
		  		console.log('scalebar.autoscale received');
		  		console.log(data);
		  		$(collaboration.historyConsole).prepend(data.presenter +': Auto Scale - '+ data.params.layerName);
            if (collaboration.role == "member") {
            	gisportal.scalebars.autoScale(data.params.id, data.params.force);
            }
		  	});            

		  	// reset scalebar
         socket.on('scalebar.reset', function(data) {
		  		console.log('scalebar.reset received');
		  		console.log(data);
		  		collaboration.log(data.presenter +': Scalebar was reset');
            if (collaboration.role == "member") {
            	gisportal.scalebars.resetScale(data.params.id);
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
} // end initSession

collaboration.startNewRoom = function() {
	collaboration._emit('startNewRoom');
}

collaboration.setValueById = function(id, value, logmsg) {
	var params = {
		"id" : id,
		"value" : value,
		"logmsg" : logmsg
	};
	collaboration._emit('setValueById', params)
}

collaboration.setUserSavedState = function() {
	var params = gisportal.saveState();
	console.log(params);
	collaboration._emit('setSavedState', params);
}

// This is the function actually sends the message if the collaboration is active and the user is the presenter
collaboration._emit = function(cmd, params) {
	if (collaboration.active && collaboration.role == "presenter") {
		socket.emit(cmd, params);	
	}
}

collaboration.userAuthorised = function() {
	console.log('user authorised');
	$('#gSignInWrapper').toggleClass('hidden', true);

	var data = {
		user : {
			fullname : '<Full Name>',
			email : '<email address>'
		}
	}
	
	// add the collaboration template into the mix...
	var rendered = gisportal.templates['collaboration'](data)
   $('.js-collaboration-holder').html(rendered); 
	$('.js-collaboration-holder').toggleClass('hidden', false);
   // and add listners to the buttons
	$(collaboration.startButton).click(function() {
   	// let it begin...
   	collaboration.initSession();
   	collaboration.startNewRoom();
   });	

	return true;
}

collaboration.log = function(msg) {
   if (collaboration.displayLog) {
      $(collaboration.historyConsole).prepend('<p>' + msg + '</p>');
   }

}

collaboration.highlightElement = function(element) {
   element.addClass('highlight-click');
   setTimeout(function() { element.removeClass('highlight-click'); }, 500);
}
