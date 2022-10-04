
gisportal.graphs.jobs = [];



function getIndicatorDateRange( indicator ){
   indicator = gisportal.layers[indicator];
   
   var firstDate = new Date(indicator.firstDate);
   var lastDate = new Date(indicator.lastDate);
   
   return [ firstDate, lastDate ];
}


gisportal.templates = {};



gisportal.graphs.activePlotEditor = null;
gisportal.graphs.storedGraphs = [];

/**
 * Adds a component to the active plot.
 * Create a plot and plot editor to the 
 * if one doesnt exist
 * 
 * @param Object component 
 */
gisportal.graphs.addComponentToGraph = function( component ){
   
   if( gisportal.graphs.activePlotEditor === null ){
      var Plot = gisportal.graphs.Plot;
      var plot = new Plot();
      plot.indicator = component.indicator;
      gisportal.graphs.editPlot( plot );
      var plotType = "timeseries";
      var bboxMethod = gisportal.methodThatSelectedCurrentRegion.method;
      if(bboxMethod == "csvUpload"){
         plotType = "transect";
      }
      if(bboxMethod == "geoJSONSelect" || bboxMethod == "state-geoJSONSelect"){
         component.bboxName = gisportal.methodThatSelectedCurrentRegion.value;
      }
      plot.plotType( plotType );
      // These variables are set so that the correct drop downs are loaded in the first place.
      component.xText = "Left Axis";
      component.yText = "Right Axis";
   }else{
      component = gisportal.graphs.setComponentXYText(component, $('.js-active-plot-type').val() || "timeseries");
   }
   
   gisportal.panelSlideout.openSlideout( 'active-plot' );
   gisportal.graphs.activePlotEditor.addComponent( component );
};

// This sets the correct text for the dropdown depending on the selected graph
gisportal.graphs.setComponentXYText = function(component, plotType){
   switch(plotType){
      case "timeseries":
         component.xText = "Left Axis";
         component.yText = "Right Axis";
         break;
      default:
         component.xText = "X Axis";
         component.yText = "Y Axis";
         break;
   }
   return component;
};



/**
 * When a graph has finished, the active GraphEditor calls this function.
 * It will remove the editor
 * Setup a status object for the history panel
 * Close the editor slideout and show the history panel
 */
gisportal.graphs.activeGraphSubmitted = function(){
   var plot = gisportal.graphs.activePlotEditor.plot();
   gisportal.analytics.events.createGraph( plot );
   var plotStatus = new gisportal.graphs.PlotStatus( plot );
   var plotStatusElement = plotStatus.element();
   gisportal.graphs.graphsHistoryList.prepend( plotStatusElement );

   gisportal.graphs.activePlotEditor = null;
   $('.panel').removeClass('has-active-plot');

   gisportal.panelSlideout.closeSlideout( 'active-plot' );
   gisportal.panels.showPanel( 'history' );
};

/**
 * Removes the active graph. Deletes the data and closes the pane;
 */
gisportal.graphs.deleteActiveGraph = function(){
   gisportal.panelSlideout.closeSlideout( 'active-plot' );
   gisportal.graphs.activePlotEditor = null;
   $('.panel').removeClass('has-active-plot');
};

gisportal.graphs.initDOM = function() {
   
   gisportal.graphs.activePlotSlideout = $('.js-active-plot-slideout');

   gisportal.graphs.statesSavedList = $('.js-states-saved-list');

   gisportal.graphs.graphsHistoryList = $('.js-graphs-history-list');
   gisportal.graphs.graphsSavedList = $('.js-graphs-saved-list');
   gisportal.graphs.popup.addActionListeners();
   
};

/**
 * Open a plot in the editor.
 * Warn the user if they are going to delete an existing the graph
 */
gisportal.graphs.editPlot = function( plot ){
   var PlotEditor = gisportal.graphs.PlotEditor;
   var plotEditor = new PlotEditor( plot, $('.js-active-plot-slideout') );
   $('.panel').addClass('has-active-plot');
   gisportal.graphs.activePlotEditor = plotEditor;
   gisportal.panelSlideout.openSlideout( 'active-plot' );
};

