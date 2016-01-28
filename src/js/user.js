gisportal.user = {};
gisportal.user.info = {"email":"", "permission":"guest"};

gisportal.user.loggedIn = function(){
   gisportal.user.updateProfile(); // The user info is updated update the login change
   $('.logoutButton').click(function() {
      $.ajax({
         url: 'app/user/logout',
         success: function() {
            gisportal.user.initDOM();
            collaboration.initDOM();
            gisportal.user.updateProfile(); // The user information is then reset back to defualts
         }
      });
   });
};


gisportal.user.initDOM = function() {
   $.ajax({
      url: 'app/user/dashboard',
      statusCode: {
         401: function() {    // the user isn't currently login so direct them at the login page instead
            $.ajax({
               url: 'app/user',
               success: function(data) {
                  $('.js-user-dashboard').html(data);         
               },
            });
         },
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
      gisportal.addLayersForm.form_info = {};
      gisportal.addLayersForm.refreshStorageInfo();
      // Makes sure that the correct buttons are shown for editing
      gisportal.loadLayerEditButtons();
      gisportal.loadLayers();
   }
   $.ajax({
      url: gisportal.middlewarePath + '/user/get',
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
   for(var index in gisportal.selectedLayers){
      var id = gisportal.selectedLayers[index];
      var layer = gisportal.layers[id];
      var indicator_actions = $('ul.indicator-list').children('li[data-id=' + id + ']').find('div.indicator-actions');
      var span_info = null;
      if(gisportal.user.info.permission == "guest"){
         if(layer && gisportal.niceDomainName != layer.owner){
            gisportal.indicatorsPanel.removeFromPanel(id)
         }
         var button = indicator_actions.find('span.js-add-layer-server')[0];
         if(button){
            button.remove();
            continue;
         }
      }else if(layer.providerTag == "UserDefinedLayer"){
         span_info = ["icon-add-3", "Add Data"];
      }else if(layer.owner != gisportal.niceDomainName || gisportal.user.info.permission == "admin"){
         span_info = ["icon-pencil-2", "Edit Data"];
      }
      if(span_info && span_info.length == 2 && layer){
         indicator_actions.append('<span class="js-add-layer-server icon-btn indicator-header-icon ' + span_info[0] + '" data-server="' + layer.serverName + '" data-owner="' + layer.owner + '" data-layer="' + id + '" title="' + span_info[1] + '"></span>');
      }
   }
   //Loads the server form button or hides it
   if(gisportal.user.info.permission == "guest"){
      $('div.server-list-div').toggleClass("hidden", true);
   }else{
      $('div.server-list-div').toggleClass("hidden", false);
   }
};