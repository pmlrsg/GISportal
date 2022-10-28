
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
   });

   var projections = [];
   _.forEach(gisportal.availableProjections, function(d) {
      projections.push(d);
   });
   var data = {
      baseLayers: layers,
      countryBorders: borders,
      projections: projections,
   };
   var rendered = gisportal.templates['map-settings'](data);
   $('.js-map-options').html(rendered);

   if(!gisportal.config.showTutorialLinks || gisportal.walkthrough.is_playing){
      $('.walkthrough-tutorial-btn').toggleClass('hidden', true);
   }

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
      if (gisportal.config.defaultBaseMap != "none")  { 
            map.addLayer(gisportal.baseLayers[gisportal.config.defaultBaseMap]);   
            $('#select-basemap').ddslick('select', { value: gisportal.config.defaultBaseMap });
      }
   } else {
      map.addLayer(gisportal.baseLayers.EOX);   
      $('#select-basemap').ddslick('select', { value: "EOX" });
   }

   // set the default value if one exists in config.js
   if (typeof gisportal.config.countryBorder != 'undefined' && typeof gisportal.config.countryBorder.defaultLayer != 'undefined' && gisportal.config.countryBorder.alwaysVisible === true) {
      $('#select-country-borders').ddslick('select', { value: gisportal.config.countryBorder.defaultLayer });
      gisportal.selectCountryBorderLayer(gisportal.config.countryBorder.defaultLayer);
   }

   if (typeof gisportal.config.showGraticules != 'undefined' && gisportal.config.showGraticules) {
      $('#select-graticules').ddslick('select', { value: "On" });
   }

   $('#mapSettingsPanel').bind('scroll', function() {
      var scrollPercent = parseInt(100 * ($(this).scrollTop()/(this.scrollHeight - $(this).height())));
      var params = {
         "event": "mapsettingspanel.scroll",
         "scrollPercent": scrollPercent
      };
      gisportal.events.trigger('mapsettingspanel.scroll', params);
   });

};

gisportal.setGraticuleVisibility = function(setTo) {
   gisportal.events.trigger('map-setting.graticules', setTo);
   
   if (setTo == 'On') {
      graticule_control.setMap(map);
   } else {
      try {
         graticule_control.setMap();   
      } catch(e) {
         // setMap doesn't like being called before it's ready, so breaks when page first loads
      }
      
   }
};

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
};

gisportal.setCountryBordersToTopLayer = function() {
   try { // because it might not exist yet
      gisportal.selectCountryBorderLayer($('#select-country-borders').data().ddslick.selectedData.value);
   } catch(e) {

   }
};

gisportal.selectCountryBorderLayer = function(id) {
   // first remove all other country layers that might be on the map
   for (var prop in gisportal.countryBorderLayers) {
      try {
         map.removeLayer(gisportal.countryBorderLayers[prop]);
      } catch(e) {
         // nowt to do really, the layer may not be on the map
      }
   }
   // then add the selected one, as long as it's not 'None' (0)
   if (id != '0') {
      map.addLayer(gisportal.countryBorderLayers[id]);
   }  
};


/**
 * Create all the base layers for the map.
 */
