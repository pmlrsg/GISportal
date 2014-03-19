/**
 * Window
 * @namespace
 */
gisportal.window = {};

gisportal.window._openWindows = {};
gisportal.window._windowTypes = {};

/**
 * Add a type of window
 * @param {Object} window
 */
gisportal.window.addWindow = function(window) {
   gisportal.window._windowTypes[window.name] = window;
};

/**
 * Show a window
 * @param {string} windowType
 * @param {number} uid
 * @param {Object} data
 */
gisportal.window.createWindow = function(windowType, uid, data) {  
   if (!gisportal.utils.isNullorUndefined(gisportal.window._windowTypes[windowType])) {
      var window = gisportal.window._windowTypes[windowType].create(windowType, uid, data);
      gisportal.window._openWindows[uid] = window;
   }
};

/**
 * Hide a window
 * @param {number} uid
 * @param {Object} obj
 */
gisportal.window.removeWindow = function(uid, obj) {  
   //var inArray = $.inArray( uid, gisportal.window._openWindows );
    
   //if ( inArray !== -1 ) {
      //var window = gisportal.window._openWindows[uid].destroy();
      //gisportal.utils.arrayRemove(gisportal.window._openWindows, inArray);     
   //}
   
   if(typeof gisportal.window._openWindows !== 'undefined') {
      var window = gisportal.window._openWindows[uid];
      // Check we have a window
      if(typeof window === 'undefined')
         return;
         
      window.destroy();
      delete gisportal.window._openWindows[uid];
   }
};

gisportal.window.getWindow = function(uid) {
   
};
