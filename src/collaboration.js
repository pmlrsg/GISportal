collaboration = {};

collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false; // indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible

// socket.io location settings
collaboration.protocol = gisportal.config.collaborationFeatures.protocol || 'http'; // 'http' or 'https'; the connection is automagically upgraded to a websocket connection
collaboration.host = gisportal.config.collaborationFeatures.host || 'localhost';
collaboration.port = gisportal.config.collaborationFeatures.port || '';
collaboration.path = gisportal.config.collaborationFeatures.path || ''; // optional path; must start with a /

// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration'; // the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console'; // the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.historyConsole = '.js-collaboration-history'; // a div that historical message log is appended to
collaboration.statusMessage = '.js-collaboration-status-msg'; // element where the status message is displayed
collaboration.statusIcon = '.js-collaboration-status-icon'; // element where the status icon is displayed
collaboration.displayLog = true; // if true the history is shown in `collaboration.historyConsole`

collaboration.active = false;
collaboration.role = '';

collaboration.initDOM = function() {
   // line up the URL 
   collaboration.socket_url = collaboration.protocol + '://' + collaboration.host + ':' + collaboration.port + collaboration.path;

   $('[data-panel-name="collaboration"]').toggleClass('hidden', false);
   var rendered = gisportal.templates['collaboration']
   $('.js-collaboration-holder').html(rendered);

}



