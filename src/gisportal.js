/**
 * gisportal.js
 * This file is the main portion of the codebase,
 * it is the namespace. It is called by portal.js
 * and is responsible for all of the other files.
 */


/**
 * Create namespace object
 * @namespace gisportal
 */ 
var gisportal = gisportal || (gisportal = {});

gisportal.VERSION = "0.4.0";
// This used to get the specific revision number from SVN. Need to change for Git
//gisportal.SVN_VERSION = "$Rev$".replace(/[^\d.]/g, ""); // Return only version number

/*==========================================================================*/
//Initialise javascript variables and objects

if( ! window.location.origin )
   window.location.origin = window.location.protocol + "//" + window.location.host

// Path to the python flask middleware
gisportal.middlewarePath = window.location.origin + gisportal.config.paths.middlewarePath; // <-- Change Path to match left hand side of WSGIScriptAlias

// Flask url paths, relates to /middleware/portalflask/views/
gisportal.wcsLocation = gisportal.middlewarePath + '/wcs?';
gisportal.wfsLocation = gisportal.middlewarePath + '/wfs?';
gisportal.stateLocation = gisportal.middlewarePath + '/state';
gisportal.graphLocation = gisportal.middlewarePath + '/graph';

// Define a proxy for the map to allow async javascript http protocol requests
OpenLayers.ProxyHost = gisportal.middlewarePath + '/proxy?url=';   // Flask (Python) service OpenLayers proxy

// Stores the data provided by the master cache file on the server. This 
// includes layer names, titles, abstracts, etc.
gisportal.cache = {};
gisportal.cache.wmsLayers = [];
gisportal.cache.wfsLayers = [];

// gisportal.layers has all of the actual layer details
gisportal.layers = {};

// gisportal.selectedLayers is an array of the ids of your selected layers
// to get the layer use gisportal.layers[gisportal.selectedLayers[i]]
gisportal.selectedLayers = [];

// Base layers are the map layers that show under the data
gisportal.baseLayers = {};

// Array of ALL available date-times for all date-time layers where data's available
// The array is populated once all the date-time layers have loaded
gisportal.enabledDays = [];

// Used as offsets when sorting layers in groups
gisportal.numBaseLayers = 0;
gisportal.numOpLayers = 0;

// Stores the current user selection. Any changes should trigger the correct event.
// Could be changed to an array later to support multiple user selections
gisportal.selection = {};
gisportal.selection.layer = undefined;
gisportal.selection.bbox = undefined;
gisportal.selection.time = undefined;

// gisportal.graphs is used as the object for graphing.js
gisportal.graphs = {};

// gisportal.selectionTools is used as the object for selection.js
gisportal.selectionTools = null;

// gisportal.timeline is used as the object for timeline.js
gisportal.timeline = null;

// Predefined map coordinate systems
gisportal.lonlat = new OpenLayers.Projection("EPSG:4326");

// Quick regions array in the format "Name",W,S,E,N
gisportal.quickRegion = [
   ["World View", -150, -90, 150, 90],
   ["European Seas", -23.44, 20.14, 39.88, 68.82],
   ["Adriatic", 11.83, 39.00, 20.67, 45.80],
   ["Baltic", 9.00, 51.08, 30.50, 67.62],
   ["Biscay", -10, 43.00, 0, 49.00],
   ["Black Sea", 27.30, 38.50, 42.00, 49.80],
   ["English Channel", -5.00, 46.67, 4.30, 53.83],
   ["Eastern Med.", 20.00, 29.35, 36.00, 41.65],
   ["North Sea", -4.50, 50.20, 8.90, 60.50],
   ["Western Med.", -6.00, 30.80, 16.50, 48.10],
   ["Mediterranean", -6.00, 29.35, 36.00, 48.10]
];

gisportal.countryBorderLayers = {
   "none" : { "id" : "0", "name" : "No Borders", "url": ""},
   "countries_all_white" : { "id" : "countries_all_white", "name" : "White border lines", "url": "https://rsg.pml.ac.uk/geoserver/wms?"},
   "countries_all_black": { "id" : "countries_all_black", "name" : "Black border lines", "url": "https://rsg.pml.ac.uk/geoserver/wms?"},
   "countries_all_default": { "id" : "countries_all_default", "name" : "Blue border lines", "url": "https://rsg.pml.ac.uk/geoserver/wms?"},
};


/**
 * The OpenLayers map object
 * Soon to be attached to gisportal namespace
 */
var map;

/*===========================================================================*/

