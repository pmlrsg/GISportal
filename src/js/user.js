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
      gisportal.loadLayers();
      gisportal.map_settings.init();
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
