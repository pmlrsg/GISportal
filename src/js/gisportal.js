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
   window.location.origin = window.location.protocol + "//" + window.location.host;

// The domain name of the portal
gisportal.domainName = window.location.origin + window.location.pathname;

// This edits the domain name a bit to be sent to the middleware (removes the end "/" and replaces all other "/"s with "_")
gisportal.niceDomainName = gisportal.domainName.replace("http://", "").replace("https://", "").replace(/\/$/, '').replace(/\//g, '_');

// Path to the middleware
gisportal.middlewarePath = gisportal.domainName.replace(/\/$/, '') + "/app";

// Flask url paths, relates to /middleware/portalflask/views/
gisportal.stateLocation = gisportal.middlewarePath + '/state';

// Define a proxy for the map to allow async javascript http protocol requests
gisportal.ProxyHost = gisportal.middlewarePath + '/settings/proxy?url=';

// Stores the data provided by the master cache file on the server. This 
// includes layer names, titles, abstracts, etc.
gisportal.cache = {};
gisportal.cache.wmsLayers = [];

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
gisportal.availableProjections = {
   'EPSG:4326': { 
      code: 'EPSG:4326',
      name: 'WGS 84',
      bounds: [-180, -90, 180, 90]
   },
   'EPSG:3857': { 
      code: 'EPSG:3857',
      name: 'WGS 84 / Pseudo-Mercator',
      bounds: [-20037508.342789244, -19971868.880408563, 20037508.342789244, 19971868.88040853]    // -180, -85, 180, 85
   }
};

gisportal.projection = gisportal.availableProjections['EPSG:4326'].code;


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
   // The old layers will be removed from the portal keeping any layers that are already loaded to one side.
   gisportal.tempRemoveLayers();
   gisportal.original_layers = {};
   gisportal.not_included_layers = {};
   gisportal.layers = {};
   gisportal.loadVectorLayers();
   loadWmsLayers();
   
   function loadWmsLayers(){
      // Get WMS cache
      $.ajax({
         url:  gisportal.middlewarePath + '/settings/get_cache?_='+ new Date().getTime(),
         dataType: 'json',
         success: gisportal.initWMSlayers,
         error: function(e){
            $.notify("Sorry\nThere was an unexpected error getting the cache. Try refreshing the page, or coming back later.", {autoHide:false, className:"error"});
         }
      });
   }

};

gisportal.tempRemoveLayers = function(){
   var id, layer, style;
   for(id in gisportal.selectedLayers){
      layer = gisportal.selectedLayers[id];
      style = gisportal.layers[layer].style;
      gisportal.tempSelectedLayers.push({id:layer, style:style});
   }
   for(id in gisportal.tempSelectedLayers){
      layer = gisportal.tempSelectedLayers[id].id;
      gisportal.indicatorsPanel.removeIndicators(layer);
   }
};

/**
 * Map function to load the vector layers from cache
 */
gisportal.loadVectorLayers = function() {


   $.ajax({
      url: gisportal.middlewarePath + '/cache/' + gisportal.niceDomainName +'/vectorLayers.json',
      dataType: 'json',
      success: gisportal.initVectorLayers,
      error: function(e){
            console.log("No Vector Layers Found");
         }

   });

};


gisportal.createVectorLayers = function() {
   gisportal.vlayers = [];
   gisportal.vectors = [];
   gisportal.cache.vectorLayers.forEach(function( vector ){
      //console.log(vector);
      vector.services.wfs.vectors.forEach(function( v ){
      processVectorLayer(vector.services.wfs.url, v);

      });
   });

   function processVectorLayer(serverUrl, vector) {
      var vectorOptions = {
         "name": vector.name,
         "description": vector.desc,
         "endpoint" : serverUrl,
         "serviceType" : "WFS",
         "variableName" : vector.variableName,
         "maxFeatures" : vector.maxFeatures,
         "tags" : vector.tags,
         "id" : vector.id,
         "exBoundingBox" : vector.exBoundingBox,
         "abstract" : vector.abstract,
         "provider" : vector.provider,
         "contactInfo" : {
            "organization" : vector.provider
         },
         "ignoredParams" : vector.ignoredParams,
         "vectorType" : vector.vectorType,
         "styles" : vector.styles,
         "defaultProperty" : vector.defaultProperty,
         "defaultProperties" : vector.defaultProperties,
         "descriptiveName" : vector.tags.niceName,
         "unit" : vector.unit
      };
      //console.log("  CREATING WITH VECTOR FUNCTION   ");
      var vectorLayer = new gisportal.Vector(vectorOptions);
      gisportal.vectors.push(vectorLayer);

gisportal.layers[vectorOptions.id] = vectorLayer;

      //console.log(vectorLayer);
      vectorLayerOL = vectorLayer.createOLLayer();
      //vectorLayer.openlayers.anID = vectorLayerOL;
      //console.log(vectorLayerOL);
      gisportal.vlayers.push(vectorLayerOL);
   }

};

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

   function processIndicatorLoop(sensorName, server){
      server.server[sensorName].forEach(function( indicator ){
         processIndicator( server, sensorName, indicator );
      });
   }

   // Processing the indicators at each indicator
   function processServer( server ){
      for(var sensorName in server.server ){
         processIndicatorLoop(sensorName, server);
      }
   }

   // Turn an indicator into a later and adding to gisportal.layers
   function processIndicator( server, sensorName, indicator ){

      var wcs_url = indicator.wcsURL || server.wcsURL;

      var include_bool = true;
      var autoScale = indicator.autoScale;
      if(autoScale){
         autoScale = autoScale.toString(); // Just incase a user types a booleanin the config
      }else{
         autoScale = "default";
      }
      var max = indicator.defaultMaxScaleVal;
      var min = indicator.defaultMinScaleVal;
      var colorbands = indicator.colorbands || gisportal.config.colorbands;
      var aboveMaxColor = indicator.aboveMaxColor || gisportal.config.aboveMaxColor;
      var belowMinColor = indicator.belowMinColor || gisportal.config.belowMinColor;
      if(max){
         max = parseFloat(max);
      }
      if(min){
         min = parseFloat(min);
      }

      if(indicator.include === false){
         include_bool = false;
      }

      var layerOptions = { 
         //new
         "abstract": indicator.Abstract,
         "include": include_bool,
         "contactInfo": server.contactInfo,
         "timeStamp":server.timeStamp,
         "owner":server.owner,
         "name": indicator.Name,
         "title": indicator.Title,
         "productAbstract": indicator.productAbstract,
         "legendSettings": indicator.LegendSettings,
         "type": "opLayers",
         "autoScale": autoScale,
         "defaultMaxScaleVal": max,
         "defaultMinScaleVal": min,
         "colorbands": colorbands,
         "aboveMaxColor": aboveMaxColor,
         "belowMinColor": belowMinColor,
         "defaultStyle": indicator.defaultStyle || gisportal.config.defaultStyle,
         "log": indicator.log,

         //orginal
         "firstDate": indicator.FirstDate, 
         "lastDate": indicator.LastDate, 
         "serverName": server.serverName, 
         "wmsURL": server.wmsURL, 
         "wcsURL": wcs_url, 
         "sensor": sensorName, 
         "exBoundingBox": indicator.EX_GeographicBoundingBox, 
         "providerTag": server.options.providerShortTag,
         "positive" : server.options.positive, 
         "provider" : indicator.providerDetails, 
         "offsetVectors" : indicator.OffsetVectors, 
         "tags": indicator.tags
      };

      var layer = new gisportal.layer( layerOptions );
//console.log("adding info for Indicator : ");
            //console.log(layer);
      // If theres a duplicate id, increase a counter
      var postfix = "";
      while( gisportal.layers[layer.id + postfix ] !== void(0) )
         postfix++; // will convert the "" into a number

      layer.id = layer.id + postfix;
      if(layer.include){
         gisportal.layers[layer.id] = layer;
      }else{
         gisportal.not_included_layers[layer.id] = layer;
      }

   }

   // This block restores the old selected layers so that the layers.openlayers object exists
   // It is done in revers order so that they stay in the same order as when they were taken off
   var id, i;
   for(i = _.size(gisportal.tempSelectedLayers)-1; i >= 0; i--){
      id = gisportal.tempSelectedLayers[i].id;
      style = gisportal.tempSelectedLayers[i].style;
      try{
         gisportal.layers[id].mergeNewParams({STYLES:style});
         gisportal.refinePanel.layerFound(id, style);
      }catch(e){
         console.log("Cannot add that layer!");
      }
   }
   gisportal.tempSelectedLayers = [];

   // This block restores the old selected layers using the new IDs that have just been set
   for(i in gisportal.addLayersForm.selectedLayers){
      id = gisportal.addLayersForm.selectedLayers[i];
      try{
         gisportal.refinePanel.layerFound(id);
      }catch(e){
         console.log("Cannot add that layer!");
      }
   }
   gisportal.addLayersForm.selectedLayers = [];

   if(_.size(gisportal.layers) <= 0){
      if(_.size($('.notifyjs-gisportal-info span:contains("There are currently no layers in the portal")')) <= 0){
         $.notify("There are currently no layers in the portal \n Please load some up using the highlighted section to the left", {autoHide:false});
         gisportal.panels.showPanel('map-settings');
         $('.js-category-filter').html("");
         $('form.add-wms-form .js-wms-url').toggleClass("alert-warning", true);
      }
   }else{
      $('.notifyjs-gisportal-info span:contains("There are currently no layers in the portal")').closest('.notifyjs-wrapper').remove();
      $('form.add-wms-form .js-wms-url').toggleClass("alert-warning", false);
      gisportal.configurePanel.refreshData();
   }
   var state = gisportal.cache.state;
   gisportal.layersLoaded = true;
   if (state && !gisportal.stateLoaded) gisportal.loadState(state);

   gisportal.events.trigger('available-layers-loaded');
};

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
   
   //console.info('Global date cache now has ' + gisportal.enabledDays.length + ' members.'); // DEBUG
};

