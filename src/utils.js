/**
 * Custom JavaScript functionality
 * @namespace
 */
gisportal.utils = {};

/**
 * An extremely handy PHP function ported to JS, works well for templating
 * 
 * @param {(string|Array)} search - A list of things to search for
 * @param {(string|Array)} replace - A list of things to replace the searches with
 * @param {string} subject - The string to search
 * @return {string} The resulting string
 */  
gisportal.utils.replace = function(search, replace, subject, count) {
   var i = 0, j = 0, temp = '', repl = '', sl = 0, fl = 0,
      f = [].concat(search),
      r = [].concat(replace),
      s = subject,
      ra = r instanceof Array, sa = s instanceof Array;
   s = [].concat(s);
   
   if(count) {
      this.window[count] = 0;
   }

   for(i = 0, sl = s.length; i < sl; i++) {      
      if(s[i] === '') {
         continue;
      }
      
      for (j = 0, fl = f.length; j < fl; j++) {     
             
         temp = s[i] + '';
         repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
         s[i] = (temp).split(f[j]).join(repl);
         
         if(count && s[i] !== temp) {
            this.window[count] += (temp.length-s[i].length) / f[j].length;
         }       
      }
   }
   
   return sa ? s : s[0];  
};

/**
 * Extension to JavaScript Arrays to de-duplicate them
 */ 
gisportal.utils.arrayDeDupe = function(array) {
   var i,
      len = array.length,
      outArray = [],
      obj = {};
      
   for (i = 0; i < len; i++) { obj[array[i]] = 0; }
   for (i in obj) { outArray.push(i); }
   return outArray;
};

/** 
 * Array Remove - By John Resig (MIT Licensed)
 */
gisportal.utils.arrayRemove = function(array, from, to) {
   var rest = array.slice((to || from) + 1 || array.length);
   array.length = from < 0 ? array.length + from : from;
   return array.push.apply(array, rest);
};

/**
 * Helper function which returns the nearest value in an array to a given value
 *
 * @param {number|Array}   arr   The array of integers to search within
 * @param {number}         goal  The value for which to find the nearest
 *
 * @return {number} Returns the value of the nearest number in the array
 */
getNearestInArray = function(arr, goal) {
   var closest = null;
   $.each(arr, function(i, e) {
      if (closest === null || Math.abs(e - goal) < Math.abs(closest - goal)) {
         closest = e;
      }
   });
   return closest;
};

/**
 * Turn JavaScript date, d into ISO8601 date part (no time)
 */ 
gisportal.utils.ISODateString = function(d) {
   function pad(n){
      return n<10 ? '0'+n : n;
   }
   // Add 1 to month as its zero based.
   var datestring = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
   return datestring;
};

/**
 * Returns true if first date is smaller than second
 */ 
gisportal.utils.compareDates = function(firstDate, secondDate) { 
   var firstDate = gisportal.utils.ISODateString(firstDate);
   var secondDate = gisportal.utils.ISODateString(secondDate);
   if (firstDate < secondDate) return true;
   return false;
};
   

/**
 * Format date string so it can be displayed
 */ 
gisportal.utils.displayDateString = function(date) {
   var year = date.substring(0, 4);
   var month = date.substring(5, 7);
   var day = date.substring(8, 10);
   return day + '-' + month + '-' + year;
};

function getObjectKey(obj, value) {
   for(var key in obj) {
      // TEST
      if(obj[key] == value) {
         return key;
      }
   }
   return null;
}

gisportal.utils.mustacheFormat = function(o)  {
   var data = [];
   for (var prop in o) {
      if (o.hasOwnProperty(prop)) {
         if (o[prop].length > 0)  {
            data.push({
               'key' : prop,
               'value' : o[prop]
            });
         }
      }
   }
   return data;
}

gisportal.utils.sortDates = function(a, b) {
   return a[0] - b[0];
};

gisportal.utils.ceil1places = function(num) {
   return Math.ceil(num * 10) / 10;
};

