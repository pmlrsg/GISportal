
collaboration = {};

collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false;	// indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible

// socket.io location settings
collaboration.protocol = gisportal.config.collaborationFeatures.protocol || 'http'; 	// 'http' or 'https'; the connection is automagically upgraded to a websocket connection
collaboration.host = gisportal.config.collaborationFeatures.host || 'localhost';
collaboration.port = gisportal.config.collaborationFeatures.port || '6789';
collaboration.path = gisportal.config.collaborationFeatures.path || '';				// optional path; must start with a /

// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration';							// the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console';						// the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.historyConsole = '.js-collaboration-history';						// a div that historical message log is appended to
collaboration.statusMessage = '.js-collaboration-status-msg';					// element where the status message is displayed

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
		  		$(collaboration.historyConsole).prepend('<p>A new session has been created; your collaboration reference is '+params.roomId+'</p>');
		  	})

		  	// -------------------------------------------------
    		// socket collaboration event functions
    		// -------------------------------------------------
		  	
		  	// sets the value of an element using the element's id
		  	socket.on('setValueById', function(data) {
		  		var params = data.params;
		  		$(collaboration.historyConsole).prepend('<p>'+data.presenter +': '+params.logmsg+'</p>');
		   	if (collaboration.role == "member") {
		   		//console.log('setting value by id');
		   		$('#'+params.id).val(params.value);
		   		$('#'+params.id).trigger('change');
		   	}
		  	});

		  	// map Zoom
		  	socket.on('map.zoom', function(data) {
		  		var params = data.params;
		  		//$(collaboration.historyConsole).prepend('<p>'+ data.presenter +': Zoom adjusted to '+params.zoomlevel+'</p>');
		   	if (collaboration.role == "member") {
		   		map.zoomToScale(params.zoomlevel);
		   	}
		  	});

		  	// map Move
		  	socket.on('map.move', function(data) {
		  		var params = data.params;
		  		//$(collaboration.historyConsole).prepend('<p>'+ data.presenter +': Map centred to '+params.lat+', '+params.lon+'</p>');
                            if (collaboration.role == "member") {
		   		map.setCenter(new OpenLayers.LonLat([params.lon, params.lat]))
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
		  		
		  		$(collaboration.historyConsole).prepend('<p>'+ data.presenter +': New layer added - '+ data.params.layerName+'</p>');
                                if (collaboration.role == "member") {
                                    gisportal.indicatorsPanel.selectLayer(data.params.id);
                                }
		  	});
                        
                        // layer selected
		  	socket.on('layer.remove', function(data) {
		  		$(collaboration.historyConsole).prepend('<p>'+ data.presenter +': Layer removed - '+ data.params.layerName+'</p>');
                                if (collaboration.role == "member") {
                                    gisportal.indicatorsPanel.selectLayer(data.params.id);
                                }
		  	});
                        
                        // layer hidden
		  	socket.on('layer.hide', function(data) {
		  		$(collaboration.historyConsole).prepend('<p>'+ data.presenter +': Layer hidden - '+ data.params.layerName+'</p>');
                                if (collaboration.role == "member") {
                                    gisportal.indicatorsPanel.hideLayer(data.params.id);
                                }
		  	});
                        
                        // layer shown
		  	socket.on('layer.show', function(data) {
		  		$(collaboration.historyConsole).prepend('<p>'+ data.presenter +': Layer un-hidden - '+ data.params.layerName+'</p>');
                                if (collaboration.role == "member") {
                                    gisportal.indicatorsPanel.showLayer(data.params.id);
                                }
		  	});

			// User saved state
			socket.on('setSavedState', function(data) {
		  		console.log(data);
		  		
		  		$(collaboration.historyConsole).prepend('<p>State restored</p>');
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
	var params = { "a": "b" };
	collaboration._emit('startNewRoom', params);
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
			fullname : 'Bob Monkhouse',
			email : 'bob@nowhere.com'
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
   	//collaboration.startNewRoom();
   });	

	return true;
}

//--------------------------------------------------------------------------------------
//  Portal EventManager event bindings
//--------------------------------------------------------------------------------------

// user zooms in/out
gisportal.events.bind("map.zoom", function(event, zoomLevel) {
   var params = {
      "event" : "map.zoom",
      "zoomlevel" : zoomLevel
   }
   collaboration._emit('c_event', params);
});

// user moves the map
gisportal.events.bind("map.move", function(event, CenterLonLat) {
   var params = { 
      "event" : "map.move",
      "lat" : CenterLonLat.lat,
      "lon" : CenterLonLat. lon
   }
   collaboration._emit('c_event', params);
});

// Base map changed
gisportal.events.bind("displayoptions.basemap", function(event, id, value, logmsg) {
   collaboration.setValueById(id, value, logmsg);
});

// Country borders changed
gisportal.events.bind("displayoptions.countryborders", function(event, id, value, logmsg) {
   collaboration.setValueById(id, value, logmsg);
});

// new layer added
gisportal.events.bind("layer.addtopanel", function(event, data) {
   var params = {
       "event" : "layer.addtopanel",
       "layer" : data
   }
   collaboration._emit('c_event', params);
});

// layer is selected
gisportal.events.bind("layer.select", function(event, id, layerName) {
    var params = {
        "event" : "layer.select",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// layer removed from panel
gisportal.events.bind("layer.remove", function(event, id, layerName) {
   var params = {
        "event" : "layer.remove",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// hide a layer
gisportal.events.bind("layer.hide", function(event, id, layerName) {
   var params = {
        "event" : "layer.hide",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// hide a layer
gisportal.events.bind("layer.show", function(event, id, layerName) {
   var params = {
        "event" : "layer.show",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});
