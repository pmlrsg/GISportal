/**------------------------------*\
    Indicators Panel
    This file is for the indicators 
    panel, which includes features such 
    as initialising scalebar, settings 
    etc. Each indicator uses a 
    mustache template.
\*------------------------------------*/

gisportal.indicatorsPanel = {};

gisportal.indicatorsPanel.open = function() {
   gisportal.panels.showPanel('active-layers');
};

gisportal.indicatorsPanel.initDOM = function() {
   $('.js-indicators').on('click', '.js-toggleVisibility', function() {
      var id = $(this).closest('[data-id]').data('id');
      if (gisportal.layers[id].isVisible) {
         gisportal.indicatorsPanel.hideLayer(id);
      } else {
         gisportal.indicatorsPanel.showLayer(id);
      }
   });

   $('.js-indicators').on('click', '.js-add-to-plot', function()  {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.addToPlot(id);
   });
   $('.js-indicators').on('click', '.js-make-new-plot', function()  {
      var id = $(this).data('id');
      gisportal.graphs.deleteActiveGraph();
      gisportal.indicatorsPanel.addToPlot(id);
   });

   $('.js-indicators').on('click', '.js-clear-selection', function()  {
      gisportal.vectorLayer.getSource().clear();
      gisportal.featureHoverOverlay.getSource().clear();
      gisportal.featureSelectOverlay.getSource().clear();
      gisportal.currentSelectedRegion = "";
      gisportal.methodThatSelectedCurrentRegion = {};
      cancelDraw();
      $('.js-coordinates').val("");
      $('.js-upload-shape').val("");
      $('.users-geojson-files').val("default");
   });

   $('.js-indicators').on('click', '.js-remove', function() {
      if (gisportal.selectedLayers.length <= 1) {
         gisportal.panels.showPanel('choose-indicator');
         // Clears the vector layer to avoid confusion
         gisportal.vectorLayer.getSource().clear();
         gisportal.featureHoverOverlay.getSource().clear();
         gisportal.featureSelectOverlay.getSource().clear();
      }
      var id = $(this).closest('[data-id]').data('id');
      console.log("deleting based on id");
      console.log(id);
      gisportal.indicatorsPanel.removeFromPanel(id);
   });


   $('.js-start-again').on('click', function() {
      gisportal.panels.showPanel('choose-indicator');
   });


   $('.js-indicators, #graphPanel').on('click', '.js-export-button', function() {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.exportData(id);
   });


   // Scale range event handlers
   $('.js-indicators').on('change', '.js-scale-min, .js-scale-max', function() {
      var id = $(this).data('id');
      $('.js-auto[data-id="' + id + '"]').prop( 'checked', false );
   });

   // Scale range event handlers
   $('.js-indicators').on('click', '.js-reset', function() {
      var id = $(this).data('id');
      $('.js-auto[data-id="' + id + '"]').prop( 'checked', false );
   });


   // Scale range event handlers
   $('.js-indicators').on('change', '.js-scale-min, .js-scale-max, .scalevalues > input[type="checkbox"]', function() {
      var id = $(this).data('id');
      // This removed the min val in the layer so that the data is refreshed on the map
      gisportal.layers[id].minScaleVal = null;
      var min = $('.js-scale-min[data-id="' + id + '"]').val();
      var max = $('.js-scale-max[data-id="' + id + '"]').val();
      gisportal.scalebars.validateScale(id, min, max);
   });

   $('.js-indicators').on('change', '.js-scale-min', function() { 
      gisportal.events.trigger('scalebar.min-set', $(this).data('id'), $(this).val());
   });

   $('.js-indicators').on('change', '.js-scale-max', function() { 
      gisportal.events.trigger('scalebar.max-set', $(this).data('id'), $(this).val());
   });

   $('.js-indicators').on('change', '.js-indicator-is-log', function() { 
      gisportal.events.trigger('scalebar.log-set', $(this).data('id'), $(this).prop('checked'));
   });

   //Auto scale range
   $('.js-indicators').on('change', '.js-auto', function() {
      var id = $(this).data('id');
      var layer = gisportal.layers[id];
      layer.minScaleVal = null;
      layer.maxScaleVal = null;
      layer.autoScale = $(this).prop('checked');
      gisportal.scalebars.autoScale(id);
      gisportal.events.trigger('scalebar.autoscale-checkbox', id, $(this).prop('checked'));
   });

   // Reset scale range
   $('.js-indicators').on('click', '.js-reset', function() {
      var id = $(this).data('id');
      gisportal.scalebars.resetScale(id);
      gisportal.events.trigger('scale.reset', id);
   });


   // Show the demisions panel when you click the scale bar 
   $('.js-indicators').on('click', '.js-scalebar', function() {
      var id = $(this).closest('[data-id]').data('id');
      var layer = gisportal.layers[id];
      $('.js-indicators .indicator-header[data-id="' + id + '"] [title="Scalebar"]').click();
   });


   // on change for vector style selection
   $('.js-indicators').on('change', '.js-vector-style-select',function(evt) {
      console.log("changing vector prop style");
      var id = $(this).closest('[data-id]').data('id');
      var prop = evt.target.value;
      gisportal.layers[id].setStyleUI(gisportal.layers[id].OLLayer.getSource(), prop);

   });


   //  Zoom to data region
   $('.js-indicators').on('click', '.js-zoom-data', function() {
      var indicator = gisportal.layers[$(this).data('id')];
      if (indicator === null){
         return;
      }

      var bbox = [
         parseFloat(indicator.exBoundingBox.WestBoundLongitude),
         parseFloat(indicator.exBoundingBox.SouthBoundLatitude),
         parseFloat(indicator.exBoundingBox.EastBoundLongitude),
         parseFloat(indicator.exBoundingBox.NorthBoundLatitude)
      ];
      var extent = gisportal.reprojectBoundingBox(bbox, 'EPSG:4326', gisportal.projection);
      
      gisportal.mapFit(extent);
   });

   //Share this map
   $('.js-share').on('click', function() {
      gisportal.openid.showShare();
      gisportal.openid.getLink();
   });

   // Store a layers current tab being viewed
   $('.js-indicators').on('change', '.js-tab-trigger', function() {
      var layerId = $(this).closest('[data-id]').data('id');
      var layer = gisportal.layers[layerId];
      layer.visibleTab = $(this).data('tab-name');
   });

   $('.js-indicators').on('click', '#show_more', function(e) {
      e.preventDefault();
      if(gisportal.panelSlideout.isOut('metadata')){
         gisportal.events.trigger('metadata.close');
      }
      else {
         var indicator = $(this).closest('[data-name]').data('name');//('ul').siblings('.indicator-header').data('name');
         var provider = $(this).closest('[data-provider]').data('provider'); //.parents('ul').siblings('.indicator-header').data('provider');
         var layer = gisportal.layers[$(this).closest('[data-id]').data('id')];
         // grey out other things here - grey needs to be clickable to disable and hide.
         $('.js-indicators > li[data-name!="' + indicator + '"]').each(function() {

            $(this).append("<div class='indicator-overlay'></div>");
         });
          gisportal.indicatorsPanel.getMetadata(layer, indicator, provider);
      }
      
   });

   $('.js-indicators').on('click', '.indicator-overlay', function(){
      gisportal.events.trigger('metadata.close');
   });

   $('.metadata-slideout').on('click', '.js-close-extrainfo', function() {
      gisportal.events.trigger('metadata.close');
   });

   $('body').on('click', '.js-focus-on-build-graph-component', function(){
      gisportal.indicatorsPanel.focusOnBuildGraphCompoent( $(this).data('id') );
   });


   $('.js-indicators').on('click', '.js-select-layer-tab', function(){
      var layerId = $(this).closest('[data-id]').data('id');
      var tabName = $(this).closest('[data-tab-name]').data('tab-name');
      gisportal.indicatorsPanel.selectTab( layerId, tabName );
   });

   // make the selected indicators list sortable, and the event to fire after sorting
   $('ul.js-indicators').addClass('sortable-list');

   $(".sortable-list").sortable({
      start: function(event, ui) {
         $(ui.item).children('.indicator-header').addClass('indicator-header-moving');
      },
      stop : function(event, ui) {
         $(ui.item).children('div.indicator-header').removeClass('indicator-header-moving'); 
         gisportal.indicatorsPanel.reorderLayers();
      }
   });

   // WCS URL event handlers
   $('.js-indicators').on('click', 'button.js-wcs-url', function()  {
      gisportal.indicatorsPanel.add_wcs_url($(this));
   });

   $('.js-indicators').on('change', 'input.js-wcs-url', function()  {
      gisportal.indicatorsPanel.add_wcs_url($(this));
   });
   
   $('.js-indicators').on('click', '.js-select-layer-tab', function(){
      var layerId = $(this).closest('[data-id]').data('id');
      var tabName = $(this).closest('[data-tab-name]').data('tab-name');
      gisportal.indicatorsPanel.selectTab( layerId, tabName );
   });

   $('#indicatorsPanel').bind('scroll', function() {
     gisportal.events.trigger('indicatorspanel.scroll', $(this).scrollTop());
   });
};

