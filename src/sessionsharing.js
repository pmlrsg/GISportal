

gisportal.sessionsharing = {};

var socket = {};
var role = 'member';

gisportal.sessionsharing.initDOM = function() {
	$('.js-session-sharing-toggle').on('click', function() {
      $('#sessionSharingPanel').toggleClass('hidden', false).toggleClass('active', true);      
      $('#mapToolsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#graphPanel').toggleClass('hidden', true).toggleClass('active', false);      
      
   });

   $('.js-start-session-sharing').click(function() {
   	gisportal.sessionsharing.initSession();

   });
}	

gisportal.sessionsharing.initSession = function() {
	// hide the start button and show the options
	$('.js-start-session-sharing').toggleClass('hidden', true);
	$('.js-session-sharing-console').toggleClass('hidden', false);

	var protocol = 'http', 
	    host = 'pmpc1465.npm.ac.uk', 
	    port = '6789';

	var socket_url = protocol+'://'+host+':'+port;

	$.getScript(socket_url+"/socket.io/socket.io.js")
		.done(function( script, textStatus ) {
    		var socket = io.connect("http://pmpc1465.npm.ac.uk:6789/", {
		   	"connect timeout": 1000
		  	});

		  	socket.on('error', function (reason){
		   	//console.error('Unable to connect Socket.IO', reason);
		   	$('.js-session-sharing-status-msg').html('The connection failed; '+reason);
		  	});

		  	socket.on('connect', function (){
		   	$('.js-session-sharing-status-msg').html('Succuessfully connected.');
		  	});

		  	socket.on('connect_error', function (reason){
		   	$('.js-session-sharing-status-msg').html('Could not connect to server; '+ reason);
		  	});

		  	socket.on('disconnect', function (reason){
		   	$('.js-session-sharing-status-msg').html('Unexpectedly disconnected, trying to reconnect...');
		  	});

		  	// doesn't appear to work as the reconnect timeout is incrementally increased with each attempt; might have to monitor it outside of socket.io
		  	socket.on('reconnect_error', function (reason){
		   	$('.js-session-sharing-status-msg').html('Could not re-establish a connection, sorry');
		  	});

		  	socket.on('new msg', function(data) {
		  		$("#socketReturn").append(data.msg+'<br />---<br />');
		   	if (role == "member") {
		   		eval(data.msg+';');	
		   	}
		  	});

			// $('#btn-presenter').click(function() {
			// 	role = 'presenter';
			// });

		 //  	$("#socketSend").click(function(e) {
		 //    var inputText = $("#socketCmd").val().trim();
		 //    if(inputText) {
		 //      var chunks = inputText.match(/.{1,1024}/g)
		 //        , len = chunks.length;

		 //      for(var i = 0; i<len; i++) {
		 //        socket.emit('my msg', {
		 //          msg: chunks[i]
		 //        });
		 //      }

		 //      $("#socketCmd").val('');

		 //      return false;
		 //   	}
		 //  	});

  		})
  		.fail(function( jqxhr, settings, exception ) {
    		$('.js-session-sharing-status-msg').html('Could not connect to server; the response was \''+ exception+'\' - <a href="javascript:gisportal.sessionsharing.initSession();">try again</a>');
   });

	gisportal.sessionsharing.shareEvent = function(command) {
		var remoteCmd = '';
		if (command == 'moveend') {
			remoteCmd = 'map.setCenter(new OpenLayers.LonLat(['+map.center.lon+', '+map.center.lat+']))';
		}	
		if (command == 'zoomend') {
			remoteCmd = 'map.zoomToScale('+ map.getScale() +')';
		}	

		if (remoteCmd.length > 0) {
			var chunks = remoteCmd.match(/.{1,1024}/g)
		     , len = chunks.length;

		   for(var i = 0; i<len; i++) {
		     	socket.emit('my msg', {
		      	msg: chunks[i]
		     });
		   }  
		}
		
				
	}	

}

function sessionSharingShareEvent(command) {
	if (socket.length > 0) {
		gisportal.sessionsharing.shareEvent(command);
	}
}