collaboration.initSession = function() {

      collaboration.initWebRTC();

      // get the socket.io script and open a connection
      $.getScript(collaboration.socket_url + "/node/socket.io/socket.io.js")
         .done(function(script, textStatus) {
            socket = io.connect(collaboration.socket_url + '/', {
               "connect timeout": 1000
            });

            // -------------------------------------------------
            // socket core event functions
            // -------------------------------------------------
            socket.on('connect', function() {
               collaboration.active = true;
               collaboration.setStatus('connected', 'Ready')

               if (typeof collaboration.roomId != 'undefined') {
                  collaboration.joinRoom(collaboration.roomId);
               }
            });

            socket.on('connect_error', function(reason) {
               collaboration.setStatus('error', 'Could not connect to server; ' + reason);
            });

            socket.on('disconnect', function(reason) {
               collaboration.active = false;
               collaboration.setStatus('error', 'Unexpectedly disconnected, trying to reconnect...');
            });

            // doesn't appear to work as the reconnect timeout is incrementally increased with each attempt; might have to monitor it outside of socket.io
            socket.on('reconnect_error', function(reason) {
               collaboration.setStatus('error', 'Could not re-establish a connection, sorry');
            });

            socket.on('error', function(reason) {
               collaboration.active = false;
               if (reason == 'handshake error') { // user not logged into Google
                  $(collaboration.consoleWrapper).toggleClass('hidden', true);
                  $(collaboration.authenticationWrapper).toggleClass('hidden', false);
                  window.open(collaboration.socket_url + '/auth/google');
               } else {
                  collaboration.setStatus('error', 'The connection failed; ' + reason);
                  // reset the iframe
                  var rendered = gisportal.templates['collaboration']
                  $('.js-collaboration-holder').html('').html(rendered);
               }

            });

            // -------------------------------------------------
            // room and user management
            // -------------------------------------------------

            socket.on('room.invalid-id', function(data) {
               console.log('invalid Room Id requested');
               var iframe = $('iframe');
               $('.js-room-id-message', iframe.contents()).html('The collaboration reference you entered does not exist, please check and try again').removeClass('hidden').addClass('error');
               $('#roomId', iframe.contents()).addClass('error');
            });

            socket.on('room.created', function(data) {
               var roomId = data.roomId;
               console.log('Room created: ' + data.roomId);
               collaboration.roomId = data.roomId;

               collaboration.setStatus('connected', 'Connected. You are the Presenter');

               // load the room template
               collaboration.buildMembersList(data);

               isInitiator = true;
            });

            socket.on('room.member-joined', function(data) {
               console.log('member joined room');

               // is this confirmation that I have joined?
               if (data.sessionId == socket.io.engine.id) { // yes, so set the role, status and show the room details
                  collaboration.roomId = data.roomId;
                  collaboration.role = 'member';
                  collaboration.setStatus('connected', 'Connected. You are in room ' + data.roomId.toUpperCase());

                  isChannelReady = true;
               }

               // if I am the presenter send my state so that the new member can catch up
               if (collaboration.role == 'presenter') {
                  var state = gisportal.saveState();
                  var params = {
                     "event": "room.presenter-state-update",
                     "state": state
                  }
                  collaboration._emit('c_event', params)
               }
               // load/update the member listings
               collaboration.buildMembersList(data);
            });

            socket.on('room.member-left', function(data) {
               console.log('member left room');
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
            })

            // -------------------------------------------------
            // socket collaboration event functions
            // -------------------------------------------------

            // sets the value of an element using the element's id
            socket.on('setValueById', function(data) {
               var params = data.params;
               collaboration.log(data.presenter + ': ' + params.logmsg);
               if (collaboration.role == "member") {
                  //console.log('setting value by id');
                  $('#' + params.id).val(params.value);
                  $('#' + params.id).trigger('change');
               }
            });

            socket.on('configurepanel.scroll', function(data) {
               if (collaboration.role == "member") {
                  $('#configurePanel').scrollTop(data.params.scrollTop);
               }
            })

            socket.on('date.selected', function(data) {
               var date = new Date(data.params.date);

               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-current-date'));
                  gisportal.timeline.setDate(date);
               }
               collaboration.log('Date changed to ' + date);
            })

            socket.on('date.zoom', function(data) {
               var startDate = new Date(data.params.startDate);
               var endDate = new Date(data.params.endDate);

               if (collaboration.role == "member") {
                  collaboration.highlightElement($('#timeline'));
                  gisportal.timeline.zoom(startDate, endDate);
               }
               collaboration.log('Timeline zoom changed');
            })

            socket.on('ddslick.open', function(data) {
               if (collaboration.role == "member") {
                  var obj = $('#' + data.params.obj);
                  collaboration.highlightElement(obj);
                  obj.ddslick('open');
               }
               collaboration.log(obj + ' drop down opened');
            })

            socket.on('ddslick.close', function(data) {
               if (collaboration.role == "member") {
                  var obj = $('#' + data.params.obj);
                  collaboration.highlightElement(obj);
                  obj.ddslick('close');
               }
               collaboration.log(obj + ' drop down closed');
            })

            socket.on('ddslick.selectIndex', function(data) {
               if (collaboration.role == "member") {
                  var obj = $('#' + data.params.obj);
                  var index = data.params.index;
                  collaboration.highlightElement(obj.find('li:nth-of-type(' + index + ')'));
                  obj.ddslick('select', {
                     "index": index
                  });
               }
               collaboration.log(obj + ' selectedIndex: ' + index);
            })

            socket.on('indicatorspanel.scroll', function(data) {
               if (collaboration.role == "member") {
                  $('#indicatorsPanel').scrollTop(data.params.scrollTop);
               }
            })

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
               collaboration.log(data.presenter + ': Layer hidden - ' + data.params.layerName);
               if (collaboration.role == "member") {
                  gisportal.indicatorsPanel.hideLayer(data.params.id);
               }
            });

            // layer selected
            socket.on('layer.remove', function(data) {
               console.log('layer.remove received');
               console.log(data);

               collaboration.log(data.presenter + ': Layer removed - ' + data.params.layerName);
               if (collaboration.role == "member") {
                  gisportal.indicatorsPanel.removeFromPanel(data.params.id);
               }
            });

            // layer order changed
            socket.on('layer.reorder', function(data) {
               var newLayerOrder = data.params.newLayerOrder;
               var ul = $('ul.js-indicators');

               collaboration.log(data.presenter + ': Layers re-ordered: ' + newLayerOrder);
               if (collaboration.role == "member") {
                  for (var i = newLayerOrder.length; i > -1; i--) {
                     var li = $('.indicator-header').parent('[data-id="' + newLayerOrder[i] + '"]');
                     li.remove(); // take it out of its current position 
                     ul.prepend(li).hide().slideDown(); // and put it back at the start of the list
                  }
                  gisportal.indicatorsPanel.reorderLayers();
               }
            });

            // layer selected
            socket.on('layer.select', function(data) {
               // console.log('layer.select received');
               // console.log(data);

               collaboration.log(data.presenter + ': New layer added - ' + data.params.layerName);
               if (collaboration.role == "member") {
                  gisportal.indicatorsPanel.selectLayer(data.params.id);
               }
            });

            // layer shown
            socket.on('layer.show', function(data) {
               collaboration.log(data.presenter + ': Layer un-hidden - ' + data.params.layerName);
               if (collaboration.role == "member") {
                  gisportal.indicatorsPanel.showLayer(data.params.id);
               }
            });

            // map Move
            socket.on('map.move', function(data) {
               var params = data.params;
               collaboration.log(data.presenter + ': Map centred to ' + params.centre + ', with a zoom of ' + params.zoom);
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
               var p = data.params.panelName
               collaboration.log(data.presenter + ': Panel selected - ' + data.params.layerName);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('[data-panel-name="' + p + '"].tab'))
                  gisportal.panels.showPanel(p);
               }
            });

            // autoscale
            socket.on('scalebar.autoscale', function(data) {
               $(collaboration.historyConsole).prepend(data.presenter + ': Auto Scale - ' + data.params.layerName);
               if (collaboration.role == "member") {
                  gisportal.scalebars.autoScale(data.params.id, data.params.force);
               }
            });

            // autoscale checkbox clicked
            socket.on('scalebar.autoscale-checkbox', function(data) {
               var id = data.params.id;
               var isChecked = data.params.isChecked;

               $(collaboration.historyConsole).prepend(data.presenter + ': Auto Scale checkbox checked: ' + isChecked);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-auto[data-id="' + id + '"]').parent())
                  $('.js-auto[data-id="' + id + '"]').prop('checked', isChecked);
               }
            });

            // Logarithmis checkbox clicked
            socket.on('scalebar.log-set', function(data) {
               var id = data.params.id;
               var isLog = data.params.isLog;

               $(collaboration.historyConsole).prepend(data.presenter + ': Logarithmic checkbox checked: ' + isLog);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-indicator-is-log[data-id="' + id + '"]').parent())
                  $('.js-indicator-is-log[data-id="' + id + '"]').prop('checked', isLog);
                  gisportal.indicatorsPanel.scalebarRangeChanged($('.js-indicator-is-log[data-id="' + id + '"]'));
               }
            });

            // Maximum scalebar value set
            socket.on('scalebar.max-set', function(data) {
               var id = data.params.id;
               var value = data.params.value;

               $(collaboration.historyConsole).prepend(data.presenter + ': Maximum set to ' + value);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-scale-max[data-id="' + id + '"]'));
                  $('.js-scale-max[data-id="' + id + '"]').val(value).change();
                  gisportal.indicatorsPanel.scalebarRangeChanged($('.js-scale-max[data-id="' + id + '"]'))
               }
            });

            // Minimum scalebar value set
            socket.on('scalebar.min-set', function(data) {
               var id = data.params.id;
               var value = data.params.value;

               $(collaboration.historyConsole).prepend(data.presenter + ': Minimum set to ' + value);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-scale-min[data-id="' + id + '"]'));
                  $('.js-scale-min[data-id="' + id + '"]').val(value).change();
                  gisportal.indicatorsPanel.scalebarRangeChanged($('.js-scale-min[data-id="' + id + '"]'));
               }
            });

            // Layer opacity value changed
            socket.on('scalebar.opacity', function(data) {
               var id = data.params.id;
               var value = data.params.value;

               if (typeof value != 'undefined') {
                  var opacity = value * 100;

                  $(collaboration.historyConsole).prepend(data.presenter + ': Opacity set to ' + value);
                  if (collaboration.role == "member") {
                     collaboration.highlightElement($('#tab-' + id + '-opacity'));

                     $('#tab-' + id + '-opacity').val(opacity)
                     gisportal.layers[id].setOpacity(value)
                  }
               }

            });

            // reset scalebar
            socket.on('scalebar.reset', function(data) {
               collaboration.log(data.presenter + ': Scalebar was reset');
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-reset[data-id="' + data.params.id + '"]'));
                  $('.js-reset[data-id="' + data.params.id + '"] span').click();
               }
            });

            // search value changed
            socket.on('search.typing', function(data) {
               var searchValue = data.params.searchValue;
               collaboration.log(data.presenter + ': search term: ' + searchValue);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('.js-search'));
                  $('.js-search').val(searchValue);
                  gisportal.configurePanel.search(searchValue);
               }
            });

            // search cancelled
            socket.on('search.cancel', function(data) {
               collaboration.log(data.presenter + ': search cancelled');
               if (collaboration.role == "member") {
                  $('.js-search-results').css('display', 'none');
               }
            });

            // search value changed
            socket.on('search.resultselected', function(data) {
               var searchResult = data.params.searchResult;
               collaboration.log(data.presenter + ': search result selected: ' + searchResult);
               if (collaboration.role == "member") {
                  gisportal.configurePanel.toggleIndicator(searchResult, '');
                  $('.js-search-results').css('display', 'none');
               }
            });

            // Layer tab selected
            socket.on('tab.select', function(data) {
               var layerId = data.params.layerId;
               var tabName = data.params.tabName;
               collaboration.log(data.presenter + ': ' + tabName + ' selected for ' + layerId);
               if (collaboration.role == "member") {
                  collaboration.highlightElement($('[data-tab-name="' + tabName + '"]'));
                  gisportal.indicatorsPanel.selectTab(layerId, tabName);
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

            // WebRTC gubbins...
            socket.on('RTCmessage', function(message) {
               console.log('Client received message:', message);
               collaboration.RTCMessageCallback(message);
            });
         })
         .fail(function(jqxhr, settings, exception) {
            $(collaboration.statusMessage).html('Could not connect to server; the response was \'' + exception + '\' - <a href="javascript:collaboration.initSession();">try again</a>');
         });
   } // end initSession