gisportal.indicatorsPanel.add_wcs_url = function(selected_this)  {
   var wcs_url = $('input.js-wcs-url')[0].value;
   var layer = gisportal.layers[selected_this.closest('[data-id]').data('id')];
   var filename = layer.serverName;
   var user = layer.owner;
   error_div = $("#" + layer.id + "-analysis-message");

   if(!(wcs_url.startsWith('http://') || wcs_url.startsWith('https://'))){
      error_div.toggleClass('hidden', false);
      error_div.html("The URL must start with 'http://'' or 'https://'");
   }else if(layer.provider == "UserDefinedLayer"){
      for(var index in gisportal.layers){
         this_layer = gisportal.layers[index];
         if(this_layer.serverName == filename){
            gisportal.layers[index].wcsURL = wcs_url.split("?")[0];
         }
      }
      console.log("May not have loaded"); // Look at only doing it if the user is allowed with that layer
      gisportal.indicatorsPanel.analysisTab(layer.id);
      message_div = $("#" + layer.id + "-analysis-message");
      message_div.toggleClass('hidden', false);
      message_div.html('The WCS URL has been added to this server.');
      message_div.toggleClass('alert-danger', false);
      message_div.toggleClass('alert-success', true);
   }else{ // Perhaps only if this user isnt a guest!
      var user_info = gisportal.user.info;
      $.ajax({
         url:  gisportal.middlewarePath + '/settings/add_wcs_url?url='+encodeURIComponent(wcs_url) + '&username=' + user + '&filename=' + filename,
         success: function(data){
            layer.wcsURL = data;
            gisportal.indicatorsPanel.analysisTab(layer.id);
            message_div = $("#" + layer.id + "-analysis-message");
            message_div.toggleClass('hidden', false);
            message_div.html('The WCS URL has been added to this server.');
            message_div.toggleClass('alert-danger', false);
            message_div.toggleClass('alert-success', true);
         },
         error: function(e){
            //show an error that tells the user what is wrong
            error_div.toggleClass('hidden', false);
            error_div.html('There was an error using that URL: ' + e.statusText);
         }
      });
   }
};

