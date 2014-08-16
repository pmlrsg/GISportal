/**
 * Create namespace object
 * @namespace
 */ 
var gisportal = gisportal || (gisportal = {});

gisportal.VERSION = "0.4.0";
gisportal.SVN_VERSION = "$Rev$".replace(/[^\d.]/g, ""); // Return only version number

/*==========================================================================*/
//Initialise javascript variables and objects

// Path to the flask middleware
gisportal.middlewarePath = '/service'; // <-- Change Path to match left hand side of WSGIScriptAlias

// Flask url paths
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

gisportal.layers = {};
gisportal.selectedLayers = [];
gisportal.baseLayers = {};

gisportal.graphs = {};

// Array of ALL available date-times for all date-time layers where data's available
// The array is populated once all the date-time layers have loaded
gisportal.enabledDays = [];

// Used as offsets when sorting layers in groups
gisportal.numBaseLayers = 0;
gisportal.numRefLayers = 0;
gisportal.numOpLayers = 0;

// Stores the current user selection. Any changes should trigger the correct event.
// Could be changed to an array later to support multiple user selections
gisportal.selection = {};
gisportal.selection.layer = undefined;
gisportal.selection.bbox = undefined;
gisportal.selection.time = undefined;

gisportal.selectionTools = null;

gisportal.timeline = null;

// Predefined map coordinate systems
gisportal.lonlat = new OpenLayers.Projection("EPSG:4326");

// Quick regions array in the format "Name",W,S,E,N - TODO: Needs to be moved at some point
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

// Provider logos
gisportal.providers = {
   "CCI" : { "logo": "img/cci.png" },
   "Cefas" : { "logo": "img/cefas.png", "url" : "http://www.cefas.defra.gov.uk/" },
   "DMI" : { "logo" : "img/dmi.png", "vertical" : "true", "url" : "http://www.dmi.dk/en/vejr/" },
   "HCMR" : { "logo" : "img/hcmr.png", "url" : "http://innovator.ath.hcmr.gr/newhcmr1/" },
   "IMS-METU" : { "logo" : "img/metu.png", "url" : "http://www.ims.metu.edu.tr/" },
   "OGS" : {"logo" : "img/ogs.png", "url" :  "http://www.ogs.trieste.it/" },
   "PML" : { "logo" : "img/pml.png", "url" : "http://www.pml.ac.uk/default.aspx" }  
};

/**
 * The OpenLayers map object
 * Soon to be attached to namespace
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
    
   // Get WMS and WFS caches
   gisportal.genericAsync('GET', './cache/mastercache.json', null, gisportal.initWMSlayers, errorHandling, 'json', {}); 
   //gisportal.genericAsync('GET', './cache/wfsMasterCache.json', null, gisportal.initWFSLayers, errorHandling, 'json', {});
};

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
   //var map = this;
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
      map.addLayer(layer);
      gisportal.baseLayers[name] = layer;
   }
   
   createBaseLayer('GEBCO', 'http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?', { layers: 'gebco_08_grid' });
   createBaseLayer('Metacarta Basic', 'http://vmap0.tiles.osgeo.org/wms/vmap0?', { layers: 'basic' });
   createBaseLayer('Landsat', 'http://irs.gis-lab.info/?', { layers: 'landsat' });
   createBaseLayer('Blue Marble', 'http://demonstrator.vegaspace.com/wmspub', {layers: "BlueMarble" });
   
   // Get and store the number of base layers
   gisportal.numBaseLayers = map.getLayersBy('isBaseLayer', true).length;
};

/**
 * Create all the reference layers for the map.
 */