/**
 * Sets up the map, plus its controls, layers, styling and events.
 */
gisportal.mapInit = function() {
   // these need to be declared using 'old school' getElementById or functions within the ol3 js don't work properly
   var dataReadingPopupDiv = document.getElementById('data-reading-popup');
   gisportal.dataReadingPopupContent = document.getElementById('data-reading-popup-content');
   gisportal.dataReadingPopupCloser = document.getElementById('data-reading-popup-closer');

   gisportal.dataReadingPopupOverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
     element: dataReadingPopupDiv,
     autoPan: true,
     autoPanAnimation: {
       duration: 250
     }
   }));

   gisportal.dataReadingPopupCloser.onclick = function() {
      gisportal.dataReadingPopupOverlay.setPosition(undefined);
      gisportal.dataReadingPopupCloser.blur();
      _.each(gisportal.selectedFeatures, function(feature){
         feature[0].setStyle(feature[1]);
      });
      gisportal.selectedFeatures = [];
      gisportal.events.trigger('dataPopup.close');
      return false;
   };

   map = new ol.Map({
      target: 'map',
      controls: [
         new ol.control.FullScreen({
            label: $('<span class="icon-arrow-move-1"><span>').appendTo('body'),
            source: document.documentElement
         }),
         new ol.control.Zoom({
            zoomInLabel: $('<span class="icon-zoom-in"></span>').appendTo('body'),
            zoomOutLabel: $('<span class="icon-zoom-out"></span>').appendTo('body')
         }),
         new ol.control.Attribution({
            collapsible: false,
            collapsed: false,
         }),
         new ol.control.ScaleLine({})
      ],
      overlays: [gisportal.dataReadingPopupOverlay],
      view: new ol.View({
         projection: gisportal.projection,
         center: [0, 0],
         minZoom: 3,
         maxZoom: 17,
         resolution: 0.175,
      }),
      logo: false
   });
   gisportal.dragAndDropInteraction = new ol.interaction.DragAndDrop({
      formatConstructors: [
         ol.format.GPX,
         ol.format.GeoJSON,
         ol.format.IGC,
         ol.format.KML,
         ol.format.TopoJSON
      ]
   });

   map.addInteraction(gisportal.dragAndDropInteraction);

   gisportal.dragAndDropInteraction.on('addfeatures', function(event) {
      // Make sure only one feature is loaded at a time
      gisportal.vectorLayer.getSource().clear();
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
      gisportal.vectorLayer.getSource().addFeatures(event.features);
      gisportal.currentSelectedRegion = gisportal.wkt.writeFeatures(event.features);
      cancelDraw();
      gisportal.methodThatSelectedCurrentRegion = {method:"dragAndDrop", justCoords:false};
      $('.js-coordinates').val("");
      $('input.js-upload-shape')[0].value = "";
      $('.users-geojson-files').val("default");
   });

   // This function decides what colour and type of style to add to a feature
   gisportal.featureOverlayStyle = function(feature, resolution){
      var fillColour, strokeColour;
      if(feature.getProperties().overlayType == "hover"){
         fillColour = 'rgba(204,204,204,1)';
         strokeColour = "white";
      }else if(feature.getProperties().overlayType == "selected"){
         fillColour = 'rgba(142,142,142,1)';
         strokeColour = "white";
      }else{
         //If there is not a recognised overlay type it will set the colour to red
         fillColour = 'red';
         strokeColour = 'red';
      }
      if(feature.getGeometry().getType() == "Point"){
         return [new ol.style.Style({
            image: new ol.style.Circle({
               stroke: new ol.style.Stroke({
                  color: strokeColour,
                  width: 0.5
               }),
               fill: new ol.style.Fill({
                  color: fillColour
               }),
               radius: 5
            })
         })];
      }
      return [new ol.style.Style({
         stroke: new ol.style.Stroke({
            color: strokeColour,
            width: 1
         }),
         fill: new ol.style.Fill({
            color: fillColour
         })
      })];
   };

   // An overlay to add features to to draw their attention to the user
   gisportal.drawingOverlay = new ol.layer.Vector({
      source: new ol.source.Vector(),
      map: map
   });

   gisportal.drawingOverlaySource =  gisportal.drawingOverlay.getSource();
   gisportal.drawingPoints = [];

   // An overlay to add points to to show where a presenter is drawing a polygon
   gisportal.featureOverlay = new ol.layer.Vector({
      source: new ol.source.Vector(),
      map: map,
      style: gisportal.featureOverlayStyle
   });

   // A function to remove any features of a certail overlay type from any given overlay (vector layer)
   gisportal.removeTypeFromOverlay = function(overlay, overlayType){
      var features = overlay.getSource().getFeatures();
      var found = false;
      for(var feature in features){
         this_feature = features[feature];
         if(this_feature.getProperties().overlayType == overlayType){
            overlay.getSource().removeFeature(this_feature);
            found = true;
         }
      }
      if(overlay == gisportal.featureOverlay && found){
         gisportal.events.trigger('featureOverlay.removeType', overlayType);
      }
   };

   map.on('pointermove', function(e){
      if(e.dragging){
         return;
      }
      var feature;
      if(gisportal.selectionTools.isSelecting){
         // If the selection mode is on
         feature = map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
            // Gets the first vector layer it finds
            if(feature.getKeys().length !== 1 && feature.getId()){
               return feature;
            }
         });
      }
      var hoverFeatures = gisportal.featureOverlay.getSource().getFeatures();
      // TODO: Filter this list to only "hover" layers
      if(hoverFeatures.length > 0){
         if(!feature){
            // Makes sure any hover features are removed
            gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
            return;
         }
         var hovered_feature = hoverFeatures[0];
         // This is unlikely to happen but is is a safely precaution for when vectors overlap
         if(!_.isEqual(hovered_feature.getGeometry().getCoordinates(), feature.getGeometry().getCoordinates())){
            gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
            gisportal.hoverFeature(feature);
            gisportal.events.trigger("selectPolygon.hover", map.getCoordinateFromPixel(e.pixel), feature.getId());
         }
      }else if(feature){
         gisportal.hoverFeature(feature);
         gisportal.events.trigger("selectPolygon.hover", map.getCoordinateFromPixel(e.pixel), feature.getId());
      }
   });
   gisportal.hoverFeature = function(feature){
      // Stores the ID of the feature so that it knows which one it can select if the user clicks now.
      gisportal.hoveredFeature = feature.getId();
      // Creates a new feature to lose the old style and add the type (so the style is correct)
      var new_feature = new ol.Feature({geometry:feature.getGeometry(), overlayType:"hover"});
      // Adds the feature to the overlay
      gisportal.featureOverlay.getSource().addFeature(new_feature);
   };

   //add a click event to get the clicked point's data reading
   map.on('singleclick', function(e){
      var response = '';
      // Removes all hover features from the overlay
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
      if(gisportal.selectionTools.isSelecting){
         // If the selection mode is on
         map.forEachFeatureAtPixel(e.pixel, function(feature,layer){
            if(feature.getKeys().length === 1 || feature.getId() != gisportal.hoveredFeature || feature.getId() === undefined){
               // If we are not on the correct feature then keep going until we are
               return;
            }
            gisportal.selectFeature(feature);
            gisportal.events.trigger("selectPolygon.select", map.getCoordinateFromPixel(e.pixel), feature.getId());
            // Only does it for one feature
            return;
         });
      }
      else {
         gisportal.displayDataPopup(e.pixel);
         gisportal.events.trigger('dataPopup.display', map.getCoordinateFromPixel(e.pixel));
      }
   });
   gisportal.selectFeature = function(feature){
         // If the correct feature is found from the hoveredFeature variable then you can select this one
         // Makes sure any old selected features are removed ready to potentially add a new one
         gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
         // Creates a new feature to lose the old style and add the type (so the style is correct)
         var new_feature = new ol.Feature({geometry:feature.getGeometry(), overlayType:"selected"});
         // Adds the feature to the overlay
         gisportal.featureOverlay.getSource().addFeature(new_feature);

         // This part actually does the selecting bit for the graphing
         var t_wkt = gisportal.wkt.writeFeatures([feature]);

         gisportal.vectorLayer.getSource().clear();
         gisportal.currentSelectedRegion = t_wkt;
         $('.js-coordinates').val("");
         $('.js-upload-shape').val("");
         $('.users-geojson-files').val("default");
         gisportal.methodThatSelectedCurrentRegion = {method:"selectExistingPolygon", value: feature.getId(), justCoords: false};
         cancelDraw();
   };
   gisportal.displayDataPopup = function(pixel){
      var isFeature = false;
      var coordinate = map.getCoordinateFromPixel(pixel);
      response = "";
      map.forEachFeatureAtPixel(pixel, function(feature, layer) {
         if (feature && _.keys(feature.getProperties()).length >1 ) {
            var geom = feature.getGeometry();
            _.each(gisportal.selectedFeatures, function(feature) {
            });
            var tlayer;
            if(feature.getId()){
               tlayer = gisportal.layers['rsg_' + feature.getId().split('.')[0]];
            }
            isFeature = true;
            gisportal.selectedFeatures.push([feature, feature.getStyle()]);
            var props = feature.getProperties();
            for (var key in props) {
               if (props.hasOwnProperty(key) && key != "geometry") {
                  if(tlayer){
                     if ((!_.includes(tlayer.ignoredParams, key))&&(props[key]!==undefined)) {
                        response += "<li>" + key + " : " + props[key] + "</li>";
                     }
                  }else if(props[key]!==undefined){
                     response += "<li>" + key + " : " + props[key] + "</li>";
                  }
               }
            }
            response += "</ul>";
            gisportal.dataReadingPopupContent.innerHTML = response;
            gisportal.dataReadingPopupOverlay.setPosition(coordinate);
         }
      });
      if (!isFeature && !gisportal.selectionTools.isDrawing) {
         gisportal.addDataPopup(coordinate, pixel);
      }
      if(gisportal.selectionTools.isDrawing){
         gisportal.events.trigger('olDraw.click', coordinate);
      }
   };

   map.on("moveend", function(data) {
      var centre = data.map.getView().getCenter();
      var zoom = data.map.getView().getZoom() || 3;      // 3 being the default zoom level, but ol3 doesn't explicitly return this if the zoom hasn't changed since first load
      gisportal.events.trigger('map.move', centre, zoom);
   });
 
   gisportal.loadLayers();

   // Adds and removes the correct grabbing css for the pointer.
   $('#map canvas').on('mousedown', function(){
      $(this).toggleClass('grabbing', true).toggleClass('grab', false);
   });
   $('#map canvas').on('mouseup', function(){
      $(this).toggleClass('grab', true).toggleClass('grabbing', false);
   });

   // Create the base layers, country borders layers and graticules; set defaults
   gisportal.map_settings.init();         // map-settings.js
   
   // add vector layer for drawing area of interest polygons, and set up tools
   gisportal.selectionTools.init();

};
gisportal.addDataPopup = function(coordinate, pixel){
         var point = gisportal.reprojectPoint(coordinate, gisportal.projection, 'EPSG:4326');
         var lon = gisportal.normaliseLongitude(point[0], 'EPSG:4326').toFixed(3);
         var lat = point[1].toFixed(3);
         var elementId = 'dataValue' + String(coordinate[0]).replace('.', '') + String(coordinate[1]).replace('.', '');
         response = '<p>Measurement at:<br /><em>Longitude</em>: ' + lon + ', <em>Latitude</em>: ' + lat + '</p><ul id="' + elementId + '"><li class="loading">Loading...</li></ul>';
         gisportal.dataReadingPopupContent.innerHTML = response;
         gisportal.dataReadingPopupOverlay.setPosition(coordinate);

         gisportal.getPointReading(pixel);
};

