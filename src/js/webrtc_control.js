// *****************************************************************************
//    WebRTC functions
// *****************************************************************************

var webRTC = {};

webRTC.isChannelReady = false;
webRTC.isInitiator = false;
webRTC.isStarted = false;
webRTC.turnReady = false;


webRTC.initMedia = function() {

   //webRTC.isChannelReady = true;

   var startTime;
   // Gets the two vieo elements
   webRTC.localVideo = document.getElementById('localVideo');
   webRTC.remoteVideo = document.getElementById('remoteVideo');

   webRTC.peerConfig = {
      'iceServers': [{
         'url': 'stun:stun.l.google.com:19302'
      }]
   };

   // Gets the audio and video
   var constraints = {
      video: true,
      audio: true
   };

   getUserMedia(constraints, handleUserMedia, handleUserMediaError);
   
   $('.js-toggle-webcam').off('click');
   $('.js-toggle-webcam').on('click', function() {
      var localStreams = webRTC.peerConn.getLocalStreams()[0];
      var video = localStreams.getVideoTracks()[0];
      video.enabled = !video.enabled;

      $(this).toggleClass('active', video.enabled);
      $(this).toggleClass('disabled', !video.enabled);
      if (video.enabled) {
         $(this).attr('title', 'Disable Webcam');
      } else {
         $(this).attr('title', 'Enable Webcam');
      }
   });

   $('.js-toggle-microphone').off('click');
   $('.js-toggle-microphone').on('click', function() {
      var localStreams = webRTC.peerConn.getLocalStreams()[0];
      var mic = localStreams.getAudioTracks()[0];
      mic.enabled = !mic.enabled;

      $(this).toggleClass('active', mic.enabled);
      $(this).toggleClass('disabled', !mic.enabled);
      if (mic.enabled) {
         $(this).attr('title', 'mute');
         $(this).toggleClass('icon-volume-medium-1', true);
         $(this).toggleClass('icon-volume-mute-1', false);
      } else {
         $(this).attr('title', 'un-mute');
         $(this).toggleClass('icon-volume-medium-1', false);
         $(this).toggleClass('icon-volume-mute-1', true);
      }
   });

   $('.js-end-webrtc-call').off('click');
   $('.js-end-webrtc-call').on('click', function() { 
      hangup();
   });

};

webRTC.deinitMedia = function() {
   sendMessage('media.disabled');
   webRTC.isChannelReady = false;
   webRTC.stop();

};

if (webrtcDetectedBrowser === 'firefox') {
   webRTC.pc_config = { 'iceServers': [{ 'url': 'stun:23.21.150.121' }] }; // number IP
} else {
   webRTC.pc_config = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
}

webRTC.pc_constraints = {
   'optional': [{
      'DtlsSrtpKeyAgreement': true
   }, {
      'RtpDataChannels': true
   }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
   'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
   }
};



webRTC.messageCallback = function(data) {
   var message = data.params.message;
   var memberId;
   console.log('Received message:', message);
   
   // USER ENABLES THEIR AUDIO/VIDEO
   if (message === 'media.enabled') {
      // update the user who's media was enabled with an 'available status'
      memberId = data.socketId;
      $('[data-id="' + memberId + '"] .js-webrtc-online').toggleClass('hidden', false);

      // then start?
      maybeStart();

   } 

   // USER DISABLES THEIR AUDIO/VIDEO
   if (message === 'media.disabled') {
      // update the user who's media was disabled 
      memberId = data.socketId;
      $('[data-id="' + memberId + '"] .js-webrtc-online').toggleClass('hidden', true);
      
   } 

   // AN OFFER 
   if (message.type === 'offer') {
      if (!webRTC.isInitiator && !webRTC.isStarted) {
         maybeStart();
      }
      webRTC.peerConn.setRemoteDescription(new RTCSessionDescription(message));
      if (!webRTC.isInitiator) {
         acceptIncomingCall(message.caller);
      }
   } 

   // THE CALLEE ANSWERS
   if (message.type === 'answer' && webRTC.isStarted) {
      webRTC.peerConn.setRemoteDescription(new RTCSessionDescription(message));
   } 

   // A CANDIDATE IS ADDED
   if (message.type === 'candidate' && webRTC.isStarted) {
      var candidate = new RTCIceCandidate({
         sdpMLineIndex: message.label,
         candidate: message.candidate
      });
      webRTC.peerConn.addIceCandidate(candidate);
   } 

   // OTHER END HANGS UP
   if (message === 'bye' && webRTC.isStarted) {
      handleRemoteHangup();
   }
};