gisportal.createRefLayers = function() {  
   
   $.each(gisportal.cache.wfsLayers, function(i, item) {
      if(typeof item.url !== 'undefined' && typeof item.serverName !== 'undefined' && typeof item.layers !== 'undefined') {
         var url = item.url;
         var serverName = item.serverName;
         $.each(item.layers, function(i, item) {
            if(typeof item.name !== 'undefined' && typeof item.options !== 'undefined') {
               item.productAbstract = "None Provided";
               //item.tags = {};
               
               var layer = new gisportal.layer(item.name, item.name, 
                     item.productAbstract, "refLayers", {
                        'serverName': serverName, 
                        'wfsURL': url, 
                        'providerTag': item.options.providerShortTag,
                        'tags': item.tags,
                        'options': item.options,
                        'times' : item.times
                     }
               );
                     
               layer = gisportal.checkNameUnique(layer);   
               gisportal.layers[layer.id] = layer;
            }
         });
      } 
   });
   
   gisportal.configurePanel.refreshData();
   // Get and store the number of reference layers
   gisportal.numRefLayers = map.getLayersBy('type', 'refLayers').length;
};

/** 
 * Create MicroLayers from the getCapabilities request to 
 * be used in the layer selector.
 */
gisportal.createOpLayers = function() {
   var layers = [];
   $.each(gisportal.cache.wmsLayers, function(i, item) {
      // Make sure important data is not missing...
      if(typeof item.server !== "undefined" && 
      typeof item.wmsURL !== "undefined" && 
      typeof item.wcsURL !== "undefined" && 
      typeof item.serverName !== "undefined" && 
      typeof item.options !== "undefined") {
         var providerTag = typeof item.options.providerShortTag !== "undefined" ? item.options.providerShortTag : '';
         var positive = typeof item.options.positive !== "undefined" ? item.options.positive : 'up';       
         var wmsURL = item.wmsURL;
         var wcsURL = item.wcsURL;
         var serverName = item.serverName;
         $.each(item.server, function(index, item) {
            if(item.length) {
               var sensorName = index;
               // Go through each layer and load it
               $.each(item, function(i, item) {
                  if(item.Name && item.Name !== "") {
                     var layer = new gisportal.layer(item.Name, item.Title, 
                        item.Abstract, "opLayers", { 
                           "firstDate": item.FirstDate, 
                           "lastDate": item.LastDate, 
                           "serverName": serverName, 
                           "wmsURL": wmsURL, 
                           "wcsURL": wcsURL, 
                           "sensor": sensorName, 
                           "exBoundingBox": item.EX_GeographicBoundingBox, 
                           "providerTag": providerTag,
                           "positive" : positive, 
                           "tags": item.tags
                        }
                     );
                               
                     layer = gisportal.checkNameUnique(layer);   
                     gisportal.layers[layer.id] = layer;
                     if (layer.tags)  {
                        var tags = [];
                        $.each(layer.tags, function(d, i) {
                           if (layer.tags[d])  {
                              var value = layer.tags[d];
                              if (value instanceof Object) {
                                 value = _.map(layer.tags[d], function(d) { return d.toLowerCase(); });
                              }
                              else  {
                                 value = value.toLowerCase();
                              }
                              tags.push({
                                 "tag" : d.toString(), 
                                 "value" : value
                              }); 
                           }
                        });
                     }
                     
                     layers.push({
                        "meta" : {
                           'id': layer.id,
                           'name': layer.name, 
                           'provider': providerTag,
                           'positive': positive, 
                           'title': layer.displayTitle, 
                           'abstract': layer.productAbstract,
                           'tags': tags,
                           'bounds': layer.exBoundingBox,
                           'firstDate': layer.firstDate,
                           'lastDate': layer.lastDate
                        },
                        "tags": layer.tags
                     });                         
                  }
               });
            }
         });
      }
   });
  
   if (layers.length > 0)  {
      layers.sort(function(a,b)  {
         if (a.meta.name && b.meta.name)  {
            var a = a.meta.name.toLowerCase();
            var b = b.meta.name.toLowerCase();
            if (a > b) return 1;
            if (a < b) return -1;
         }
         return 0;
      });

      $.each(layers, function(i, item) {
      });
   }

   gisportal.configurePanel.refreshData();
   // Batch add here in future.
};

/**
 * Get a layer that has been added to the map by its id.
 * In future this function will return a generic layer
 * rather than a OpenLayers layer.
 */
gisportal.getLayerByID = function(id) {
   //return map.getLayersBy('id', id)[0];
   return gisportal.layers[id];
};

