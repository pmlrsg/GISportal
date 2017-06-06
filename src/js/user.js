gisportal.user = {};
gisportal.user.info = {"email":"", "permission":"guest"};

gisportal.user.loggedIn = function(){
   gisportal.user.updateProfile(); // The user info is updated update the login change
   $('.logoutButton').click(function() {
      $.ajax({
         url: gisportal.middlewarePath + '/user/logout',
         success: function() {
            collaboration.active = false;
            collaboration.role = "";
            collaboration.diverged = false;
            if(socket){
               socket.disconnect();
            }
            gisportal.user.updateProfile(); // The user information is then reset back to defualts
            gisportal.user.initDOM();
            if(gisportal.config.collaborationFeatures.enabled){
               collaboration.initDOM();
            }
            if(collaboration && collaboration.roomId){
               // Makes sure the collaboration room is left to avoid bugs
               $('.js-leave-room').trigger('click');
            }
            $('.collaboration-status').toggleClass('hidden', true).html("");
         }
      });
   });
};


gisportal.user.initDOM = function() {
   $.ajax({
      url: gisportal.middlewarePath + '/user/dashboard/?domain=' + gisportal.niceDomainName,
      statusCode: {
         401: function() {    // the user isn't currently login so direct them at the login page instead
            $.ajax({
               url: gisportal.middlewarePath + '/user',
               success: function(data) {
                  $('.js-user-dashboard').html(data); 
                  $('.js-google-auth-button').click(function() {
                     window.top.open(gisportal.middlewarePath + '/user/auth/google','authWin','left=20,top=20,width=700,height=700,toolbar=1');
                  });
                  gisportal.walkthrough.loadWalkthroughList();
               },
            });
         },
         403: function() {    // the user isn't currently login so direct them at the login page instead
            $('[data-panel-name="user"]').toggleClass('hidden', true);
            gisportal.config.collaborationFeatures.enabled = false;
            $('[data-panel-name="collaboration"]').toggleClass('hidden', true);
            gisportal.noOAuth = true;
            gisportal.walkthrough.loadWalkthroughList();
         }
      },
      success: function(data) {
         $('.js-user-dashboard').html(data);
         gisportal.user.loggedIn();
         gisportal.walkthrough.loadWalkthroughList();
      },
   });
   var rendered = gisportal.templates.user();

   if(!gisportal.config.showTutorialLinks || gisportal.walkthrough.is_playing){
      $('.walkthrough-tutorial-btn').toggleClass('hidden', true);
   }
   
   $('.js-secondary-user-dashboard').html(rendered);
   if(gisportal.walkthrough.is_recording){
      $('.walkthrough-record').toggleClass("hidden", true);
      $('.walkthroughs-manage').toggleClass("hidden", true);
   }

   $('button.js-edit-layers').on('click', function(e){
      e.preventDefault();
      gisportal.editLayersForm.addSeverTable();
      var params = {
         "event" : "configureInternalLayers.clicked"
      };
      gisportal.events.trigger('configureInternalLayers.clicked', params);
   });

   $('button.js-edit-groups').on('click', function() {
      gisportal.editGroups.loadTable();
   });

   $('#refresh-cache-box').on('change', function(){
      var checked = $(this).is(':checked');
      var params = {
         "event" : "refreshCacheBox.clicked",
         "checked" : checked
      };
      gisportal.events.trigger('refreshCacheBox.clicked', params);
   });

   // WMS URL event handler
   $('button.js-wms-url').on('click', function(e)  {
      e.preventDefault();
      $('form.add-wms-form .js-wms-url').toggleClass("alert-warning", false);
      if(!gisportal.wms_submitted){ // Prevents users from loading the same data multiple times (clicking when the data is loading)
         gisportal.wms_submitted = true;
         // Gets the URL and refresh_cache boolean
         gisportal.autoLayer.given_wms_url = $('input.js-wms-url')[0].value.split("?")[0];
         gisportal.autoLayer.refresh_cache = $('#refresh-cache-box')[0].checked.toString();

         error_div = $("#wms-url-message");
         // The URL goes through some simple validation before being sent
         if(!(gisportal.autoLayer.given_wms_url.startsWith('http://') || gisportal.autoLayer.given_wms_url.startsWith('https://'))){
            error_div.toggleClass('hidden', false);
            error_div.html("The URL must start with 'http://'' or 'https://'");
            $('#refresh-cache-div').toggleClass('hidden', true);
            gisportal.wms_submitted = false;
         }else{
            $('.notifyjs-gisportal-info span:contains("There are currently no layers in the portal")').closest('.notifyjs-wrapper').remove();
            // If it passes the error div is hidden and the autoLayer functions are run using the given parameters
            $('input.js-wms-url').val("");
            $('#refresh-cache-message').toggleClass('hidden', true);
            $('#refresh-cache-div').toggleClass('hidden', true);
            error_div.toggleClass('hidden', true);
            gisportal.autoLayer.TriedToAddLayer = false;
            gisportal.autoLayer.loadGivenLayer();
            gisportal.panels.showPanel('choose-indicator');
            gisportal.addLayersForm.layers_list = {};
            gisportal.addLayersForm.server_info = {};
            // The wms_url is stored in the form_info dict so that it can be loaded the next time the page is loaded
            gisportal.addLayersForm.form_info = {"wms_url":gisportal.autoLayer.given_wms_url};
            gisportal.addLayersForm.refreshStorageInfo();
         }
      }
      var params = {
         "event" : "wms.submitted"
      };
      gisportal.events.trigger('wms.submitted', params);
   });

   // WMS URL event handler for refresh cache checkbox
   $('input.js-wms-url').on('change keyup paste', function(e)  {
      gisportal.wms_submitted = false; // Allows the user to submit the different WMS URL again
      var typed = $('input.js-wms-url')[0].value;
      var input_value = typed.split("?")[0];
      if(input_value.length > 0){
         var clean_url = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], input_value);
         // The timeout is measured to see if the cache can be refreshed. if so the option if shown to the user to do so, if not they are told when the cache was last refreshed.
         $.ajax({
            url:  gisportal.middlewarePath + '/cache/' + gisportal.niceDomainName + '/temporary_cache/'+clean_url+".json?_="+ new Date().getTime(),
            dataType: 'json',
            success: function(layer){
               if(!gisportal.wms_submitted){
                  $('#refresh-cache-message').toggleClass('hidden', false);
                  if(layer.timeStamp){
                     $('#refresh-cache-message').html("This file was last cached: " + new Date(layer.timeStamp));
                  }
                  if(!layer.timeStamp || (+new Date() - +new Date(layer.timeStamp))/60000 > gisportal.config.cacheTimeout){
                     $('#refresh-cache-div').toggleClass('hidden', false);
                  }else{
                     $('#refresh-cache-div').toggleClass('hidden', true);
                  }
               }
            },
            error: function(e){
               $('#refresh-cache-message').toggleClass('hidden', true);
               $('#refresh-cache-div').toggleClass('hidden', true);
            }
         });
      }else{
         $('#refresh-cache-message').toggleClass('hidden', true);
         $('#refresh-cache-div').toggleClass('hidden', true);
      }
      if(e.type == "paste"){
         try{
            typed = e.originalEvent.clipboardData.getData('text/plain');
         }catch(err){}
      }
      var params = {
         "event" : "wms.typing",
         "typedValue" : typed,
         "eType" : e.type
      };
      gisportal.events.trigger('wms.typing', params);
   });

   $('.js-show-recording-controls').on('click', function(){
      if(!gisportal.walkthrough.is_recording){
         gisportal.walkthrough.starting_recording = true;
         $('.walkthrough-record').toggleClass("hidden", true);
         $('.walkthroughs-manage').toggleClass("hidden", true);
         gisportal.walkthrough.renderControls();
      }
   });

   $('.js-manage-walkthroughs').on('click', function(){
      gisportal.walkthrough.loadManagementPanel();
   });
};

