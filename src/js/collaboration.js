
collaboration = {};


// jquery selectors for various control elements
collaboration.startButton = '.js-start-collaboration';							// the button to initiate a collaboration session
collaboration.consoleWrapper = '.js-collaboration-console';						// the containing div that includes the status message, history console, and other collaboration elements only visible when connected
collaboration.statusMessage = '.js-collaboration-status-msg';					// element where the status message is displayed
collaboration.statusIcon = '.js-collaboration-status-icon';                // element where the status icon is displayed
collaboration.displayLog = true;                                           // if true the history is shown in `collaboration.historyConsole`

collaboration.active = false;
collaboration.role = '';

collaboration.initDOM = function() {
      
   collaboration.enabled = gisportal.config.collaborationFeatures.enabled || false; // indicates whether collaboration is globally enabled; set to false and no collaboration features will be visible

   if(!collaboration.enabled){
      return;
   }

	$('[data-panel-name="collaboration"]').toggleClass('hidden', false);

   var rendered = gisportal.templates.collaboration();
   $('.js-collaboration-holder').html(rendered);

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
      $('.js-collab-message')
         .toggleClass('hidden', false)
         .toggleClass('alert-warning', true)
         .html('You have been invited to join room '+ roomId.toUpperCase() +'; please login to enter the room');
   }
};