gisportal.createBaseLayers = function() {

   var baseLayerTitleLoadFunction = function(tile, src) {
      gisportal.loading.increment();

      var tileElement = tile.getImage();
      tileElement.onload = function() {
         gisportal.loading.decrement();
      };
      tileElement.onerror = function() {
         gisportal.loading.decrement();
      };
      if(src.startsWith("http://")){
         src = gisportal.ImageProxyHost + encodeURIComponent(src);
      }
      tileElement.src = src;
   };

   gisportal.baseLayers = {
      EOX: new ol.layer.Tile({
         id: 'EOX',                       // required to populate the display options drop down list
         title: 'EOX',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: 'Terrain Light { Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors and <a href="#data">others</a>, Rendering &copy; <a href="http://eox.at">EOX</a> }',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'terrain-light', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: baseLayerTitleLoadFunction
         }),
         viewSettings: {
            maxZoom: 13,
         }
      }),
      EOXs2cloudless: new ol.layer.Tile({
         id: 'EOXs2cloudless',                       // required to populate the display options drop down list
         title: 'EOX Sentinel-2 Cloudless',
         description: 'EPSG:4326 only, Europe only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: '<a href="https://s2maps.eu/">Sentinel-2 cloudless</a> by <a href="https://eox.at/">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2016)',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 's2cloudless', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: baseLayerTitleLoadFunction
         }),
         viewSettings: {
            maxZoom: 14,
         }
      }),
      GEBCO: new ol.layer.Tile({
         id: 'GEBCO',
         title: 'GEBCO',
         projections: ['EPSG:4326', 'EPSG:3857'],
         source: new ol.source.TileWMS({
            attributions: 'Imagery reproduced from the GEBCO_2021 Grid, GEBCO Compilation Group (2021) GEBCO 2021 Grid (doi:10.5285/c6612cbe-50b3-0cff-e053-6c86abc09f8f)',
            url: 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?',
            crossOrigin: null,
            params: {LAYERS: 'GEBCO_LATEST_2', VERSION: '1.1.1', SRS: gisportal.projection, FORMAT: 'image/jpeg', wrapDateLine: true },
            tileLoadFunction: baseLayerTitleLoadFunction
         }),
         viewSettings: {
            maxZoom: 7,
         }
      }),
      BlueMarble: new ol.layer.Tile({
         id: 'BlueMarble',
         title: 'Blue Marble',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: 'Blue Marble { &copy; <a href="http://nasa.gov">NASA</a> }',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'bluemarble', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: baseLayerTitleLoadFunction
         }),
         viewSettings: {
            maxZoom: 8,
         }
      }),
      BlackMarble: new ol.layer.Tile({
         id: 'BlackMarble',
         title: 'Black Marble',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: 'Black Marble { &copy; <a href="http://nasa.gov">NASA</a> }',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'blackmarble', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true },
            tileLoadFunction: baseLayerTitleLoadFunction
         }),
         viewSettings: {
            maxZoom: 8,
         }
      }),
      OSM: new ol.layer.Tile({
         id: 'OSM',
         title: 'Open Street Map',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.OSM({
            projection: gisportal.projection
         }),
         viewSettings: {
            maxZoom: 19,
         }
      }),
   };

   if (gisportal.config.bingMapsAPIKey) {
      gisportal.baseLayers.BingMapsAerial = new ol.layer.Tile({
         id: 'BingMapsAerial',
         title: 'Bing Maps - Aerial imagery',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'Aerial'
         }),
         viewSettings: {
            maxZoom: 19,
         }
      });

      gisportal.baseLayers.BingMapsAerialWithLabels = new ol.layer.Tile({
         id: 'BingMapsAerialWithLabels',
         title: 'Bing Maps - Aerial imagery with labels',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'AerialWithLabels'
         }),
         viewSettings: {
            maxZoom: 19,
         }
      });

      gisportal.baseLayers.BingMapsRoad = new ol.layer.Tile({
         id: 'BingMapsRoad',
         title: 'Bing Maps - Road',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.BingMaps({
            key: gisportal.config.bingMapsAPIKey,
            imagerySet: 'Road'
         }),
         viewSettings: {
            maxZoom: 19,
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
            maxZoom: 16,
            defaultCenter: [53.825564,-2.421976]
         }
      });

   }
};

