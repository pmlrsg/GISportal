
/**
 * Load and cache all the templates locally
 */
 
gisportal.templates = {};
gisportal.loadTemplates = function(){
	
	function compileTemplate( template, status, request ){
		var templateName = request.fileName.substring( 0, request.fileName.length - 4 )
		gisportal.templates[ templateName ] = Handlebars.compile( template )
	}
	
	$.ajax({
		url: '/templates/',
		success: function( data ){
			reg = RegExp(/href="(.+.mst?)"/g);
			var match;
			while (match = reg.exec(data)) {
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