collaboration.initSession = function() {

	// get the socket.io script and open a connection
	$.getScript("socket.io/socket.io.js")
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
					window.open('auth/google');
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
            var name = data.user.name || data.user.email;
            if(data.user.email != gisportal.user.info.email){
               collaboration.log(name + " has joined.");
            }
            // load/update the member listings
            collaboration.buildMembersList(data);
         });

         socket.on('room.member-left', function(data) {
            collaboration.log(data.departed +' has left the room');
            collaboration.buildMembersList(data);
         });

         socket.on('room.presenter-changed', function(data) {
            // am I now the presenter?
            for (var p in data.people) {
               var person = data.people[p];
               if (person.presenter && person.id == socket.io.engine.id) {
                  collaboration.role = "presenter";
                  collaboration.setStatus('connected', 'Connected. You are the presenter');
                  gisportal.showModalMessage('You are now the presenter');
                  break;
               } else {
                  collaboration.role = "member";
                  collaboration.setStatus('connected', 'Connected. .....');
               }
               if(person.presenter){
                  var pName = person.name || person.email;
                  collaboration.log("Presenter changed to " + pName);
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

         socket.on('configurepanel.scroll', function(data) {
            if (collaboration.role == "member") {
               var div = $('#configurePanel');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('mapsettingspanel.scroll', function(data) {
            if (collaboration.role == "member") {
               var div = $('#mapSettingsPanel');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('addLayersForm.scroll', function(data) {
            if (collaboration.role == "member") {
               var div = $('.overlay-container-form');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('slideout.scroll', function(data) {
            if (collaboration.role == "member") {
               var div = $('.js-slideout-content');
               var scrollPercent = data.params.scrollPercent;
               div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
            }
         });

         socket.on('addLayersForm.input', function(data) {
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

         socket.on('addLayersForm.close', function(data) {
            collaboration.log(data.presenter +': Add Layers Form Closed');
            if (collaboration.role == "member") {
               $('span.js-layer-form-close').trigger('click');
            }
         });

         socket.on('body.keydown', function(data) {
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
            var obj = $('#' + data.params.obj);
            if (collaboration.role == "member") {
               collaboration.highlightElement(obj);
               obj.ddslick('open');
            }
         });

         socket.on('ddslick.close', function(data) {
            var obj = $('#' + data.params.obj);
            if (collaboration.role == "member") {
               obj.ddslick('close');
            }
         });

         socket.on('ddslick.selectValue', function(data) {
            var obj = $('#' + data.params.obj);
            var value = data.params.value;
            if (collaboration.role == "member") {
               obj.ddslick('select', { "value": value });
            }
         });

   	  	socket.on('indicatorspanel.scroll', function(data) {
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
            collaboration.log(data.presenter +': Layer hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
               var id = data.params.id;
               gisportal.indicatorsPanel.hideLayer(id);
               collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
            }
         });

         // layer selected
		  	socket.on('layer.remove', function(data) {
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

         // layer shown
		  	socket.on('layer.show', function(data) {
		  		collaboration.log(data.presenter +': Layer un-hidden - '+ data.params.layerName);
            if (collaboration.role == "member") {
               var id = data.params.id;
            	gisportal.indicatorsPanel.showLayer(id);
               collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
            }
		  	});
                        
         // map Move
         socket.on('map.move', function(data) {
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
               collaboration.highlightElementRubber($('[data-panel-name="' + p + '"].tab'));
               gisportal.panels.showPanel(p);
            }
		  	});  

		  	// autoscale
         socket.on('scalebar.autoscale', function(data) {
            if (collaboration.role == "member") {
            	gisportal.scalebars.autoScale(data.params.id, data.params.force);
            }
		  	});

         // autoscale checkbox clicked
         socket.on('scalebar.autoscale-checkbox', function(data) {
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

		  	// reset scalebar
         socket.on('scalebar.reset', function(data) {
		  		collaboration.log(data.presenter +': Scalebar was reset');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-reset[data-id="'+ data.params.id +'"]'));
            	$('.js-reset[data-id="'+ data.params.id +'"]').click();
            }
		  	});            

         // search value changed
         socket.on('search.typing', function(data) {
            var searchValue = data.params.searchValue;
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.js-search'));
               $('.js-search').val(searchValue);
               gisportal.configurePanel.search(searchValue);
            }
         });

         // wms value changed
         socket.on('wms.typing', function(data) {
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
            var checked = data.params.checked;
            collaboration.log(data.presenter +': refreshCacheBox: ' + checked);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('#refresh-cache-box'));
               $('#refresh-cache-box')[0].checked = checked;
            }
         });

         // wms submitted
         socket.on('wms.submitted', function(data) {
            collaboration.log(data.presenter +': WMS submitted');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('button.js-wms-url'));
               $('button.js-wms-url').trigger('click');
            }
         });

         // more info clicked
         socket.on('moreInfo.clicked', function(data) {
            collaboration.log(data.presenter +': more info clicked');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('.more-info'));
               $('.more-info').trigger('click');
            }
         });

         // reset list clicked
         socket.on('resetList.clicked', function(data) {
            collaboration.log(data.presenter +': "Reset" clicked');
            if (collaboration.role == "member") {
               $('button#reset-list').trigger('click');
            }
         });

         // add layers form clicked
         socket.on('addLayersForm.clicked', function(data) {
            collaboration.log(data.presenter +': "Add layers" clicked');
            if (collaboration.role == "member") {
               collaboration.highlightElement($('button#js-add-layers-form'));
               $('button#js-add-layers-form').trigger('click');
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
            collaboration.log(data.presenter +': ' + tabName + ' tab selected for ' + layerId);
            if (collaboration.role == "member") {
               collaboration.highlightElement($('[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]'));
               gisportal.indicatorsPanel.selectTab( layerId, tabName );
            }
         });

         socket.on('paginator.selected', function(data) {
            collaboration.log(data.presenter +': Page ' + data.params.page + ' selected');
            if (collaboration.role == "member") {
               $('.js-go-to-form-page').find('a[data-page="' + data.params.page + '"]').trigger('click');
            }
         });

         socket.on('zoomToData.clicked', function(data) {
            var id = data.params.layer;
            collaboration.log(data.presenter +': Zoom to data clicked: ' + id);
            if (collaboration.role == "member") {
               var zoom_elem = $('.js-zoom-data[data-id="' + id + '"]');
               collaboration.highlightElement(zoom_elem);
               zoom_elem.trigger('click');
            }
         });

         socket.on('submitLayers.clicked', function(data) {
            collaboration.log(data.presenter +': "Submit Layers" clicked');
            if (collaboration.role == "member") {
               var submit_elem = $('.js-layers-form-submit');
               collaboration.highlightElement(submit_elem);
               submit_elem.trigger('click');
            }
         });

         socket.on('cancelChanges.clicked', function(data) {
            collaboration.log(data.presenter +': "Cancel Changes" clicked');
            if (collaboration.role == "member") {
               $('.js-layers-form-cancel').trigger('click');
            }
         });

         socket.on('toggleAllLayers.clicked', function(data) {
            collaboration.log(data.presenter +': "Copy to all" clicked');
            if (collaboration.role == "member") {
               var toggle_all_elem = $('.toggle-all-layers');
               collaboration.highlightElement(toggle_all_elem);
               toggle_all_elem.trigger('click');
            }
         });

         socket.on('addToAll.clicked', function(data) {
            collaboration.log(data.presenter +': "Add to all" clicked');
            if (collaboration.role == "member") {
               var field = data.params.field;
               var add_to_all_elem = $('.add-to-all-layers[data-field="' + field + '"]');
               collaboration.highlightElement(add_to_all_elem);
               add_to_all_elem.trigger('click');
            }
         });

         socket.on('addScalePointsToAll.clicked', function(data) {
            collaboration.log(data.presenter +': "Add Scale Points to all" clicked');
            if (collaboration.role == "member") {
               var add_to_all_elem = $('.scale-to-all-layers');
               collaboration.highlightElement(add_to_all_elem);
               add_to_all_elem.trigger('click');
            }
         });

         socket.on('addTagInput.clicked', function(data) {
            collaboration.log(data.presenter +': "Add Another Tag" clicked');
            if (collaboration.role == "member") {
               var add_tag_elem = $('.add-tag-input');
               collaboration.highlightElement(add_tag_elem);
               add_tag_elem.trigger('click');
            }
         });

         socket.on('userFeedback.close', function(data) {
            collaboration.log(data.presenter +': User feedback closed');
            if (collaboration.role == "member") {
               $('.js-user-feedback-close').trigger('click');
            }
         });

         socket.on('userFeedback.submit', function(data) {
            collaboration.log(data.presenter +': User feedback submitted');
            if (collaboration.role == "member") {
               $('.js-user-feedback-submit').trigger('click');
            }
         });

         socket.on('userFeedback.input', function(data) {
            if (collaboration.role == "member") {
               var input = data.params.inputValue;
               var input_elem = $('.user-feedback-input');
               input_elem.val(input);
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('drawBox.clicked', function(data) {
            collaboration.log(data.presenter +': "Draw Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-draw-box');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('drawPolygon.clicked', function(data) {
            collaboration.log(data.presenter +': "Draw Irregular Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-draw-polygon');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('selectPolygon.clicked', function(data) {
            collaboration.log(data.presenter +': "Select Existing Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-draw-select-polygon');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('removeGeoJSON.clicked', function(data) {
            collaboration.log(data.presenter +': "Delete Selected Polygon" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-remove-geojson');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('jsCoordinate.edit', function(data) {
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
            collaboration.log(data.presenter +': "Clear Selection" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-clear-selection');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('olDraw.click', function(data) {
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
            if (collaboration.role == "member") {
               gisportal.vectorLayer.getSource().clear();
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
            }
         });

         socket.on('olDraw.drawend', function(data) {
            var coordinates = data.params.coordinates;
            collaboration.log(data.presenter +': Polygon drawn');
            if (collaboration.role == "member") {
               var sketch = new ol.Feature({geometry:new ol.geom.Polygon(coordinates)});
               gisportal.selectionTools.ROIAdded(sketch);
               gisportal.vectorLayer.getSource().addFeature(sketch);
            }
         });

         socket.on('selectPolygon.hover', function(data) {
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

         socket.on('featureOverlay.removeType', function(data) {
            var overlayType = data.params.overlayType;
            collaboration.log(data.presenter +': Remove ' + overlayType);
            if (collaboration.role == "member") {
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, overlayType);
            }
         });

         socket.on('dataPopup.display', function(data) {
            var pixel = map.getPixelFromCoordinate(data.params.coordinate);
            if (collaboration.role == "member") {
               gisportal.displayDataPopup(pixel);
            }
         });

         socket.on('dataPopup.close', function(data) {
            if (collaboration.role == "member") {
               gisportal.dataReadingPopupCloser.click();
            }
         });

         socket.on('newPlot.clicked', function(data) {
            var id = data.params.id;
            collaboration.log(data.presenter +': "Make new graph" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-make-new-plot[data-id="' + id + '"]');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('addToPlot.clicked', function(data) {
            var id = data.params.id;
            collaboration.log(data.presenter +': "Add to graph" Clicked');
            if (collaboration.role == "member") {
               var button_elem = $('.js-add-to-plot[data-id="' + id + '"]');
               button_elem.trigger('click');
               collaboration.highlightElement(button_elem);
            }
         });

         socket.on('graphs.deleteActive', function(data) {
            collaboration.log(data.presenter +': Closed Plot');
            if (collaboration.role == "member") {
               gisportal.graphs.deleteActiveGraph();
            }
         });

         socket.on('slideout.togglePeak', function(data) {
            var slideoutName = data.params.slideoutName;
            collaboration.log(data.presenter +': Show panel: ' + slideoutName);
            if (collaboration.role == "member") {
               var clicked_elem = $('[data-slideout-name="' + slideoutName + '"] .js-slideout-toggle-peak');
               gisportal.panelSlideout.togglePeak(slideoutName);
               collaboration.highlightElement(clicked_elem);
            }
         });

         socket.on('graphTitle.edit', function(data) {
            var value = data.params.value;
            collaboration.log(data.presenter +': Title value set to: "' + value + '"');
            if (collaboration.role == "member") {
               var input_elem = $('.js-active-plot-title');
               input_elem.val(value);
               collaboration.highlightElement(input_elem);
            }
         });

         socket.on('graphType.edit', function(data) {
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

         socket.on('graphRange.change', function(data) {
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
            collaboration.log(data.presenter +': "Create Graph" clicked');
            if (collaboration.role == "member") {
               $('.js-create-graph').trigger('click');
            }
         });

         socket.on('graph.open', function(data) {
            var hash = data.params.hash;
            var open_elem = $('.js-graph-status-open[data-hash="' + hash + '"]');
            var title = open_elem.data('title');
            collaboration.log(data.presenter + ': "' + title + '": "Open" clicked');
            if (collaboration.role == "member") {
               open_elem.trigger('click');
            }
         });

         socket.on('graph.copy', function(data) {
            var hash = data.params.hash;
            var copy_elem = $('.js-graph-status-copy[data-hash="' + hash + '"]');
            var title = copy_elem.data('title');
            collaboration.log(data.presenter + ': "' + title + '": "Copy/Edit" clicked');
            if (collaboration.role == "member") {
               copy_elem.trigger('click');
            }
         });

         socket.on('graph.delete', function(data) {
            var hash = data.params.hash;
            var delete_elem = $('.js-graph-status-delete[data-hash="' + hash + '"]');
            var title = delete_elem.data('title') || "Graph";
            collaboration.log(data.presenter + ': "' + title + '": "Delete" clicked');
            if (collaboration.role == "member") {
               delete_elem.trigger('click');
            }
         });

         socket.on('graphPopup.close', function(data) {
            collaboration.log(data.presenter + ': Plot closed');
            if (collaboration.role == "member") {
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
      var notificationText = $(".notifyjs-gisportal-collab-notification-base div.title");

      if(notificationText.length === 0){
         $.notify({'title':msg, "hide-text":"Hide"},{style:"gisportal-collab-notification", autoHide:false});
      }else{
         notificationText.html(msg);
      }
      $(document).off('click', '.notifyjs-gisportal-collab-notification-base .hide-opt');
      $(document).one('click', '.notifyjs-gisportal-collab-notification-base .hide-opt', function(e) {
         e.preventDefault();
         collaboration.displayLog = false;
      });
   }

};

collaboration.highlightElement = function(element) {
   element.addClass('highlight-click');
   setTimeout(function() { element.removeClass('highlight-click'); }, 1000);
};

collaboration.highlightElementRubber = function(element) {
   element.addClass('highlight-rubber');
   setTimeout(function() { element.removeClass('highlight-rubber'); }, 1000);
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