/**
 * @param {Object} name - name of layer to check
 */
gisportal.isSelected = function(name) {
   if(map)
      return $.inArray(name, gisportal.sampleLayers) > -1 ? true : false;
};

/**
 * Checks if a layer name is unique recursively
 * 
 * @param {OPEC.MicroLayer} microLayer - The layer to check 
 * @param {number} count - Number of other )ayers with the same name (optional)
 */
gisportal.checkNameUnique = function(layer, count) {
   /*
   REIMPLEMENT
var id = null;
   
   if(typeof count === "undefined" || count === 0) {
      id = layer.id;
      count = 0;
   } else {
      id = layer.id + count;
   }
   
   if(id in gisportal.layers) {
      gisportal.checkNameUnique(layer, ++count);
   } else {
      if(count !== 0) { 
         layer.id = layer.id + count; 
      }
   }
  */ 
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
   
   // Not too keen on this being here
   gisportal.configurePanel.refreshIndicators(); 
   
   console.info('Global date cache now has ' + gisportal.enabledDays.length + ' members.'); // DEBUG
};

/**
 * Creates a list of custom args that will be added to the
 * permalink url.
 */
gisportal.customPermalinkArgs = function()
{
   var args = OpenLayers.Control.Permalink.prototype.createParams.apply(
      this, arguments
   );
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
   
   //map.setupGlobe(map, 'map', {
      //is3D: false,
      //proxy: '/service/proxy?url='
   //});

   // Get both master cache files from the server. These files tells the server
   // what layers to load for Operation (wms) and Reference (wcs) layers.
   gisportal.loadLayers();

   // Create the base layers and then add them to the map
   gisportal.createBaseLayers();
   // Create the reference layers and then add them to the map
   //gisportal.createRefLayers();

   /* 
    * Set up event handling for the map 
    */
   
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
 * Anything that needs to be done after the layers are loaded goes here.
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

gisportal.initWFSLayers = function(data, opts) {
   if (data !== null)  {
      gisportal.cache.wfsLayers = data;
      // Create WFS layers from the data
      gisportal.createRefLayers();
   }
};

/*===========================================================================*/

/**
 * Loads anything that is not dependent on layer data. 
 */
gisportal.nonLayerDependent = function() {
   // Keeps the vectorLayers at the top of the map
   map.events.register("addlayer", map, function() { 
       // Get and store the number of reference layers
      var refLayers = map.getLayersBy('type', 'refLayers');
      var poiLayers = map.getLayersBy('type', 'poiLayer');

      $.each(refLayers, function(index, value) {
         map.setLayerIndex(value, map.layers.length - index - 1);
      });

      $.each(poiLayers, function(index, value) {
         map.setLayerIndex(value, map.layers.length - 1);
      });
   });
   
   //--------------------------------------------------------------------------
  
   //Configure and generate the UI elements
   
   gisportal.openid.setup('shareOptions');

   // Setup timeline
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

gisportal.loadState = function(state) {
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
      var indicator = gisportal.layers[keys[i]];
      if (indicator && !gisportal.selectedLayers[keys[i]]) {
         gisportal.configurePanel.close();
         gisportal.refinePanel.foundIndicator(state.selectedIndicators[i]);
        
      }
   }
   
   // Create the feature if there is one
         indicator = {};
   if(!gisportal.utils.isNullorUndefined(stateMap.feature)) {
      var layer = map.getLayersBy('type', 'poiLayer')[0];
      layer.addFeatures(gisportal.geoJSONToFeature(stateMap.feature));
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

gisportal.featureToGeoJSON = function(feature) {
   var geoJSON = new OpenLayers.Format.GeoJSON();
   return geoJSON.write(feature);
};

gisportal.geoJSONToFeature = function(geoJSONFeature) {
   var geoJSON = new OpenLayers.Format.GeoJSON();
   return geoJSON.read(geoJSONFeature); 
};

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
 * Any code that should be run when user logs in
 */
gisportal.login = function() {
   $('.js-logged-out').toggleClass('hidden', true);
   $('.js-logged-in').toggleClass('hidden', false);
   gisportal.openid.login();
   // Load history
};

/**
 * Any code that should be run when the user logs out
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
   
   // TODO: Get states from component.
   state = gisportal.saveState(state);

   // TODO: Merge state with default state.
   
   // TODO: Return state.
   return state; 
};

gisportal.setState = function(state) {
   var state = state || {}; 
   // Cache state for access by others
   gisportal.cache.state = state;
   // TODO: Merge with default state.
   
   // TODO: Set states of components.
   gisportal.loadState(state);
};

/*===========================================================================*/

/**
 * This code runs once the page has loaded - jQuery initialised.
 */
gisportal.main = function() {
 
   // Set up the map
   // any layer dependent code is called in a callback in mapInit
   gisportal.mapInit();

  gisportal.initStart();

   // Compile Templates
   gisportal.templates = {};

   $('#version').html('v' + gisportal.VERSION + ':' + gisportal.SVN_VERSION);
  
   $('.js-start').click(function()  {
      $('.start').toggleClass('hidden', true);
   });
 
   // Setup the gritter so we can use it for error messages
   gisportal.gritter.setup();
   gisportal.configurePanel.initDOM();
   gisportal.indicatorsPanel.initDOM();
   gisportal.graphs.initDOM();
   gisportal.analytics.initGA();

   $('.js-show-tools').on('click', showPanel);

   function showPanel()  {
      $(this).toggleClass('hidden', true);
      $('.panel.active').toggleClass('hidden', false);
   }

   $('.js-hide-panel').on('click', hidePanel);

   function hidePanel()  {
      $(this).parents('.panel').toggleClass('hidden', true);
      $('.js-show-tools').toggleClass('hidden', false);
   }

   // Start setting up anything that is not layer dependent
   gisportal.nonLayerDependent();
  

   // Grab the url of any state.
   var stateID = gisportal.utils.getURLParameter('state');
   
   // Check if there is a state to load.
   if(stateID !== null) {
      console.log('Retrieving State...');
      gisportal.ajaxState(stateID);
   }
   else {
      console.log('Loading Default State...');
   }

   gisportal.replaceAllIcons(); 
};


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

gisportal.getTopLayer = function() {
	var layer = null;
	$.each($('.sensor-accordion').children('li').children(':checkbox').get().reverse(), function(index, value) {
      if($(this).is(':checked')) {
         var layerID = $(this).parent('li').attr('id');
         layer = gisportal.getLayerByID(layerID);
      }
   });
   return layer;
};

gisportal.updateLayerData = function(layerID)  {
   var layer = gisportal.getLayerByID(layerID);
   $('#graphcreator-baseurl').val(layer.wcsURL);
   $('#graphcreator-coverage option[value=' + layer.origName + ']').prop('selected', true);
};

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

// Automatically goes through all icons
gisportal.replaceAllIcons = function()  {
   gisportal.replaceSubtreeIcons('body');
};

// Goes through all icons in a subtree
gisportal.replaceSubtreeIcons = function(el)  {
   $.each($('.icon-svg', el).not(".bg-removed, .bg-being-removed"), function(i,e)  {
      var e = $(e); 
      e.addClass('bg-being-removed');
      var url = e.css('background-image').replace('url(','').replace(')','').replace(/\"/g, "");
      $.ajax({
         url: url,
         dataType: "xml"
      }).done(function(svg){
         var ele = document.importNode(svg.documentElement,true);
         e.prepend(ele);
         e.addClass('bg-removed');
         e.removeClass('bg-being-removed');
      });
   });
};

// Should probably be using Mustache for this
gisportal.initStart = function()  {
   var list = $('.start .examples li');
   for (var i = 0; i < list.length; i++)  {
      var current = gisportal.config.defaultStates[i];
      var currentLi = $(list[i]);
      if (!current) $(currentLi).remove();
      else  {
         $('a', currentLi).attr("href", current.url);
         $('span', currentLi).text(current.name);
      }
   }
};
