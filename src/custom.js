/**
 * Custom JavaScript functionality
 * @namespace
 */
opec.util = {};

/**
* An extremely handy PHP function ported to JS, works well for templating
* 
* @param {(string|Array)} search A list of things to search for
* @param {(string|Array)} replace A list of things to replace the searches with
* @return {string} sa The output
*/  
opec.util.replace = function(search, replace, subject, count){

   var i = 0, j = 0, temp = '', repl = '', sl = 0, fl = 0,
      f = [].concat(search),
      r = [].concat(replace),
      s = subject,
      ra = r instanceof Array, sa = s instanceof Array;
   s = [].concat(s);
   
   if(count){
      this.window[count] = 0;
   }

   for(i = 0, sl = s.length; i < sl; i++){
      
      if(s[i] === ''){
         continue;
      }
      
      for (j = 0, fl = f.length; j < fl; j++){
         
         temp = s[i] + '';
         repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
         s[i] = (temp).split(f[j]).join(repl);
         
         if(count && s[i] !== temp){
            this.window[count] += (temp.length-s[i].length) / f[j].length;
         }
         
      }
   }
   
   return sa ? s : s[0];
   
}

// Extension to JavaScript Arrays to de-duplicate them
Array.prototype.deDupe = function() {
   var arr = this;
   var i,
   len=arr.length,
   out=[],
   obj={};
   for (i=0;i<len;i++) { obj[arr[i]]=0; }
   for (i in obj) { out.push(i); }
   return out;
}

// Turn JavaScript date, d into ISO8601 date part (no time)
function ISODateString(d) {
   function pad(n){
      return n<10 ? '0'+n : n;
   }
   // Add 1 to month as its zero based.
   var datestring = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
   return datestring;
}

// Format date string so it can be displayed
function displayDateString(date) 
{
   var year = date.substring(0, 4);
   var month = date.substring(5, 7);
   var day = date.substring(8, 10);
   return day + '-' + month + '-' + year;
}

function getObjectKey(obj, value)
{
   for(var key in obj) {
      // TEST
      if(obj[key] == value) {
         return key;
      }
   }
   return null;
};