
gisportal.map_settings = {};

gisportal.map_settings.init = function() {

   gisportal.createBaseLayers();
   gisportal.createCountryBorderLayers();
   gisportal.createGraticules();
   

   // load the template and set values for base map options and country border options
   var layers = [];
   
   var layer = {};
   layer.id = 'none';
   layer.name = 'No map';
   layer.description = 'plain black background';
   layers.push(layer);

   _.forEach(gisportal.baseLayers, function(d)  {
      var layer = {};
      layer.id = d.getProperties().id;
      layer.name = d.getProperties().title;
      layer.description = d.getProperties().description;
      layers.push(layer);
   });

   var borders = [];
   borders.push({id:'0', name: 'None'});

   _.forEach(gisportal.countryBorderLayers, function(d) {
   	var border = {};
      border.id = d.getProperties().id;
      border.name = d.getProperties().title;
      borders.push(border);
   })

   var projections = [];
   _.forEach(gisportal.availableProjections, function(d) {
      projections.push(d)
   })
   var data = {
      baseLayers: layers,
      countryBorders: borders,
      projections: projections
   }
   var rendered = gisportal.templates['map-settings'](data)
   $('.js-map-options').html(rendered); 

   // enable ddslick'ness
   $('#select-basemap').ddslick({
      onSelected: function(data) { 
         if (data.selectedData) {
            gisportal.selectBaseLayer(data.selectedData.value); 
         }
      }
   });
   $('#select-country-borders').ddslick({
      onSelected: function(data) { 
         if (data.selectedData) {
            gisportal.selectCountryBorderLayer(data.selectedData.value); 
         }
      },
   });
   $('#select-graticules').ddslick({
      onSelected: function(data) { 
         if (data.selectedData) {
            gisportal.setGraticuleVisibility(data.selectedData.value); 
         }
      },
   });
   $('#select-projection').ddslick({
      onSelected: function(data) { 
         if (data.selectedData) {
            gisportal.setProjection(data.selectedData.value); 
         }
      },
   });

   // set the default value for the base map
   if (typeof gisportal.config.defaultBaseMap != 'undefined' && gisportal.config.defaultBaseMap) {
      map.addLayer(gisportal.baseLayers[gisportal.config.defaultBaseMap]);   
      $('#select-basemap').ddslick('select', { value: gisportal.config.defaultBaseMap })
   } else {
      map.addLayer(gisportal.baseLayers.EOX);   
      $('#select-basemap').ddslick('select', { value: "EOX" })
   }

   // NEEDS TO UPDATED FOR COLLABORATION
   //  // set an action for the base map select changing
   // $('#select-basemap').change(function() {
   // 	gisportal.selectBaseLayer($('#select-basemap').val())
   //    gisportal.indicatorsPanel.reorderLayers();
   // 	gisportal.events.trigger('displayoptions.basemap', ['select-basemap', $(this).val(), 'Base map changed to '+ $('#select-basemap option:selected').text() ])
   // });

   // set the default value if one exists in config.js
   if (typeof gisportal.config.countryBorder != 'undefined' && typeof gisportal.config.countryBorder.defaultLayer != 'undefined' && gisportal.config.countryBorder.alwaysVisible == true) {
      $('#select-country-borders').ddslick('select', { value: gisportal.config.countryBorder.defaultLayer });
      gisportal.selectCountryBorderLayer(gisportal.config.countryBorder.defaultLayer);
   };

   // NEEDS TO UPDATED FOR COLLABORATION
   //   // set an action for the country borders select changing
   //   $('#select-country-borders').change(function() {
	// 	gisportal.selectCountryBorderLayer($('#select-country-borders').val());
	// 	gisportal.events.trigger('displayoptions.basemap', ['select-country-borders', $(this).val(), 'Country borders set to \''+ $('#select-country-borders option:selected').text() +'\'' ])
	// });

   if (typeof gisportal.config.showGraticules != 'undefined' && gisportal.config.showGraticules) {
      $('#select-graticules').ddslick('select', { value: "On" });
   }

   // NEEDS TO UPDATED FOR COLLABORATION
   // // set an action for the graticules select changing
   // $('#select-graticules').change(function() {
   //    gisportal.setGraticuleVisibility($(this).val());
   //    gisportal.events.trigger('displayoptions.graticules', ['select-graticules', $(this).val(), 'Lat/Lon Graticules set to \''+ $('#select-graticules option:selected').text() +'\'' ])
   // });

};