gisportal.events.bind('metadata.close', function() {
   $('.indicator-overlay').remove();
   gisportal.panelSlideout.closeSlideout('metadata');
});



gisportal.indicatorsPanel.getMetadata = function(layer, indicator, provider) {
   $('.metadata_provider').html('');
   $('.metadata_indicator').html('');
   var some = function(promises){
      var d = $.Deferred(), results = [];
      var remaining = promises.length;
      var alwaysFunction = function(res){
         remaining--; // always mark as finished
         if(!remaining) d.resolve(results);
      };
      var pushResults = function(res){
         results.push(res); // on success, add to results
      };
      for(var i = 0; i < promises.length; i++){
         promises[i].then(pushResults).always(alwaysFunction);
       }
       return d.promise(); // return a promise
   };

   var urls = [gisportal.middlewarePath + '/metadata/provider/' + provider, gisportal.middlewarePath + '/metadata/indicator/' + indicator].map($.get);

   some(urls).then(function(results){
      for(var i = 0; i < results.length; i++) {
         if (results[i].indexOf('Provider') != -1) {
            $('.metadata_provider').html(results[i]);
            var text;
            switch( layer.tags.Confidence ){
               case"Low":
                  text = "&#9785; Low";
                  break;
               case"Medium":
                  text = "&#128528; Medium";
                  break;
               case"High":
                  text = "&#9786; High";
                  break;
            }
            var confidence = '<p>' +
                  '<strong>Confidence:</strong>' +
                  text +
                  '<br><i>Model provider\'s level of confidence in the data based on a combination of skill assessment and their expert judgment.</i>' +
               '</p>';
            $('.metadata_provider').append(confidence);

         }else {
            $('.metadata_indicator').html(results[i]);
         }
      }
   }).always(function(){
      gisportal.panelSlideout.openSlideout('metadata');
   });

};



gisportal.indicatorsPanel.refreshData = function(indicators) {
   $('.js-indicators').html('');
   for (var i = 0; i < indicators.length; i++) {
      this.addToPanel(indicators[i]);
   }
};

gisportal.indicatorsPanel.addToPanel = function(data) {
   for(var l in gisportal.selectedLayers){
      $('[data-id="' + gisportal.selectedLayers[l] + '"] .indicator-actions span').not('.toggleVisibility').toggleClass('active', false);
   }
   if ($('.js-indicators [data-id="' + data.id + '"]').length > 0) return false;

   var id = data.id;

   var layer = gisportal.layers[id];

   if( gisportal.graphs.activePlotEditor )
      layer.visibleTab = "analysis";

   user_allowed_to_add = false;
   user_allowed_to_edit = false;

   if(gisportal.user.info.permission != "guest" && layer.providerTag == "UserDefinedLayer"){
      user_allowed_to_add = true;
   }
   if(gisportal.user.info.permission != "guest" && layer.providerTag != "UserDefinedLayer" && layer.serviceType != "WFS"){
      if(layer.owner != gisportal.niceDomainName || gisportal.user.info.permission == "admin")
      user_allowed_to_edit = true;
   }

   var rendered = gisportal.templates.indicator({"layer":layer, "user_allowed_to_add":user_allowed_to_add, "user_allowed_to_edit":user_allowed_to_edit});

   var index = data.index || 0;
   var prevIndex = index - 1;

   $('.js-indicators').prepend(rendered);

   $('.js-indicators > li').sort(function(a, b) {
      return $(a).data('order') > $(b).data('order');
   }).appendTo('.js-indicators');

   if (data.refine) {
      var refine = data.refine;
      var cat = refine.cat;
      var tag = refine.tag;
      if (cat && tag) {
         var ids = group[cat][tag];
         group = gisportal.indicatorsPanel.refineData(ids, "none");
         refined = true;
      }
   }

   $('[data-id="' + id + '"] .js-toggleVisibility')
      .toggleClass('hidden', false)
      .toggleClass('active', gisportal.layers[id].isVisible);
   //console.log(layer);
   if(layer.serviceType != "WFS"){
      //console.log("adding scalebar");
   gisportal.indicatorsPanel.scalebarTab(id);

   }
   else {
      gisportal.indicatorsPanel.vectorStyleTab(id);
   }
   gisportal.indicatorsPanel.detailsTab(id);
   gisportal.indicatorsPanel.analysisTab(id);

   //Add the scale bar tooltip
   var renderedTooltip = gisportal.templates['tooltip-scalebar']( layer );
   $('[data-id="' + id + '"] .js-scalebar').tooltipster({
      contentAsHTML: true,
      content: renderedTooltip,
      position: "right",
      maxWidth: 200
   });

   //Add the edit/add layers listener to add the server to the form
   $('span.js-add-layer-server').on('click', function(){
      gisportal.addLayersForm.addServerToForm($(this).data('server'), $(this).data('owner'), $(this).data('layer'));
   });

   gisportal.events.trigger('layer.addtopanel', data);
};


