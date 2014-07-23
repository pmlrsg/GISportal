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
      if (gisportal.layers[id].isVisible)  {
         gisportal.indicatorsPanel.hideLayer(id);
      }
      else {
         gisportal.indicatorsPanel.showLayer(id);
      } 
   });

   $('.js-indicators').on('click', '.js-create-graph', function()  {
      var id = $(this).data('id');
      $('#graphPanel').toggleClass('hidden', false).toggleClass('active', true);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
      gisportal.indicatorsPanel.createGraph(id);
      //$(this).toggleClass("loading", true);
   });

   $('.js-indicators').on('click', '.js-draw-box', function()  {
      var id = $(this).data('id'); 
   });

   $('.js-indicators').on('change', '.indicator-select select', function()  {
      var ids = $('option:selected', this).val().split(',');
      var current = $(this).parents('.js-tab-options').data('id');
      gisportal.indicatorsPanel.refineData(ids, current);
   });

   $('.js-indicators').on('click', '.js-remove', function()  {
     if (gisportal.configurePanel.selectedIndicators.length <= 1)  {
         $('#configurePanel').toggleClass('hidden', false).toggleClass('active', true);
         $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
      }

      gisportal.configurePanel.deselectLayer($(this).data('name'));
      
      $(this).parents('li').remove();

   });

   $('.js-indicators').on('click', '.js-reset-options', function()  {
      var id = $(this).data('id');
      var name = $(this).data('name');
      if (id !== "none") gisportal.indicatorsPanel.defaultOptionsTab(id);
      else  {
         var group = gisportal.groupNames()[name];
         gisportal.indicatorsPanel.renderOptionsTab({
         name: name,
         id: id,
         refined: false}, group);
      }
   });
      
   $('.js-start-again').on('click', function() {
      $('#configurePanel').toggleClass('hidden', false).toggleClass('active', true);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
   });
   

   $('.js-indicators').on('click', '.js-export-button', function()  {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.exportData(id);
      $('.export.overlay').toggleClass('hidden', false);
   });

   $('.js-close-export').on('click', function()  {
      $('.export.overlay').toggleClass('hidden', true);
   });

   $('.js-indicators').on('change', '.js-scale-min, .js-scale-max', function()  {
      var id = $(this).data('id');
      var min = $('.js-scale-min[data-id="' + id + '"]').val();
      var max = $('.js-scale-max[data-id="' + id + '"]').val();
      gisportal.scalebars.validateScale(id, min, max);
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
      gisportal.openid.getLink();
   });
}

gisportal.indicatorsPanel.refreshData = function(indicators)  {
   $('.js-indicators').html('');
   for (var i = 0; i < indicators.length; i++) {
      this.addToPanel(indicators[i]);
   }
};

gisportal.indicatorsPanel.changeIndicator = function(current, id)  {
   var indicatorAmount  = Object.keys(_.where(gisportal.configurePanel.selectedIndicators, { "name" : current })).length;
   if (!gisportal.layers[current] && indicatorAmount === 0)  {
      var tmp;
      for (var indicator in gisportal.layers)  {
         if (indicator.name.toLowerCase() === gisportal.microLayers[current].name.toLowerCase())  {
            tmp = indicator.id;
         }
      }
      current = tmp;
   }

   if (gisportal.layers[current])  {
      gisportal.layers[current].unselect();
      delete gisportal.layers[current];
  }
   
   if (gisportal.microLayers[id]) {
      gisportal.indicatorsPanel.selectLayer(id);
      var name = gisportal.microLayers[id].name.toLowerCase();
      gisportal.indicatorsPanel.addToPanel({
         id : id,
         refined: true,
         name : name
      });
   }
   
};

