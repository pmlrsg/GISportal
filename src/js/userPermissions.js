gisportal.userPermissions = {};


//Temporary variable placement for user info:
gisportal.userPermissions.user_info ={
      "admin":{
         'id':'admin',
         'username':'admin',
         'permission':'admin',
         'forename':'Admin',
         'surname':'Account'
      },
      "guest":{
         'id':'guest',
         'username':'guest',
         'permission':'guest',
         'forename':'Guest',
         'surname':'User'
      }
   };

gisportal.userPermissions.user = "guest";
gisportal.userPermissions.this_user_info = gisportal.userPermissions.user_info["guest"];

gisportal.userPermissions.setPermissions = function(level){
   gisportal.userPermissions.admin_clearance = false;
   gisportal.userPermissions.user_clearance = false;
   gisportal.userPermissions.guest_clearance = false;
   switch(level){
      case "admin":
         gisportal.userPermissions.admin_clearance = true;
      case "user":
         gisportal.userPermissions.user_clearance = true;
      case "guest":
         gisportal.userPermissions.guest_clearance = true;
   }
};
gisportal.userPermissions.setPermissions(gisportal.userPermissions.this_user_info.permission);
gisportal.userPermissions.domainName = window.location.href.replace("http://", "").replace("https://", "").split("?")[0].replace(/\/$/, '').replace(/\./g, "_").replace(/\//g, '_');

gisportal.userPermissions.loginAs = function(username){
   gisportal.userPermissions.user = username;
   gisportal.userPermissions.this_user_info = gisportal.userPermissions.user_info[username] || gisportal.userPermissions.user_info["guest"];
   gisportal.userPermissions.setPermissions(gisportal.userPermissions.this_user_info.permission);
   gisportal.addLayersForm.form_info = {};
   gisportal.addLayersForm.refreshStorageInfo();
   gisportal.loadLayers();
   gisportal.map_settings.init();
}