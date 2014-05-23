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

   $('.js-indicators').on('click', '.js-draw-box', function()  {
      var id = $(this).data('id'); 
   });

   $('.js-indicators').on('change', '.indicator-select select', function()  {
      var ids = $('option:selected', this).val().split(',');
      var current = $(this).parents('.js-tab-options').data('id');
      gisportal.indicatorsPanel.refineData(ids, current);
   });

   $('.js-indicators').on('click', '.js-reset-options', function()  {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.defaultOptionsTab(id);
   });
   
   $('.js-indicators').on('click', '.js-save-changes', function()  {
      var current = $(this).data('id');
      var id = $('[data-id="' + current + '"] .indicator-select select option:not(.js-placeholder)').val().split(',')[0];
      if (gisportal.microLayers[id])  {
         gisportal.layers[current].unselect();
         delete gisportal.layers[current];
         gisportal.indicatorsPanel.removeFromPanel(current);
         gisportal.indicatorsPanel.selectLayer(id);
         gisportal.indicatorsPanel.addToPanel(id);
      }
   });
   
   $('.js-start-again').on('click', function() {
      $('#configurePanel').toggleClass('hidden', false).toggleClass('active', true);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
   });

   $('.js-indicators').on('click', '.js-zoom-data', function()  {
   var indicator = gisportal.microLayers[$(this).data('id')];
   if(indicator === null)
      return;
            
       var bbox = new OpenLayers.Bounds(
          indicator.exBoundingBox.WestBoundLongitude,
          indicator.exBoundingBox.SouthBoundLatitude,
          indicator.exBoundingBox.EastBoundLongitude,
          indicator.exBoundingBox.NorthBoundLatitude
       ).transform(map.displayProjection, map.projection);
       
      map.zoomToExtent(bbox);
   });

   $('.js-indicators').on('click', '.js-auto', function()  {
      var id = $(this).data('id');
      gisportal.scalebars.autoScale(id);
   });

   $('.js-indicators').on('click', '.js-reset', function()  {
      var id = $(this).data('id');
      gisportal.scalebars.resetScale(id);
   });

   $('.js-share').on('click', function()  {
      gisportal.openid.showShare();
   });
}

gisportal.indicatorsPanel.refreshData = function()  {
   $('.js-indicators').html('');
   for (var id in gisportal.layers)  {
      this.addToPanel(id);
   }
};

gisportal.indicatorsPanel.addToPanel = function(id)  {
   if (gisportal.microLayers[id])  { 
      $.get('templates/indicator.mst', function(template) {
         var name = gisportal.microLayers[id].name;
         var rendered = Mustache.render(template, {
            id : id,
            name : name
         });
         $('.js-indicators').append(rendered);
          
         gisportal.indicatorsPanel.optionsTab(id);
         gisportal.indicatorsPanel.scalebarTab(id);
         gisportal.indicatorsPanel.detailsTab(id);
         gisportal.indicatorsPanel.analysisTab(id);
      });
   }
};

