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
}