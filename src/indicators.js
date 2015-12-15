/**------------------------------*\
    Indicators Panel
    This file is for the indicators 
    panel, which includes features such 
    as initialising scalebar, settings 
    etc. Each indicator uses a 
    mustache template.
\*------------------------------------*/

gisportal.indicatorsPanel = {};

gisportal.indicatorsPanel.close = function() {
   //$('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
};

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

   $('.js-indicators').on('click', '.js-remove', function() {
      if (gisportal.selectedLayers.length <= 1) {
         gisportal.panels.showPanel('choose-indicator');
      }
      var id = $(this).closest('[data-id]').data('id');
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
      var min = $('.js-scale-min[data-id="' + id + '"]').val();
      var max = $('.js-scale-max[data-id="' + id + '"]').val();
      gisportal.scalebars.validateScale(id, min, max);
   });

   //Auto scale range
   $('.js-indicators').on('change', '.js-auto', function() {
      var id = $(this).data('id');
      gisportal.layers[id].autoScale = $(this).prop('checked');

      gisportal.scalebars.autoScale(id);
   });

   // Rest scale range
   $('.js-indicators').on('click', '.js-reset', function() {
      var id = $(this).data('id');
      gisportal.scalebars.resetScale(id);
   });


   // Show the demisions panel when you click the scale bar 
   $('.js-indicators').on('click', '.js-scalebar', function() {
      var id = $(this).closest('[data-id]').data('id');
      var layer = gisportal.layers[id];
      $('.js-indicators .indicator-header[data-id="' + id + '"] [title="Scalebar"]').click();
   });



   //  Zoom to data region
   $('.js-indicators').on('click', '.js-zoom-data', function() {
      var indicator = gisportal.layers[$(this).data('id')];
      if (indicator === null)
         return;

      var bbox = [
         parseFloat(indicator.exBoundingBox.WestBoundLongitude),
         parseFloat(indicator.exBoundingBox.SouthBoundLatitude),
         parseFloat(indicator.exBoundingBox.EastBoundLongitude),
         parseFloat(indicator.exBoundingBox.NorthBoundLatitude)
      ]
      var extent = gisportal.reprojectBoundingBox(bbox, 'EPSG:4326', map.getView().getProjection().getCode());
      
      map.getView().fit(extent, map.getSize());
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
};

gisportal.indicatorsPanel.add_wcs_url = function(selected_this)  {
   wcs_url = $('input.js-wcs-url')[0].value;
   layer = gisportal.layers[selected_this.closest('[data-id]').data('id')];
   filename = layer.serverName;
   name = layer.urlName;
   sensor = layer.sensor;
   error_div = $("#" + layer.id + "-analysis-message");

   if(!(wcs_url.startsWith('http://') || wcs_url.startsWith('https://'))){
      error_div.toggleClass('hidden', false);
      error_div.html("The URL must start with 'http://'' or 'https://'");
   }
   else{
      $.ajax({
         url:  '/service/add_wcs_url?url='+encodeURIComponent(wcs_url) + '&filename=' + filename + '&name=' + name + '&sensor=' + sensor,
         success: function(data){
            layer.wcsURL = data
            gisportal.indicatorsPanel.analysisTab(layer.id)
            message_div = $("#" + layer.id + "-analysis-message");
            message_div.toggleClass('hidden', false);
            message_div.html('The WCS URL has been added to this layer.');
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
}

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
      for(var i = 0; i < promises.length; i++){
         promises[i].then(function(res){
            results.push(res); // on success, add to results
         }).always(function(res){
            remaining--; // always mark as finished
            if(!remaining) d.resolve(results);
         });
       }
       return d.promise(); // return a promise
   };

   var urls = [gisportal.middlewarePath+'/metadata/provider/' + provider, gisportal.middlewarePath+'/metadata/indicator/' + indicator].map($.get);

   some(urls).then(function(results){
      for(var i = 0; i < results.length; i++) {
         if (results[i].indexOf('Provider') != -1) {
            $('.metadata_provider').html(results[i]);

            switch( layer.tags.Confidence ){
               case"Low":
                  var text = "&#9785; Low";
                  break;
               case"Medium":
                  var text = "&#128528; Medium";
                  break;
               case"High":
                  var text = "&#9786; High";
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
      
   if ($('.js-indicators [data-id="' + data.id + '"]').length > 0) return false;

   var id = data.id;

   var layer = gisportal.layers[id];

   if( gisportal.graphs.activePlotEditor )
      layer.visibleTab = "analysis"
   
   var rendered = gisportal.templates['indicator'](layer);

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

   gisportal.indicatorsPanel.scalebarTab(id);
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
      gisportal.addLayersForm.addServerToForm($(this).data('server'));
   })

   gisportal.events.trigger('layer.addtopanel', data)
};

gisportal.indicatorsPanel.reorderLayers = function() {
   var layers = [];
   $('.sortable-list .indicator-header').each(function() {
      layers.push($(this).parent().data('id'));
   })

   // so, ol3 doesn't have a nice way to reorder layers; therefore, we take 'em all off and then add 'em back on
   var currentLayers = map.getLayers().getArray();
   var something = currentLayers.length + 1;
   if (currentLayers) {
      for (var i = 0; i < map.getLayers().getArray().length + something; i++) {
         map.removeLayer(map.getLayers().getArray()[0]);
      }
   }
   
   // stick the base layer back on
   var selectedBaseMap = $('#select-basemap').data().ddslick.selectedData.value;
   if (selectedBaseMap !== 'none') {
      map.addLayer(gisportal.baseLayers[selectedBaseMap]);   
   }
   

   // then the indicator layers
   for (var l = layers.length - 1; l > -1; l--) {
      map.addLayer(gisportal.layers[layers[l]].openlayers['anID']);
   }

   gisportal.setCountryBordersToTopLayer();
   gisportal.selectionTools.setVectorLayerToTop();
}

gisportal.indicatorsPanel.removeFromPanel = function(id) {

   $('.js-indicators > li[data-id="' + id + '"]').remove();
   if (gisportal.layers[id]) gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);

   gisportal.events.trigger('layer.remove', id, gisportal.layers[id].name)
};

/* There is overlap here with configurePanel,
 * should refactor at some point */
gisportal.indicatorsPanel.selectLayer = function(id) {
   if (_.indexOf(gisportal.selectedLayers, id) > -1) return false;
   var layer = gisportal.layers[id];
   var options = {};
   if (layer) {
      var name = layer.name.toLowerCase();
      options.visible = true;
      gisportal.getLayerData(layer.serverName + '_' + layer.urlName + '.json', layer, options);
      
      gisportal.events.trigger('layer.select', id, gisportal.layers[id].name)
   }
};

gisportal.indicatorsPanel.hideLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(false);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', false);

      gisportal.events.trigger('layer.hide', id, gisportal.layers[id].name)
   }
};

gisportal.indicatorsPanel.showLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(true);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', true);

      gisportal.events.trigger('layer.show', id, gisportal.layers[id].name)
   }
};

gisportal.indicatorsPanel.detailsTab = function(id) {
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
   
   var rendered = gisportal.templates['tab-details'](indicator);
   $('[data-id="' + id + '"] .js-tab-details').html(rendered);
   $('[data-id="' + id + '"] .js-icon-details').toggleClass('hidden', false);
   gisportal.indicatorsPanel.checkTabFromState(id);
};

gisportal.indicatorsPanel.analysisTab = function(id) {
   var indicator = gisportal.layers[id];

   var onMetadata = function() {
      var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
      indicator.modified = gisportal.utils.nameToId(indicator.name);
      indicator.modifiedName = modifiedName;
      var rendered = gisportal.templates['tab-analysis'](indicator);
      $('[data-id="' + id + '"] .js-tab-analysis')
         .html(rendered)
         .find('.js-coordinates')
         .val( gisportal.currentSelectedRegion );
      $('[data-id="' + id + '"] .js-icon-analyse').toggleClass('hidden', false);

      gisportal.indicatorsPanel.checkTabFromState(id);

   }

   if (indicator.metadataComplete) onMetadata();
   else indicator.metadataQueue.push(onMetadata);

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
      }catch(e){
         indicator.angle = 0;
      }
      try{
         indicator.legendURL = indicator.legendSettings.URL || encodeURIComponent(gisportal.scalebars.createGetLegendURL(indicator, indicator.legend));
      }catch(e){
         indicator.legendURL = encodeURIComponent(gisportal.scalebars.createGetLegendURL(indicator, indicator.legend));
      }
      var renderedScalebar = gisportal.templates['scalebar'](indicator);


      $('[data-id="' + indicator.id + '"] .js-scalebar').html(renderedScalebar);

   } else {
      $('[data-id="' + indicator.id + '"] .js-scalebar').html("");
   };
}

