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
      var id = $(this).parent().data('id');
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
      var id = $(this).parent().data('id');
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
   $('.js-indicators').on('change', '.js-scale-min, .js-scale-max, .scale-options > input[type="checkbox"]', function() {
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

      var bbox = new OpenLayers.Bounds(
         indicator.exBoundingBox.WestBoundLongitude,
         indicator.exBoundingBox.SouthBoundLatitude,
         indicator.exBoundingBox.EastBoundLongitude,
         indicator.exBoundingBox.NorthBoundLatitude
      ).transform(map.displayProjection, map.projection);

      map.zoomToExtent(bbox);
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
         var indicator = $(this).parents('ul').siblings('.indicator-header').data('name');
         var provider = $(this).parents('ul').siblings('.indicator-header').data('provider');
         //console.log('closing slideout');
         // grey out other things here - grey needs to be clickable to disable and hide.
         $('.js-indicators > li[data-name!="' + indicator + '"]').each(function() {
            console.log('greyaing out : ' + $(this).data('name'));
            $(this).append("<div class='indicator-overlay'></div>");
         });
          gisportal.indicatorsPanel.getMetadata(indicator, provider);
      }
      
      // if (gisportal.panelSlideout.isOut('metadata')) {
      //    gisportal.panelSlideout.closeSlideout('metadata');
      //    setTimeout(function() {
      //       gisportal.indicatorsPanel.getMetadata(indicator, provider);
      //    }, 500);
      // } else {
      //    gisportal.indicatorsPanel.getMetadata(indicator, provider);

      // }

      //gisportal.indicatorsPanel.getMetadata(indicator,provider);
   });

   $('.js-indicators').on('click', '.indicator-overlay', function(){
      gisportal.events.trigger('metadata.close');
   });

   $('.metadata-slideout').on('click', '.js-close-extrainfo', function() {
      gisportal.events.trigger('metadata.close');
   });


};

gisportal.events.bind('metadata.close', function() {
   $('.indicator-overlay').remove();
   gisportal.panelSlideout.closeSlideout('metadata');
});



gisportal.indicatorsPanel.getMetadata = function(indicator, provider) {
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
       }
       else {
          $('.metadata_indicator').html(results[i]);
       }
    }
}).always(function(){
   gisportal.panelSlideout.openSlideout('metadata');
});
   // $.when($.get('service/metadata/provider/' + provider).fail(function(){}), $.get('service/metadata/indicator/' + indicator).fail(function(){console.log("failed to get thing");}))
   //    .then(function(provider, indicator) {
   //       $('.metadata_indicator').html(indicator[0]);
   //       $('.metadata_provider').html(provider[0]);
   //       gisportal.panelSlideout.openSlideout('metadata');

   //    }, function(d){console.log(d);});



};



gisportal.indicatorsPanel.refreshData = function(indicators) {
   $('.js-indicators').html('');
   for (var i = 0; i < indicators.length; i++) {
      this.addToPanel(indicators[i]);
   }
};

