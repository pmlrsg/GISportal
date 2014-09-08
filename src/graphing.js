/**
 * graphing.js
 * This is the file responsible for setting up graphing.
 * The actual graphs are in src/graphs/
 */

/**
 * initDOM is called in gisportal.js
 * It sets up all of the DOM events.
 */
gisportal.graphs.initDOM = function() {
   $('.js-return-analysis').on('click', function() {
      gisportal.panels.showPanel( 'active-layers' );  
      $('.graph-wait-message').toggleClass("hidden", false);
      $('.graph-holder').html('');   
   });

}

/**
 * This function produces the url request for the AJAX call
 * to get data. It then calls addGraph on success.
 * 
 * @param {object} params - The parametres for the request
 * @param {object} options - The options to be passed through to
 * the creation of the graph.
 */
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

/**
 * This is where the calls to the creation of the graphs are made.
 * It checks data.type for the type of the graph, which it then
 * calls from src/graphs/<type>.js
 *
 * @param {object} data - The actual data of the graph
 * @param {object} options - The options that control the output
 * and creation of the graph.
 */ 
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

/**
 * This function adds the setup of the graph to the DOM,
 * this includes titles and other features that are
 * controlled by the options.
 * At this point the graph itself does not exist, but
 * the mustache template has an SVG element for the graph
 * to go into.
 *
 * @param {data} data - The data of the graph, to be passed
 * into create so that the graph can be created
 * @param {options} options - The options such as title and id
 */
gisportal.graphs.addGraph = function(data, options)  {
   var uid = 'wcsgraph' + Date.now();
   var title = options.title || "Graph";
   var units = gisportal.layers[options.id].units;

   $.get('templates/graph.mst', function(template) {
      var rendered = Mustache.render(template, {
         id : options.id,
         title : title,
         units: units
      });
      $('.graph-holder').html(rendered);    
      $('.graph-wait-message').toggleClass("hidden", true);   
      gisportal.graphs.create(data, options);
      gisportal.replaceAllIcons();
   });

}

