gisportal.graphs.initDOM = function() {
   $('.js-return-analysis').on('click', function() {
      $('#indicatorsPanel').toggleClass('hidden', false).toggleClass('active', true);
      $('#graphPanel').toggleClass('hidden', true).toggleClass('active', false);      
      $('.graph-wait-message').toggleClass("hidden", false);
      $('.graph-holder').html('');   
   });

}


// Options currently requires a title
gisportal.graphs.data = function(params, options)  {
   var request = $.param( params );    

   function success(data) {
      gisportal.graphs.addGraph(data, options);
   }
      
   function error(request, errorType, exception) {
      var data = {
         type: 'wcs data',
         request: request,
         errorType: errorType,
         exception: exception,
         url: this.url
      };          
      gritterErrorHandler(data);
   }

   gisportal.genericAsync('GET', gisportal.wcsLocation + request, null, success, error, 'json', null);
}

gisportal.graphs.create = function(data, options)  {
   if (data.error !== "") {
      var d = { error: data.error };
      gisportal.gritter.showNotification('graphError', d);
      return;
   }

   var graph;
   switch (data.type)  {
      case 'timeseries':
         graph = gisportal.graphs.timeseries(data, options);
         break;
      case 'histogram':
         graph = gisportal.graphs.histogram(data, options);
         break;
      case 'hovmollerLat':
         break;
      case 'hovmollerLon':
         break;
   }
}

gisportal.graphs.addGraph = function(data, options)  {
   var uid = 'wcsgraph' + Date.now();
   var title = options.title || "Graph";
   var units = gisportal.layers[options.id].units;

   $.get('templates/graph.mst', function(template) {
      var rendered = Mustache.render(template, {
         id : data.coverage,
         title : title,
         units: units
      });
      $('.graph-holder').html(rendered);    
      $('.graph-wait-message').toggleClass("hidden", true);   
      gisportal.graphs.create(data, options);
   });

}