gisportal.indicatorsPanel.addToPanel = function(data)  {
   $.get('templates/indicator.mst', function(template) {
      var id = data.id || "none";
      var refined = data.refined || false;
      var name = data.name;

      if (refined && !name)  {
         name = gisportal.microLayers[id].name;
      }
      else if (!gisportal.microLayers[id])  {
         id = "none";
      }
      if (!name)  {
         name = id;
      }
       var index = _.findIndex(gisportal.configurePanel.selectedIndicators, function(d) { return d.name.toLowerCase() === name.toLowerCase();  });
      var group = gisportal.groupNames()[name];
      var modified = gisportal.utils.nameToId(name);
      var rendered = Mustache.render(template, {
         id : id,
         name : name,
         modified : modified,
         index : index
      });

      var prevIndex = index - 1;

      $('.js-indicators > li[data-name="' + name.toLowerCase() + '"]').remove();
      $('.js-indicators').prepend(rendered); 
      
      $('.js-indicators > li').sort(function(a,b){
            return $(a).data('order') > $(b).data('order');
      }).appendTo('.js-indicators');

      if (data.refine)  {
         var refine = data.refine;
         var cat = refine.cat;
         var tag = refine.tag;
         if (cat && tag)  {
            var ids = group[cat][tag];
            group = gisportal.indicatorsPanel.refineData(ids, "none");
            refined = true;
         }
      }
      
      
      if (!refined)  {
         gisportal.indicatorsPanel.renderOptionsTab(data, group);
      }

      if (gisportal.microLayers[id])  { 
         $('[data-name="' + name.toLowerCase() + '"] .js-toggleVisibility').toggleClass('hidden', false);
         gisportal.indicatorsPanel.optionsTab(id);
         gisportal.indicatorsPanel.scalebarTab(id);
         gisportal.indicatorsPanel.detailsTab(id);
         gisportal.indicatorsPanel.analysisTab(id);
      }   

      gisportal.replaceSubtreeIcons($('.js-indicators'));
   });
};

gisportal.indicatorsPanel.removeFromPanel = function(id)  {
   var layer = gisportal.microLayers[id];
   if (layer && layer.name)  {
      $('.js-indicators > li[data-id="' + id + '"], .js-indicators > li[data-name="' + layer.name.toLowerCase() + '"]').remove();
      if (gisportal.layers[id]) gisportal.removeLayer(gisportal.layers[id]);
      gisportal.timeline.removeTimeBarById(id);
   }
};

/* There is overlap here with configurePanel,
 * should refactor at some point */
gisportal.indicatorsPanel.selectLayer = function(id)  {
   var microlayer = gisportal.microLayers[id];
   var options = {};
   if (microlayer)  {
      //$('[data-id="' + id + '"] .icon_show').toggleClass('active', true);
      var name = microlayer.name.toLowerCase();
      var index = _.indexOf(gisportal.configurePanel.selectedIndicators, name);
      if (typeof gisportal.configurePanel.selectedIndicators[index] === "string") {
         gisportal.configurePanel.selectedIndicators[index] = { name : name, id: id };
      }
      else  {
         var index = _.findIndex(gisportal.configurePanel.selectedIndicators, function(d)  {
            return d.name === name;
         });
         gisportal.configurePanel.selectedIndicators[index] = { name : name, id : id };
      }
      gisportal.getLayerData(microlayer.serverName + '_' + microlayer.origName + '.json', microlayer, options);
   }
};

gisportal.indicatorsPanel.hideLayer = function(id)  {
   if (gisportal.layers[id])  {
      gisportal.layers[id].setVisibility(false);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', false);   
   }
};

gisportal.indicatorsPanel.showLayer = function(id)  {
    if (gisportal.layers[id])  {
      gisportal.layers[id].setVisibility(true);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', true);   
   }  
};

gisportal.indicatorsPanel.optionsTab = function(id)  {
   this.defaultOptionsTab(id);
};

gisportal.indicatorsPanel.defaultOptionsTab = function(id)  {
   var indicator = gisportal.microLayers[id];
   indicator.groupedNames = {};
   var name = indicator.name.toLowerCase();
   var group = gisportal.groupNames()[name];
   this.renderOptionsTab({
      indicator: indicator, 
      id : id,
      name: name
   }, group);   
};

gisportal.indicatorsPanel.renderOptionsTab = function(data, group) {
   $.get('templates/tab-options.mst',function(template)  {
      var indicator = data.indicator || {};
      var id = data.id;
      var name = data.name;
      var refined = data.refined;


     
      if (!group) group = {};
      for (var cat in group)  {
         group[cat] = gisportal.utils.mustacheFormat(group[cat]);
      }
      
      group.region = group.region || []; 
      indicator.hasInterval = false;
      indicator.hasConfidence = false;
      if (refined || group.region.length === 1)  {
         indicator.refined = true;
         var found = true;


         if (group.interval.length > 1)  {
            indicator.hasInterval = true;
            found = false;
         }
         
         if (group.Confidence.length > 1)  {
            indicator.hasConfidence = true;
            found = false;
         }
         
         if (found === true)  {
            var newId = group.region[0].value[0];
            var newName;

            if (id !== newId)  {
               if (id !== "none" && id)  {
                  gisportal.indicatorsPanel.changeIndicator(id, newId); 
               }
               else {
                  newName = data.name || gisportal.microLayers[newId].name.toLowerCase();
                  if (newName) id = newName;
                  gisportal.indicatorsPanel.changeIndicator(id, newId); 
               } 
            }
         }                  
      }
      else  {
         indicator.refined = false;
      }

      indicator.id = id || "none";
      indicator.name = name;
      indicator.modified = gisportal.utils.nameToId(name);
      indicator.groupedNames = group;
      var rendered = Mustache.render(template, indicator);
      $('[data-name="' + name.toLowerCase() + '"].js-tab-options').html(rendered);

      // TEMP
      $('[data-name="' + indicator.name + '"] #tab--options').prop('checked', true).change();

      if (refined)  {
         $('.js-reset-options[data-name="' + name.toLowerCase() + '"]').removeClass('hidden');
      }
      gisportal.indicatorsPanel.checkTabFromState(id);
   });

}

