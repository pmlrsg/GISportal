
/**
 * Load and cache all the templates locally
 */
 
gisportal.templates = {};
gisportal.loadTemplates = function( callback ){
	var waitingFor = 0;
	var callback = callback || function(){};

	function compileTemplate( template, status, request ){
		var templateName = request.fileName.substring( 0, request.fileName.length - 4 );
		gisportal.templates[ templateName ] = Handlebars.compile( template );

		waitingFor--;
		if( waitingFor == 0 )
			callback();
	}
	
	$.ajax({
		url: '/templates/',
		success: function( data ){
			reg = RegExp(/href="(.+.mst?)"/g);
			var match;
			while (match = reg.exec(data)) {
				waitingFor++;
				var request = $.ajax({
					url: '/templates/' + match[1],
					success: compileTemplate
				});
				request.fileName = match[1];
			}
		}
	});
};

/**
 * Runs an image through the middleware to rotate it on the server
 * @param  {[string]} imgUrl URL of the original image you want to rotate
 * @param  {[init]} angle The angle to rotate the image by
 * @return {[string]} The new image URL
 */
Handlebars.registerHelper('rotate_image', function(imgUrl, angle) {
  return "/service/rotate?angle=" + angle + "&url=" + encodeURIComponent(imgUrl);
});

Handlebars.registerHelper('if_equals', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return options.fn();
});


Handlebars.registerHelper('equals', function(attr1, attr2, options) {
   return ( attr1 == attr2 )
});


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
      return 'selected'
});

Handlebars.registerHelper('checked', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return 'checked'
});


Handlebars.registerHelper('active', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return 'active'
});

/**
 * Rounds the input to a certain precision
 * @param {float} number The number to round
 * @param {int} decimals OPTIONAL How many decimals to round to, defaults to 0
 * @return {float} The rounded number
 */
Handlebars.registerHelper('round', function(number, decimals, options) {
   var decimals = decimals || 0;
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
   for( var i = 1; i < arguments.length - 1; i++ )
      methodArgs[i - 1] = arguments[ i ];
   var options = arguments[ arguments.length - 1 ];

   var lastLocation;
   var currentLocation = options.data.root;
   var path = method.split('.');

   for( var i = 0; path.length > i; i++ ){
      lastLocation = currentLocation;
      currentLocation = currentLocation[ path[i] ];
   };

   return currentLocation.apply( lastLocation, methodArgs );

});
