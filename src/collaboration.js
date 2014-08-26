
collaboration = {};

// socket.io location settings
collaboration.protocol = 'http'; 														// 'http' or 'https'; the connection is automagically upgraded to a websocket connection
collaboration.host = 'pmpc1465.npm.ac.uk';
collaboration.port = '6789';
collaboration.path = '';

// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration';							// the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console';					// the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.historyConsole = '.js-collaboration-history';					// a div that historical message log as appended to
collaboration.statusMessage = '.js-collaboration-status-msg';					// element where the status message is displayed

collaboration.active = false;
collaboration.role = 'member';

collaboration.initDOM = function() {
	// this should really be done somewhere else in a much more elegant way than this, but for now...
	$('.js-collaboration-toggle').on('click', function() {
      $('#collaborationPanel').toggleClass('hidden', false).toggleClass('active', true);      
      $('#mapToolsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#graphPanel').toggleClass('hidden', true).toggleClass('active', false);      
      
   });

   $(collaboration.startButton).click(function() {
   	// let it begin...
   	collaboration.initSession();
   });
}	

collaboration.initSession = function() {
	// hide the start button and show the options
	$(collaboration.startButton).toggleClass('hidden', true);
	$(collaboration.consoleWrapper).toggleClass('hidden', false);

	// line up the URL 
	collaboration.socket_url = collaboration.protocol+'://'+collaboration.host+':'+collaboration.port + collaboration.path;

	// get the socket.io script and open a connection
	$.getScript(collaboration.socket_url+"/socket.io/socket.io.js")
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
    		// socket collaboration event functions
    		// -------------------------------------------------
		  	
		  	// set's the value of an element using the element's id
		  	socket.on('setValueById', function(data) {
		  		var params = data.params;
		  		$(collaboration.historyConsole).prepend('<p>'+params.logmsg+'</p>');
		   	if (collaboration.role == "member") {
		   		$('#'+params.id).val(params.value);
		   		$('#'+params.id).trigger('change');
		   	}
		  	});

		  	// map Zoom
		  	socket.on('mapZoom', function(data) {
		  		console.log(data);
		  		var params = data.params;
		  		$(collaboration.historyConsole).prepend('<p>Zoom adjusted to '+params.zoomlevel+'</p>');
		   	if (collaboration.role == "member") {
		   		map.zoomToScale(params.zoomlevel);
		   	}
		  	});

		  	// map Move
		  	socket.on('mapMove', function(data) {
		  		var params = data.params;
		  		$(collaboration.historyConsole).prepend('<p>Map centred to '+params.lat+', '+params.lon+'</p>');
		   	if (collaboration.role == "member") {
		   		map.setCenter(new OpenLayers.LonLat([params.lon, params.lat]))
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

collaboration.setValueById = function(id, value, logmsg) {
	var params = {
		"id" : id,
		"value" : value,
		"logmsg" : logmsg
	};
	collaboration._emit('setValueById', params)
}

collaboration.mapZoom = function() {
	var params = {
		"zoomlevel" : map.getScale()
	}
	collaboration._emit('mapZoom', params);
}

collaboration.mapMove = function() {
	var params = {
		"lat" : map.center.lat,
		"lon" : map.center.lon
	}
	collaboration._emit('mapMove', params);
}

// This is the function actually sends the message if the collaboration is active and the user is the presenter
collaboration._emit = function(cmd, params) {
	if (collaboration.active && collaboration.role == "presenter") {
		socket.emit(cmd, params);	
	}
}
