

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
}	

gisportal.sessionsharing.initSession = function() {

	$.getScript("http://pmpc1465.npm.ac.uk:6789/socket.io/socket.io.js")
		.done(function( script, textStatus ) {
    		var socket = io.connect("http://pmpc1465.npm.ac.uk:6789/", {
		   	"connect timeout": 1000
		  	});

		  	socket.on('error', function (reason){
		   	console.error('Unable to connect Socket.IO', reason);
		  	});

		  	socket.on('connect', function (){
		   	console.info('successfully established a working connection');
		   	
		  	});

		  	socket.on('new msg', function(data) {
		  		$("#socketReturn").append(data.msg+'<br />---<br />');
		   	if (role == "member") {
		   		eval(data.msg+';');	
		   	}
		  	});

			$('#btn-presenter').click(function() {
				role = 'presenter';
			});

		  	$("#socketSend").click(function(e) {
		    var inputText = $("#socketCmd").val().trim();
		    if(inputText) {
		      var chunks = inputText.match(/.{1,1024}/g)
		        , len = chunks.length;

		      for(var i = 0; i<len; i++) {
		        socket.emit('my msg', {
		          msg: chunks[i]
		        });
		      }

		      $("#socketCmd").val('');

		      return false;
		   	}
		  	});

  		})
  		.fail(function( jqxhr, settings, exception ) {
    		console.log("Failed to get script: "+exception);
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