gisportal.indicatorsPanel.addToPanel = function(data) {
   $.get('templates/indicator.mst', function(template) {
      console.log(data);
      //console.log("adding indicator to panel");
      //console.log(data);
      if ($('.js-indicators [data-id="' + data.id + '"]').length > 0) return false;
      var id = data.id || "none";
      var provider = data.provider || "none";
      var refined = data.refined || false;
      var name = data.name.toLowerCase();
      var index = data.index || 0;
      if (refined && !name) {
         name = gisportal.layers[id].name;
      } else if (!gisportal.layers[id]) {
         id = "none";
      }
      if (!name) {
         name = id;
      }

      var group = gisportal.groupNames()[name];
      var modified = gisportal.utils.nameToId(name);
      var region = gisportal.layers[id].tags.region;
      var tmp = {
         id: id,
         name: name,
         modified: modified,
         index: index,
         region: region,
         provider: provider
      };
      var tags = gisportal.groupNames()[name.toLowerCase()];
      if (data.interval && Object.keys(tags['interval']).length > 1) tmp.interval = gisportal.layers[id].tags.interval;
      if (data.confidence && Object.keys(tags['Confidence']).length > 1) tmp.confidence = gisportal.layers[id].tags.Confidence;
      var rendered = Mustache.render(template, tmp);

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

      if (gisportal.layers[id]) {
         $('[data-name="' + name.toLowerCase() + '"] .js-toggleVisibility')
            .toggleClass('hidden', false)
            .toggleClass('active', gisportal.layers[id].isVisible);
         gisportal.indicatorsPanel.scalebarTab(id);
         gisportal.indicatorsPanel.detailsTab(id);
         gisportal.indicatorsPanel.analysisTab(id);
      }


      //Add the scale bar tooltip
      var renderedTooltip = gisportal.templates['tooltip-scalebar'](gisportal.layers[id]);
      $('[data-id="' + id + '"] .js-scalebar').tooltipster({
         //interactive: true,
         contentAsHTML: true,
         content: renderedTooltip,
         position: "right",
         maxWidth: 200
      });

      gisportal.replaceSubtreeIcons($('.js-indicators'));
   });
};

gisportal.indicatorsPanel.removeFromPanel = function(id) {

   $('.js-indicators > li[data-id="' + id + '"]').remove();
   if (gisportal.layers[id]) gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);
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
      gisportal.getLayerData(layer.serverName + '_' + layer.origName + '.json', layer, options);
   }
};

gisportal.indicatorsPanel.hideLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(false);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', false);
   }
};

gisportal.indicatorsPanel.showLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(true);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', true);
   }
};

gisportal.indicatorsPanel.detailsTab = function(id) {
   var indicator = gisportal.layers[id];

   var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
   indicator.modifiedName = modifiedName;
   indicator.modified = gisportal.utils.nameToId(indicator.name);
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

      gisportal.replaceAllIcons();
   }

   if (indicator.metadataComplete) onMetadata();
   else indicator.metadataQueue.push(onMetadata);

};

/**
 * Redraws the legend bar which will reflect changes to the legend colour and rage
 *
 * @param String layerId The ID of the layer to reload
 */
gisportal.indicatorsPanel.redrawScalebar = function(layerId) {
   var indicator = gisportal.layers[layerId];
   var scalebarDetails = gisportal.scalebars.getScalebarDetails(layerId);
   if (scalebarDetails) {
      indicator.legend = scalebarDetails.url;
      indicator.scalePoints = scalebarDetails.scalePoints;
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

      $('#tab-' + indicator.id + '-elevation').on('change', function() {
         var value = $(this).val();
         indicator.selectedElevation = value;
         indicator.mergeNewParams({
            elevation: value
         });
      });

      $('#tab-' + indicator.id + '-layer-style').on('change', function() {
         var value = $(this).val();
         indicator.style = value;
         indicator.mergeNewParams({
            styles: value
         });
         gisportal.indicatorsPanel.scalebarTab(id);

      });
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

   var vert = $('[data-id="' + indicator.id + '"] .js-analysis-elevation').val();
   if( indicator.positive == "down" )
     urlParams['vertical'] = Math.abs( vert );
  else
      urlParams['vertical'] = indicator.positive + Math.abs( vert );


   graphParams['type'] = 'timeseries';
   graphParams['time'] = urlParams['time'];
   graphParams['bbox'] = urlParams['bbox'];
   graphParams['depth'] = urlParams['depth'];


   var request = $.param(urlParams);
   if (urlParams['bbox'].indexOf("POLYGON") !== -1 || urlParams['bbox'].indexOf("LINESTRING") !== -1) {
      url = "/service/download?" + $.param(graphParams);
   } else {
      url = indicator.wcsURL + request;
   }
   return url;
};

gisportal.indicatorsPanel.addToPlot = function(id)  {
   var graphParams = this.getParams(id);
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