gisportal.selectBaseLayer = function(id) {
   gisportal.events.trigger('map-setting.basemap-change', id);

   // take off all the base maps
   for (var prop in gisportal.baseLayers) {
      try {
         map.removeLayer(gisportal.baseLayers[prop]);
      } catch(e) {
         // nowt to do really, the base layer may not be on the map
      }
   }
   // check to see if we need to change projection
   var current_projection = gisportal.projection;
   var msg = '';
   var setViewRequired = true;

   // the selected base map isn't available in the current projection
   if (gisportal.baseLayers[id] && _.indexOf(gisportal.baseLayers[id].getProperties().projections, current_projection) < 0) {
      // if there's only one available projection for the selected base map set the projection to that value and then load the base map
      if (gisportal.baseLayers[id].getProperties().projections.length == 1) {
         msg = 'The projection has been changed to ' + gisportal.baseLayers[id].getProperties().projections[0] + ' in order to display the ' + gisportal.baseLayers[id].getProperties().title + ' base layer';
         gisportal.setProjection(gisportal.baseLayers[id].getProperties().projections[0]);
         $('#select-projection').ddslick('select', { value: gisportal.baseLayers[id].getProperties().projections[0], doCallback: false });
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
      var projection = gisportal.projection;
      gisportal.setView(centre, extent, projection);
   }
};

gisportal.createGraticules = function() {

   graticule_control = new ol.layer.Graticule({
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
};
  
gisportal.setProjection = function(new_projection) {
   var old_projection = map.getView().getProjection().getCode();
   // first make sure that base layer can accept the projection
   var current_basemap = $('#select-basemap').data('ddslick').selectedData.value;
   var base_layer = gisportal.baseLayers[current_basemap];

   // does the current base map allow the requested projection?
   if (base_layer && _.indexOf(base_layer.getProperties().projections, new_projection) < 0) {
      // no, tell the user then bail out
      $('.js-map-settings-message')
         .html('The \'' + base_layer.getProperties().title + '\' base map cannot be used with '+ new_projection +'. Try changing the base map and then selecting the required projection.')
         .toggleClass('alert-danger', true)
         .toggleClass('hidden', false);
      // set the projection ddslick value back to original value
      $('#select-projection').ddslick('revertToPreviousValue');
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
   var new_extent = gisportal.reprojectBoundingBox(current_extent, current_projection, new_projection);
   
   // Empty cache for the current baseMap and force a refresh  
   var current_layers = map.getLayers();
   var base_map=current_layers.getArray()[0];
   var base_map_source = base_map.getSource();
   base_map_source.tileCache.expireCache({});
   base_map_source.tileCache.clear();
   base_map_source.refresh();

   var new_centre = ol.proj.transform(current_centre, current_projection, new_projection);
   gisportal.setView(new_centre, new_extent, new_projection);
   gisportal.refreshLayers();
   if(gisportal.vectorLayer){
      gisportal.selectedRegionProjectionChange(old_projection, new_projection);
   }
   gisportal.projection = map.getView().getProjection().getCode();
   gisportal.geolocationFilter.drawCurrentFilter();
};

gisportal.setView = function(centre, extent, projection) {
   var min_zoom = 3;
   var max_zoom = 12;
   if (projection == 'EPSG:3857') max_zoom = 19;
   var value = $('#select-basemap').data('ddslick').selectedData.value;

   var viewSettings;
   if(value && value != "none"){
      viewSettings = gisportal.baseLayers[$('#select-basemap').data('ddslick').selectedData.value].getProperties().viewSettings;
   }else{
      viewSettings = undefined;
   }

   if (typeof viewSettings !== 'undefined') {
      if (typeof viewSettings.minZoom !== 'undefined') min_zoom = viewSettings.minZoom;
      if (typeof viewSettings.maxZoom !== 'undefined') max_zoom = viewSettings.maxZoom;
   }

   var view = new ol.View({
         projection: projection,
         center: centre,
         minZoom: min_zoom,
         maxZoom: max_zoom,
      });
   map.setView(view);
   gisportal.mapFit(extent, true);

};

gisportal.selectedRegionProjectionChange = function(old_proj, new_proj){
   var feature, this_feature;
   var features = gisportal.vectorLayer.getSource().getFeatures();
   for(feature in features){
      this_feature = features[feature];
      features[feature] = gisportal.geoJSONToFeature(gisportal.featureToGeoJSON(this_feature, old_proj, new_proj));
   }
   gisportal.vectorLayer.getSource().clear();
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
   gisportal.vectorLayer.getSource().addFeatures(features);
   if(gisportal.methodThatSelectedCurrentRegion.justCoords){
      gisportal.currentSelectedRegion = gisportal.reprojectBoundingBox(gisportal.currentSelectedRegion.split(","), old_proj, new_proj).toString();
   }else if(features.length > 0){
      var wkt_features = gisportal.wkt.writeFeatures(features);
      wkt_features = wkt_features.replace(/[\d\.]+/g, function(num){
         return Math.round(num * 1000 ) / 1000;
      });
      gisportal.currentSelectedRegion = wkt_features;
   }
   if(gisportal.methodThatSelectedCurrentRegion.method == "drawBBox"){
      gisportal.methodThatSelectedCurrentRegion.value = gisportal.currentSelectedRegion;
      $('.js-coordinates').val(gisportal.currentSelectedRegion);
   }
};

// A bounding box may need to be split on the ","
// It needs to be in the format: [int, int, int, int] not "int, int, int, int"
gisportal.reprojectBoundingBox = function(bounds, from_proj, to_proj) {
   var new_bounds = bounds;

   if (from_proj != to_proj) {
      var new_max_extent = gisportal.availableProjections[to_proj].bounds;

      var sw_corner = gisportal.reprojectPoint([bounds[0], bounds[1]], from_proj, to_proj);
      var ne_corner = gisportal.reprojectPoint([bounds[2], bounds[3]], from_proj, to_proj);
      
      new_bounds = [sw_corner[0], sw_corner[1], ne_corner[0], ne_corner[1]];

      for (var i = 0; i < 4; i++) {
         if (isNaN(new_bounds[i])) new_bounds[i] = new_max_extent[i];
      }   
   }
   return new_bounds;
};
/*
 * This function reprojects a polygon to a given prjection
 * The polygon cannot be parsed back so the values have to be put back in 'by hand'
 */
gisportal.reprojectPolygon = function(polygon, to_proj) {
   var polygonBox = new Terraformer.WKT.parse(polygon);
   var bbox;

   // If it can be projected it will be, if not the original is returned.
   if(to_proj == "EPSG:4326"){
      bbox = polygonBox.toGeographic();
   }else if(to_proj == "EPSG:3857"){
      bbox = polygonBox.toMercator();
   }else{
      return polygon;
   }
   var coord = bbox.coordinates;

   return gisportal.coordinatesToPolygon(coord);
   // Maybe try gisportal.indicatorsPanel.bboxToWKT at some point
};

gisportal.coordinatesToPolygon = function(coord){
   // The building of the POLYGON.
   var projectedWKT = 'POLYGON(';

   var ringCount = coord.length;
   for (var i = 0; i < ringCount; i++) {
      var ring = coord[i];
      //ring starts; add opening bracket
      projectedWKT = projectedWKT + "(";
      var ptCount = ring.length;
      var coordList = "";
      for (var j = 0; j < ptCount; j++) {
         var pt = ring[j];
         //write the coordinates
         coordList = coordList + String(pt[0]) + " " + String(pt[1]) + ", ";
      }
      //remove the last comma (indicating end of coordinate)
      coordList = coordList.substring(0, coordList.lastIndexOf(','));
      //add to the WKT String
      projectedWKT = projectedWKT + coordList + "), ";
   }
   //remove the last comma (indicating end of ring)
   projectedWKT = projectedWKT.substring(0, projectedWKT.lastIndexOf(','));

   //closing bracket
   projectedWKT = projectedWKT + ")";
   return projectedWKT;
};

gisportal.reprojectPoint = function(point, from_proj, to_proj) {
   // Makes sure that each of the points are floats and not strings.
   point[0] = parseFloat(point[0]);
   point[1] = parseFloat(point[1]);
   return ol.proj.transform(point, from_proj, to_proj);
};

gisportal.refreshLayers = function() {
   _.forEach(map.getLayers().a, function(layer) {
      var params = null;
      try {
         params = layer.getSource().getParams();   
      } catch(e) {}

      if (params) {
         params.t = new Date().getMilliseconds();
         layer.getSource().updateParams(params);
      }
   });
};