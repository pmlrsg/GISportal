// *****************************************************************************
//    WebRTC functions
// *****************************************************************************

var webRTC = {};

webRTC.isChannelReady = false;
webRTC.isInitiator = false;
webRTC.isStarted = false;
webRTC.turnReady = false;
webRTC.remoteStreams = {};

webRTC.initMedia = function() {
   // Gets the audio and video
   var constraints = {
      video: true,
      audio: true
   };
   navigator.mediaDevices.getUserMedia(constraints).then(handleUserMedia).catch(handleUserMediaError);
   $('.js-end-webrtc-call').off('click');
   $('.js-end-webrtc-call').on('click', function() { 
      hangup();
   });
};

webRTC.deinitMedia = function() {
   hangup();
   sendMessage('media.disabled');
   webRTC.isChannelReady = false;
   $('.js-toggle-rtc').find('.btn-value').text('Enable Audio/Video');
   webRTC.localStream.getTracks().forEach(function(track) { track.stop(); });
   webRTC.stop();
};

webRTC.pc_constraints = {
   'optional': [{
      'DtlsSrtpKeyAgreement': true
   }, {
      'RtpDataChannels': true
   }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
   mandatory: {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
   }
};



webRTC.messageCallback = function(data) {
   var message = data.params.message;
   var memberId;
   
   // USER ENABLES THEIR AUDIO/VIDEO
   if (message === 'media.enabled') {
      // update the user who's media was enabled with an 'available status'
      memberId = data.socketId;
      $('[data-id="' + memberId + '"] .js-webrtc-call').toggleClass('hidden', false);

      // then start?
      maybeStart();

   } 

   // USER DISABLES THEIR AUDIO/VIDEO
   if (message === 'media.disabled') {
      // update the user who's media was disabled 
      memberId = data.socketId;
      $('[data-id="' + memberId + '"] .js-webrtc-call').toggleClass('hidden', true);
      
   } 

   // AN OFFER 
   if (message.type === 'offer') {
      var for_me = false;
      if(data.params.peerId == socket.io.engine.id){
         for_me = true;
      }
      if(for_me && (webRTC.isStarted || !$('.js-modal-message-popup').hasClass('hidden'))){
         sendMessage({
         type: 'callee_busy',
         sender: data.sender
      });
         return false;
      }
      if (!webRTC.isInitiator && !webRTC.isStarted && for_me) {
         maybeStart();
      }
      if(for_me){
         if(data.params.peerMedia){
            webRTC.peerMedia = data.params.peerMedia;
         }
         webRTC.peerConn.setRemoteDescription(new RTCSessionDescription(message));
      }
      if (!webRTC.isInitiator && for_me) {
         webRTC.peerId = data.socketId;
         acceptIncomingCall(data.sender_name);
      }
   } 

   // THE CALLEE ANSWERS
   if (message.type === 'answer' && webRTC.isStarted) {
      gisportal.hideModalMessage();
      if(data.params.peerId == socket.io.engine.id && data.params.peerMedia){
         webRTC.peerMedia = data.params.peerMedia;
         addLocalVideoStream();
      }
      webRTC.peerConn.setRemoteDescription(new RTCSessionDescription(message));
      collaboration.showVideoButtons();
   } 

   // A CANDIDATE IS ADDED
   if (message.type === 'candidate' && webRTC.isStarted) {
      var candidate = new RTCIceCandidate({
         sdpMLineIndex: message.label,
         candidate: message.candidate
      });
      webRTC.peerConn.addIceCandidate(candidate);
   } 

   // This makes sure that the call is only ended or rejecteed if it is meant for this user
   if(data.socketId != webRTC.peerId){
      return false;
   }
   // OTHER END HANGS UP
   if (message === 'bye' && (webRTC.isStarted || !$('.js-modal-message-popup').hasClass('hidden'))) {
      handleRemoteHangup('Call Ended');
   }

   // OTHER END REJECTS
   if (message === 'reject' && webRTC.isStarted) {
      handleRemoteHangup('Call Rejected');
   }

   // OTHER END DOESN'T ANSWER
   if (message === 'no_answer' && webRTC.isStarted) {
      handleRemoteHangup('No Answer');
   }

   // OTHER END is busy
   if (message.type === 'callee_busy' && webRTC.isStarted && gisportal.user.info.email == message.sender) {
      handleRemoteHangup('User Busy');
   }
};


function sendMessage(message){
   var params = {
      'event': 'webrtc_event',
      'message': message,
      'peerId': webRTC.peerId,
      'peerMedia': {video: webRTC.hasVideo, audio: webRTC.hasAudio}
   };
   collaboration._emit('webrtc_event', params, true);
   
}
function handleUserMedia(stream) {
   webRTC.localStream = stream;
   webRTC.isChannelReady = true;
   sendMessage('media.enabled');
   $('.js-toggle-rtc').find('.btn-value').text('Disable Audio/Video');
}

function attachMediaStream(elements, stream) {
   for(var elem in elements){
      var element = elements[elem];
      if (typeof element.srcObject !== 'undefined') {
         element.srcObject = stream;
      } else if (typeof element.mozSrcObject !== 'undefined') {
         element.mozSrcObject = stream;
      } else{
         element.src = URL.createObjectURL(stream);
      }
   }
}

function addLocalVideoStream(){
   var localVideo = $('.localVideo[data-id="' + socket.io.engine.id + '"]');
   if(webRTC.hasVideo){
      localVideo.toggleClass('hidden', false);
   }
   attachMediaStream(localVideo, webRTC.localStream);
}

function addRemoteVideoStream(peerId){
   var remoteVideo = $('.remoteVideo[data-id="' + peerId + '"]');
   if(webRTC.peerMedia.video){
      remoteVideo.toggleClass('hidden', false);
   }
   attachMediaStream(remoteVideo, webRTC.remoteStreams[peerId]);
}

function handleUserMediaError(error) {
   webRTC.localStream = undefined;
   webRTC.isChannelReady = false;
   sendMessage('media.disabled');
   $('.js-toggle-rtc').find('.btn-value').text('Enable Audio/Video');
   $.notify("Error Getting Media: " + (error.message || "Internal Error") + "\nPlease try again");
}

function maybeStart() {
   if (!webRTC.isStarted && webRTC.localStream && webRTC.isChannelReady) {
      createPeerConnection();
      webRTC.peerConn.addStream(webRTC.localStream);
      if (webRTC.isInitiator) {
         webRTC.isStarted = true;
         $('.js-webrtc-call').toggleClass('hidden', true);
         doCall();
         // show the videos and controls
         collaboration.showVideoButtons();
         $('.local-display-div').toggleClass('hidden', !webRTC.hasVideo);
         var hide = false;
         if(webRTC.peerMedia){
            hide = !webRTC.peerMedia.video;
         }
      }
   }
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
   try {
      webRTC.peerConn = new RTCPeerConnection(webRTC.pc_config, webRTC.pc_constraints);
      webRTC.peerConn.onicecandidate = handleIceCandidate;
   } catch (e) {
      alert('Cannot create RTCPeerConnection object.');
      return;
   }
   webRTC.peerConn.onaddstream = handleRemoteStreamAdded;

}

function handleIceCandidate(event) {
   if (event.candidate) {
      sendMessage({
         type: 'candidate',
         label: event.candidate.sdpMLineIndex,
         id: event.candidate.sdpMid,
         candidate: event.candidate.candidate
      });
   }
}

// Needed as the offer needs an error function.
function handlePeerConnError(err) {
   return false;
}

function doCall() {
   webRTC.peerConn.createOffer(setLocalAndSendMessage, handlePeerConnError, sdpConstraints);
}

function acceptIncomingCall(caller) {
   var data = {
      "caller": caller
   };
   var rendered = gisportal.templates['webrtc-inbound-call'](data);
   gisportal.showModalMessage(rendered, 20000, answerTimeout=true); // user has 20 seconds to answer
   webRTC.playRingtone();

   $('.js-answer-webrtc-call').click(function() { 
      // hide the message
      gisportal.hideModalMessage();
      // show the videos and controls
      $('.local-display-div').toggleClass('hidden', !webRTC.hasVideo);
      var hide = false;
      if(webRTC.peerMedia){
         hide = !webRTC.peerMedia.video;
      }
      // actually answer the call
      doAnswer();
   });
   $('.js-reject-webrtc-call').click(function() { 
      gisportal.hideModalMessage();
      doReject();
   });
}

function doAnswer() {
   gisportal.panels.showPanel('collab-video');
   webRTC.stopRingtone();
   clearTimeout(gisportal.modalTimeout);
   $('.js-webrtc-call').toggleClass('hidden', true);
   webRTC.peerConn.createAnswer(setLocalAndSendMessage, handlePeerConnError, sdpConstraints);
   webRTC.isStarted = true;
   addLocalVideoStream();
   var remoteVideo = $('.remoteVideo[data-id="' + webRTC.peerId + '"]');
   collaboration.showVideoButtons();
   if(webRTC.peerMedia.video){
      remoteVideo.toggleClass('hidden', false);
   }
}

function doReject() {
   webRTC.stopRingtone();
   clearTimeout(gisportal.modalTimeout);
   hideVideos();
   sendMessage('reject');
}

function doNoAnswer() {
   webRTC.stopRingtone();
   sendMessage('no_answer');
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

function handleRemoteStreamAdded(event) {
   var hide = false;
   if(webRTC.peerMedia){
      hide = !webRTC.peerMedia.video;
   }
   var remoteVideo = $('.remoteVideo[data-id="' + webRTC.peerId + '"]');
   if(webRTC.isStarted && webRTC.peerMedia.video){
      remoteVideo.toggleClass('hidden', false);
   }
   attachMediaStream(remoteVideo, event.stream);
   webRTC.remoteStreams[webRTC.peerId] = event.stream;
}

function hangup() {
   if(webRTC.isStarted){
      gisportal.showModalMessage('Call ended');
      webRTC.stop();
      webRTC.isInitiator = false;
      webRTC.peerMedia = {};
      sendMessage('bye');
      $('.js-webrtc-call').toggleClass('hidden', false);
      hideVideos();
   }
}

function handleRemoteHangup(message) {
   webRTC.stopRingtone();
   gisportal.showModalMessage(message);
   webRTC.stop();
   webRTC.isInitiator = false;
   webRTC.peerMedia = {};
   $('.js-webrtc-call').toggleClass('hidden', false);
}

webRTC.stop = function() {
   $('.collaboration-video').toggleClass('hidden', true);
   $('.remote-video-div').toggleClass('hidden', true);
   hideVideos();
   
   webRTC.isStarted = false;
   if(webRTC.peerConn){
      webRTC.peerConn.close();
      webRTC.peerConn = null;
   }
};

function hideVideos(){
   $('.collab-call-vid').toggleClass('hidden', true)
      .each(function(){
         this.src = "";
      });
}

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

webRTC.playRingtone = function(){
   var tone = $('.ringtone')[0];
   try{
      tone.play();
   }catch(e){}
};

webRTC.stopRingtone = function(){
   var tone = $('.ringtone')[0];
   try{
      tone.pause();
      tone.currentTime = 0;
   }catch(e){}
};