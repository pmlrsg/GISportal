


gisportal.config.graphServer = "http://localhost:3000/";

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
      gisportal.panelSlideout.openSlideout( 'active-plot' );

      plot.plotType( 'timeseries' );
   }
   gisportal.graphs.activePlotEditor.plot().addComponent( component )
}



gisportal.graphs.close_export_data = function(){
   $('.export-data').removeClass('show-all').html('');
}

gisportal.graphs.export_data = function( indicator ){
   var indicator = gisportal.layers[ indicator ];
   $('.export-data').addClass('show-all');
   
   
   $('.export-data').html( "Pull from the template at some point" );
   
}


gisportal.graphs.initDOM = function() {
   gisportal.graphs.oldInitDOM();
   
   gisportal.graphs.activePlotSlideout = $('.js-active-plot-slideout');
   
   $('body').on('click', '.remove-active-graph', function(){
         gisportal.graphs.activePlot.activePlot( false );
   })
   
   $('body').on('mousemove tap click', '.tooltips', function(){
         var $tooltip = $(this).find('.tooltip')
      var positon = $(this).offset();
      
      $tooltip.css({
         top: positon.top,
         left: positon.left + $(this).outerWidth(),
      })
   })
   
   
   $('body').on('click', '.js-export-button', function(){
      gisportal.graphs.export_data( $(this).data('id') );
   })
   
   $('body').on('click', '.js-close-export-data', function(){
      gisportal.graphs.close_export_data();
   })
   
   $('.js-return-analysis').on('click', function() {
        $('#historyPanel').toggleClass('hidden', true).toggleClass('active', false); 
        $('#indicatorsPanel').toggleClass('hidden', false).toggleClass('active', true);
   });
   
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