gisportal.setGraticuleVisibility = function(setTo) {
   if (setTo == 'On') {
      graticule_control.setMap(map);
   } else {
      try {
         graticule_control.setMap();   
      } catch(e) {
         // setMap doesn't like being called before it's ready, so breaks when page first loads
      }
      
   }
}

/** Create  the country borders overlay
 *
 */
gisportal.createCountryBorderLayers = function() {
   
   gisportal.countryBorderLayers = {
      countries_all_white: new ol.layer.Tile({ 
         id: 'countries_all_white', 
         title: 'White border lines',
         source: new ol.source.TileWMS({
            url: 'https://rsg.pml.ac.uk/geoserver/wms?',
            crossOrigin: null,
            params: { LAYERS: 'rsg:full_10m_borders', VERSION: '1.1.0', STYLES: 'line-white', SRS: gisportal.projection},
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }),
      }),
      countries_all_black: new ol.layer.Tile({ 
         id: 'countries_all_black', 
         title: 'Black border lines',
         source: new ol.source.TileWMS({
            url: 'https://rsg.pml.ac.uk/geoserver/wms?',
            crossOrigin: null,
            params: { LAYERS: 'rsg:full_10m_borders', VERSION: '1.1.0', STYLES: 'line_black', SRS: gisportal.projection},
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }),
      }),
      countries_all_blue: new ol.layer.Tile({ 
         id: 'countries_all_blue', 
         title: 'Blue border lines',
         source: new ol.source.TileWMS({
            url: 'https://rsg.pml.ac.uk/geoserver/wms?',
            crossOrigin: null,
            params: { LAYERS: 'rsg:full_10m_borders', VERSION: '1.1.0', STYLES: 'line', SRS: gisportal.projection},
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }),
      })
   };


}

gisportal.setCountryBordersToTopLayer = function() {
   try { // because it might not exist yet
      gisportal.selectCountryBorderLayer($('#select-country-borders').data().ddslick.selectedData.value);
   } catch(e) {

   }
}

gisportal.selectCountryBorderLayer = function(id) {
   // // first remove all other country layers that might be on the map
   for (var prop in gisportal.countryBorderLayers) {
      try {
         map.removeLayer(gisportal.countryBorderLayers[prop])   
      } catch(e) {
         // nowt to do really, the layer may not be on the map
      }
   }
   // then add the selected one, as long as it's not 'None' (0)
   if (id != '0') {
      map.addLayer(gisportal.countryBorderLayers[id]);
   }  
}


/**
 * Create all the base layers for the map.
 */