// this will be re-engineered when ol3 fixed layer ordering
gisportal.indicatorsPanel.reorderLayers = function() {
 var layers = [];
   $('.sortable-list .indicator-header').each(function() {
      layers.push($(this).parent().data('id'));
   });

   // so, ol3 doesn't have a nice way to reorder layers; therefore, we take 'em all off and then add 'em back on
   var currentLayers = map.getLayers().getArray();
   console.log(currentLayers);
   console.log(layers);
   console.log("map.layers before remove");
   console.log(map.getLayers().getArray().length);
   console.log(map.getLayers().getArray());
   var oddFactor = 1 + currentLayers.length;
   if (currentLayers) {
      for (var i = 0; i < map.getLayers().getArray().length + oddFactor; i++) {
         console.log("removing layer ");
         map.removeLayer(map.getLayers().getArray()[0]);
      }
   }
   console.log("map.layers after remove");
   console.log(map.getLayers().getArray().length);
   console.log(map.getLayers().getArray());
   // stick the base layer back on
   var selectedBaseMap = $('#select-basemap').data().ddslick.selectedData.value;
   if (selectedBaseMap !== 'none') {
      map.addLayer(gisportal.baseLayers[selectedBaseMap]);   
   }
   
   console.log("current after delete");
   console.log(currentLayers);
   // then the indicator layers;
   for (var l = layers.length - 1; l > -1; l--) {
      map.addLayer(gisportal.layers[layers[l]].openlayers.anID);
   }

   gisportal.setCountryBordersToTopLayer();
   gisportal.selectionTools.setVectorLayerToTop();

   gisportal.events.trigger('layer.reorder', layers);
};

gisportal.indicatorsPanel.removeFromPanel = function(id) {

   $('.js-indicators > li[data-id="' + id + '"]').remove();
   if (gisportal.layers[id]) gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);

   gisportal.events.trigger('layer.remove', id, gisportal.layers[id].name);
};

/* There is overlap here with configurePanel,
 * should refactor at some point */
gisportal.indicatorsPanel.selectLayer = function(id, style) {
   if (_.indexOf(gisportal.selectedLayers, id) > -1) return false;
   var layer = gisportal.layers[id];
   var options = {};
   //console.log("fetching extra data for layer");
   //console.log(layer);
   if (layer) {
      var name = layer.name.toLowerCase();
      options.visible = true;
      if(layer.servicetype=="WFS"){
         gisportal.getVectorLayerData(layer);
      }
      else {
         gisportal.getLayerData(layer.serverName + '_' + layer.urlName + '.json', layer, options, style);
      }
      gisportal.events.trigger('layer.select', id, gisportal.layers[id].name);
   }
};

gisportal.indicatorsPanel.hideLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(false);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', false);

      gisportal.events.trigger('layer.hide', id, gisportal.layers[id].name);
   }
};

gisportal.indicatorsPanel.showLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(true);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', true);

      gisportal.events.trigger('layer.show', id, gisportal.layers[id].name);
   }
};

gisportal.indicatorsPanel.detailsTab = function(id) {
   //console.log("adding details");
   //console.log(id);
   var indicator = gisportal.layers[id];

   var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
   indicator.modifiedName = modifiedName;
   indicator.modified = gisportal.utils.nameToId(indicator.name);

   // load the tag values based on the currently enabled gisportal.browseCategories
   indicator.displayTags = [];
   for (var index in gisportal.browseCategories) {
      var name = gisportal.browseCategories[index];
      var val = indicator.tags[index];
      if (val) {
         if (typeof(val) == "string") val = val.split(',');
         indicator.displayTags.push({
            displayName: name,
            displayValues: val
         });      
      }
   }
   ////console.log(indicator);
   var rendered = gisportal.templates['tab-details'](indicator);
   ////console.log(rendered);
   $('[data-id="' + id + '"] .js-tab-details').html(rendered);
   $('[data-id="' + id + '"] .js-icon-details').toggleClass('hidden', false);
};

gisportal.indicatorsPanel.analysisTab = function(id) {
   //console.log("adding analysis");
   var indicator = gisportal.layers[id];
   var onMetadata = function(){
      //console.log("in Onmetdata");
      var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
      indicator.modified = gisportal.utils.nameToId(indicator.name);
      indicator.modifiedName = modifiedName;
      indicator.loggedIn = gisportal.user.info.permission != "guest";
      indicator.noOAuth = gisportal.noOAuth;
      var rendered = gisportal.templates['tab-analysis'](indicator);
      $('[data-id="' + id + '"] .js-tab-analysis').html(rendered);
      $('.js-google-auth-button').click(function() {
         var authWin = window.top.open(gisportal.middlewarePath + '/user/auth/google','authWin','left=20,top=20,width=700,height=700,toolbar=1');
      });
      $('[data-id="' + id + '"] .js-icon-analyse').toggleClass('hidden', false);

      if(gisportal.methodThatSelectedCurrentRegion.method == "drawBBox"){
         $('.js-coordinates').val(gisportal.methodThatSelectedCurrentRegion.value);
      }

      gisportal.indicatorsPanel.addAnalysisListeners();
      gisportal.indicatorsPanel.populateShapeSelect();
   };
   if(indicator.metadataComplete) onMetadata();
   else gisportal.events.bind_once('layer.metadataLoaded',onMetadata);

};

gisportal.indicatorsPanel.geoJSONSelected = function(selectedValue, fromSavedState){
   $.ajax({
      url: gisportal.middlewarePath + '/cache/' + gisportal.niceDomainName + '/user_' + gisportal.user.info.email + "/" + selectedValue + ".geojson" ,
      dataType: 'json',
      success: function(data){
         gisportal.selectionTools.loadGeoJSON(data, false, selectedValue, fromSavedState);
      },
      error: function(e){
         gisportal.vectorLayer.getSource().clear();
         $.notify("Sorry, There was an error with that: " + e.statusText, "error");
      }
   });
};

