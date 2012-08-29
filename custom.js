// Custom JavaScript functionality

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
      return n<10 ? '0'+n : n
   }
   datestring = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
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

/* Function to extend existing classes taken from Yahoo the YUI JavaScript library */
function extend(subc, superc, overrides) {
   if (!superc || !subc) {
      throw new Error("extend failed, please check that " + "all dependencies are included.");
   }
   var F = function() {
   };
   F.prototype = superc.prototype;
   subc.prototype = new F();
   subc.prototype.constructor = subc;
   subc.superclass = superc.prototype;
   if (superc.prototype.constructor == Object.prototype.constructor) {
      superc.prototype.constructor = superc;
   }

   if (overrides) {
      for (var i in overrides) {
         if (L.hasOwnProperty(overrides, i)) {
            subc.prototype[i] = overrides[i];
         }
      }

      L._IEEnumFix(subc.prototype, overrides);
   }
}