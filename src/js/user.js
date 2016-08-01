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
            socket.disconnect();
            gisportal.user.initDOM();
            if(gisportal.config.collaborationFeatures.enabled){
               collaboration.initDOM();
            }
            if(collaboration && collaboration.roomId){
               // Makes sure the collaboration room is left to avoid bugs
               $('.js-leave-room').trigger('click');
            }
            $('.collaboration-status').toggleClass('hidden', true).html("");
            gisportal.user.updateProfile(); // The user information is then reset back to defualts
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
               },
            });
         },
         403: function() {    // the user isn't currently login so direct them at the login page instead
            $('[data-panel-name="user"]').toggleClass('hidden', true);
            gisportal.config.collaborationFeatures.enabled = false;
            $('[data-panel-name="collaboration"]').toggleClass('hidden', true);
            gisportal.noOAuth = true;
         }
      },
      success: function(data) {
         $('.js-user-dashboard').html(data);
         gisportal.user.loggedIn();
      },

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
      if(span_info && span_info.length == 2 && layer){
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