gisportal.indicatorsPanel.addAnalysisListeners = function(){
   $('.users-geojson-files').on('change', function(){
      gisportal.indicatorsPanel.geoJSONSelected(this.value);
   });
   var addCoordinatesToProfile = function(name){
      var feature = gisportal.vectorLayer.getSource().getFeatures()[0];
      var geojson = gisportal.featureToGeoJSON(feature, gisportal.projection, "EPSG:4326");
      $.ajax({
         method: 'post',
         url:  gisportal.middlewarePath + '/plotting/save_geoJSON?filename=' + name,
         data:{'data': JSON.stringify(geojson)},
         success: function(data){
            if($(".users-geojson-files option[value='" + data + "']").length === 0){
               $('.users-geojson-files').append("<option selected value='" + data + "'>" + data + "</option>");
            }else{
               $('.users-geojson-files').val(data);
            }
            $('.users-geojson-files').trigger('change');
         },
         error: function(e){
            $.notify("Sorry, There was an error with that: " + e.statusText, "error");
         }
      });
   };

   $('.js-add-coordinates-to-profile').on('click', function(){
      gisportal.panels.userFeedback("Please enter a name to use for your file", addCoordinatesToProfile);
   });
};

gisportal.indicatorsPanel.populateShapeSelect = function(){
   // A request to populate the dropdown with the users polygons
   $.ajax({
      url:  gisportal.middlewarePath + '/plotting/get_shapes',
      dataType: 'json',
      success: function(data){
         var selected_value;
         if(gisportal.methodThatSelectedCurrentRegion.method == "geoJSONSelect"){
            selected_value = gisportal.methodThatSelectedCurrentRegion.value;
         }
         if($('.users-geojson-files')[0]){
            var current_val = $('.users-geojson-files')[0].value;
            if(current_val != "default"){
               selected_value = $('.users-geojson-files')[0].value;
            }
         }
         // Empties the dropdown
         $('.users-geojson-files').html("");
         selectValues = data.list;
         if(selectValues.length > 0){
            $('.users-geojson-files').html("<option value='default' disabled>Please select a file...</option>");
            $.each(selectValues, function(key, value) {   
               $('.users-geojson-files')
                  .append($("<option></option>")
                  .attr("value",value)
                  .text(value));
            });
            if(selected_value){
               $('.users-geojson-files').val(selected_value);
            }else{
               $('.users-geojson-files').val("default");
            }            
         }else{
            $('.users-geojson-files').html("<option value='default' selected disabled>You have no files yet, please add some</option>");
         }
      },
      error: function(e){
         $('.users-geojson-files').html("<option selected value='default' disabled>You must be logged in to use this feature</option>");
      }
   });
};

/**
 * Redraws the legend bar which will reflect changes to the legend colour and range
 *
 * @param String layerId The ID of the layer to reload
 */
gisportal.indicatorsPanel.redrawScalebar = function(layerId) {
   var indicator = gisportal.layers[layerId];
   var scalebarDetails = gisportal.scalebars.getScalebarDetails(layerId);
   if (scalebarDetails) {
      indicator.legend = scalebarDetails.url;
      indicator.scalePoints = scalebarDetails.scalePoints;
      try{
         indicator.angle = indicator.legendSettings.Rotation;
      }catch(err){
         indicator.angle = 0;
      }
      try{
         indicator.legendURL = indicator.legendSettings.URL || encodeURIComponent(gisportal.scalebars.createGetLegendURL(indicator, indicator.legend));
      }catch(err){
         indicator.legendURL = encodeURIComponent(gisportal.scalebars.createGetLegendURL(indicator, indicator.legend));
      }
      indicator.middleware = gisportal.middlewarePath;
      var renderedScalebar = gisportal.templates.scalebar(indicator);


      $('[data-id="' + indicator.id + '"] .js-scalebar').html(renderedScalebar);

   } else {
      $('[data-id="' + indicator.id + '"] .js-scalebar').html("");
   }
};

gisportal.indicatorsPanel.vectorStyleTab = function(id) {
   //console.log("INSIDE VECTOR STYLES TAB")
         var layer = gisportal.layers[id];
         //
         //layer.setStyle();

         var rendered = gisportal.templates['tab-vectorstyles'](layer);
         //console.log(rendered);
         //console.log(id);
         //console.log('[data-id="' + id + '"] .js-tab-dimensions');
         //console.log($('[data-id="' + id + '"] .js-tab-dimensions'));
         $('[data-id="' + id + '"] .js-tab-dimensions').html(rendered);
         //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
         //console.log(id+"__"+layer.defaultProperty);
         if(id+"__"+layer.defaultProperty in gisportal.vectorStyles.cache) {
            gisportal.vectorStyles.cache[id+"__"+layer.defaultProperty].unit = layer.unit;
            console.log(gisportal.vectorStyles.cache[id+"__"+layer.defaultProperty]);
            var indicator = gisportal.vectorStyles.cache[id+"__"+layer.defaultProperty];
            indicator.zoomable = true;
            if(gisportal.current_view && gisportal.current_view.noPan){
               indicator.zoomable = false;
            }
      var renderedStyleUI = gisportal.templates['vector-style-ui'](indicator);
      $('[data-id="' + layer.id + '"] .dimensions-tab .vector-style-container').html(renderedStyleUI);
   }
};

