gisportal.user = {};
gisportal.user.info = {"email":"", "permission":"guest"};
gisportal.user.domainName = window.location.href.replace("http://", "").replace("https://", "").split("?")[0].replace(/\/$/, '').replace(/\//g, '_');

gisportal.user.loggedIn = function(){
   $.ajax({
      url: gisportal.middlewarePath + '/user/get',
      // If there is success
      success: function(user_info){
         gisportal.user.info = user_info;
         gisportal.addLayersForm.form_info = {};
         gisportal.addLayersForm.refreshStorageInfo();
         gisportal.loadLayers();
         gisportal.map_settings.init();
      },
      error: function(e){
         $.notify("Error logging in", "error");
      }
   });
   $('.logout').click(function() {
      $.ajax({
         url: 'app/user/logout',
         success: function() {
            gisportal.user.initDOM();
            collaboration.initDOM();
         }
      })
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
