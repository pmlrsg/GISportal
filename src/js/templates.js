
/**
 * Load and cache all the templates locally
 */
 
gisportal.templates = {};
/**
 * Reads the /templates/ directory on the server
 * and downloads all the .mst files and caches them
 * @param  {Function} callback Callback on completion 
 */
gisportal.loadTemplates = function( callback ){
	callback = callback || function(){};
   
   function compileTemplates(all_templates, status, request) {
      var templates = all_templates.split('#####');
      for (var i = 0; i< templates.length; i++) {
         if (templates[i].length > 1) {
            var t = templates[i].split('###');
            var templateName = t[0].substring( 0, t[0].length - 4 );
            gisportal.templates[ templateName ] = Handlebars.compile( t[1] );   
         }
      }
      callback();
   }

   $.ajax({
      url: 'all_templates.mst',
      success: compileTemplates
   });
   
   gisportal.templatesLoaded = true;
   gisportal.events.trigger("templates-loaded");

};

/**
 * Runs an image through the middleware to rotate it on the server
 * @param  {[string]} imgUrl URL of the original image you want to rotate
 * @param  {[init]} angle The angle to rotate the image by
 * @return {[string]} The new image URL
 */
Handlebars.registerHelper('rotate_image', function(imgUrl, angle) {
  return gisportal.middlewarePath + "/rotate?angle=" + angle + "&url=" + encodeURIComponent(imgUrl);
});

Handlebars.registerHelper('if_equals', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return options.fn();
});

Handlebars.registerHelper('unless_equals', function(attr1, attr2, options) {
   if( attr1 != attr2 )
      return options.fn();
});


Handlebars.registerHelper('equals', function(attr1, attr2, options) {
   return ( attr1 == attr2 );
});

Handlebars.registerHelper('dotdotdot', function(str) {
   lenVal = 200;
   if (str.length > lenVal){
      for(var index=lenVal; index<str.length; index++){
         if([" ", "_"].indexOf(str[index])>=0){
            return str.substring(0,index) + '...';
         }
      }
      return str.substring(0,lenVal) + '...';
   }
   return str;
});

Handlebars.registerHelper('title_case', function(str) {
   return str.replace(/_/g, " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
});

Handlebars.registerHelper('get_value', function(obj, key) {
   if(obj){
      if(typeof(obj[key]) == "object"){
         return obj[key].join(", ");
      }
      return obj[key] || "";
   }else{
      return "";
   }
});

String.prototype.endsWith = function(search) {
   var result = this.indexOf(search, this.length - search.length);
   return result !== -1;
};


/**
 * Returns the index of the current handelbars loop + 1
 */
Handlebars.registerHelper('index_plus_one', function( options ) {
   return options.data.index + 1;
});


/**
 * Truncates a string to a certain length
 * and puts a tool tip on it with the full text.
 *
 * @param {string} text The text to shorten
 * @param {int} decimals The maximum lets to show
 * @return {string} The text shortened possible in a span tag for the tooltip
 */
Handlebars.registerHelper('truncate', function(text, max_length) {
   
   if(text.length > max_length)
      return new Handlebars.SafeString('<span title="' + text + '">' + text.substring( 0 , max_length - 3 ) + '...</span>');
   else
      return text;
});

Handlebars.registerHelper('for', function(from, to, incr, block) {
    var accum = '';
    for(var i = from; i <= to; i += incr)
        accum += block.fn(i);
    return accum;
});

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

/**
 * Helper to join a array of strings in handlebars
 * @param  Array arrayToJoin  Array of variables to join
 * @param  e]} separator    
 */
Handlebars.registerHelper('str_join', function(arrayToJoin, separator) {
   if( arrayToJoin == void(0) ) return "";
   separator = separator || "";
   return arrayToJoin.join( separator );
});



/**
 * Can be used in with <option> tags. It compares to 2 
 * input parameters, if they match it prints "select" which
 * will set the option tag as selected.
 */
Handlebars.registerHelper('selected', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return 'selected';
});

/**
 * Useful with checkbox's if the 2 parameters given 
 * are the same it returns "checked" otherwise ""
 */
Handlebars.registerHelper('checked', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return 'checked';
});


/**
 * Useful with customer elements that use a `active` class
 *  if the 2 parameters given are the same it returns "active" otherwise ""
 */
Handlebars.registerHelper('active', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return 'active';
});

/**
 * Rounds the input to a certain precision
 * @param {float} number The number to round
 * @param {int} decimals OPTIONAL How many decimals to round to, defaults to 0
 * @return {float} The rounded number
 */
Handlebars.registerHelper('round', function(number, decimals, options) {
   decimals = decimals || 0;
   var offset = Math.pow( 10 ,decimals  );
   return Math.round( number * offset ) / offset;
});


/**
 * Allows you to pass a string of a path. The function
 * at the end of the path will be called with the correct context
 * as if it was running in the normal javascript runtime
 * @return {[type]}
 */
Handlebars.registerHelper('call', function() {
   var method = arguments[ 0 ];
   var methodArgs = new Array(arguments.length - 2);
   for(var i = 1; i < arguments.length - 1; i++ )
      methodArgs[i - 1] = arguments[ i ];
   var options = arguments[ arguments.length - 1 ];

   var lastLocation;
   var currentLocation = options.data.root;
   var path = method.split('.');

   for(i = 0; path.length > i; i++ ){
      lastLocation = currentLocation;
      currentLocation = currentLocation[ path[i] ];
   }

   return currentLocation.apply( lastLocation, methodArgs );

});