gisportal.indicatorsPanel.detailsTab = function(id)  {
   $.get('templates/tab-details.mst', function(template)  {
      var indicator = gisportal.microLayers[id];
      indicator.modified = gisportal.utils.nameToId(indicator.name); 
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-details').html(rendered);
      $('[data-id="' + id + '"] .icon_details').toggleClass('hidden', false);
      gisportal.indicatorsPanel.checkTabFromState(id);
   });
};

gisportal.indicatorsPanel.analysisTab = function(id)  {
   $.get('templates/tab-analysis.mst', function(template)  {
      var indicator = gisportal.microLayers[id];      
      indicator.modified = gisportal.utils.nameToId(indicator.name); 
      var rendered = Mustache.render(template, indicator);
      $('[data-id="' + id + '"] .js-tab-analysis').html(rendered);
      gisportal.indicatorsPanel.initialiseSliders(id);      
      $('[data-id="' + id + '"] .icon_analyse').toggleClass('hidden', false);
      
      gisportal.indicatorsPanel.checkTabFromState(id);
   });
};

gisportal.indicatorsPanel.scalebarTab = function(id, toggleOn)  {
   var toggleOn = toggleOn || false; 
   var microlayer = gisportal.microLayers[id];
      var onMetadata = function()  {
         $.get('templates/tab-scalebar.mst', function(template)  {
      var indicator = gisportal.layers[id];
         if (indicator.elevationCache.length > 0)  {         
            indicator.hasElevation = true;
         }
         
         if (indicator.styles.length > 0)  {
            indicator.hasStyles = true;
         }

         

         indicator.modified = gisportal.utils.nameToId(indicator.name);
         var scalebarDetails = gisportal.scalebars.getScalebarDetails(id); 
         if (scalebarDetails) indicator.legend = scalebarDetails.url;
         if (toggleOn) indicator.showScalebar = true;
         var rendered = Mustache.render(template, indicator);
         $('[data-name="' + indicator.name.toLowerCase() + '"] .js-tab-scalebar').html(rendered);      
         $('[data-name="' + indicator.name.toLowerCase() + '"] .icon_scalebar').toggleClass('hidden', false);

         $('#tab-' + indicator.modified + '-elevation').on('change', function()  {
            var value = $(this).val();
            indicator.selectedElevation = value; 
            indicator.mergeNewParams({elevation: value});
         });

         $('#tab-' + indicator.modified + '-layer-style').on('change', function()  {
            var value = $(this).val();
            indicator.style = value;
            indicator.mergeNewParams({ styles: value });
            gisportal.indicatorsPanel.scalebarTab(id, true);
         });

         gisportal.indicatorsPanel.checkTabFromState(id);
      });

   }
   
   if (microlayer.metadataComplete) onMetadata();
   else microlayer.metadataQueue.push(onMetadata);

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
      var indicator = gisportal.microLayers[current] || {};
      indicator.groupedNames = {};
      console.log(results);
      this.renderOptionsTab({
         indicator : indicator, 
         id : current,
         name : name,
         refined: true
      }, results);
   }
};

// Needs a refactor
gisportal.indicatorsPanel.initialiseSliders = function(id,firstDate, lastDate)  {
     
   if (gisportal.microLayers[id])  {
      var firstDate = gisportal.microLayers[id].firstDate || firstDate || '';
      var lastDate = gisportal.microLayers[id].lastDate || lastDate || '';
   }
   else  {
      var firstDate = firstDate || '';
      var lastDate = lastDate || '';
   } 
   
   if (firstDate !== '' && lastDate !== '')  { 
      var min = new Date(firstDate).getTime();
      var max = new Date(lastDate).getTime();

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
   }
};