gisportal.indicatorsPanel.scalebarTab = function(id) {
   var layer = gisportal.layers[id];
   
   var onMetadata = function(){
      //console.log("inside on metadata");
      var indicator = gisportal.layers[id];
      if (indicator.elevationCache && indicator.elevationCache.length > 0) {
         indicator.hasElevation = true;
      }

      if (indicator.styles && indicator.styles.length > 0) {
         indicator.hasStyles = true;
      }


      var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
      indicator.modifiedName = modifiedName;
      indicator.modified = gisportal.utils.nameToId(indicator.name);

      gisportal.indicatorsPanel.redrawScalebar(id);

      indicator.zoomable = true;
      if(gisportal.current_view && gisportal.current_view.noPan){
         indicator.zoomable = false;
      }
      var rendered = gisportal.templates['tab-dimensions'](indicator);

      $('[data-id="' + indicator.id + '"] .js-tab-dimensions').html(rendered);
      $('[data-id="' + indicator.id + '"] .js-icon-scalebar').toggleClass('hidden', false);

      $('#tab-' + indicator.id + '-opacity').noUiSlider({
         start: [ indicator.opacity * 100 ],
         margin: 20,
         connect: "lower",
         range: {
            'min': [   0 ],
            'max': [ 100 ]
         },
         serialization: {
            lower: [
               $.Link({
                  target: $('#tab-' + indicator.id + '-opacity-value'),
                  method: setOpacityValue
               })
            ],
         }
      });
      
      function setOpacityValue(value) {
         $(this).html(parseInt(value) +'%');
      }

      $('#tab-' + indicator.id + '-opacity').on('slide', function() {
         var opacity = $(this).val() / 100;

         gisportal.events.trigger('scalebar.opacity', indicator.id, opacity);
         gisportal.layers[indicator.id].setOpacity( opacity );
      });

      $('#tab-' + indicator.id + '-elevation').ddslick({
         onSelected: function(data) {
            if (data.selectedData) {
               indicator.selectedElevation = data.selectedData.value;
               indicator.mergeNewParams({
                  elevation: data.selectedData.value
               });   
            }
         }
      });

      $('#tab-' + indicator.id + '-layer-style').ddslick({
         onSelected: function(data) {
            if (data.selectedData) {
               indicator.style = data.selectedData.value;
               indicator.mergeNewParams({
                  STYLES: data.selectedData.value
               });
               gisportal.indicatorsPanel.scalebarTab(id);
            }
         }
      });
   };
   if(layer.metadataComplete) onMetadata();
   else gisportal.events.bind_once('layer.metadataLoaded',onMetadata);
};

// Needs a refactor

gisportal.indicatorsPanel.initialiseSliders = function(id) {
   // The dates stored in layer are DD-MM-YYYY instead of YYYY-MM-DD
   var firstDate = gisportal.layers[id].firstDate;
   var lastDate = gisportal.layers[id].lastDate;

   var from = $('.js-min[data-id="' + id + '"]');
   var to = $('.js-max[data-id="' + id + '"]');

   if (firstDate !== '' && lastDate !== '' && from.length > 0 && to.length > 0) {
      var min = new Date(firstDate).getTime();
      var max = new Date(lastDate).getTime();
      var Link = $.noUiSlider.Link;
      var slider = $('.range-slider[data-id="' + id + '"]');

      try {
         slider.noUiSlider({
            start: [min, max],
            connect: true,
            behaviour: 'tap-drag',
            range: {
               'min': min,
               'max': max
            },
            serialization: {
               lower: [
                  $.Link({
                     target: from,
                     method: setDate
                  })
               ],
               upper: [
                  $.Link({
                     target: to,
                     method: setDate
                  })
               ],
               format: {
                  decimals: 0
               }
            }
         });
      } catch (e) {}

      slider.on('slide', function(event, val) {
         var interval;

         interval = setInterval(function() {
            if (val[0] <= min) {
               $(this).val([val - 1, null]);
            }

            if (val[1] > max) {
               $(this).val([null, val + 1]);
            }

         }, 100);

         $(this).on('set', function() {
            clearInterval(interval);
         });

         from.val(new Date(+val[0]).toISOString().substring(0, 10));
         to.val(new Date(+val[1]).toISOString().substring(0, 10));
      });
   }
};

function setDate(value) {
   $(this).val(new Date(+value).toISOString().substring(0, 10));
}

gisportal.indicatorsPanel.removeIndicators = function(id) {
   gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);
};


gisportal.indicatorsPanel.getParams = function(id) {
   var dateRange = $('.js-min[data-id="' + id + '"]').val(); // Find date range
   dateRange += "/" + $('.js-max[data-id="' + id + '"]').val();
   var graphXAxis = null,
      graphYAxis = null;

   // Some providers change direction of depth,
   // so this makes it match direction
   var depthDirection = function(id) {
      var layerID = $('#graphcreator-coverage option:selected').val();
      //var layer = gisportal.layers[id];
      var layer = gisportal.layers[id];
      var elevation = layer.selectedElevation; // $('#tab-'+gisportal.utils.nameToId(layer.name)+'-elevation option:selected').val();    
      var direction = gisportal.layers[id].positive;

      // Take direction === up as default
      //if (direction === "down") elevation = -elevation; 
      return elevation;
   };

   var indicator = gisportal.layers[id];

   var exBoundingBox = indicator.exBoundingBox;

   var bbox = gisportal.currentSelectedRegion;
   if(bbox === ""){
      bbox = exBoundingBox.WestBoundLongitude + "," + exBoundingBox.SouthBoundLatitude + "," + exBoundingBox.EastBoundLongitude + "," + exBoundingBox.NorthBoundLatitude;
      bbox = gisportal.reprojectBoundingBox(bbox.split(","), "EPSG:4326", gisportal.projection).join(",");
   }
   // TODO: add bins for histogram!
   var graphParams = {
      baseurl: indicator.wcsURL,
      coverage: indicator.urlName,
      type: $('#tab-' + id + '-graph-type option:selected').val(),
      bins: '',
      time: dateRange,
      //bbox: $('#graphcreator-bbox').val(),
      bbox: bbox,
      depth: depthDirection(id),
      graphXAxis: graphXAxis,
      graphYAxis: graphYAxis,
      graphZAxis: indicator.urlName
   };
   return graphParams;
};