gisportal.createBaseLayers = function() {

   gisportal.baseLayers = {
      EOX: new ol.layer.Tile({
         id: 'EOX',                       // required to populate the display options drop down list
         title: 'EOX',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'terrain-light', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }) 
      }),
      GEBCO: new ol.layer.Tile({
         id: 'GEBCO',
         title: 'GEBCO',
         projections: ['EPSG:4326', 'EPSG:3857'],
         source: new ol.source.TileWMS({
            url: 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?',
            crossOrigin: null,
            params: {LAYERS: 'gebco_08_grid', VERSION: '1.1.1', SRS: gisportal.projection, FORMAT: 'image/jpeg', wrapDateLine: true },
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }) 
      }),
      MetacartaBasic: new ol.layer.Tile({
         id: 'MetacartaBasic',
         title: 'Metacarta Basic',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            url: 'http://vmap0.tiles.osgeo.org/wms/vmap0?',
            crossOrigin: null,
            params: {LAYERS: 'basic', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }) 
      }),
      Landsat: new ol.layer.Tile({
         id: 'Landsat',
         title: 'Landsat',
         projections: ['EPSG:4326', 'EPSG:3857'],
         source: new ol.source.TileWMS({
            url: 'http://irs.gis-lab.info/?',
            crossOrigin: null,
            params: {LAYERS: 'landsat', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }) 
      }),
      BlueMarble: new ol.layer.Tile({
         id: 'BlueMarble',
         title: 'Blue Marble',
         projections: ['EPSG:4326', 'EPSG:3857'],
         source: new ol.source.TileWMS({
            url: 'http://demonstrator.vegaspace.com/wmspub/?',
            crossOrigin: null,
            params: {LAYERS: 'BlueMarble', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: function(tile, src) {
               gisportal.loading.increment();

               var tileElement = tile.getImage();
               tileElement.onload = function() {
                  gisportal.loading.decrement();
               };
               tileElement.src = src;
            }
         }) 
      }),
      OSM: new ol.layer.Tile({
         id: 'OSM',
         title: 'Open Street Map',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.OSM({
            projection: gisportal.projection
         })
      }),
   }

   if (gisportal.config.bingMapsAPIKey) {
      gisportal.baseLayers.BingMapsAerial = new ol.layer.Tile({
         id: 'BingMapsAerial',
         title: 'Bing Maps - Aerial imagery',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'Aerial'
         })
      });

      gisportal.baseLayers.BingMapsAerialWithLabels = new ol.layer.Tile({
         id: 'BingMapsAerialWithLabels',
         title: 'Bing Maps - Aerial imagery with labels',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'AerialWithLabels'
         })
      });

      gisportal.baseLayers.BingMapsRoad = new ol.layer.Tile({
         id: 'BingMapsRoad',
         title: 'Bing Maps - Road',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'Road'
         })
      });

      gisportal.baseLayers.BingMapsCB = new ol.layer.Tile({
         id: 'BingMapsCB',
         title: 'Collins Bart',
         description: 'EPSG:3857 only, coverage of UK only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'collinsBart'
         }),
         viewSettings: {
            minZoom: 10,
            maxZoom: 13,
            defaultCenter: [53.825564,-2.421976]
         }
      });

      gisportal.baseLayers.BingMapsOS = new ol.layer.Tile({
         id: 'BingMapsOS',
         title: 'Ordnance Survey',
         description: 'EPSG:3857 only, coverage of UK only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'ordnanceSurvey'
         }),
         viewSettings: {
            minZoom: 10,
            maxZoom: 17,
            defaultCenter: [53.825564,-2.421976]
         }
      });

   }
};

gisportal.selectBaseLayer = function(id) {
   // take off all the base maps
   for (var prop in gisportal.baseLayers) {
      try {
         map.removeLayer(gisportal.baseLayers[prop])
      } catch(e) {
         // nowt to do really, the base layer may not be on the map
      }
   }
   // check to see if we need to change projection
   var current_projection = map.getView().getProjection().getCode();
   var msg = '';
   var setViewRequired = true;

   // the selected base map isn't available in the current projection
   if (_.indexOf(gisportal.baseLayers[id].getProperties().projections, current_projection) < 0) {
      // if there's only one available projection for the selected base map set the projection to that value and then load the base map
      if (gisportal.baseLayers[id].getProperties().projections.length == 1) {
         msg = 'The projection has been changed to ' + gisportal.baseLayers[id].getProperties().projections[0] + ' in order to display the ' + gisportal.baseLayers[id].getProperties().title + ' base layer';
         gisportal.setProjection(gisportal.baseLayers[id].getProperties().projections[0])
         $('#select-projection').ddslick('select', { value: gisportal.baseLayers[id].getProperties().projections[0], doCallback: false })
         setViewRequired = false;
      } else {
         msg = 'The \'' + gisportal.baseLayers[id].getProperties().title + '\' base map is not available in the current projection. Try changing the projection first and then selecting the base map again';
         return;
      }
   } 

   // if there's a message as a result of reprojection display it
   if (msg.length > 0) {
      $('.js-map-settings-message').html(msg).toggleClass('alert-warning', true).toggleClass('hidden', false);
   } else {
      $('.js-map-settings-message').html('').toggleClass('alert-warning', false).toggleClass('hidden', true);
   }
   // then add the selected option and send it to the bottom
   if (id !== 'none') {
      map.addLayer(gisportal.baseLayers[id]);
   }
   // and make sure that they are in the correct order
   if (gisportal.selectedLayers.length > 0) {
      gisportal.indicatorsPanel.reorderLayers();   
   }

   if (setViewRequired) {
      var centre = map.getView().getCenter();
      var extent = map.getView().calculateExtent(map.getSize());
      var projection = map.getView().getProjection().getCode();
      gisportal.setView(centre, extent, projection);
   }
}