gisportal.selectedFeatures = [];


/**
 * The initiation of WMS layers, such as adding to gisportal.cache.
 * @param {object} data - The actual layer
 * @param {object} opts - Options, not currently used
 */ 
gisportal.initWMSlayers = function(data, opts) {

   if (data !== null)  {
      gisportal.cache.wmsLayers = data;
      // Create browse categories list
      gisportal.loadBrowseCategories(data);
      // Create WMS layers from the data
      gisportal.createOpLayers();
   }
};

/**
 * The initiation of Vector layers, such as adding to gisportal.cache.
 * @param {object} data - The actual layer
 * @param {object} opts - Options, not currently used
 */ 
gisportal.initVectorLayers = function(data, opts) {
   if (data !== null)  {

      gisportal.cache.vectorLayers = data;
      // Create WMS layers from the data
      gisportal.createVectorLayers();
   }
};



/*===========================================================================*/

/**
 * Loads anything that is not dependent on layer data.
 * This is used to set the layer index to be the correct order 
 */
gisportal.nonLayerDependent = function() {
   
   // Setup timeline, from timeline.js
   gisportal.timeline = new gisportal.TimeLine('timeline', {
      comment: "Sample timeline data",
      selectedDate: new Date("1900-01-01T00:00:00Z"),
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
   var state = JSON.stringify(gisportal.saveState());
   gisportal.storage.set( gisportal.niceDomainName + '_state', state );
};

gisportal.getAutoSaveState = function(){
   var state = JSON.parse(gisportal.storage.get( gisportal.niceDomainName + '_state' ));
   return state;
};
gisportal.hasAutoSaveState = function(){
   return ( gisportal.storage.get( gisportal.niceDomainName + '_state' ) !== null );
};

/**
 * Creates an object that contains the current state
 * @param {object} state - Optional, allows a previous state to be extended 
 */
gisportal.saveState = function(state) {
   state = state || {}; 
   // Save layers
   state.map = {};
   state.selectedRegionInfo = gisportal.methodThatSelectedCurrentRegion;
   state.selectedIndicators = [];
   state.selectedLayers = {}; 
   state.view = gisportal.current_view;
   state.graphs = {};
   state.panel = {};
   state.refine = {};

   // Get the current layers and any settings/options for them.
   var keys = gisportal.selectedLayers;
   for(var i = 0, len = keys.length; i < len; i++) {
      var selectedIndicator = gisportal.selectedLayers[i];

      if (selectedIndicator)  {
         var indicator = gisportal.layers[selectedIndicator];
         state.selectedLayers[indicator.id] = {
            'id': indicator.id,
            'selected': indicator.selected,
            'isVisible': indicator.isVisible,
            'autoScale': indicator.autoScale,
            'colorbands': indicator.colorbands,
            'aboveMaxColor': indicator.aboveMaxColor,
            'belowMinColor': indicator.belowMinColor,
            'opacity': indicator.opacity !== null ? indicator.opacity : 1,
            'style': indicator.style !== null ? indicator.style : '',
            'minScaleVal': indicator.minScaleVal,
            'maxScaleVal': indicator.maxScaleVal,
            'log': indicator.log,
            'openTab' : $('.indicator-header[data-id="' + indicator.id + '"] + ul .js-tab-trigger:checked[id]').attr('id')
         };    
      }
   }
   // outside of loop so it can be easily ordered 
   var layers = [];
   $('.sortable-list .indicator-header').each(function() {
      layers.unshift($(this).parent().data('id'));
   });
   state.selectedIndicators = layers;
   
   // Get currently selected date.
   if(!gisportal.utils.isNullorUndefined($('.js-current-date').val())) {
      state.map.date = gisportal.timeline.getDate();
   }
     
   // Get selection from the map
   var features = gisportal.vectorLayer.getSource().getFeatures();
   var geoJsonFormat = new ol.format.GeoJSON();
   var featureOptions = {
      'dataProjection': gisportal.projection,
      'featureProjection': gisportal.projection,
      'decimals': 3
   };
   state.map.feature = geoJsonFormat.writeFeatures(features, featureOptions);   
   
   // Get zoom level
   state.map.zoom = map.getView().getZoom();

   // Get position
   state.map.centre = map.getView().getCenter();

   // Get timeline zoom
   // This is here because it only needs to be regenerated if there are loaded layers
   if(state.selectedIndicators.length > 0){
      state.timeline = {};
      state.timeline.minDate = gisportal.timeline.xScale.domain()[0];
      state.timeline.maxDate = gisportal.timeline.xScale.domain()[1];
   }

   state.map.baselayer = $('#select-basemap').data().ddslick.selectedData.value;
   state.map.countryborders = $('#select-country-borders').data().ddslick.selectedData.value;
   state.map.graticules = $('#select-graticules').data().ddslick.selectedData.value;
   state.map.projection = $('#select-projection').data().ddslick.selectedData.value;

   if(gisportal.graphs.activePlotSlideout.hasClass('show-all') || gisportal.graphs.activePlotSlideout.hasClass('show-peak')){
      state.graphs.state_plot = gisportal.graphs.activePlotEditor.plot();
      state.graphs.state_plot.show_all = gisportal.graphs.activePlotSlideout.hasClass('show-all');
   }
   if(gisportal.graphs.storedGraphs.length > 0){
      state.graphs.storedGraphs = gisportal.graphs.storedGraphs;
   }
   if(gisportal.graphs.popup.openHash){
      state.graphs.openGraph = gisportal.graphs.popup.openHash;
   }

   state.panel.activePanel = gisportal.panels.activePanel;

   state.refine.category = gisportal.refinePanel.selectedCategory;
   state.refine.refineData = gisportal.refinePanel.currentData;

   return state;
};

/**
 * To load the state, provide a state object (created with saveState)
 * @param {object} state - The saved state object
 */
gisportal.loadState = function(state){
   if(gisportal.stopLoadState){
      return true;
   }
   gisportal.stopLoadState = true;
   $('.start').toggleClass('hidden', true);
   state = state || {};

   var stateTimeline = state.timeline;
   var stateMap = state.map;
   
   // Load layers for state
   var keys = state.selectedIndicators;
   var available_keys = [];

   for(var key in keys){
      if (gisportal.layers[keys[key]]){
         available_keys.push(keys[key]);
      }
   }
   if (available_keys.length > 0)  {
      gisportal.indicatorsPanel.open();
   }
   if(gisportal.selectedLayers && gisportal.selectedLayers.length > 0){
      // Remove any layers already on the map (if they are going to be reloaded it's okay because ol3 (sort-of) caches them)
      gisportal.removeLayersByProperty('type', 'OLLayer');
      for(id = gisportal.selectedLayers.length-1; id >= 0; id--){
         gisportal.indicatorsPanel.removeFromPanel(gisportal.selectedLayers[id]);
      }
   }
   for (var i = 0, len = available_keys.length; i < len; i++) {
      var indicator = null;
      if (typeof available_keys[i] === "object") indicator = gisportal.layers[available_keys[i].id];
      else indicator = gisportal.layers[available_keys[i]];
      if (indicator && !gisportal.selectedLayers[indicator.id]) {
         if(indicator.serviceType == "WFS"){
            console.log("Please load the vector properly");
         }else{
            var state_indicator = state.selectedLayers[indicator.id];
            gisportal.configurePanel.close();
            // this stops the map from auto zooming to the max extent of all loaded layers
            indicator.preventAutoZoom = true;
            if(state_indicator){
               indicator.minScaleVal = state_indicator.minScaleVal;
               indicator.maxScaleVal = state_indicator.maxScaleVal;
            }
            gisportal.indicatorsPanel.selectLayer(indicator.id);
            gisportal.indicatorsPanel.addToPanel({id:indicator.id});
            if(state.selectedRegionInfo){
               gisportal.methodThatSelectedCurrentRegion = state.selectedRegionInfo;
               switch( state.selectedRegionInfo.method ){
                  case "drawBBox":
                     gisportal.currentSelectedRegion = state.selectedRegionInfo.value;
                     break;
                  case "csvUpload":
                     gisportal.methodThatSelectedCurrentRegion = {};
                     break;
                  case "geoJSONSelect":
                     gisportal.indicatorsPanel.geoJSONSelected(state.selectedRegionInfo.value, fromSavedState = true);
                     break;
                  case "dragAndDrop":
                     stateMap.feature = undefined;
                     break;
                  case "selectExistingPolygon":
                     gisportal.methodThatSelectedCurrentRegion = {};
                     break;
               }
            }
         }
      }
   }
   if(state.selectedLayers){
      gisportal.loadLayersState = state.selectedLayers;
   }

   gisportal.state_indicators_list = state.selectedIndicators;

   // This makes sure that all the layers from the state are loaded before the rest of the information is loaded.
   gisportal.events.bind('layer.metadataLoaded', function(event, id){
      var index = gisportal.state_indicators_list.indexOf(id);
      if(index > -1){
         // splice used because pop was not removing the correct value.
         state.selectedIndicators.splice(index, 1);
      }
      if(state.selectedIndicators.length === 0){
         gisportal.loadLayerState();
      }
   });
   
   //Makes sure that the vectorLayer is cleared to avoid duplication
   gisportal.vectorLayer.getSource().clear();
   // Create the feature if there is one
   if (stateMap.feature) {    // Array.<ol.Feature>
      var geoJsonFormat = new ol.format.GeoJSON();
      var featureOptions = {
         'dataProjection': gisportal.projection,
         'featureProjection': gisportal.projection
      };
      var features = geoJsonFormat.readFeatures(stateMap.feature, featureOptions);
      gisportal.vectorLayer.getSource().addFeatures(features);
   }
   
   if (stateTimeline)  {
      gisportal.timeline.zoomDate(stateTimeline.minDate, stateTimeline.maxDate);
      if (stateMap.date) {
         var date = new Date(stateMap.date);
         if(date.getTime() != gisportal.timeline.getDate().getTime()){
            gisportal.timeline.setDate(date);
         }
      }
   }

   if (stateMap.baselayer && (!gisportal.current_view || !gisportal.current_view.baseMap)) {
      $('#select-basemap').ddslick('select', { value: stateMap.baselayer });
   }

   if (stateMap.countryborders && (!gisportal.current_view || !gisportal.current_view.borders)) {
      $('#select-country-borders').ddslick('select', { value: stateMap.countryborders});
   }

   if (stateMap.graticules && (!gisportal.current_view || !gisportal.current_view.graticules)) {
      $('#select-graticules').ddslick('select', { value: stateMap.graticules });
   }

   if(stateMap.projection && (!gisportal.current_view || !gisportal.current_view.projection)){
      $('#select-projection').ddslick('select', { value: stateMap.projection });
   }

   // Load position & zoom
   var view = map.getView();
   view.setZoom(stateMap.zoom);
   view.setCenter(stateMap.centre);
   if(state.view){
      gisportal.view.loadView(state.view.view_name);
   }

   //Adding the graph state
   if(state.graphs){
      gisportal.loadGraphsState(state.graphs);
   }

   if(state.panel && state.panel.activePanel){
      gisportal.panels.showPanel(state.panel.activePanel);
   }

   if(state.refine){
      if(state.refine.category){
         $('#js-category-filter-select').ddslick('select', { value: state.refine.category });
      }
      if(state.refine.refineData){
         gisportal.refinePanel.refreshData(state.refine.refineData);
      }
   }

   gisportal.stateLoaded = true;

};

gisportal.loadLayerState = function(){
   if(gisportal.loadLayersState){
      var setScaleValues = function(id, min, max, log, autoScale){
         var auto = $('.js-auto[data-id="' + id + '"]');
         $('.js-indicator-is-log[data-id="' + id + '"]').prop('checked', log);
         auto.prop('checked', autoScale);
         gisportal.layers[id].autoScale = autoScale.toString();
         if(autoScale){
            auto.trigger('change');
            return false;
         }
         $('.js-scale-min[data-id="' + id + '"]').val(min);
         $('.js-scale-max[data-id="' + id + '"]').val(max).trigger('change');
      };
      for(var layer in gisportal.loadLayersState){
         var layer_state = gisportal.loadLayersState[layer];
         var id = layer_state.id;
         var defaultStyle = gisportal.config.defaultStyle || "boxfill/rainbow";
         var style = layer_state.style || defaultStyle;
         var min = layer_state.minScaleVal;
         var max = layer_state.maxScaleVal;
         var log = layer_state.log || false;
         if(layer_state.autoScale === undefined){
            layer_state.autoScale = "default";
         }
         var autoScale = gisportal.getAutoScaleFromString(layer_state.autoScale.toString());
         var opacity = layer_state.opacity || 1;
         var colorbands = layer_state.colorbands || gisportal.config.colorbands;
         var aboveMaxColor = layer_state.aboveMaxColor || gisportal.config.aboveMaxColor;
         var belowMinColor = layer_state.belowMinColor || gisportal.config.belowMinColor;

         // This opens the tab that the user had open
         if(layer_state.openTab){
            var openTab = layer_state.openTab;
            var tabName = openTab.split(id + "-")[1];
            gisportal.indicatorsPanel.selectTab(id, tabName);
         }else{
            var tab_elem = $('[for="tab-'+ layer_state.id + '-details"]');
            var button_elem = $('#'+$(tab_elem).attr('for'));
            button_elem.removeAttr('checked');
            tab_elem.removeClass('active');
         }

         //This sets the visibility of the layer to the same as what the user had before
         if(layer_state.isVisible === false){
            gisportal.indicatorsPanel.hideLayer(id);
         }else{
            gisportal.indicatorsPanel.showLayer(id);
         }
         gisportal.layers[id].resetting = true;
         // This sets the layer style to the same as what the user had before
         $('#tab-' + id + '-layer-style').ddslick('select', {value: style});

         // Sets the min & max and log of the scalebar to the value that the user had previously set
         setScaleValues(id, min, max, log, autoScale);

         // Sets the layers opacity to the value that the user had previously
         $('#tab-' + id + '-opacity').val(opacity*100);
         gisportal.layers[id].setOpacity(opacity);

         // Sets the layers opacity to the value that the user had previously
         $('#tab-' + id + '-colorbands').val(colorbands);

         // This sets the aboveMaxColor to the same as what the user had before
         $('#tab-' + id + '-aboveMaxColor').ddslick('select', {value: aboveMaxColor || "0"});
         // This sets the belowMinColor to the same as what the user had before
         $('#tab-' + id + '-belowMinColor').ddslick('select', {value: belowMinColor || "0"});

         gisportal.layers[id].resetting = false;
      }
   }
   gisportal.loadLayersState = null;
};

gisportal.loadGraphsState = function(graphState){
   var plot;
   var graph;
   var current_graphs = [];
   if(graphState.state_plot){
      var time;
      var state_plot = graphState.state_plot;

      plot = gisportal.graphs.createPlotFromState(state_plot);
      // Makes the lists dates instaead of date strings
      for(time in plot._dateRangeBounds){
         plot._dateRangeBounds[time] = new Date(plot._dateRangeBounds[time]);
      }
      for(time in plot._tBounds){
         plot._tBounds[time] = new Date(plot._tBounds[time]);
      }
      gisportal.graphs.editPlot(plot);
      if(!state_plot.show_all){
         gisportal.panelSlideout.peakSlideout( 'active-plot' );
      }
   }
   if(gisportal.graphs && gisportal.graphs.storedGraphs){
      var store = gisportal.graphs.storedGraphs;
      for(graph in store){
         current_graphs.push(store[graph].id);
      }
   }
   if(graphState.storedGraphs && graphState.storedGraphs.length > 0){
      var getStatus = function(plot, index){
         $.ajax({
            url: "plots/" + plot.id + "-status.json?_="+ new Date().getTime(),
            dataType:'json',
            success: function( data ){
               if(data.state == "complete"){
                  plot.noCopyEdit = true;
                  plot.state = function(){
                     return "complete";
                  };
                  plot.title = function(){
                     return this._title;
                  };
                  $('.no-graphs-text').toggleClass("hidden", true);
                  var rendered = gisportal.templates['plot-status']( plot );
                  gisportal.graphs.addButtonListeners(gisportal.graphs.graphsHistoryList.prepend(rendered), noCopyEdit = true);
                  gisportal.graphs.storedGraphs.push(graphState.storedGraphs[index]);
                  if(plot.id == graphState.openGraph){
                     $('.js-graph-status-open[data-hash="' + plot.id + '"]').trigger('click');
                  }
               }
            }
         });
      };
      for(graph in graphState.storedGraphs){
         plot = graphState.storedGraphs[graph];
         if(current_graphs.indexOf(plot.id) < 0){
            getStatus(plot, graph);
         }else if(plot.id == graphState.openGraph){
            $('.js-graph-status-open[data-hash="' + plot.id + '"]').trigger('click');
         }
      }
   }
};

/**
 * This converts from Feature to GeoJSON
 * @param {object} feature - The feature
 */
gisportal.featureToGeoJSON = function(feature, from_proj, to_proj) {
   var geoJSON = new ol.format.GeoJSON();
   var featureOptions = {
      dataProjection: to_proj,
      featureProjection: from_proj
   };
   return geoJSON.writeFeature(feature, featureOptions);
};

/**
 * This converts from GeoJSON to Feature
 * @param {string} geoJSONFeature - The GeoJSON
 */
gisportal.geoJSONToFeature = function(geoJSONFeature) {
   var geoJSON = new ol.format.GeoJSON();
   return geoJSON.readFeature(geoJSONFeature); 
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
   state = state || {}; 
   // Cache state for access by others
   gisportal.cache.state = state;
   // TODO: Merge with default state. 
   if (state && gisportal.layersLoaded) gisportal.loadState(state);
   
};

/*===========================================================================*/

/**
 * This code runs once the page has loaded - jQuery initialised.
 * It is called from portal.js
 */
gisportal.main = function() {

   if( gisportal.config.browserRestristion ){
      if( gisportal.validateBrowser() === false )
         return;
   }
      


   if( gisportal.config.siteMode == "production" ) {
      gisportal.startRemoteErrorLogging();
   } else {
      $('body').prepend('<div class="dev-warning">DEVELOPMENT MODE</div>');
      $('.js-start-container').addClass('start-dev');
   }
   if(!gisportal.config.colorbands){
      gisportal.config.colorbands = gisportal.config.colourbands || 255;
   }
   var col;
   if(!gisportal.config.aboveMaxColor){
      gisportal.config.aboveMaxColor = gisportal.config.aboveMaxColour;
   }
   if(gisportal.config.aboveMaxColor){
      col = gisportal.config.aboveMaxColor;
      if(col == "black"){
         col = "0x000000";
      }else if(col == "white"){
         col = "0xFFFFFF";
      }else if(col != "transparent"){
         col = null;
      }
      gisportal.config.aboveMaxColor = col;
   }

   gisportal.pageTitleNotification = {
      Vars:{
         OriginalTitle: document.title,
         Interval: null
      },    
      On: function(notification, intervalSpeed, messageNotify){
         var _this = this;
         clearInterval(_this.Vars.Interval);
         _this.Vars.Interval = setInterval(function(){
            document.title = (_this.Vars.OriginalTitle == document.title) ? notification : _this.Vars.OriginalTitle;
         }, (intervalSpeed) ? intervalSpeed : 1000);
         if(messageNotify){
            var notify_number = $('.collaboration-pulltab span.notify-number');
            if(notify_number.length <= 0){
               $('.collaboration-pulltab span[title]').append('<span class="notify-number">1</span>');
            }else{
               notify_number.html(parseInt(notify_number.html()) + 1);
            }
         }
      },
      Off: function(){
         $('.collaboration-pulltab span.notify-number').remove();
         clearInterval(this.Vars.Interval);
         document.title = this.Vars.OriginalTitle;   
      }
   };

   if(!gisportal.config.belowMinColor){
      gisportal.config.belowMinColor = gisportal.config.belowMinColour;
   }
   if(gisportal.config.belowMinColor){
      col = gisportal.config.belowMinColor;
      if(col == "black"){
         col = "0x000000";
      }else if(col == "white"){
         col = "0xFFFFFF";
      }else if(col != "transparent"){
         col = null;
      }
      gisportal.config.belowMinColor = col;
   }

   // Compile Templates
   gisportal.loadTemplates(function(){
      
      gisportal.initStart();

      // Set up the map
      // any layer dependent code is called in a callback in mapInit
      gisportal.mapInit();

      $('#version').html('v' + gisportal.VERSION + ':' + gisportal.SVN_VERSION);

      // Initiate the DOM for panels
      gisportal.panels.initDOM();
      gisportal.indicatorsPanel.initDOM();  // indicators.js
      gisportal.graphs.initDOM();           // graphing.js
      gisportal.analytics.initGA();         // analytics.js
      gisportal.panelSlideout.initDOM();    //panel-slideout.js
      gisportal.user.initDOM();             // panels.js
      gisportal.share.initDOM();            // share.js
      
      //Set the global loading icon
      gisportal.loading.loadingElement= jQuery('.global-loading-icon');
      
      $('.js-show-tools').on('click', showPanel);

      function showPanel()  {
         $('.js-show-tools').toggleClass('hidden', true);
         $('.panel.active').toggleClass('hidden', false);
         gisportal.events.trigger('panel.show');
      }

      $('.js-hide-panel').on('click', hidePanel);

      function hidePanel()  {
         $('.panel.active').toggleClass('hidden', true);
         $('.js-show-tools').toggleClass('hidden', false);
         gisportal.events.trigger('panel.hide');
      }

      // Start setting up anything that is not layer dependent
      gisportal.nonLayerDependent();

      // Grab the url of any state and store it as an id to be used
      // for retrieving a state object.
      var stateID = gisportal.utils.getURLParameter('state');
      if(stateID !== null) {
         //console.log('Retrieving State...');
         gisportal.ajaxState(stateID);
      }
      else {
         //console.log('Loading Default State...');
      }

      collaboration.initDOM();
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
   
   $.ajax({
      url: gisportal.stateLocation + '/' + id,
      dataType: 'json',
      success: function( data ) {         
         gisportal.setState( data );
         //console.log('Success! State retrieved');
      },
      error: function( request ){
         //console.log('Error: Failed to retrieved state. The server returned a ' + data.output.status);
      }
   });
};

/**
 * This zooms the map so that all of the selected layers
 * fit into the viewport.
 */
gisportal.zoomOverall = function()  {
   if (Object.keys(gisportal.selectedLayers).length > 0)  {

      // minX, minY, maxX, maxY
      var largestBounds = [ 180, 90, -180, -90 ];

      for (var i = 0; i < gisportal.selectedLayers.length; i++)  {
         var bbox = gisportal.layers[gisportal.selectedLayers[i]].exBoundingBox;
         var MinX = bbox.WestBoundLongitude;
         var MinY = bbox.SouthBoundLatitude;
         var MaxX = bbox.EastBoundLongitude;
         var MaxY = bbox.NorthBoundLatitude;
         if (+MinX < +largestBounds[0]) largestBounds[0] = parseFloat(MinX); // left 
         if (+MinY < +largestBounds[1]) largestBounds[1] = parseFloat(MinY); // bottom
         if (+MaxX > +largestBounds[2]) largestBounds[2] = parseFloat(MaxX); // right 
         if (+MaxY > +largestBounds[3]) largestBounds[3] = parseFloat(MaxY); // top
      }

      var extent = gisportal.reprojectBoundingBox(largestBounds, 'EPSG:4326', gisportal.projection);
      gisportal.mapFit(extent);
   }
};
gisportal.mapFit = function(extent){
   // This takes an extent and fits the map to it with the correct padding
   var polygon = ol.geom.Polygon.fromExtent(extent);
   var padding = [50, 0, 0, 0];
   if(gisportal.timeline && gisportal.timeline.timebars && gisportal.timeline.timebars.length > 0){
      padding[2] = 95;
   }
   padding[3] = $('.panel').offset().left + $('.panel').width();
   map.getView().fit(polygon, map.getSize(), {padding: padding});
};

/**
 * Replace links on start splash from config file
 * Should probably be using Mustache for this
 */
gisportal.initStart = function()  {
   
   // Work out if we should skip the splash page
   // Should we auto resume ?
   // Do we have to show the T&C box first ?
   var autoLoad = null;
   if( gisportal.config.skipWelcomePage === true || gisportal.utils.getURLParameter('wms_url')){
      if( gisportal.config.autoResumeSavedState === true && gisportal.hasAutoSaveState() ){
         autoLoad = function(){ if(!_.isEmpty(gisportal.layers) && !gisportal.stateLoaded){gisportal.loadState( gisportal.getAutoSaveState() );} gisportal.launchMap();};
      }else{
         autoLoad = function(){ gisportal.launchMap(); };
      }
   }else if( gisportal.config.autoResumeSavedState === true && gisportal.hasAutoSaveState() ){
      autoLoad = function(){ if(!_.isEmpty(gisportal.layers) && !gisportal.stateLoaded){gisportal.loadState( gisportal.getAutoSaveState() );} gisportal.launchMap();};
   }

   if( autoLoad !== null)
      return setTimeout(autoLoad, 1000);

   // Splash page parameters
   var data = {
      homepageSlides  : gisportal.config.homepageSlides,
      hasAutoSaveState: gisportal.hasAutoSaveState(),
      startHTML: gisportal.config.startPageHTML
   };

   // Render the spasl page HTML
   var rendered = gisportal.templates.start( data );
   $('.js-start-container').html( rendered );

   // Start JS slider library
   window.mySwipe = new Swipe($('.homepageSlider')[0] , {
     speed: 800,
     auto: 3000,
     continuous: true,
     disableScroll: false,
   });


   // If clicked - Load the users previously saved state
   $('.js-load-last-state').click(function(){
      gisportal.launchMap();
      gisportal.loadState( gisportal.getAutoSaveState() );
   });
   
   // Make the terms and conditions template
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

      if( gisportal.config.requiresTermsAndCondictions === true &&  gisportal.hasAgreedToTermsAndCondictions() === false ){
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
   window.onbeforeunload = function(e){
      gisportal.autoSaveState();
      var msg = "Warning. You're about to leave the page";
      if( gisportal.config.siteMode == "production"){
         e.returnValue = msg;
         return msg;
      }else{
         return;
      }
   };

};

/**
 * Returns if the user has agree to the
 * terms and conditions in the past
 * @return {Boolean} True is they have agreed, False if not
 */
gisportal.hasAgreedToTermsAndCondictions = function(){
   return gisportal.storage.get( 'tac-agreed', false );
};

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
         }catch(err){}
   
         Raven.captureException(e, { extra: extra} );
      };
   });
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
   for(var i =  0; i < requirements.length; i++ ){
      valid = (valid &&  Modernizr[requirements[i]] );
   }
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

};


