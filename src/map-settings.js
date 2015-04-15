
gisportal.map_settings = {};

gisportal.map_settings.init = function() {

   gisportal.createBaseLayers();
   gisportal.createCountryBorderLayers();
   gisportal.createGraticules();
   

   // load the template and set values for base map options and country border options
   var layers = [];
   _.forEach(gisportal.baseLayers, function(d)  {
      var layer = {};
      layer.id = d.getProperties().id;
      layer.name = d.getProperties().title;
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

   var data = {
      baseLayers: layers,
      countryBorders: borders
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
   // 	gisportal.events.emit('displayoptions.basemap', ['select-basemap', $(this).val(), 'Base map changed to '+ $('#select-basemap option:selected').text() ])
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
	// 	gisportal.events.emit('displayoptions.basemap', ['select-country-borders', $(this).val(), 'Country borders set to \''+ $('#select-country-borders option:selected').text() +'\'' ])
	// });

   if (typeof gisportal.config.showGraticules != 'undefined' && gisportal.config.showGraticules) {
      $('#select-graticules').ddslick('select', { value: "On" });
   }

   // NEEDS TO UPDATED FOR COLLABORATION
   // // set an action for the graticules select changing
   // $('#select-graticules').change(function() {
   //    gisportal.setGraticuleVisibility($(this).val());
   //    gisportal.events.emit('displayoptions.graticules', ['select-graticules', $(this).val(), 'Lat/Lon Graticules set to \''+ $('#select-graticules option:selected').text() +'\'' ])
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
      })
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
   // then add the selected option and send it to the bottom
   map.addLayer(gisportal.baseLayers[id]);
   // and make sure that the country borders are on top
   gisportal.setCountryBordersToTopLayer();
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