gisportal.indicatorsPanel.exportData = function(id) {
   gisportal.panelSlideout.openSlideout('export-raw');
   var indicator = gisportal.layers[id];
   var rendered = gisportal.templates['export-raw']({
      indicator: indicator
   });

   var content = $('.js-export-raw-slideout  .js-slideout-content')
      .html(rendered);
   

   var startDateStamp = new Date(indicator.firstDate).getTime();
   var lastDateStamp = new Date(indicator.lastDate).getTime();

   var from = content.find('.js-min');
   var to = content.find('.js-max');
   var slider = content.find('.js-range-slider');

    slider.noUiSlider({
      connect: true,
      behaviour: 'tap-drag',
      start: [startDateStamp, lastDateStamp],
      range: {
         'min': startDateStamp,
         'max': lastDateStamp
      },
      serialization: {
         lower: [
            $.Link({
               target: from,
               method: setDate
            })
         ],
         upper: [
            $.Link({
               target: to,
               method: setDate
            })
         ],
         format: {
            decimals: 0
         }
      }
   });

   from.change(function(){
      var currentRange = slider.val();
      var newStart = new Date( $(this).val() ).getTime();
      if( ! isNaN( newStart ) ){
         var newRange = [ newStart, currentRange[1] ];
         slider.val( newRange );
      }
   });
   to.change(function(){
      var currentRange = slider.val();
      var newEnd = new Date( $(this).val() ).getTime();
      if( ! isNaN( newEnd ) ){
         var newRange = [ currentRange[0], newEnd ];
         slider.val( newRange );
      }
   });


   content.find('.js-download').click(function(){
      gisportal.loading.increment();
      var range = slider.val();
      var download_data = gisportal.indicatorsPanel.exportRawUrl( id );
      if(download_data.irregular){
         $.ajax({
            url:  download_data.url,
            method:"POST",
            data: {'data': JSON.stringify(download_data.data)},
            success: function(data){
               window.open(gisportal.middlewarePath + '/download?filename=' + data.filename + '&coverage=' + data.coverage, "_blank");
               gisportal.loading.decrement();
            },
            error: function(e){
               $.notify('There was an error downloading the netCDF: ' + e.statusText, "error");
               gisportal.loading.decrement();
            }
         });
      }else{
         window.open(download_data.url, "_blank");
         gisportal.loading.decrement();
      }

   });

};

gisportal.indicatorsPanel.exportRawUrl = function(id) {
   var indicator = gisportal.layers[id];
   var graphParams = (this.getParams(id));

   var download_data = null;
   var urlParams = {
      service: 'WCS',
      version: '1.0.0',
      request: 'GetCoverage',
      crs: 'OGC:CRS84',
      format: 'NetCDF3'
   };

   urlParams.coverage = indicator.urlName;

   //This block converts the bbox for the download ... TODO: This might be simplifiyable (similar to selectedRegionProjectionChange function)
   if(gisportal.projection != "EPSG:4326"){
      if(gisportal.methodThatSelectedCurrentRegion.justCoords){
         urlParams.bbox = gisportal.reprojectBoundingBox(gisportal.currentSelectedRegion.split(","), gisportal.projection, "EPSG:4326").toString();
      }else{
         var feature, this_feature;
         var features = gisportal.vectorLayer.getSource().getFeatures();
         for(feature in features){
            this_feature = features[feature];
            features[feature] = gisportal.geoJSONToFeature(gisportal.featureToGeoJSON(this_feature, gisportal.projection, "EPSG:4326"));
         }
         urlParams.bbox = gisportal.wkt.writeFeatures(features);
      }
   }else{
      urlParams.bbox = gisportal.currentSelectedRegion;
   }
   urlParams.time = $('.js-export-raw-slideout .js-min').val() + "/" + $('.js-export-raw-slideout .js-max').val();

   if( $('[data-id="' + indicator.id + '"] .js-analysis-elevation').length > 0 ){
      var vert = $('[data-id="' + indicator.id + '"] .js-analysis-elevation').val();
      if( indicator.positive == "down" )
        urlParams.vertical = Math.abs( vert );
     else
         urlParams.vertical = '-' + Math.abs( vert );
   }

   graphParams.type = 'file';
   graphParams.time = urlParams.time;
   graphParams.bbox = urlParams.bbox;
   graphParams.depth = urlParams.vertical;


   var request = $.param(urlParams);
   if (gisportal.methodThatSelectedCurrentRegion.justCoords !== true) {
      download_data = {url:gisportal.middlewarePath + "/prep_download?", data: graphParams, irregular:true};
   } else {
      download_data = {url:indicator.wcsURL + request, irregular:false};
   }
   return download_data;
};