/**
 *  Gets the value at the user selected point for all currently loaded layers
 *  
 */
gisportal.getPointReading = function(pixel) {
   var coordinate = map.getCoordinateFromPixel(pixel);
   var elementId = '#dataValue'+ String(coordinate[0]).replace('.','') + String(coordinate[1]).replace('.','');
   var feature_found = false;
   $.each(gisportal.selectedLayers, function(i, selectedLayer) {
      if(gisportal.pointInsideBox(coordinate, gisportal.layers[selectedLayer].exBoundingBox)){
         feature_found = true;
         var layer = gisportal.layers[selectedLayer];
         // Makes sure data is only shown for normal layers
         if(layer.serviceType == "WFS"){
            return;
         }
         // build the request URL, starting with the WMS URL
         var request = layer.wmsURL;
         var bbox = map.getView().calculateExtent(map.getSize());

         request += 'LAYERS=' + layer.urlName;
         if (layer.elevation) {
            // add the currently selected elevation
         } else {
            request += '&ELEVATION=0';
         }
         request += '&TIME=' + layer.selectedDateTime;
         request += '&TRANSPARENT=true';
         request += '&CRS='+ gisportal.projection;
         request += '&COLORSCALERANGE='+ layer.minScaleVal +','+ layer.maxScaleVal;
         request += '&NUMCOLORBANDS=253';
         request += '&LOGSCALE=false';
         request += '&SERVICE=WMS&VERSION=1.1.1';
         request += '&REQUEST=GetFeatureInfo';
         request += '&EXCEPTIONS=application/vnd.ogc.se_inimage';
         request += '&FORMAT=image/png';
         request += '&SRS='+ gisportal.projection;
         request += '&BBOX='+ bbox;
         request += '&X='+ pixel[0].toFixed(0);
         request += '&Y='+ pixel[1].toFixed(0);
         request += '&QUERY_LAYERS='+ layer.urlName;
         request += '&WIDTH='+ $('#map').width();
         request += '&HEIGHT='+ $('#map').height();
         request += '&url='+ layer.wmsURL;
         request += '&server='+ layer.wmsURL;


         $.ajax({
            url:  gisportal.middlewarePath + '/settings/load_data_values?url=' + encodeURIComponent(request) + '&name=' + layer.descriptiveName + '&units=' + layer.units,
            success: function(data){
               try{
                  $(elementId +' .loading').remove();
                  $(elementId).prepend('<li>'+ data +'</li>');
               }
               catch(e){
                  $(elementId +' .loading').remove();
                  $(elementId).prepend('<li>Sorry, feature information unavailable for: '+ layer.descriptiveName +'</li>');
               }
            },
            error: function(e){
               $(elementId +' .loading').remove();
               $(elementId).prepend('<li>Sorry, feature information unavailable for: '+ layer.descriptiveName +'</li>');
            }
         });
      }
   });
   if(!feature_found){
      $(elementId +' .loading').remove();
      $(elementId).prepend('<li>Sorry, you have clicked outside the bounds of all layers</li>');
   }
   
};
/**
 *    Returns true if the coordinate is inside the bounding box provided.
 *    Returns false otherwise
 */