gisportal.createGraticules = function() {

   graticule_control = new ol.Graticule({
      // the style to use for the lines, optional.
      strokeStyle: new ol.style.Stroke({
         color: 'rgba(255,255,255,0.9)',
         width: 1,
         lineDash: [0.5, 4]
      })
   });
   if (gisportal.config.showGraticules) {
      graticule_control.setMap(map);
   }

}
  
gisportal.setProjection = function(new_projection) {
   // first make sure that base layer can accept the projection
   var current_basemap = $('#select-basemap').data('ddslick').selectedData.value;

   // does the current base map allow the requested projection?
   if (_.indexOf(gisportal.baseLayers[current_basemap].getProperties().projections, new_projection) < 0) {
      // no, tell the user then bail out
      $('.js-map-settings-message')
         .html('The \'' + gisportal.baseLayers[current_basemap].getProperties().title + '\' base map cannot be used with '+ new_projection +'. Try changing the base map and then selecting the required projection.')
         .toggleClass('alert-danger', true)
         .toggleClass('hidden', false);
      // set the projection ddslick value back to original value
      $('#select-projection').ddslick('revertToPreviousValue')
      return;
   } else {
      $('.js-map-settings-message').html('').toggleClass('alert-danger', false).toggleClass('hidden', true);
   }
   
   // the centre point so that we know where we are
   var current_centre = map.getView().getCenter();
   // the projection so that we know what we're transforming from
   var current_projection = map.getView().getProjection().getCode();
   // the extent so that we can make sure the visible area remains visible in the new projection
   var current_extent = map.getView().calculateExtent(map.getSize());
   // make sure that extent is within the new projection's extent, and if not tweak it so that it is
   var new_max_extent = gisportal.availableProjections[new_projection].bounds
   
   // the current extent reprojected
   var sw_corner = ol.proj.transform([current_extent[0], current_extent[1]], current_projection, new_projection);
   var ne_corner = ol.proj.transform([current_extent[2], current_extent[3]], current_projection, new_projection);
   var new_extent = [sw_corner[0], sw_corner[1], ne_corner[0], ne_corner[1]];

   for (var i = 0; i < 4; i++) {
      if (isNaN(new_extent[i])) new_extent[i] = new_max_extent[i];
   }
   var new_centre = ol.proj.transform(current_centre, current_projection, new_projection);
   gisportal.setView(new_centre, new_extent, new_projection);
}

gisportal.setView = function(centre, extent, projection) {
   var current_zoom = map.getView().getZoom();
   var min_zoom = 3;
   var max_zoom = 12;
   if (projection == 'EPSG:3857') max_zoom = 19;

   var viewSettings = gisportal.baseLayers[$('#select-basemap').data('ddslick').selectedData.value].getProperties().viewSettings;
   if (typeof viewSettings !== 'undefined') {
      if (typeof viewSettings.minZoom !== 'undefined') min_zoom = viewSettings.minZoom;
      if (typeof viewSettings.maxZoom !== 'undefined') max_zoom = viewSettings.maxZoom;
   }

   var view = new ol.View({
         projection: projection,
         center: centre,
         minZoom: min_zoom,
         maxZoom: max_zoom,
      })
   map.setView(view);
   map.getView().fitExtent(extent, map.getSize());

}