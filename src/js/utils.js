/**
 * utils.js
 * This file is full of useful utlities
 * for use in the rest of the portal.
 *
 * @namespace utils
 */
gisportal.utils = {};

//POLYFILLER!!!!!!!!

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

/**
 * An extremely handy PHP function ported to JS, works well for templating
 * 
 * @param {(string|Array)} search - A list of things to search for
 * @param {(string|Array)} replace - A list of things to replace the searches with
 * @param {string} subject - The string to search
 * @return {string} The resulting string
 */  
gisportal.utils.replace = function(search, replace, subject, count) {
   var j = 0, temp = '', repl = '', fl = 0,
      f = [].concat(search),
      r = [].concat(replace),
      s = subject,
      ra = r instanceof Array, sa = s instanceof Array;
   s = [].concat(s);
   
   if(count) {
      this.window[count] = 0;
   }

   for(var i = 0, sl = s.length; i < sl; i++) {      
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

gisportal.utils.closestIndex = function closest(array,num){
   var i=0;
   var minDiff=100000000000;
   var ans = -1;
   for(i in array){
      var m=Math.abs(num-array[i]);
      if(m<minDiff){ 
         minDiff=m; 
         ans=i; 
      }
   }
   return ans;
};

/**
 * Extension to JavaScript Arrays to de-duplicate them
 * @param {array} array - The array to remove duplications from
 * @return {array} The array with the duplications removed
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
 * @param {string} d - A date to turn into ISO8601 
 * @return {string} The ISO8601 date string
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
 * so that it can be used as the comparasion operator
 * in sorts.
 *
 * @param {string} firstDate - The first date
 * @param {string} secondDate - The second date
 */ 
gisportal.utils.compareDates = function(firstDate, secondDate) { 
   firstDate = gisportal.utils.ISODateString(firstDate);
   secondDate = gisportal.utils.ISODateString(secondDate);
   if (firstDate < secondDate) return true;
   return false;
};
   

/**
 * Format date string so it can be displayed,
 * essentially just reversing the formatting
 * of the date. The result is day-month-year,
 * this is for display only and most
 * dates should use year-month-day to avoid confusion.
 */ 
gisportal.utils.displayDateString = function(date) {
   var year = date.substring(0, 4);
   var month = date.substring(5, 7);
   var day = date.substring(8, 10);
   return day + '-' + month + '-' + year;
};

/**
 * This converts objects into a key value pair
 * that makes larger data structures easier to
 * traverse using mustache.
 * 
 * @param {object} o - The initial object
 * @returns The formatted object with "key" "value" items
 */
gisportal.utils.mustacheFormat = function(o)  {
   var data = [];
   for (var prop in o) {
      if (o.hasOwnProperty(prop)) {
         if (o[prop].length > 0)  {
            var d = '';
            if (o[prop].length > 1) {
               d = o[prop].length +' matches';
            } 
            data.push({
               'text' : prop,
               'value' : o[prop],
               'description': d
            });
         }
      }
   }
   return data;
};

/**
 * Clamps the number between the min and max.
 * @param {number} num - The value to clamp
 * @param {number} min - The lowest the value can go
 * @param {number} max - The highest the value can go
 * @returns The clamped number
 */
gisportal.utils.clamp = function (num, min, max) {
   return Math.min(Math.max(num, min), max);
};

/**
 * This function finds part of the URL.
 * It is used for finding the state id (shortlink).
 * 
 * @param {string} name - The name of the URL parameter
 * @returns The decoded URI component matching the name
 */
gisportal.utils.getURLParameter = function(name) {
   return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||["",""])[1].replace(/\+/g, '%20'))||null;
};

/**
 * A function for getting unique identifier, 
 * generic function so that it can easily be 
 * changed throughout the codebase.
 * Currently it simply returns the date.
 * @returns A unique ID
 */
gisportal.utils.uniqueID = function()  {
   return new Date().getTime();
};

/**
 * This function checks whether an object is
 * null or undefined.
 * @param {object} object - The object to check
 * @returns True if null/undefined 
 */
gisportal.utils.isNullorUndefined = function(object) {
   if(object === null || typeof object === "undefined") {
      return true;
   }
   
   return false;
};