gisportal.pointInsideBox = function(coordinate, exBoundingBox){
   // as the exBoundingBox is defined as EPSG:4326 first reproject the coordinate
   var point = gisportal.reprojectPoint(coordinate, gisportal.projection, 'EPSG:4326');
   point[0] = gisportal.normaliseLongitude(point[0], 'EPSG:4326');

   return point[0] >= exBoundingBox.WestBoundLongitude && point[0] <= exBoundingBox.EastBoundLongitude && point[1] >= exBoundingBox.SouthBoundLatitude && point[1] <= exBoundingBox.NorthBoundLatitude;
};

/**
 * When clicking on a map where the date line has been crossed returns the latitude incorrectly, e.g. scroll west over the date
 * line and click on Hobart and you get -212 degrees. This function corrects this 
 * 
 * @param  {[type]} coordinate      Reported longitude of the point on the map
 * @param  {[type]} projection_code The projection from which to use the bounds
 * @return {[type]}                 corrected longitude that's within the bounds of the projection
 */
gisportal.normaliseLongitude = function(coordinate, projection_code){
   var bounds = gisportal.availableProjections[projection_code].bounds;

   while(coordinate <= bounds[0]){
      coordinate += Math.abs(bounds[0] + bounds[0]);
   }
   while(coordinate >= bounds[2]){
      coordinate -= Math.abs(bounds[2] + bounds[2]);
   }
   return coordinate;
};