/**
 * Map function to get the master cache JSON files from the server and then 
 * start layer dependent code asynchronously
 */
gisportal.loadLayers = function() { 
   
   var errorHandling = function(request, errorType, exception) {
      var data = {
         type: 'master cache',
         request: request,
         errorType: errorType,
         exception: exception,
         url: this.url
      };  
      gritterErrorHandler(data); 
   };
    
   // Get WMS cache
   gisportal.genericAsync('GET', './cache/mastercache.json', null, gisportal.initWMSlayers, errorHandling, 'json', {}); 
   
   $.ajax({
      url:  './cache/providers.json',
      dataType: 'json',
      success: function( providers ){
         gisportal.providers = providers;
      }
   });

};

/**
 * Used to show points and popup information about WFS features
 * @param {object} layer - The gisportal.layers layer
 * @param {object} olLayer - The Open Layers map layer
 * @time {string} time - The date of the feature
 */
gisportal.getFeature = function(layer, olLayer, time) {
   
   var errorHandling = function(request, errorType, exception) {
      var data = {
         type: 'getFeature',
         request: request,
         errorType: errorType,
         exception: exception,
         url: this.url
      };  
      gritterErrorHandler(data); 
   };
  
   var featureID = layer.WFSDatesToIDs[time];   
   var updateLayer = function(data, opts) {
      var output = data.output;
      var pos = output.position.split(' ');
      var point = new OpenLayers.Geometry.Point(pos[1], pos[0]);
      var feature = new OpenLayers.Feature.Vector(point, {
         message: $('<div/>').html(output.content).html(),
         location: 'Lon: ' + pos[1] + ' Lat: ' + pos[0] 
      });
      olLayer.addFeatures(feature);
   };
   
   var params = {
      baseurl: layer.wfsURL,
      request: 'GetFeature',
      version: '1.1.0',
      featureID: featureID,
      typeName: layer.urlName
   };   
   var request = $.param(params);   
   
   gisportal.genericAsync('GET', gisportal.wfsLocation, request, updateLayer, errorHandling, 'json', {layer: layer}); 
};

/**
 * Generic Asyc Ajax to save having lots of different ones all over the place.
 * 
 * @param {string} url - The url to use as part of the ajax call
 * @param {Object} data - The data to be sent
 * @param {Function} success - Called if everything goes ok.
 * @param {Function} error - Called if problems arise from the ajax call.
 * @param {string} dataType - What data type will be returned, xml, json, etc
 * @param {object} opts - Object to pass to success function
 */
gisportal.genericAsync = function(type, url, data, success, error, dataType, opts) {
   $.ajax({
      type: type,
      url: url, 
      data: data,
      dataType: dataType,
      async: true,
      cache: false,
      success: function(data) { success(data, opts); },
      error: error
   });
};

/**
 * Create all the base layers for the map.
 */