gisportal.utils.ceil3places = function(num) {
   return Math.ceil(num * 1000) / 1000;
};

gisportal.utils.clamp = function (num, min, max) {
   return Math.min(Math.max(num, min), max);
};

gisportal.utils.getURLParameter = function(name) {
   return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
};

// A function for getting unique identifier, generic function so that it can easily be changed throughout the codebase
gisportal.utils.uniqueID = function()  {
   return new Date().getTime();
};

gisportal.utils.isNullorUndefined = function(object) {
   if(object === null || typeof object === "undefined") {
      return true;
   }
   
   return false;
};

/* Taken from:
 *    https://code.google.com/p/step2/source/browse/code/java/trunk/example-consumer/src/main/webapp/popuplib.js 
 *    Apache 2.0 License
 * 
 * Computes the size of the window contents. Returns a pair of
 * coordinates [width, height] which can be [0, 0] if it was not possible
 * to compute the values.
 */
gisportal.utils.getWindowInnerSize = function() {
  var width = 0;
  var height = 0;
  var elem = null;
  if ('innerWidth' in window) {
    // For non-IE
    width = window.innerWidth;
    height = window.innerHeight;
  } else {
    // For IE,
    if (('BackCompat' === window.document.compatMode)
        && ('body' in window.document)) {
        elem = window.document.body;
    } else if ('documentElement' in window.document) {
      elem = window.document.documentElement;
    }
    if (elem !== null) {
      width = elem.offsetWidth;
      height = elem.offsetHeight;
    }
  }
  return [width, height];
};

/* Taken from:
 *    https://code.google.com/p/step2/source/browse/code/java/trunk/example-consumer/src/main/webapp/popuplib.js 
 *    Apache 2.0 License
 * 
 * Computes the coordinates of the parent window.
 * Gets the coordinates of the parent frame.
 */
gisportal.utils.getParentCoords = function() {
  var width = 0;
  var height = 0;
  if ('screenLeft' in window) {
    // IE-compatible variants
    width = window.screenLeft;
    height = window.screenTop;
  } else if ('screenX' in window) {
    // Firefox-compatible
    width = window.screenX;
    height = window.screenY;
  }
  return [width, height];
};

/* Taken from:
 *    https://code.google.com/p/step2/source/browse/code/java/trunk/example-consumer/src/main/webapp/popuplib.js 
 *    Apache 2.0 License
 * 
 * Computes the coordinates of the new window, so as to center it
 * over the parent frame.
 */
gisportal.utils.getCenteredCoords = function(width, height) {
   var parentSize = gisportal.utils.getWindowInnerSize();
   var parentPos = gisportal.utils.getParentCoords();
   var xPos = parentPos[0] +
       Math.max(0, Math.floor((parentSize[0] - width) / 2));
   var yPos = parentPos[1] +
       Math.max(0, Math.floor((parentSize[1] - height) / 2));
   return [xPos, yPos];
};

gisportal.utils.openPopup = function(width, height, url, onOpenHandler, checkforCloseHandler) {
   if(onOpenHandler !== null) {
      onOpenHandler();
   }
   
   var coordinates = gisportal.utils.getCenteredCoords(width, height);
   var popupWindow = window.open(url, "", 
      "width=" + width + 
      ", height=" + height + 
      ", status = 1, location = 1, resizable = yes" + 
      ", left=" + coordinates[0] + 
      ", top=" + coordinates[1]
   );
   var interval = window.setInterval(checkforCloseHandler, 80);
   return {'popupWindow':popupWindow, 'interval': interval};
};

/* Changes a name so that it can
 * be used as an HTML id.
 * Use as a HASH. Compare don't decipher. */
gisportal.utils.nameToId = function(name)  {
   if (!name) return null;
   name = name.replace(/\ /g, '__');
   name = name.replace(/\,/g, '_');
   name = name.replace(/\./g, '_');
   name = name.replace(/\:/g, '_');
   name = name.replace(/\;/g, '_');
   name = name.replace(/\//g, '_');
   return name.toLowerCase();
}


Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}  
