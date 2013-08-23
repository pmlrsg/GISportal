/**
 * Window
 * @namespace
 */
opec.window = {};

opec.window._openWindows = {};
opec.window._windowTypes = {};

/**
 * Add a type of window
 * @param {Object} window
 */
opec.window.addWindow = function(window) {
   opec.window._windowTypes[window.name] = window;
};

/**
 * Show a window
 * @param {string} windowType
 * @param {number} uid
 * @param {Object} data
 */
opec.window.createWindow = function(windowType, uid, data) {  
   if (!opec.utils.isNullorUndefined(opec.window._windowTypes[windowType])) {
      var window = opec.window._windowTypes[windowType].create(windowType, uid, data);
      opec.window._openWindows[uid] = window;
   }
};

/**
 * Hide a window
 * @param {number} uid
 * @param {Object} obj
 */
opec.window.removeWindow = function(uid, obj) {  
   //var inArray = $.inArray( uid, opec.window._openWindows );
    
   //if ( inArray !== -1 ) {
      //var window = opec.window._openWindows[uid].destroy();
      //opec.utils.arrayRemove(opec.window._openWindows, inArray);     
   //}
   
   if(typeof opec.window._openWindows !== 'undefined') {
      var window = opec.window._openWindows[uid];
      // Check we have a window
      if(typeof window === 'undefined')
         return;
         
      window.destroy();
      delete opec.window._openWindows[uid];
   }
};

opec.window.getWindow = function(uid) {
   
};