gisportal.createBaseLayers = function() {
   
   function createBaseLayer(name, url, opts) {
      var layer = new OpenLayers.Layer.WMS(
         name,
         url,
         opts,
         { projection: gisportal.lonlat, wrapDateLine: true, transitionEffect: 'resize' }      
      );
      
      layer.id = name;
      layer.type = 'baseLayers';
      layer.displayTitle = name;
      layer.name = name;
      
      layer.events.on({
         "loadstart": gisportal.loading.increment,
         "loadend": gisportal.loading.decrement
      })
      map.addLayer(layer);
      gisportal.baseLayers[name] = layer;
   }
   
   createBaseLayer('GEBCO', 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?', { layers: 'gebco_08_grid' });
   createBaseLayer('EOX', 'https://tiles.maps.eox.at/wms/?' , {layers : 'terrain-light'});
   createBaseLayer('Metacarta Basic', 'http://vmap0.tiles.osgeo.org/wms/vmap0?', { layers: 'basic' });
   createBaseLayer('Landsat', 'http://irs.gis-lab.info/?', { layers: 'landsat' });
   createBaseLayer('Blue Marble', 'http://demonstrator.vegaspace.com/wmspub', {layers: "BlueMarble" });
   
   // Get and store the number of base layers
   gisportal.numBaseLayers = map.getLayersBy('isBaseLayer', true).length;
};

/** Create  the country borders overlay
 *
 */
gisportal.createCountryBorderLayer = function(layerName) {
   // first remove the old country border layer if it exists
   var old_layer = map.getLayersByName('country_borders');
   if (old_layer.length > 0) {
      old_layer[0].destroy();
   }

   if (layerName != '0') {
      // then add the selected one
      var layer = new OpenLayers.Layer.WMS(
         'country_borders',
         //'https://rsg.pml.ac.uk/geoserver/wms?',
         gisportal.countryBorderLayers[layerName].url,
         { layers: gisportal.countryBorderLayers[layerName].id, transparent: true },
         { projection: gisportal.lonlat, wrapDateLine: true, transitionEffect: 'resize' }
      );

      layer.id = 'country_borders';
      layer.controlID = 'country_borders';
      layer.displayTitle = 'Country Borders';
      layer.name = 'country_borders';
      
      map.addLayer(layer);   
   }
 }

gisportal.setCountryBordersToTopLayer = function() {
   // if the country border layer is on the map move it to the top
   var border_layer = map.getLayersByName('country_borders');
   if (border_layer.length > 0) {
      border_layer[0].setZIndex(2000);   
   }
}


/** 
 * Create layers from the getCapabilities request (stored in gisportal.cache.wmsLayers)
 * iterates over each and adds to gisportal.layers 
 */
gisportal.createOpLayers = function() {
   var layers = [];

   // Loop over each server
   gisportal.cache.wmsLayers.forEach(function( server ){
      processServer( server );
   });

   // Processing the indicators at each indicator
   function processServer( server ){
      for(var sensorName in server.server ){
         server.server[sensorName].forEach(function( indicator ){
            processIndicator( server, sensorName, indicator );
         });
      };
   };

   // Turn an indicator into a later and adding to gisporta.layers
   function processIndicator( server, sensorName, indicator ){

      var layerOptions = { 
         //new
         "name": indicator.Name,
         "title": indicator.Title,
         "productAbstract": indicator.productAbstract,
         "type": "opLayers",

         //orginal
         "firstDate": indicator.FirstDate, 
         "lastDate": indicator.LastDate, 
         "serverName": server.serverName, 
         "wmsURL": server.wmsURL, 
         "wcsURL": server.wcsURL, 
         "sensor": sensorName, 
         "exBoundingBox": indicator.EX_GeographicBoundingBox, 
         "providerTag": server.options.providerShortTag,
         "positive" : server.options.positive, 
         "providerDetails" : indicator.ProviderDetails, 
         "offsetVectors" : indicator.OffsetVectors, 
         "tags": indicator.tags,
         "moreProviderInfo" : indicator.MoreProviderInfo,
         "moreIndicatorInfo" : indicator.MoreIndicatorInfo,
      };

      var layer = new gisportal.layer( layerOptions );

      // If theres a duplicate id, increase a counter
      var postfix = "";
      while( gisportal.layers[layer.id + postfix ] !== void(0) )
         postfix++; // will convert the "" into a number

      gisportal.layers[layer.id + postfix] = layer;

   };

   var state = gisportal.cache.state;
   gisportal.layersLoaded = true;
   if (!gisportal.stateLoadStarted && state) gisportal.loadState(state);
   gisportal.configurePanel.refreshData();
   // Batch add here in future.
};

/** Create  the country borders overlay
 *
 */
gisportal.createCountryBorderLayer = function(layerName) {
   // first remove the old country border layer if it exists
   var old_layer = map.getLayersByName('country_borders');
   if (old_layer.length > 0) {
      old_layer[0].destroy();
   }

   if (layerName != '0') {
      // then add the selected one
      var layer = new OpenLayers.Layer.WMS(
         'country_borders',
         'https://rsg.pml.ac.uk/geoserver/wms?',
         { layers: layerName, transparent: true },
         { projection: gisportal.lonlat, wrapDateLine: true, transitionEffect: 'resize' }
      );

      layer.id = 'country_borders';
      layer.controlID = 'country_borders';
      layer.displayTitle = 'Country Borders';
      layer.name = 'country_borders';
      
      map.addLayer(layer);   
   }
 }

gisportal.setCountryBordersToTopLayer = function() {
   // if the country border layer is on the map move it to the top
   var border_layer = map.getLayersByName('country_borders');
   if (border_layer.length > 0) {
      border_layer[0].setZIndex(2000);   
   }
}

/**
 * Get a layer that has been added to the map by its id.
 * This is the same as gisportal.layers[id], it is rarely used.
 * @param {string} id - The id of the layer
 */
gisportal.getLayerByID = function(id) {
   return gisportal.layers[id];
};

/**
 * Checks if a layer is selected
 * @param {string} id - id of layer to check
 */
gisportal.isSelected = function(id) {
   if (gisportal.selectedLayers[id]) return true;
};

/**
 * Checks if a layer ID is unique recursively
 * 
 * @param {gisportal.layer} layer - The layer to check 
 * @param {number} count - Number of other layers with the same name (optional)
 */
gisportal.checkNameUnique = function(layer, count) {
   var id = null;
   
   if (typeof count === "undefined" || count === 0) {
      id = layer.id;
      count = 0;
   } 
   else {
      id = layer.id + count;
   }
   
   if (id in gisportal.layers && layer.wcsURL !== gisportal.layers[layer.id].wcsURL) {
      gisportal.checkNameUnique(layer, ++count);
   } else {
      if (count !== 0) { 
         layer.id = layer.id + count; 
      }
   }
   return layer;
};

/**
 * Returns availability (boolean) of data for the given JavaScript date for all layers.
 * Used as the beforeshowday callback function for the jQuery UI current view date DatePicker control
 * 
 * @param {Date} thedate - The date provided by the jQuery UI DatePicker control as a JavaScript Date object
 * @return {Array.<boolean>} Returns true or false depending on if there is layer data available for the given date
 */
gisportal.allowedDays = function(thedate) {
   var uidate = gisportal.utils.ISODateString(thedate);
   // Filter the datetime array to see if it matches the date using jQuery grep utility
   var filtArray = $.grep(gisportal.enabledDays, function(dt, i) {
      var datePart = dt.substring(0, 10);
      return (datePart == uidate);
   });
   // If the filtered array has members it has matched this day one or more times
   if(filtArray.length > 0) {
      return [true];
   }
   else {
      return [false];
   }
};

/**
 * Map function to re-generate the global date cache for selected layers.
 */
gisportal.refreshDateCache = function() {
   var map = this;
   gisportal.enabledDays = [];
   
   $.each(map.layers, function(index, value) {
      var layer = value;
      if(layer.selected && layer.temporal) {
         gisportal.enabledDays = gisportal.enabledDays.concat(layer.DTCache);
      }
   });
   
   gisportal.enabledDays = gisportal.utils.arrayDeDupe(gisportal.enabledDays);  
   
   console.info('Global date cache now has ' + gisportal.enabledDays.length + ' members.'); // DEBUG
};

/**
 * Sets up the map, plus its controls, layers, styling and events.
 */
gisportal.mapInit = function() {
   map = new OpenLayers.Map('map', {
      projection: gisportal.lonlat,
      displayProjection: gisportal.lonlat,
      controls: [
         new OpenLayers.Control.Zoom({
            zoomInId: "mapZoomIn",
            zoomOutId: "mapZoomOut"
        })
      ]
   });


   // Get both master cache files from the server. These files tells the server
   // what layers to load for Operation (wms) and Reference (wcs) layers.
   gisportal.loadLayers();

   // Create the base layers and then add them to the map
   gisportal.createBaseLayers();
   
   
   // Create map controls identified by key values which can be activated and deactivated
   gisportal.mapControls = {
      zoomIn: new OpenLayers.Control.ZoomBox(
         { out: false, alwaysZoom: true }
      ),
      zoomOut: new OpenLayers.Control.ZoomBox(
         { out: true, alwaysZoom: true }
      ),
      pan: new OpenLayers.Control.Navigation(),
      selector: new OpenLayers.Control.SelectFeature([], {
         hover: false,
         autoActive: true
      })
   };

   // Add all the controls to the map
   for (var key in gisportal.mapControls) {
      var control = gisportal.mapControls[key];
      map.addControl(control);
   }

   gisportal.quickRegions.setup();
   gisportal.selectionTools.init();

   if(!map.getCenter())
      map.zoomTo(3);


};

/**
 * The initiation of WMS layers, such as adding to gisportal.cache.
 * @param {object} data - The actual layer
 * @param {object} opts - Options, not currently used
 */ 
gisportal.initWMSlayers = function(data, opts) {
   if (data !== null)  {
      gisportal.cache.wmsLayers = data;
      // Create WMS layers from the data
      gisportal.createOpLayers();
      
      //var ows = new OpenLayers.Format.OWSContext();
      //var doc = ows.write(map);
   }
};



/*===========================================================================*/

/**
 * Loads anything that is not dependent on layer data.
 * This is used to set the layer index to be the correct order 
 */
gisportal.nonLayerDependent = function() {
   // Keeps the vectorLayers at the top of the map
   map.events.register("addlayer", map, function() { 
       // Get and store the number of reference layers
      var poiLayers = map.getLayersBy('type', 'poiLayer');

      $.each(poiLayers, function(index, value) {
         map.setLayerIndex(value, map.layers.length - 1);
      });
   });
   
   // Setup timeline, from timeline.js
   gisportal.timeline = new gisportal.TimeLine('timeline', {
      comment: "Sample timeline data",
      selectedDate: new Date("2006-06-05T00:00:00Z"),
      chartMargins: {
         top: 7,
         right: 0,
         bottom: 5,
         left: 0
      },
      barHeight: 10,
      barMargin: 2,
      timebars: [] 
   });
};

/*===========================================================================*/

gisportal.autoSaveState = function(){
   var state = JSON.stringify(gisportal.saveState())
   gisportal.storage.set( 'stateAutoSave', state )
}

gisportal.getAutoSaveState = function(){
   var state = JSON.parse(gisportal.storage.get( 'stateAutoSave' ))
   return state;
}
gisportal.hasAutoSaveState = function(){
   return ( gisportal.storage.get( 'stateAutoSave' ) != null );
}

/**
 * Creates an object that contains the current state
 * @param {object} state - Optional, allows a previous state to be extended 
 */
gisportal.saveState = function(state) {
   var state = state || {}; 
   // Save layers
   state.map = {};
   state.selectedIndicators = [];
   state.map.layers = {}; 
   state.timeline = {}; 

   // Get the current layers and any settings/options for them.
   var keys = gisportal.selectedLayers;
   for(var i = 0, len = keys.length; i < len; i++) {
      var selectedIndicator = gisportal.selectedLayers[i];

      if (selectedIndicator)  {
         var indicator = gisportal.layers[selectedIndicator];
         state.map.layers[indicator.id] = {
            'selected': indicator.selected,
            'opacity': indicator.opacity !== null ? indicator.opacity : 1,
            'style': indicator.style !== null ? indicator.style : '',
            'minScaleVal': indicator.minScaleVal,
            'maxScaleVal': indicator.maxScaleVal,
            'openTab' : $('.indicator-header[data-id="' + indicator.id + '"] + ul .js-tab-trigger:checked').attr('id')
         };    
      }
   }
   // outside of loop so it can be easily ordered 
   state.selectedIndicators = gisportal.selectedLayers;
   
   // Get currently selected date.
   if(!gisportal.utils.isNullorUndefined($('.js-current-date').val())) {
      state.map.date = gisportal.timeline.getDate();
   }
     
   // Get selection from the map
   var layer = map.getLayersBy('controlID', 'poiLayer')[0];
   if(layer.features.length > 0) {
      var feature = layer.features[0];
      state.map.feature = gisportal.featureToGeoJSON(feature);
   }
   
   // Get zoom level
   state.map.zoom = map.zoom;

   // Get position
   state.map.extent = map.getExtent();

   // Get quick regions
   state.map.regions = gisportal.quickRegion;
   state.map.selectedRegion = $('#quickRegion option:selected').val();

   // Get timeline zoom
   state.timeline.minDate = gisportal.timeline.xScale.domain()[0];
   state.timeline.maxDate = gisportal.timeline.xScale.domain()[1];


   return state;
};

/**
 * To load the state, provide a state object (created with saveState)
 * @param {object} state - The saved state object
 */
gisportal.loadState = function(state) {
   gisportal.stateLoadStarted = true;
   $('.start').toggleClass('hidden', true);
   var state = state || {};

   var stateTimeline = state.timeline;
   var stateMap = state.map;
   
   // Load layers for state
   var keys = state.selectedIndicators;
   if (keys.length > 0)  {
      gisportal.configurePanel.close();
      gisportal.indicatorsPanel.open();
   }
   for (var i = 0, len = keys.length; i < len; i++) {
      var indicator = null;
      if (typeof keys[i] === "object") indicator = gisportal.layers[keys[i].id];
      else indicator = gisportal.layers[keys[i]];
      if (indicator && !gisportal.selectedLayers[indicator.id]) {
         gisportal.configurePanel.close();
//         console.log(indicator);

         gisportal.refinePanel.foundIndicator(indicator.id);
        
      }
   }
   
   // Create the feature if there is one
   indicator = {};
   if(!gisportal.utils.isNullorUndefined(stateMap.feature)) {
      var layer = map.getLayersBy('type', 'poiLayer')[0];
      if (layer) layer.addFeatures(gisportal.geoJSONToFeature(stateMap.feature));
    }
   
   // Load position
   if (stateMap.extent)
      map.zoomToExtent(new OpenLayers.Bounds([stateMap.extent.left,stateMap.extent.bottom, stateMap.extent.right, stateMap.extent.top]));

   // Load Quick Regions
   if (stateMap.regions) {
      gisportal.quickRegion = stateMap.regions;
      gisportal.quickRegions.setup();
   }

   if (stateMap.selectedRegion)  {
      $('#quickRegion').val(stateMap.selectedRegion);
   }

   if (stateTimeline)  {
      gisportal.timeline.zoomDate(stateTimeline.minDate, stateTimeline.maxDate);
      if (stateMap.date) gisportal.timeline.setDate(new Date(stateMap.date));
   }


};

/**
 * This converts from Feature to GeoJSON
 * @param {object} feature - The feature
 */
gisportal.featureToGeoJSON = function(feature) {
   var geoJSON = new OpenLayers.Format.GeoJSON();
   return geoJSON.write(feature);
};

/**
 * This converts from GeoJSON to Feature
 * @param {string} geoJSONFeature - The GeoJSON
 */
gisportal.geoJSONToFeature = function(geoJSONFeature) {
   var geoJSON = new OpenLayers.Format.GeoJSON();
   return geoJSON.read(geoJSONFeature); 
};

/**
 * This applies the changes from the state
 * to the layer once it is selected.
 * @param {object} layer - The gisportal.layer[i] 
 */
gisportal.checkIfLayerFromState = function(layer) {
   if(typeof gisportal.cache.state !== "undefined") {
      var keys = Object.keys(gisportal.cache.state.map.layers);
      var state = gisportal.cache.state.map;
      for(var i = 0, len = keys.length; i < len; i++) {
         if(keys[i] == layer.id){
            layer.setOpacity(state.layers[keys[i]].opacity);
            layer.setStyle(state.layers[keys[i]].style);
            layer.minScaleVal = state.layers[keys[i]].minScaleVal;
            layer.maxScaleVal = state.layers[keys[i]].maxScaleVal;
            gisportal.scalebars.updateScalebar(layer.id);
         }
      }
   }
};


/*===========================================================================*/

/**
 * This will run when a user logs in using openID
 */
gisportal.login = function() {
   $('.js-logged-out').toggleClass('hidden', true);
   $('.js-logged-in').toggleClass('hidden', false);
   gisportal.openid.login();
   // Load history
};

/**
 * This will run when a user logs out
 */
gisportal.logout = function() {
   $('.js-logged-out').toggleClass('hidden', false);
   $('.js-logged-in').toggleClass('hidden', true);
}


/*===========================================================================*/

/**
 * Gets the current state of the portal from any and all components who have 
 * a state and wish to be stored. 
 */
gisportal.getState = function() {
   var state = {};
   
   // TODO: Split state into components
   state = gisportal.saveState(state);

   // TODO: Merge state with default state.
   
   // TODO: Return state.
   return state; 
};

/**
 * Loads the state and adds into cache
 * @param {object} state - The state object
 */
gisportal.setState = function(state) {
   var state = state || {}; 
   // Cache state for access by others
   gisportal.cache.state = state;
   // TODO: Merge with default state. 
   if (!gisportal.stateLoadStarted && state && gisportal.layersLoaded) gisportal.loadState(state);
   
};

/*===========================================================================*/

/**
 * This code runs once the page has loaded - jQuery initialised.
 * It is called from portal.js
 */
gisportal.main = function() {

   if( gisportal.config.browserRestristion ){
      if( gisportal.validateBrowser() == false )
         return;
   }
      


   if( gisportal.config.siteMode == "production" ) {
      gisportal.startRemoteErrorLogging();
   } else {
      $('body').prepend('<div class="dev-warning">DEVELOPMENT MODE</div>')
      $('.js-start-container').addClass('start-dev')
   }

   // Compile Templates
   gisportal.loadTemplates(function(){
      
      gisportal.initStart();

      // Set up the map
      // any layer dependent code is called in a callback in mapInit
      gisportal.mapInit();

      $('#version').html('v' + gisportal.VERSION + ':' + gisportal.SVN_VERSION);
    
      // Setup the gritter so we can use it for error messages
      gisportal.gritter.setup();

      // Initiate the DOM for panels
      gisportal.panels.initDOM();
      gisportal.configurePanel.initDOM();   // configure.js
      gisportal.indicatorsPanel.initDOM();  // indicators.js
      gisportal.graphs.initDOM();           // graphing.js
      gisportal.analytics.initGA();         // analytics.js
      gisportal.panelSlideout.initDOM();    //panel-slideout.js
      gisportal.map_settings.init();         // map-settings.js
      //Set the global loading icon
      gisportal.loading.loadingElement= jQuery('.global-loading-icon')
      
      $('.js-show-tools').on('click', showPanel);

      function showPanel()  {
         $('.js-show-tools').toggleClass('hidden', true);
         $('.panel.active').toggleClass('hidden', false);
      }

      $('.js-hide-panel').on('click', hidePanel);

      function hidePanel()  {
         $('.panel.active').toggleClass('hidden', true);
         $('.js-show-tools').toggleClass('hidden', false);
      }

      // Start setting up anything that is not layer dependent
      gisportal.nonLayerDependent();

      // Grab the url of any state and store it as an id to be used
      // for retrieving a state object.
      var stateID = gisportal.utils.getURLParameter('state');
      if(stateID !== null) {
         console.log('Retrieving State...');
         gisportal.ajaxState(stateID);
      }
      else {
         console.log('Loading Default State...');
      }

      // Replaces all .icon-svg with actual SVG elements,
      // so that they can be styled with CSS
      // which cannot be done with SVG in background-image
      // or <img>
      
   });
};

/**
 * This uses ajax to get the state from the database
 * based on the id (shortlink) provided.
 * @param {string} id - The shortlink/id to state
 */
gisportal.ajaxState = function(id) { 
   // Async to get state object
   gisportal.genericAsync('GET', gisportal.stateLocation + '/' + id, null, function(data, opts) {         
      if(data.output.status == 200) {
         gisportal.setState($.parseJSON(data.output.state));
         console.log('Success! State retrieved');
      } else {
         console.log('Error: Failed to retrieved state. The server returned a ' + data.output.status);
      }
   }, function(request, errorType, exception) {
      console.log('Error: Failed to retrieved state. Ajax failed!');
   }, 'json', {});
} 

/**
 * This zooms the map so that all of the selected layers
 * fit into the viewport.
 */
gisportal.zoomOverall = function()  {
   if (Object.keys(gisportal.selectedLayers).length > 0)  {

      // minX, minY, maxX, maxY
      var largestBounds = [ 
         Number.MAX_VALUE,
         Number.MAX_VALUE,
         Number.MIN_VALUE,
         Number.MIN_VALUE
      ];

      for (var i = 0; i < gisportal.selectedLayers.length; i++)  {
         var layer = gisportal.layers[gisportal.selectedLayers[i]].boundingBox;
         if (+layer.MinX < +largestBounds[0]) largestBounds[0] = layer.MinX; // left 
         if (+layer.MinY < +largestBounds[1]) largestBounds[1] = layer.MinY; // bottom
         if (+layer.MaxX > +largestBounds[2]) largestBounds[2] = layer.MaxX; // right 
         if (+layer.MaxY > +largestBounds[3]) largestBounds[3] = layer.MaxY; // top
      }

      map.zoomToExtent(new OpenLayers.Bounds(largestBounds));
   }
};

/**
 * Replace links on start splash from config file
 * Should probably be using Mustache for this
 */
gisportal.initStart = function()  {
   
   var autoLoad = null;
   if( gisportal.config.skipWelcomePage == true )
      if( gisportal.config.autoResumeSavedState == true && gisportal.hasAutoSaveState() )
         var autoLoad = function(){ gisportal.loadState( gisportal.getAutoSaveState() ); };
      else
         var autoLoad = function(){ gisportal.launchMap(); };

   else if( gisportal.config.autoResumeSavedState == true && gisportal.hasAutoSaveState() )
      var autoLoad = function(){ gisportal.loadState( gisportal.getAutoSaveState() ); };

   if( autoLoad != null)
      return setTimeout(autoLoad, 1000);


   var data = {
      homepageSlides  : gisportal.config.homepageSlides,
      hasAutoSaveState: gisportal.hasAutoSaveState()
   };

   var rendered = gisportal.templates['start']( data );
   $('.js-start-container').html( rendered );

   window.mySwipe = new Swipe($('.homepageSlider')[0] , {
     speed: 800,
     auto: 3000,
     continuous: true,
     disableScroll: false,
   });


   // Load there previously saved state
   $('.js-load-last-state').click(function(){
      gisportal.launchMap();
      gisportal.loadState( gisportal.getAutoSaveState() );
   });
   
   $('.js-tac-content').html( gisportal.templates['terms-and-conditions-text']() );

   $('.js-tac-accept').click(function(){
      gisportal.storage.set( 'tac-agreed', true );
      $('.js-tac-popup').toggleClass('hidden', true);
      gisportal.launchMap();
   });


   $('.js-tac-decline').click(function(){
      $('.js-tac-popup').toggleClass('hidden', true);
   });


   $('.js-start').click(function()  {

      if( gisportal.config.requiresTermsAndCondictions == true &&  gisportal.hasAgreedToTermsAndCondictions() == false ){
         $('.js-tac-popup').toggleClass('hidden', false);
      }else{
         gisportal.launchMap();
      }

   });
};

/**
 * Hides the start menu and launches the main part of the port
 * @return {[type]} [description]
 */
gisportal.launchMap = function(){

   $('.start').toggleClass('hidden', true);

   setInterval( gisportal.autoSaveState, 60000 );

   //Once they are past the splash page warn them if they leave
   window.onbeforeunload = function(){
      gisportal.autoSaveState();
      if( gisportal.config.siteMode == "production")
         return "Warning. Your about to leave the page";
      else
         return;
   };

}

gisportal.hasAgreedToTermsAndCondictions = function(){
   return gisportal.storage.get( 'tac-agreed', false );
}


gisportal.loading = {};
gisportal.loading.counter = 0;
gisportal.loading.loadingElement = jQuery('');
gisportal.loading.loadingTimeout = null;


/**
 * Increases the counter of how many things are currently loading
 */
gisportal.loading.increment = function(){
   gisportal.loading.counter++;
   gisportal.loading.updateLoadingIcon();
}

/**
 * Drecreases the counter of how many things are currently loading
 */
gisportal.loading.decrement = function(){
   gisportal.loading.counter--;
   gisportal.loading.updateLoadingIcon();
}

/**
 * Either show or hide the loading icon.
 *  A delay is added to show because layers can update in a few milliseconds causing a horrible flash
 */
gisportal.loading.updateLoadingIcon = function(){
   
   if( gisportal.loading.loadingTimeout != null )
      return ;
   
   gisportal.loading.loadingTimeout = setTimeout(function(){
      gisportal.loading.loadingTimeout = null
      if( gisportal.loading.counter > 0 ){
         gisportal.loading.loadingElement.show();
      
      }else{
         gisportal.loading.loadingElement.hide();
      }
   }, gisportal.loading.counter ? 300 : 600);

}

/**
 * Sends all error to get sentry.
 */
gisportal.startRemoteErrorLogging = function(){
   
   $.getScript('//cdn.ravenjs.com/1.1.15/jquery,native/raven.min.js')
   .done(function(){
      Raven.config('https://552996d22b5b405783091fdc4aa3664a@app.getsentry.com/30024', {}).install();
      window.onerror = function(e){
         var extra = {};
   
         //Attempt to store information about the error.
         try{
            extra.state = JSON.stringify(gisportal.saveState());
   
            if( window.event && window.event.target && $.contains( window.document.body, window.event.target ) )
               extra.domEvemtTarget =  $( window.event.target ).html();
         }catch(e){};
   
         Raven.captureException(e, { extra: extra} );
      };
   });
};

/**
 * Returns the currently location of portal including origin and path
 * @return {[type]} [description]
 */
function portalLocation(){
   var origin = location.origin;
   var path = location.pathname;
   var endSlash = path.lastIndexOf( '/' );
   path = path.substring( 0, endSlash + 1 );
   return origin + path;
};


/**
 * Check the users version of the portal is valid.
 *  - If the browser is valid it return true
 *  - If the browser is NOT valid is returns false and those an error
 */

gisportal.validateBrowser = function(){
   if( gisportal.config.browserRestristion == void(0) )
      return true;

   var level = gisportal.config.browserRestristion;
   if( level == "none" )
      return true;

   var requirements = [ 'svg', 'boxsizing', 'csscalc','inlinesvg' ];

   var valid = true;
   for( var i =  0; i < requirements.length; i++ )
      valid = (valid &&  Modernizr[requirements[i]] )

   if( valid )
      return true;

   if( gisportal.config.browserRestristion == "advisory" ){
      alert('Your browser is out of date, this site will not work correctly, if at all.');
      return false;
   }else if( gisportal.config.browserRestristion == "strict" ){
      $('.js-browse-not-compatible').show();
      $('.js-start').hide();
      return false;
   }else{
      throw new Error( 'Invalid config.browserRestristion value "' + gisportal.config.browserRestristion + '"' );
   }

}