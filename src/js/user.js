gisportal.user = {};


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

gisportal.user.loggedIn = function() {
   $('.logout').click(function() {
      $.ajax({
         url: 'app/user/logout',
         success: function() {
            gisportal.user.initDOM();
            collaboration.initDOM();
         }
      })
   });

}