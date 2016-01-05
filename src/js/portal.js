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
   
   gisportal.main();
});
