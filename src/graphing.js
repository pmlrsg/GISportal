
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
      $('.panel').addClass('has-active-plot');
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
   $('.panel').removeClass('has-active-plot');

   gisportal.panelSlideout.closeSlideout( 'active-plot' );
   gisportal.panels.showPanel( 'history' );
}

/**
 * Removes the active graph. Deletes the data and closes the pane;
 */
gisportal.graphs.deleteActiveGraph = function(){
   gisportal.panelSlideout.closeSlideout( 'active-plot' );
   gisportal.graphs.activePlotEditor = null;
   $('.panel').removeClass('has-active-plot');
}

gisportal.graphs.initDOM = function() {
   
   gisportal.graphs.activePlotSlideout = $('.js-active-plot-slideout');

   gisportal.graphs.statesSavedList = $('.js-states-saved-list');

   gisportal.graphs.graphsHistoryList = $('.js-graphs-history-list');
   gisportal.graphs.graphsSavedList = $('.js-graphs-saved-list');
   
}



