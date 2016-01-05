gisportal.userPermissions = {};


//Temporary variable placement for user info:
gisportal.userPermissions.user_info = gisportal.config.user_information;
gisportal.userPermissions.user = prompt("Please enter your username", "Username");
gisportal.userPermissions.this_user_info = gisportal.userPermissions.user_info[gisportal.userPermissions.user] || gisportal.userPermissions.user_info["guest"];

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
gisportal.userPermissions.domainName = gisportal.utils.getURLParameter('domain') || "pmpc1310_npm_ac_uk";