function sendMessage(message){
   var params = {
      'event': 'webrtc_event',
      'message': message
   };
   console.log('Sending message: ', message);
   collaboration._emit('webrtc_event', params, true);
   
}
function handleUserMedia(stream) {
   webRTC.localStream = stream;
   attachMediaStream(localVideo, stream);
   webRTC.isChannelReady = true;
   console.log('Adding local stream.');
   sendMessage('media.enabled');         // expand on this to tell others of the users video and/or audio availability
   if (webRTC.isInitiator) {
      maybeStart();                       // probably don't need this here
   }
}

function handleUserMediaError(error) {
   console.log('getUserMedia error: ', error);
}

// if (location.hostname != "localhost") {
//    requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
// }

function maybeStart() {
   if (!webRTC.isStarted && webRTC.localStream && webRTC.isChannelReady) {
      createPeerConnection();
      webRTC.peerConn.addStream(webRTC.localStream);
      // webRTC.isStarted = true;
      if (webRTC.isInitiator) {
         webRTC.isStarted = true;
         doCall();
         // show the videos and controls
         $('.collaboration-video').toggleClass('hidden', false);
      }
   }
}

window.onbeforeunload = function(e) {
   sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
   try {
      webRTC.peerConn = new RTCPeerConnection(webRTC.pc_config, webRTC.pc_constraints);
      webRTC.peerConn.onicecandidate = handleIceCandidate;
      console.log('Created RTCPeerConnnection with:\n' +
         '  config: \'' + JSON.stringify(webRTC.pc_config) + '\';\n' +
         '  constraints: \'' + JSON.stringify(webRTC.pc_constraints) + '\'.');
   } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
   }
   webRTC.peerConn.onaddstream = handleRemoteStreamAdded;
   webRTC.peerConn.onremovestream = handleRemoteStreamRemoved;

}

function handleIceCandidate(event) {
   console.log('handleIceCandidate event: ', event);
   if (event.candidate) {
      sendMessage({
         type: 'candidate',
         label: event.candidate.sdpMLineIndex,
         id: event.candidate.sdpMid,
         candidate: event.candidate.candidate
      });
   } else {
      console.log('End of candidates.');
   }
}

function doCall() {
   var constraints = {
      'optional': [],
      'mandatory': {
         'MozDontOfferDataChannel': true
      }
   };
   // temporary measure to remove Moz* constraints in Chrome
   if (webrtcDetectedBrowser === 'chrome') {
      for (var prop in constraints.mandatory) {
         if (prop.indexOf('Moz') !== -1) {
            delete constraints.mandatory[prop];
         }
      }
   }
   constraints = mergeConstraints(constraints, sdpConstraints);
   console.log('Sending offer to peer, with constraints: \n' +
      '  \'' + JSON.stringify(constraints) + '\'.');
   webRTC.peerConn.createOffer(setLocalAndSendMessage, null, constraints);
}