gisportal.indicatorsPanel.addToPlot = function( id )  {
   var graphParams = this.getParams( id );

   // Gets any error with the bounding box and puts it into the div
   if(gisportal.methodThatSelectedCurrentRegion.method != "csvUpload"){
      var bound_error = gisportal.indicatorsPanel.doesCurrentlySelectedRegionFallInLayerBounds( id );
      if( bound_error !== true ){
         errorHtml = '<div class="alert alert-danger">' + bound_error + '</div>';
         var errorElement = $( errorHtml ).prependTo('.js-tab-analysis[data-id="' + id + '"] .analysis-coordinates');
         setTimeout( function(){
            errorElement.remove();
         }, 6000 );
         return;
      }
   }

   var indicator = gisportal.layers[id];
   
   var component = {
      indicator: id,
      bbox: graphParams.bbox
   };

   var elevationSelect = $('.js-tab-analysis[data-id="' + id + '"] .js-analysis-elevation');
   if( elevationSelect.length == 1 )
      component.elevation = elevationSelect.val();

   gisportal.graphs.addComponentToGraph( component );
   
};

gisportal.indicatorsPanel.focusOnBuildGraphCompoent = function( layerId ){
   gisportal.panelSlideout.peakSlideout( 'active-plot' );
   gisportal.panels.showPanel( 'active-layers' );
   gisportal.indicatorsPanel.selectTab( layerId, 'analysis' );
};

gisportal.indicatorsPanel.vectorSelectSwitch = function( layerID , tabName) {
   //Why is this empty??!!
};

gisportal.indicatorsPanel.selectTab = function( layerId, tabName ){
   // Select tab
   if(tabName=="analysis"){
      gisportal.vectorSelectionTest( layerId, tabName );
   }
   $('#tab-' + layerId + '-' + tabName).prop( 'checked', true ).trigger('change');

   //Scroll to layer
   var containerScroll = $('#indicatorsPanel').scrollTop();
   var layerTop = $('#indicatorsPanel > ul > [data-id="' + layerId + '"]').position().top;

   var newLocation = containerScroll + layerTop;
   $('#indicatorsPanel').stop().animate({
      scrollTop: newLocation,
      duration: 150
   }, 2000).one('mousewheel', function(){
      $(this).stop();
   });
};

gisportal.indicatorsPanel.bboxToWKT = function( bboxString ){
   var elements = bboxString.split( "," );
   if( elements.length === false ) return false;
   var newPoints = [
      elements[0] + " " + elements[1],
      elements[0] + " " + elements[3],

      elements[2] + " " + elements[3],
      elements[0] + " " + elements[1],

      elements[0] + " " + elements[1],
   ];

   return 'POLYGON((' + newPoints.join(",") + '))';
};

gisportal.indicatorsPanel.convertBboxCoords = function(coordsArray, from_proj, to_proj){
   for(var point in coordsArray){
      if(typeof(coordsArray[point][0]) == "object"){
         gisportal.indicatorsPanel.convertBboxCoords(coordsArray[point], from_proj, to_proj);
      }else{
         coordsArray[point] = gisportal.reprojectPoint(coordsArray[point], from_proj, to_proj);
      }
   }
};

gisportal.indicatorsPanel.doesCurrentlySelectedRegionFallInLayerBounds = function( layerId ){
   // Skip if empty
   if( gisportal.currentSelectedRegion === "" ) return true;

   var bb1, point;
   // Try to see if its WKT string
   var temp_bbox = gisportal.currentSelectedRegion;
   // This bit just makes sure that the Terraformer can interprate the values as it doesn't work with scientific notation
   temp_bbox = temp_bbox.split(",");
   for(var val in temp_bbox){
      temp_bbox[val] = Number(temp_bbox[val]);
   }
   temp_bbox = temp_bbox.join(",");
   try{
      bb1 = Terraformer.WKT.parse( gisportal.currentSelectedRegion );
   }catch( e ){
      // Assume the old bbox style
      try{
         bb1 = Terraformer.WKT.parse( gisportal.indicatorsPanel.bboxToWKT(temp_bbox) );
      }catch(err){
         $.notify("This shape is not a polygon and cannot be used to select data for graphing, please try another shape", "error");
      }
   }

   var current_proj = gisportal.projection;

   gisportal.indicatorsPanel.convertBboxCoords(bb1.coordinates, current_proj, "EPSG:4326");

   var proj_bounds = gisportal.availableProjections[current_proj].bounds;
   // A different message is displayed if the user clicks off the earth
   var bb2 = new Terraformer.Polygon( {
      "type": "Polygon",
      "coordinates": [[[proj_bounds[0], proj_bounds[3]], [proj_bounds[2], proj_bounds[3]], [proj_bounds[2], proj_bounds[1]], [proj_bounds[0], proj_bounds[1]], [proj_bounds[0], proj_bounds[3]]]]
   });
   if(current_proj !== "EPSG:4326"){
      for(point in bb2.coordinates[0]){
         bb2.coordinates[0][point] = gisportal.reprojectPoint(bb2.coordinates[0][point], current_proj, "EPSG:4326");
      }
   }
   // INFO: This could eventually be replaced if a bounding box that intersects the current world can be split into multi-polygons.
   if(!bb1.within( bb2 )){
      return "The bounding box cannot wrap around the dateline, please redraw it.";
   }

   var layer = gisportal.layers[ layerId ];
   var bounds = layer.exBoundingBox;

   var arr = [
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ],
      [
         Number(bounds.EastBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ],
      [
         Number(bounds.EastBoundLongitude),
         Number(bounds.SouthBoundLatitude)
      ],
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.SouthBoundLatitude)
      ],
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ]
   ];

   bb2 = new Terraformer.Polygon( {
      "type": "Polygon",
      "coordinates": [arr] 
   });

   if(bb1.intersects( bb2 )){
      return true;
   }
   else{
      return "The bounding box selected contains no data for this indicator.";
   }
};
