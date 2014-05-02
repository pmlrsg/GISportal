/*------------------------------------*\
    Indicators Panel
    This file is for the indicators 
    panel, which includes features such 
    as initialising scalebar, settings 
    etc. Each indicator uses a 
    mustache template.
\*------------------------------------*/

gisportal.indicatorsPanel = {};

gisportal.indicatorsPanel.initDOM = function()  {
   $('.js-indicators').on('click', '.js-toggleVisibility', function()  {
      var id = $(this).parent().data('id');
      if (gisportal.selectedLayers[id])  {
         gisportal.indicatorsPanel.deselectLayer(id);
      }
      else {
         gisportal.indicatorsPanel.selectLayer(id);
      } 
   });

   $('.js-indicators').on('click', '.js-create-graph', function()  {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.createGraph(id);
   });
};

gisportal.indicatorsPanel.refreshData = function()  {
   $('.js-indicators').html('');
   for (var id in gisportal.layers)  {
      this.addToPanel(id);
   }
};

gisportal.indicatorsPanel.addToPanel = function(id)  { 
   $.get('templates/indicator.mst', function(template) {
      var name = gisportal.layers[id].name;
      var rendered = Mustache.render(template, {
         id : id,
         name : name
      });
      $('.js-indicators').append(rendered);
      gisportal.indicatorsPanel.detailsTab(id);
      gisportal.indicatorsPanel.analysisTab(id);
   });
};

/* There is overlap here with configurePanel,
 * should refactor at some point */
gisportal.indicatorsPanel.selectLayer = function(id)  {
   var microlayer = gisportal.microLayers[id];
   var options = {};
   if (microlayer)  {
      gisportal.getLayerData(microlayer.serverName + '_' + microlayer.origName + '.json', microlayer,options);
   $('[data-id="' + id + '"] button').toggleClass('active', true);
   }
};

gisportal.indicatorsPanel.deselectLayer = function(id)  {
   if (gisportal.layers[id])  {
      gisportal.layers[id].unselect();
   $('[data-id="' + id + '"] button').toggleClass('active', false);   
   }
};

gisportal.indicatorsPanel.detailsTab = function(id)  {
   $.get('templates/tab-details.mst', function(template)  {
      var indicator = gisportal.layers[id];
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-details').html(rendered);
   });
};

gisportal.indicatorsPanel.analysisTab = function(id)  {
   $.get('templates/tab-analysis.mst', function(template)  {
      var indicator = gisportal.layers[id];
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-analysis').html(rendered);
   });
};

gisportal.indicatorsPanel.createGraph = function(id)  {
   var dateRange; // Find date range
      
   var graphXAxis = null,
       graphYAxis = null;
   
   if ( $('#tab- ' + id + '-graph-type option[value="hovmollerLon"').prop("selected") ) {
      graphXAxis = 'Lon';
      graphYAxis = 'Time';
   }
   else if ( $('#tab- ' + id + '-graph-type option[value="hovmollerLat"]').prop("selected") ) {
      graphXAxis = 'Time';
      graphYAxis = 'Lat';
   }
  
   // Some providers change direction of depth,
   // so this makes it match direction
   var depthDirection = function(id)  {
      var layerID = $('#graphcreator-coverage option:selected').val();
      var layer = gisportal.layers[id];
      var elevation = layer.selectedElevation;
      var direction = gisportal.microLayers[id].positive;

      // Take direction === up as default
      if (direction === "down") elevation = -elevation; 
      return elevation;
   }
  
   var indicator = gisportal.layers[id];

   // TODO: add bins for histogram!
   var graphParams = {
      baseurl: indicator.wcsURL,
      coverage: indicator.id,
      type: $('#tab-' + id + '-graph-type option:selected').val(),
      bins: '',
      time: dateRange,
      bbox: $('#graphcreator-bbox').val(),
      depth: depthDirection(id),
      graphXAxis: graphXAxis,
      graphYAxis: graphYAxis,
      graphZAxis: indicator.id
   }; 
   
   if (graphParams.baseurl && graphParams.coverage)  {
      var title = graphParams.type + " of " + indicator.name;
      
      var graphObject = {};
      graphObject.graphData = graphParams;      
      graphObject.description = title;
      graphObject.title = title;

      // Async post the state
      gisportal.genericAsync(
         'POST', 
         gisportal.graphLocation, 
         { 
            graph: JSON.stringify(graphObject)
         }, 
         function(data, opts) {
            console.log('POSTED graph!');
         }, function(request, errorType, exception) {
            console.log('Failed to post graph!');
         }, 
         'json', 
         {}
      );

      var options = {};
      options.title = title;
      options.provider = indicator.providerTag;
      options.labelCount = 5; // TO DO: make custom
      gisportal.graphs.data(graphParams, options);
   }
   else {
      gisportal.gritter.showNotification ('dataNotSelected', null);
   }
};
