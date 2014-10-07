
gisportal.graphs.jobs = [];



function getIndicatorDateRange( indicator ){
   var indicator = gisportal.layers[indicator];
   
   var firstDate = new Date(indicator.firstDate);
   var lastDate = new Date(indicator.lastDate);
   
   return [ firstDate, lastDate ];
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

gisportal.graphs.deleteActiveGraph = function(){
   gisportal.panelSlideout.closeSlideout( 'active-plot' );
   gisportal.graphs.activePlotEditor = null;
}

gisportal.graphs.initDOM = function() {
   
   gisportal.graphs.activePlotSlideout = $('.js-active-plot-slideout');

   gisportal.graphs.statesSavedList = $('.js-states-saved-list');

   gisportal.graphs.graphsHistoryList = $('.js-graphs-history-list');
   gisportal.graphs.graphsSavedList = $('.js-graphs-saved-list');
   
}