gisportal.indicatorsPanel.scalebarTab = function(id) {
   var layer = gisportal.layers[id];
   var onMetadata = function() {
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
         gisportal.layers[indicator.id].setOpacity( $(this).val() / 100 )
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
      })

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
      })
      
      // $('#tab-' + indicator.id + '-layer-style').on('change', function() {
      //    var value = $(this).val();
      //    indicator.style = value;
      //    indicator.mergeNewParams({
      //       styles: value
      //    });
      //    gisportal.indicatorsPanel.scalebarTab(id);

      // });
      gisportal.indicatorsPanel.checkTabFromState(id);
   }

   if (layer.metadataComplete) onMetadata();
   else layer.metadataQueue.push(onMetadata);
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
      } catch (e) {};

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
}


gisportal.indicatorsPanel.checkTabFromState = function(id) {
   // Couldn't find a better place to put it 
   if (gisportal.cache && gisportal.cache.state && gisportal.cache.state.map && gisportal.cache.state.map.layers && gisportal.cache.state.map.layers[id]) {
      var openTab = gisportal.cache.state.map.layers[id].openTab;
      if (openTab) {
         $('[data-id="' + id + '"] label').toggleClass('active', false);
         $('label[for="' + openTab + '"]').toggleClass('active', true);
         $('#' + openTab).prop('checked', true).change();
      }
   }
}


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


   // TODO: add bins for histogram!
   var graphParams = {
      baseurl: indicator.wcsURL,
      coverage: indicator.urlName,
      type: $('#tab-' + id + '-graph-type option:selected').val(),
      bins: '',
      time: dateRange,
      //bbox: $('#graphcreator-bbox').val(),
      bbox: $('#tab-' + id + '-coordinates').val(),
      depth: depthDirection(id),
      graphXAxis: graphXAxis,
      graphYAxis: graphYAxis,
      graphZAxis: indicator.urlName
   };
   var bbox = $('#tab-' + id + '-coordinates').val();
   if (bbox.indexOf('POLYGON') !== -1) {
      graphParams.isPolygon = 'true';

   }
   if (bbox.indexOf('LINESTRING') !== -1) {
      graphParams.isLine = 'true';

   }
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
      };
   });
   to.change(function(){
      var currentRange = slider.val();
      var newEnd = new Date( $(this).val() ).getTime();
      if( ! isNaN( newEnd ) ){
         var newRange = [ currentRange[0], newEnd ];
         slider.val( newRange );
      };
   });


   content.find('.js-download').click(function(){
      var range = slider.val();
      window.open(gisportal.indicatorsPanel.exportRawUrl( id ), "_blank");
      //$.get("/service/download_check", function(data){
      //   console.log(data);
      //   $('.js-download').text("Download "+data.format+" @ "+ data.size);
      //});
   });

};