// This gets the logged in users information or the default guest values
gisportal.user.updateProfile = function(){
   function refreshUserPortal(){
      if(!gisportal.addLayersForm.form_info.display_form){
         gisportal.addLayersForm.form_info = {};
      }
      gisportal.addLayersForm.refreshStorageInfo();
      // Makes sure that the correct buttons are shown for editing
      gisportal.loadLayerEditButtons();
      gisportal.loadLayers();
      gisportal.updateHideClasses();
      gisportal.indicatorsPanel.populateShapeSelect();
   }
   $.ajax({
      url: gisportal.middlewarePath + '/user/get/',
      success: function(user_info){
         gisportal.user.info = user_info;
         refreshUserPortal();
      },
      error: function(e){
         gisportal.user.info = {"email":"", "permission":"guest"};
         refreshUserPortal();
      }
   });
};

gisportal.loadLayerEditButtons = function(){
   var addListenerForEditButton = function(){
      $('span.js-add-layer-server').on('click', function(){
         gisportal.addLayersForm.addServerToForm($(this).data('server'), $(this).data('owner'), $(this).data('layer'));
      });
   };
   for(var index in gisportal.selectedLayers){
      var id = gisportal.selectedLayers[index];
      var layer = gisportal.layers[id];
      var indicator_actions = $('ul.indicator-list').children('li[data-id=' + id + ']').find('div.indicator-actions');
      var span_info = null;
      if(gisportal.user.info.permission == "guest" && layer.serviceType != "WFS"){
         if(layer && gisportal.niceDomainName != layer.owner){
            gisportal.indicatorsPanel.removeFromPanel(id);
         }
         var button = indicator_actions.find('span.js-add-layer-server')[0];
         if(button){
            button.remove();
            continue;
         }
      }else if(layer.providerTag == "UserDefinedLayer" && layer.serviceType != "WFS"){
         span_info = ["icon-add-3", "Add Data"];
      }else if((layer.owner != gisportal.niceDomainName || gisportal.user.info.permission == "admin") && layer.serviceType != "WFS"){
         span_info = ["icon-pencil-2", "Edit Data"];
      }
      if(span_info && span_info.length == 2 && layer && $('span.js-add-layer-server[data-server="' + layer.serverName + '"]').length <= 0){
         indicator_actions.append('<span class="js-add-layer-server icon-btn indicator-header-icon ' + span_info[0] + '" data-server="' + layer.serverName + '" data-owner="' + layer.owner + '" data-layer="' + id + '" title="' + span_info[1] + '"></span>');
         addListenerForEditButton();
      }
   }
   //Loads the server form button or hides it
   if(gisportal.user.info.permission == "guest"){
      $('div.server-list-div').toggleClass("hidden", true);
   }else{
      $('div.server-list-div').toggleClass("hidden", false);
   }
   if(gisportal.user.info.permission != "admin" || gisportal.walkthrough.is_recording){
      $('.walkthrough-record').toggleClass("hidden", true);
      $('.walkthroughs-manage').toggleClass("hidden", true);
   }else{
      $('.walkthrough-record').toggleClass("hidden", false);
      $('.walkthroughs-manage').toggleClass("hidden", false);
   }
};

gisportal.updateHideClasses = function(){
   if(gisportal.user.info.permission == "guest"){
      $('.hide-when-logged-in').toggleClass('hidden', false);
      $('.show-when-logged-in').toggleClass('hidden', true);
   }else{
      $('.hide-when-logged-in').toggleClass('hidden', true);
      $('.show-when-logged-in').toggleClass('hidden', false);
   }
};