
/**
 * Load and cache all the templates locally
 */
 
gisportal.templates = {};
gisportal.loadTemplates = function( callback ){
	var waitingFor = 0;
	var callback = callback || function(){};

	function compileTemplate( template, status, request ){
		var templateName = request.fileName.substring( 0, request.fileName.length - 4 )
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
				})
				request.fileName = match[1];
			};
		}
	})
}

Handlebars.registerHelper('rotate_image', function(imgUrl, angle) {
  return "/service/rotate?angle=" + angle + "&url=" + encodeURIComponent(imgUrl);
});

Handlebars.registerHelper('if_equals', function(attr1, attr2, options) {
   if( attr1 == attr2 )
      return options.fn();
});


Handlebars.registerHelper('index_plus_one', function( options ) {
   return options.data.index + 1;
});


/* Add some usefull handlebars calls */
Handlebars.registerHelper('truncate', function(text, max_length) {
   
   if(text.length > max_length)
      return new Handlebars.SafeString('<span title="' + text + '">' + text.substring( 0 , max_length - 3 ) + '...</span>');
   else
      return text;
});