gisportal.indicatorsPanel.exportRawUrl = function(id) {
   var indicator = gisportal.layers[id];
   var graphParams = (this.getParams(id));

   var url = null;
   var urlParams = {
      service: 'WCS',
      version: '1.0.0',
      request: 'GetCoverage',
      crs: 'OGC:CRS84',
      format: 'NetCDF3'
   };

   urlParams['coverage'] = indicator.urlName;
   urlParams['bbox'] = $('[data-id="' + indicator.id + '"] .js-coordinates').val();
   urlParams['time'] = $('.js-export-raw-slideout .js-min').val() + "/" + $('.js-export-raw-slideout .js-max').val();

   if( $('[data-id="' + indicator.id + '"] .js-analysis-elevation').length > 0 ){
      var vert = $('[data-id="' + indicator.id + '"] .js-analysis-elevation').val();
      if( indicator.positive == "down" )
        urlParams['vertical'] = Math.abs( vert );
     else
         urlParams['vertical'] = '-' + Math.abs( vert );
   }

   graphParams['type'] = 'timeseries';
   graphParams['time'] = urlParams['time'];
   graphParams['bbox'] = urlParams['bbox'];
   graphParams['depth'] = urlParams['vertical'];


   var request = $.param(urlParams);
   if (urlParams['bbox'].indexOf("POLYGON") !== -1 || urlParams['bbox'].indexOf("LINESTRING") !== -1) {
      url = "/service/download?" + $.param(graphParams);
   } else {
      url = indicator.wcsURL + request;
   }
   return url;
};

gisportal.indicatorsPanel.addToPlot = function( id )  {
   var graphParams = this.getParams( id );

   if( ! doesCurrentlySelectedRegionFallInLayerBounds( id ) ){
      errorHtml = '<div class="alert alert-danger">The bounding box selected contains no data for this indicator.</div>';
      var errorElement = $( errorHtml ).prependTo('.js-tab-analysis[data-id="' + id + '"] .analysis-coordinates');
      setTimeout( function(){
         errorElement.remove()
      }, 6000 );
      return;
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
}

gisportal.indicatorsPanel.selectTab = function( layerId, tabName ){
   // Select tab
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
}

function bboxToWKT( bboxString ){
   var elements = bboxString.split( "," );
   if( elements.length == false )
      return false;
   var newPoints = [
      elements[0] + " " + elements[1],
      elements[0] + " " + elements[3],

      elements[2] + " " + elements[3],
      elements[0] + " " + elements[1],

      elements[0] + " " + elements[1],
   ];

   return 'POLYGON((' + newPoints.join(",") + '))';

}

function doesCurrentlySelectedRegionFallInLayerBounds( layerId ){
   // Skip if empty
   if( gisportal.currentSelectedRegion == "" )
      return true;

   // Try to see if its WKT string
   try{
      var bb1 = Terraformer.WKT.parse( gisportal.currentSelectedRegion );
   }catch( e ){
      // Assume the old bbox style
      var bb1 = Terraformer.WKT.parse( bboxToWKT(gisportal.currentSelectedRegion) );
   };

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
      ]
   ];

   var bb2 = new Terraformer.Polygon( {
      "type": "Polygon",
      "coordinates": [arr] 
   });

   return bb1.intersects( bb2 ) || bb1.contains( bb2 ) || bb1.within( bb2 );

}