collaboration.startNewRoom = function() {
   collaboration.role = 'presenter';
   collaboration._emit('room.new');
}

collaboration.joinRoom = function(roomId) {
   collaboration._emit('room.join', roomId.toLowerCase(), true);
}

collaboration.buildMembersList = function(data) {
   var rendered = gisportal.templates['collaboration-room'](data)
   $('.js-collaboration-holder').html('').html(rendered);

   // add events to the various action links
   $('.js-leave-room').click(function() {
      socket.disconnect();
      collaboration.roomId = undefined;

      var rendered = gisportal.templates['collaboration']
      $('.js-collaboration-holder').html('').html(rendered);

      collaboration.setStatus('error', 'You have left the room');
      setTimeout(function() {
         $('.collaboration-status').remove()
      }, 3000);
   });

   if (collaboration.role == 'presenter') {
      // add a link to other members to allow you to make them presenter
      $('.person').each(function() {
         var id = $(this).data('id');
         var link = $('<a href="javascript:void(0)" class="js-make-presenter" title="Make this person the presenter" data-id="' + id + '"></a>')
         $(this).prepend(link);
      });

      $('.js-make-presenter').click(function() {
         var id = $(this).data('id');
         collaboration._emit('room.make-presenter', id);
      })
   }

   // call button
   $('.js-start-rtc').click(function() {
      var id = $(this).parent().data('id');
      collaboration.initWebRTC();
   })
}