gisportal.indicatorsPanel.removeFromPanel = function(id)  {
   $('.js-indicators li[data-id="' + id + '"]').remove();
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

gisportal.indicatorsPanel.optionsTab = function(id)  {
   this.defaultOptionsTab(id);
};

gisportal.indicatorsPanel.defaultOptionsTab = function(id)  {
   var indicator = gisportal.microLayers[id];
   indicator.groupedNames = {};
   var group = gisportal.groupNames()[indicator.name.toLowerCase()];
   this.renderOptionsTab(indicator, id, group);
};

gisportal.indicatorsPanel.renderOptionsTab = function(indicator, id, group, refined) {
   console.log(indicator, id);
   $.get('templates/tab-options.mst', function(template)  {
      var layer = gisportal.layers[id];  
      if (layer)  { 
         indicator.elevationCache = layer.elevationCache;  
         indicator.elevationUnits = layer.elevationUnits;
         indicator.styles = layer.styles;
         indicator.style = layer.style;
      }
      
      for (var cat in group)  {
         indicator.groupedNames[cat] = gisportal.utils.mustacheFormat(group[cat]);
      }
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-options').html(rendered);

      $('#tab-' + id + '-elevation').on('change', function()  {
         var value = $(this).val();
         layer.selectedElevation = value; 
         layer.mergeNewParams({elevation: value});
      });

      $('#tab-' + id + '-layer-style').on('change', function()  {
         var value = $(this).val();
         layer.style = value;
         layer.mergeNewParams({ styles: value });
         gisportal.indicatorsPanel.scalebarTab(id);
      });

      $('#tab-' + id + '-options').prop('checked', true).change();
      
      if (refined)  {
         $('button[data-id="' + id + '"]').removeClass('hidden');
      }
   });

}

gisportal.indicatorsPanel.detailsTab = function(id)  {
   $.get('templates/tab-details.mst', function(template)  {
      var indicator = gisportal.microLayers[id];
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-details').html(rendered);
   });
};

gisportal.indicatorsPanel.analysisTab = function(id)  {
   $.get('templates/tab-analysis.mst', function(template)  {
      var indicator = gisportal.microLayers[id];
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-analysis').html(rendered);
      gisportal.indicatorsPanel.initialiseSliders(id);
   });
};

gisportal.indicatorsPanel.scalebarTab = function(id)  {
   $.get('templates/tab-scalebar.mst', function(template)  {
      var indicator = gisportal.microLayers[id];
      indicator.legend = gisportal.scalebars.getScalebarDetails(id).url;
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-scalebar').html(rendered);
   });
};

gisportal.indicatorsPanel.createScalebar = function(id)  {
   var indicator = gisportal.microLayers[id];
   
};

gisportal.indicatorsPanel.refineData = function(ids, current)  {
   var indicator = gisportal.microLayers[ids[0]];
   if (indicator)  {
      var name = indicator.name.toLowerCase();
      var groupedNames = gisportal.groupNames()[name];
      var results = groupedNames;
      for (var i = 0; i < Object.keys(groupedNames).length; i++)  {
         var cat = Object.keys(groupedNames)[i];
         for (var j = 0; j < Object.keys(groupedNames[cat]).length; j++)  {
            var tag = groupedNames[cat][Object.keys(groupedNames[cat])[j]];
            console.log('Before',tag);
            var result = _.intersection(tag, ids);
            results[cat][Object.keys(groupedNames[cat])[j]] = result; 
            console.log('After', result);
         }
      }
      var indicator = gisportal.microLayers[current];
      indicator.groupedNames = {};
      console.log(results);
      this.renderOptionsTab(indicator, current, results, true);
   }
};

// Needs a refactor
gisportal.indicatorsPanel.initialiseSliders = function(id)  {

   var firstDate = gisportal.layers[id].firstDate;
   var lastDate = gisportal.layers[id].lastDate;
   var min = new Date(firstDate.split('-').reverse().join('-')).getTime();
   var max = new Date(lastDate.split('-').reverse().join('-')).getTime();

   var from = $('.js-min[data-id="' + id + '"]');
   var to   = $('.js-max[data-id="' + id + '"]');

   var Link = $.noUiSlider.Link;
   var slider = $('.range-slider[data-id="' + id + '"]');
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
      });


      slider.on('slide', function(event, val)  {
          var interval;

          interval = setInterval(function()  {
            if (val[0] <= min)  {
              $(this).val([val -1, null]);
            }

            if (val[1] > max)  {
              $(this).val([null, val + 1]);
            }

          }, 100);

          $(this).on('set', function()  {
            clearInterval(interval);
          });
          
         from.val(new Date(+val[0]).toISOString().substring(0,10));
         to.val(new Date(+val[1]).toISOString().substring(0,10));
      });
};

function setDate(value){
   $(this).val(new Date(+value).toISOString().substring(0,10));   
}

gisportal.indicatorsPanel.createGraph = function(id)  {
   var dateRange = $('.js-min[data-id="' + id + '"]').val(); // Find date range
       dateRange += "/" + $('.js-max[data-id="' + id + '"]').val(); 
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
      var layer = gisportal.microLayers[id];
      var elevation = layer.selectedElevation;
      var direction = gisportal.microLayers[id].positive;

      // Take direction === up as default
      if (direction === "down") elevation = -elevation; 
      return elevation;
   }
  
   var indicator = gisportal.microLayers[id];

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
