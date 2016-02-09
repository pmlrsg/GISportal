/**
 * portal.js
 * This file is the entry point to the GIS Portal.
 * It should only have a call to gisportal.main()
 * This function is held in gisportal.js
 */

$(document).ready(function() {
   
   // IE 9 Fix for missing console
   if (!window.console) window.console = {};
   if (!window.console.log) window.console.log = function () { };
   if (!window.console.info) window.console.info = function () { };
   $.ajax({
	  url: gisportal.middlewarePath + '/settings/config',
	  dataType: 'script',
	  success: function(script){
	  	// CHECK THIS IS SAFE!!!!!!!!!11
	  	// NOT HAPPY ABOUT HAVING TO DO THIS BUT THERE SEEMS NO OTHER WAY TO GET THE SCRIPT TO RUN BEFORE gisportal.main() D-: !
	  		eval(script);
	  		gisportal.main();
	  }
	});
});