gisportal.graphs.popup = {};
gisportal.graphs.popup.addActionListeners = function(){
   $('span.js-plot-popup-close').on('click', function(){
      if(collaboration.role != "member" || collaboration.diverged || collaboration.forcePopupClose){
         $('div.js-plot-popup').toggleClass('hidden', true);
         var params = {
            "event": "graphPopup.close"
         };
         gisportal.events.trigger('graphPopup.close', params);
         collaboration.forcePopupClose = false;
         gisportal.graphs.popup.openHash = null;
      }else{
         collaboration.divergeAlert();
      }
   });
};

gisportal.graphs.popup.loadPlot = function(html, hash, plotType){
   var popup_content = gisportal.templates['plot-popup']({html:html, hash:hash, plotType:plotType});
   $('.js-plot-popup').html(popup_content);
   $.ajax({
      url: 'plots/' + hash + "-request.json",
      dataType: 'json',
      success: function( data ){
         var plotting_data = gisportal.templates['plot-data']({data:data.plot.data.series});
         $('.extra-plot-info[data-hash="' + hash + '"]').prepend(plotting_data);
      }, error: function(e){
         var error = 'Sorry, we failed to load the metadata: \n'+
                        'The server failed with this message: "' + e.statusText + '"';
         $.notify(error, "error");
         // TODO: Remove the graph from the list
      }
   });
   $('.js-plot-popup').toggleClass("hidden", false);
   gisportal.graphs.popup.openHash = hash;
   gisportal.graphs.popup.addActionListeners();
   $('.bk-tool-icon-reset')[0].click();
};

gisportal.graphs.addButtonListeners = function(element, noCopyEdit, plot){
   element
   .off('click', '.js-graph-status-delete')
   .off('click', '.js-graph-status-copy')
   .off('click', '.js-graph-status-open')
   .on('click', '.js-graph-status-delete', function(){
      var hash = $(this).data("hash");
      $(this).closest('.graph-job').remove();
      if($('.graph-job').length <= 0){
         $('.no-graphs-text').toggleClass("hidden", false);
      }
      if(plot){
         plot.stopMonitoringJobStatus();
      }
      // removes it from the stored list
      var index;
      for(var graph in gisportal.graphs.storedGraphs){
         if(gisportal.graphs.storedGraphs[graph].id == hash){
            index = graph;
         }
      }
      if(index){
         gisportal.graphs.storedGraphs.pop(index);
      }
      var params = {
         "event": "graph.delete",
         "hash": hash
      };
      gisportal.events.trigger('graph.delete', params);
   })
   // Copy a plot
   .on('click', '.js-graph-status-copy', function(){
      if(collaboration.role == "presenter"){
         $(this).notify("You cannot Copy/Edit when presenting because some members may not be able to follow.", {position: "right"});
         return false;
      }
      var hash = $(this).data("hash");
      gisportal.graphs.editPlot( plot.copy() );
      var params = {
         "event": "graph.copy",
         "hash": hash
      };
      gisportal.events.trigger('graph.copy', params);
   })
   // Open a plot
  .on('click', '.js-graph-status-open', function(){
      var hash = $(this).data("hash");
      var plotType = $(this).data("type");
      $.ajax({
         url: 'plots/' + hash + "-plot.html",
         dataType: 'html',
         success: function( html ){
            gisportal.graphs.popup.loadPlot(html, hash, plotType);
         }, error: function(e){
            var error = 'Sorry, we failed to load the graph: \n'+
                           'The server failed with this message: "' + e.statusText + '"';
            $.notify(error, "error");
            // TODO: Remove the graph from the list
         }
      });
      var params = {
         "event": "graph.open",
         "hash": hash
      };
      gisportal.events.trigger('graph.open', params);
   });
   if(noCopyEdit || !plot){
      element.off('click', '.js-graph-status-copy');
   }
};