/**
 *  Hides all ol popups/overlays
 */
gisportal.hideAllPopups = function() {
   var overlays = map.getOverlays().getArray();

   $.each(overlays, function(i, overlay) {
      overlay.setPosition(undefined);
   });
};

gisportal.showModalMessage = function(html, timeout) {
   var t = parseInt(timeout) || 2000;
   var holder = $('.js-modal-message-popup');
   var target = $('.js-modal-message-html');

   target.html(html);
   holder.toggleClass('hidden', false);
   setTimeout(function() {
      holder.toggleClass('hidden', true);
   }, t);
};

gisportal.hideModalMessage = function() {
   var holder = $('.js-modal-message-popup');
   var target = $('.js-modal-message-html');

   target.html("");
   holder.toggleClass('hidden', true);
};

// This function gets a list of all the available tags
gisportal.loadBrowseCategories = function(data){
   // This takes a category (cat) in a versatile format e.g. indicator_type
   addCategory = function(cat){
      // If the category is not in the list already
      if(!(cat in gisportal.browseCategories || cat == "niceName" || cat == "providerTag")){
         // Add the category name as a key and convert it to a nice view for the value
         if(gisportal.config.catDisplayNames){
            gisportal.browseCategories[cat] = gisportal.config.catDisplayNames[cat] || gisportal.utils.titleCase(cat.replace(/_/g, ' '));
         }else{
            gisportal.browseCategories[cat] = gisportal.utils.titleCase(cat.replace(/_/g, ' '));
         }
      }
   };
   gisportal.browseCategories = {};
   var category, layer;
   // If data is give (first loading of portal)
   // Loop through each of the tags and run it through the addCategory function
   if(data){
      for(var obj in data){
         for(var server in data[obj].server){
            for(var layers in data[obj].server[server]){
               for(category in data[obj].server[server][layers].tags){
                  addCategory(category);
               }
            }
         }
      }
      for(layer in gisportal.vectors){
         for(category in gisportal.vectors[layer].tags){
            addCategory(category);
         }
      }
   // Any other time
   // Loop through each of the tags in gisportal.layers and run it through the addCategory function
   }else{
      for(layer in gisportal.layers){
         for(category in gisportal.layers[layer].tags){
            addCategory(category);
         }
      }
   }
   for(category in gisportal.config.hiddenCategories){
      var deleteCat = gisportal.config.hiddenCategories[category];
      delete gisportal.browseCategories[deleteCat];
      console.log("Removing '" + deleteCat + "' category");
   }
};