function setDate(value){
   $(this).val(new Date(+value).toISOString().substring(0,10));   
}

gisportal.indicatorsPanel.removeIndicators = function(id)  {
   gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);
}


gisportal.indicatorsPanel.checkTabFromState = function(id)  {
   // Couldn't find a better place to put it 
   if (gisportal.cache && gisportal.cache.state && gisportal.cache.state.map && gisportal.cache.state.map.layers)  {
      var openTab = gisportal.cache.state.map.layers[id].openTab;
      if (openTab)  {
         $('[data-id="' + id + '"] label').toggleClass('active', false);
         $('label[for="' + openTab + '"]').toggleClass('active', true);
         $('#' + openTab).prop('checked', true).change();
      }
   }
}


gisportal.indicatorsPanel.getParams = function(id)  {
   var dateRange = $('.js-min[data-id="' + id + '"]').val(); // Find date range
       dateRange += "/" + $('.js-max[data-id="' + id + '"]').val(); 
   var graphXAxis = null,
       graphYAxis = null;
   
   //var modified = gisportal.utils.nameToId(id);


/*   if ( $('#tab-' + modified + '-graph-type option[value="hovmollerLon"').prop("selected") ) {
      graphXAxis = 'Lon';
      graphYAxis = 'Time';
   }
   else if ( $('#tab-' + modified + '-graph-type option[value="hovmollerLat"]').prop("selected") ) {
      graphXAxis = 'Time';
      graphYAxis = 'Lat';
   }*/
  
   // Some providers change direction of depth,
   // so this makes it match direction
   var depthDirection = function(id)  {
      var layerID = $('#graphcreator-coverage option:selected').val();
      //var layer = gisportal.microLayers[id];
      var layer = gisportal.layers[id];
      var elevation = layer.selectedElevation; // $('#tab-'+gisportal.utils.nameToId(layer.name)+'-elevation option:selected').val();    
      var direction = gisportal.microLayers[id].positive;

      // Take direction === up as default
      //if (direction === "down") elevation = -elevation; 
      return elevation;
   }
  
   var indicator = gisportal.microLayers[id];


   // TODO: add bins for histogram!
   var graphParams = {
      baseurl: indicator.wcsURL,
      coverage: indicator.origName,
      type: $('#tab-' + id + '-graph-type option:selected').val(),
      bins: '',
      time: dateRange,
      //bbox: $('#graphcreator-bbox').val(),
      bbox: $('#tab-' + id + '-coordinates').val(),
      depth: depthDirection(id),
      graphXAxis: graphXAxis,
      graphYAxis: graphYAxis,
      graphZAxis: indicator.id
   };
   return graphParams;
};
gisportal.indicatorsPanel.createGraph = function(id)  {
   var graphParams = this.getParams(id);
   var indicator = gisportal.microLayers[id];
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
      options.id = indicator.id;
      gisportal.graphs.data(graphParams, options);
   }
   else {
      gisportal.gritter.showNotification ('dataNotSelected', null);
   }
};


gisportal.indicatorsPanel.exportData = function(id)  {
   this.exportProcessed(id);
   this.exportRaw(id);
};

gisportal.indicatorsPanel.exportRaw = function(id)  {
   var link = $('#export-netcdf');
   
   var indicator = gisportal.microLayers[id];    

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
   urlParams['time'] = $('.js-min[data-id="' + indicator.id + '"]').val() + "/" + $('.js-max[data-id="' + indicator.id + '"]').val(); 
   
   var request = $.param(urlParams);
   url = indicator.wcsURL + request;

   $(link).attr('href', url); 

};

gisportal.indicatorsPanel.exportProcessed = function(id)  {
   var link = $('#export-csv');
   var params = this.getParams(id);
   params['output_format'] = 'csv';
   var request = $.param(params);


   var csv = gisportal.wcsLocation + request;
   $(link).attr('href', csv);
};

/*
gisportal.indicatorsPanel.createURL = function(url, params)  {
   var params = params || {};
   var urlParams = {
      service: 'WCS',
      version: '1.0.0',
      request: 'GetCoverage',
      crs: 'OGC:CRS84',
      format: 'NetCDF3',
      coverage: '',
      time: '',

   }; 

   urlParams = $.extend(urlParams, params);
   urlParams = $.param(urlParams);
   return url + urlParams;
};

gisportal.indicatorsPanel.openURL = function(url, id)  {
   var link = $('.exportButton[data-id="' + id + '"]');
   $(link).attr('download', 'dataexport');
   $(link).attr('href', url);
};*/