collaboration.setValueById = function(id, value, logmsg) {
   var params = {
      "id": id,
      "value": value,
      "logmsg": logmsg
   };
   collaboration._emit('setValueById', params)
}

collaboration.setUserSavedState = function() {
   var params = gisportal.saveState();
   console.log(params);
   collaboration._emit('setSavedState', params);
}

// This is the function actually sends the message if the collaboration is active and the user is the presenter
collaboration._emit = function(cmd, params, force) {
   if (collaboration.active && (collaboration.role == "presenter" || force)) {
      socket.emit(cmd, params);
   }
}

collaboration.userAuthorised = function() {
   console.log('user authorised');

   // add the collaboration template into the mix...
   var rendered = gisportal.templates['collaboration']
   $('.js-collaboration-holder').html('').html(rendered);

   collaboration.initSession();
   return true;
}

collaboration.log = function(msg) {
   if (collaboration.displayLog) {
      $(collaboration.historyConsole).prepend('<p>' + msg + '</p>');
   }

}

collaboration.highlightElement = function(element) {
   element.addClass('highlight-click');
   setTimeout(function() {
      element.removeClass('highlight-click');
   }, 500);
}

collaboration.setStatus = function(icon, message) {
   if ($('.collaboration-status').length == 0) {
      var statusMsg = gisportal.templates['collaboration-status']
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
}

// *****************************************************************************
//    WebRTC functions
// *****************************************************************************

collaboration.initWebRTC = function() {

   var startTime;
   collaboration.localVideo = document.getElementById('localVideo');
   collaboration.remoteVideo = document.getElementById('remoteVideo');

   collaboration.peerConfig = {
      'iceServers': [{
         'url': 'stun:stun.l.google.com:19302'
      }]
   };

   var constraints = {
      video: true,
      audio: true
   };

   getUserMedia(constraints, handleUserMedia, handleUserMediaError);
   console.log('Getting user media with constraints', constraints);

}
var pc_config = webrtcDetectedBrowser === 'firefox' ? {
      'iceServers': [{
         'url': 'stun:23.21.150.121'
      }]
   } : // number IP
   {
      'iceServers': [{
         'url': 'stun:stun.l.google.com:19302'
      }]
   };

var pc_constraints = {
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

var isChannelReady;
var isInitiator;
var isStarted;
var peerConn;
var turnReady;

collaboration.RTCMessageCallback = function(message) {
   console.log('Received message:', message);
   if (message === 'got user media') {
      maybeStart();
   } else if (message.type === 'offer') {
      if (!isInitiator && !isStarted) {
         maybeStart();
      }
      peerConn.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
   } else if (message.type === 'answer' && isStarted) {
      peerConn.setRemoteDescription(new RTCSessionDescription(message));
   } else if (message.type === 'candidate' && isStarted) {
      var candidate = new RTCIceCandidate({
         sdpMLineIndex: message.label,
         candidate: message.candidate
      });
      peerConn.addIceCandidate(candidate);
   } else if (message === 'bye' && isStarted) {
      handleRemoteHangup();
   }
};


function sendMessage(message){
   console.log('Sending message: ', message);
  collaboration._emit('RTCmessage', message, true);
}
function handleUserMedia(stream) {
   localStream = stream;
   attachMediaStream(localVideo, stream);
   isChannelReady = true;
   console.log('Adding local stream.');
   sendMessage('got user media');
   if (isInitiator) {
      maybeStart();
   }
}

function handleUserMediaError(error) {
   console.log('getUserMedia error: ', error);
}

// if (location.hostname != "localhost") {
//    requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
// }

function maybeStart() {
   if (!isStarted && localStream && isChannelReady) {
      // show the videos and controls
      $('.collaboration-video').toggleClass('hidden', false);

      createPeerConnection();
      peerConn.addStream(localStream);
      isStarted = true;
      if (isInitiator) {
         doCall();
      }
   }
}

window.onbeforeunload = function(e) {
   sendMessage('bye');
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
   try {
      peerConn = new RTCPeerConnection(pc_config, pc_constraints);
      peerConn.onicecandidate = handleIceCandidate;
      console.log('Created RTCPeerConnnection with:\n' +
         '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
         '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
   } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
   }
   peerConn.onaddstream = handleRemoteStreamAdded;
   peerConn.onremovestream = handleRemoteStreamRemoved;

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
   peerConn.createOffer(setLocalAndSendMessage, null, constraints);
}

function doAnswer() {
   console.log('Sending answer to peer.');
   peerConn.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
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
   peerConn.setLocalDescription(sessionDescription);
   sendMessage(sessionDescription);
}

function requestTurn(turn_url) {
   var turnExists = false;
   for (var i in pc_config.iceServers) {
      if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
         turnExists = true;
         turnReady = true;
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
            pc_config.iceServers.push({
               'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
               'credential': turnServer.password
            });
            turnReady = true;
         }
      };
      xhr.open('GET', turn_url, true);
      xhr.send();
   }
}

function handleRemoteStreamAdded(event) {
   console.log('Remote stream added.');
   // reattachMediaStream(miniVideo, localVideo);
   attachMediaStream(remoteVideo, event.stream);
   remoteStream = event.stream;
   //  waitForRemoteVideo();
}

function handleRemoteStreamRemoved(event) {
   console.log('Remote stream removed. Event: ', event);
}

function hangup() {
   console.log('Hanging up.');
   stop();
   sendMessage('bye');
}

function handleRemoteHangup() {
   console.log('Session terminated.');
   $('.collaboration-video').toggleClass('hidden', true);
   $('.overlay-message').text('Call ended');
   $('.js-collaboration-popup').toggleClass('hidden', false);
   setTimeout(function() {
      $('.js-collaboration-popup').toggleClass('hidden', true)
   }, 2000);
   stop();
   isInitiator = false;
}

function stop() {
   isStarted = false;
   // isAudioMuted = false;
   // isVideoMuted = false;
   peerConn.close();
   peerConn = null;
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

