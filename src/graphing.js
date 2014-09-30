
gisportal.graphs.jobs = [];



function getIndicatorDateRange( indicator ){
   var indicator = gisportal.layers[indicator];
   
   var firstDate = new Date(indicator.firstDate);
   var lastDate = new Date(indicator.lastDate);
   
   return [ firstDate, lastDate ];
}


gisportal.templates = {};



gisportal.graphs.activePlotEditor = null;

gisportal.graphs.addComponentToGraph = function( component ){
   
   if( gisportal.graphs.activePlotEditor == null ){
      var PlotEditor = gisportal.graphs.PlotEditor;
      var Plot = gisportal.graphs.Plot;

      var plot = new Plot();
      var plotEditor = new PlotEditor( plot, $('.js-active-plot-slideout') );

      gisportal.graphs.activePlotEditor = plotEditor;

      plot.plotType( 'timeseries' );
   }
   gisportal.panelSlideout.openSlideout( 'active-plot' );
   gisportal.graphs.activePlotEditor.plot().addComponent( component )
}



/**
 * When a graph has finished, the active GraphEditor calls this function.
 * It will remove the editor
 * Setup a status object for the history panel
 * Close the editor slideout and show the history panel
 */
gisportal.graphs.activeGraphSubmitted = function(){
   var plot = gisportal.graphs.activePlotEditor.plot();
   var plotStatus = new gisportal.graphs.PlotStatus( plot );
   var plotStatusElement = plotStatus.element();
   gisportal.graphs.graphsHistoryList.prepend( plotStatusElement );

   gisportal.graphs.activePlotEditor = null;

   gisportal.panelSlideout.closeSlideout( 'active-plot' );
   gisportal.panels.showPanel( 'history' );
}

gisportal.graphs.initDOM = function() {
   gisportal.graphs.oldInitDOM();
   
   gisportal.graphs.activePlotSlideout = $('.js-active-plot-slideout');

   gisportal.graphs.statesSavedList = $('.js-states-saved-list');

   gisportal.graphs.graphsHistoryList = $('.js-graphs-history-list');
   gisportal.graphs.graphsSavedList = $('.js-graphs-saved-list');
   
}




//-----------------------
// OLD STUFF


gisportal.graphs.oldInitDOM = function() {
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
      gisportal.replaceAllIcons();
   });

}