function acceptIncomingCall(caller) {
   var data = {
      "caller": caller
   };
   var rendered = gisportal.templates['webrtc-inbound-call'](data);
   gisportal.showModalMessage(rendered, 20000); // user has 20 seconds to answer

   $('.js-answer-webrtc-call').click(function() { 
      // hide the message
      gisportal.hideModalMessage();
      // show the videos and controls
      $('.collaboration-video').toggleClass('hidden', false);
      // actually answer the call
      doAnswer(); 
   });
   $('.js-reject-webrtc-call').click(function() { 
      gisportal.hideModalMessage();
      hangup();
   });
}
function doAnswer() {
   console.log('Sending answer to peer.');
   webRTC.peerConn.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function mergeConstraints(cons1, cons2) {
   var merged = cons1;
   for (var name in cons2.mandatory) {
      merged.mandatory[name] = cons2.mandatory[name];
   }
   merged.optional.concat(cons2.optional);
   return merged;
}

function setLocalAndSendMessage(sessionDescription) {
   // Set Opus as the preferred codec in SDP if Opus is present.
   sessionDescription.sdp = preferOpus(sessionDescription.sdp);
   webRTC.peerConn.setLocalDescription(sessionDescription);
   sendMessage(sessionDescription);
}

function requestTurn(turn_url) {
   var turnExists = false;
   for (var i in webRTC.pc_config.iceServers) {
      if (webRTC.pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
         turnExists = true;
         webRTC.turnReady = true;
         break;
      }
   }
   if (!turnExists) {
      console.log('Getting TURN server from ', turn_url);
      // No TURN server. Get one from computeengineondemand.appspot.com:
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
         if (xhr.readyState === 4 && xhr.status === 200) {
            var turnServer = JSON.parse(xhr.responseText);
            console.log('Got TURN server: ', turnServer);
            webRTC.pc_config.iceServers.push({
               'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
               'credential': turnServer.password
            });
            webRTC.turnReady = true;
         }
      };
      xhr.open('GET', turn_url, true);
      xhr.send();
   }
}

function handleRemoteStreamAdded(event) {
   console.log('Remote stream added.');
   // reattachMediaStream(miniVideo, localVideo);
   $('.remote-video-div').toggleClass('hidden', false);
   attachMediaStream(remoteVideo, event.stream);
   remoteStream = event.stream;
   //  waitForRemoteVideo();
}

function handleRemoteStreamRemoved(event) {
   console.log('Remote stream removed. Event: ', event);
}

function hangup() {
   console.log('Hanging up.');
   gisportal.showModalMessage('Call ended');
   webRTC.stop();
   sendMessage('bye');
}

function handleRemoteHangup() {
   console.log('Session terminated.');
   gisportal.showModalMessage('Call ended');
   webRTC.stop();
   webRTC.isInitiator = false;
}

webRTC.stop = function() {
   $('.collaboration-video').toggleClass('hidden', true);
   $('.remote-video-div').toggleClass('hidden', true);
   
   webRTC.isStarted = false;
   webRTC.peerConn.close();
   webRTC.peerConn = null;
};

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
   var sdpLines = sdp.split('\r\n');
   var mLineIndex;
   // Search for m line.
   for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
         mLineIndex = i;
         break;
      }
   }
   if (mLineIndex === null) {
      return sdp;
   }

   // If Opus is available, set it as the default in m line.
   for (i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('opus/48000') !== -1) {
         var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
         if (opusPayload) {
            sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
         }
         break;
      }
   }

   // Remove CN in m line and sdp.
   sdpLines = removeCN(sdpLines, mLineIndex);

   sdp = sdpLines.join('\r\n');
   return sdp;
}

function extractSdp(sdpLine, pattern) {
   var result = sdpLine.match(pattern);
   return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
   var elements = mLine.split(' ');
   var newLine = [];
   var index = 0;
   for (var i = 0; i < elements.length; i++) {
      if (index === 3) { // Format of media starts from the fourth.
         newLine[index++] = payload; // Put target payload to the first.
      }
      if (elements[i] !== payload) {
         newLine[index++] = elements[i];
      }
   }
   return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
   var mLineElements = sdpLines[mLineIndex].split(' ');
   // Scan from end for the convenience of removing an item.
   for (var i = sdpLines.length - 1; i >= 0; i--) {
      var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
      if (payload) {
         var cnPos = mLineElements.indexOf(payload);
         if (cnPos !== -1) {
            // Remove CN payload from m line.
            mLineElements.splice(cnPos, 1);
         }
         // Remove CN line in sdp
         sdpLines.splice(i, 1);
      }
   }

   sdpLines[mLineIndex] = mLineElements.join(' ');
   return sdpLines;
}