/**
 * Taken from:
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
    if (('BackCompat' === window.document.compatMode) &&
        ('body' in window.document)) {
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

/**
 * Taken from:
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

/**
 * Taken from:
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

/**
 * Changes a name so that it can
 * be used as an HTML id.
 * Use as a HASH. Compare don't decipher.
 * @param {string} name - The original name
 * @returns The modified version of the name.
 */
gisportal.utils.nameToId = function(name)  {
   if (!name) return null;
   name = name.replace(/\ /g, '__');
   name = name.replace(/\,/g, '_');
   name = name.replace(/\./g, '_');
   name = name.replace(/\:/g, '_');
   name = name.replace(/\;/g, '_');
   name = name.replace(/\//g, '_');
   return name.toLowerCase();
};

/**
 * Takes an object a returns a flattened object
 * @param  {[type]} obj  the object to be flattened
 * @param  {[type]} keep [description]
 * @return {[type]}      [description]
 */
gisportal.utils.flattenObject = function(obj, keep) {

   // normalize parameters
   keep = keep || { contains: function () { return true; } };

   var result = {};

   var traverse = function (current, prefix) {
      switch (Object.prototype.toString.call(current))
      {
         case "[object Object]":
            for (var prop in current)
            {
               traverse(current[prop], (prefix.length ? prefix + "." : "") + prop);
            }
            // when there were no properties it's an empty object instance
            if (!prop && keep.contains(prefix))
            {
               result[prefix] = {};
            }
            break;
         case "[object Array]":
            // arrays
            for (var i = 0, l = current.length; i < l; i++)
            {
               traverse(current[i], (prefix.length ? prefix : "") + "[" + i + "]");
            }
            // when there were no elements it's an empty array instance'
            if (l === 0 && keep.contains(prefix))
            {
               result[prefix] = [];
            }
            break;
         case "[object Null]":
         case "[object Undefined]":
         case "[object Function]":
            // don't use nulls, undefineds or functions
            break;
         default:
            // primitive values: string, number, boolean, date, regexp
            if (keep.contains(prefix))
            {
               result[prefix] = current;
            }
      }
   };

   traverse(obj, "");
   return result;
};

gisportal.utils.unflattenObject = function unflatten(obj) {
   var result = {},
      current,
      prop,
      currIdx,
      normalized;

   for (var props in obj)
   {
      normalized = props.replace(/\[(\d+)\]/gi, ".$1");
      current = result;
      currIdx = -2;
      while (currIdx !== -1)
      {
         prop = normalized.substring(
            ++currIdx,
            (currIdx = normalized.indexOf(".", currIdx)) !== -1 ? currIdx : undefined
         );
         if (currIdx > 0)
         {
            current = current[prop] || (current[prop] = isNaN(parseInt(normalized.substring(currIdx + 1))) ? {} : []);
         }
      }
      current[prop] = obj[props];
   }

   return result;
};

var hashMapRx = /\[\d*\]/gi;

// Fast dictionary-like searching
var HashMap = function constructor(stringArray) {
   this.hash = {};

   for (var i = 0, l = stringArray.length; i < l; i++)
   {
      this.hash[this.normalize(stringArray[i])] = true;
   }
};

HashMap.prototype.contains = function contains(value) {
   var val = this.normalize(value);
   return !!this.hash[val] || this.any(val);
};

HashMap.prototype.normalize = function normalize(value) {
   return value.replace(hashMapRx, "[]");
};

HashMap.prototype.any = function any(value) {
   var result = false;
   for (var key in this.hash)
   {
      if (value === key || value.substr(0, key.length) === key)
         return true;
   }
   return false;
};

gisportal.utils.titleCase = function(str){
   return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

$.fn.keepOnScreen = function(){
   var element = this.get(0);
   var bounds = element.getBoundingClientRect();
   var exceeds = [];
   if(bounds.left < 0){
      element.style.left = 0 + "px"
   }
   if(bounds.top < 0){
      element.style.top = 0 + "px"
   }
   if(bounds.bottom > window.innerHeight){
      element.style.top = parseInt(window.innerHeight - bounds.height) + "px"
   }
   if(bounds.right > window.innerWidth){
      element.style.left = parseInt(window.innerWidth - bounds.width) + "px"
   }
}