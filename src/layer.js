/**
 * layer.js
 * This file represents a Layer class-like object.
 * The layers are stored in gisportal.layers and 
 * the selected layers' ids are stored in gisportal.selectedLayers
 */


/**
 * All data of a particular indicator is stored in a gisportal.layer object. 
 * @constructor
 * 
 * Some params will need renaming in the future.
 * For instance, name is actually ID and
 * title is not currently being used.
 *
 * @param {string} name - The ID of the layer
 * @param {string} title - The display title
 * @param {string} productAbstract - The description of the layer
 * @param {string} type - opLayers or refLayers
 *
 * 
 * @param {object} options - Options to extend the defaults
 */
 //gisportal.layer = function(name, title, productAbstract, type, opts) {
gisportal.layer = function( options ) {
   var layer = this;

   var defaults = {
      firstDate : '',
      lastDate : '',
      serverName : null,
      wfsURL : null,
      wmsURL : null,
      wcsURL : null,
      sensorNameDisplay : null,
      sensorName : null,
      exBoundingBox : null,
      
      providerTag : null,
      tags : null,
      options : null,

      providerDetails: {},
      offsetVectors: null,

      autoScale: gisportal.config.autoScale
   };

   $.extend(true, this, defaults, options);


   // id used to identify the layer internally 
   this.id = options.name + "_" + options.providerTag;

   // The grouped name of the indicator (eg Oxygen)
   this.name = options.tags.niceName || options.name.replace("/","-");

   // {indicator name} - {indicator region} - { indicator provider }
   this.descriptiveName = this.name + ' - ' + this.tags.region + ' - ' + this.providerTag

   // The original indicator name used by thedds/cache
   this.urlName = options.name;
   this.displayTitle = options.title.replace(/_/g, " ");

   // The title as given by threads, not reliable 
   this.title = options.title;


   this.productAbstract = options.productAbstract;
   this.type = options.type;

   // Default indicator tab to show
   this.visibleTab = "details";
   
   // These queues feel like a hack, refactor?
   this.metadataComplete = false;
   this.metadataQueue = [];

   
   //this.moreInfo = opts.moreInfo;
   // Used for sensor data from SOS, not tested as we have no sensor data
   this.sensorName = this.sensorName !== null ? this.sensorName.replace(/\s+/g, "") : null;
   this.sensorName = this.sensorName !== null ? this.sensorName.replace(/[\.,]+/g, "") : null;
   
   if(this.type == 'refLayers') {
      this.urlName = this.urlName.replace('-', ':');
   }
   

   this.tags['providerTag'] = this.providerTag;

   // I do not like the metadataQueue but it is used to
   // prevent race conditions of AJAX calls such as
   // for the scalebar.
   // Essentially, if metadata is complete then the scalebar
   // will use the data otherwise it will put a callback into
   // the queue.
   this.metadataComplete = false;
   this.metadataQueue = []; 

   this.times = []; // The times for each of the layers stored
   this.openlayers = {}; // OpenLayers layers
   this.cesiumLayers = {}; // Cesium layers
   
   // Maintains the order of microlayers (not fully implemented) 
   this.order = [];
   
   // Is the layer selected.
   // This is left over from the old design, it could probably
   // be deprecated as selected layers can be found in
   // gisportal.selectedLayers now.
   this.selected = false;
   
   //--------------------------------------------------------------------------
   // The min and max scale range, used by the scalebar
   this.maxScaleVal = null;
   this.origMaxScaleVal = null;
   this.minScaleVal = null;
   this.origMinScaleVal = null;
   this.log = false;
   //--------------------------------------------------------------------------
   
   // Set this to true of the layer is a temporal layer with date-time based data
   this.temporal = false;
   
   // Holds cached date-times as array of ISO8601 strings for each layer based on data availability
   this.DTCache = [];
   
   // Holds an array of the current date-times for the current date and layer as an array of ISO8601 strings
   this.currentDateTimes = [];
   
   // Currently selected date-time for the current date and layer as an ISO8601 string
   this.selectedDateTime = ''; 
     
   //--------------------------------------------------------------------------
   // Set this to true if the layer has an elevation component
   this.elevation = false;
   
   this.selectedElevation = null;
   
   // Elevation default
   this.elevationDefault = null;  
   
   this.elevationUnits = null;
   
   // Holds cached elevation numbers as an array
   this.elevationCache = [];
   //--------------------------------------------------------------------------
   

   
   /**
    * When data is available, initialise the layer
    * so that it can be used.
    * @param {object} layerData - The data
    * @param {object} options - The options
    */
   this.init = function(layerData, options) {
      var self = this;
      this.displayName = function() { return this.providerTag + ': ' + this.name; };
      
      // A list of styles available for the layer
      this.styles = null;
      
      // The BoundingBox for the layer
      this.boundingBox = layerData.BoundingBox; // Can be 'Null'.

      if(this.type == "opLayers") {
         this.getMetadata();
         this.getDimensions(layerData); // Get dimensions.
         // A list of styles available for the layer
         this.styles = layerData.Styles; // Can be 'Null'.
         this.style = "boxfill/rainbow";
         
      } else if(this.type == "refLayers") {
         this.style = new OpenLayers.StyleMap(this.options.style);
      }
      
      var olLayer = this.createOLLayer(); // Create OL layer.
      
      this.openlayers['anID'] = olLayer;

      if (options.show !== false)  { 
         gisportal.checkIfLayerFromState(layer);
         gisportal.addLayer(layer, options);    
      }

      this.select();

   };
   
   /**
    * Checks for and gets any dimensions for the layer.
    * 
    * @method
    * 
    * @param {Object} layerData - Object containing data about the layer. 
    */
   this.getDimensions = function(layerData) {
      var layer = this;
      
      // Get the time dimension if this is a temporal layer
      // or elevation dimension
      $.each(layerData.Dimensions, function(index, value) {
         var dimension = value;
         // Time dimension
         if (value.Name.toLowerCase() == 'time') {
            layer.temporal = true;
            var datetimes = dimension.Value.split(',');           
            layer.DTCache = datetimes;

         // Elevation dimension   
         } else if (value.Name.toLowerCase() == 'elevation') {
            layer.elevation = true;
            layer.elevationCache = dimension.Value.split(',');
            layer.mergeNewParams({elevation: value.Default});
            layer.selectedElevation = value.Default;
            layer.elevationDefault = value.Default;
            layer.elevationUnits = value.Units;
         }
      });
   };
   
   //--------------------------------------------------------------------------
   
   /**
    * When params are changed, such as minScaleVal, pass them
    * to this function as an object and it will merge them into
    * the correct OpenLayers WMS Layer. Note that it currently assumes there is only
    * one WMS layer per layer.
    *
    * @param {object} object - The object to extend the WMS layer params
    */
   this.mergeNewParams = function(object) {
      if (this.openlayers['anID']) this.openlayers['anID'].mergeNewParams(object);
      gisportal.scalebars.autoScale( this.id );
   };
   
   /**
    * By default the layer is visible, to hide it
    * just call layer.setVisibility(false);
    *
    * @param {boolean} visibility - True if visible, false if hidden
    */
   this.isVisible = true;  
   this.setVisibility = function(visibility) {
      if (this.openlayers['anID']) this.openlayers['anID'].setVisibility(visibility);
      this.isVisible = visibility;
   };
   
   /**
    * Set the opacity of the layer.
    * @param {double} opacityValue - 0 is transparent, 1 is opaque.
    */
   this.opacity = 1;
   this.setOpacity = function(opacityValue) {
      var self = this;
      
      // Set the opacity for all layers
      var keys = Object.keys(this.openlayers);
      for(var i = 0, len = keys.length; i < len; i++) {
         self.openlayers[keys[i]].setOpacity(opacityValue);
      }
      
      this.opacity = opacityValue;
   };

   /**
    * Sets the style from the layer.styles list.
    * These style names represent colour palettes.
    *
    * @param {string} style - The name of the style
    */
   this.setStyle = function(style)  {
      var indicator = this;
      indicator.style = style;
      gisportal.indicatorsPanel.scalebarTab(indicator.id);
   }; 
  
   /**
    * This function is the main way to select layers
    */
   this.select = function() {
      // Just in case it tries to add a duplicate
      if (_.indexOf(gisportal.selectedLayers, this.id) > -1) return false;
      var layer = this;
      
      layer.selected = true;
      
      // Adds the layer ID to the beginning of the gisportal.selectedLayers array
      gisportal.selectedLayers.unshift(layer.id);

      // If the layer has date-time data, use special select routine
      // that checks for valid data on the current date to decide if to show data
      if(layer.temporal) {
         var currentDate = gisportal.timeline.getDate();
         
         //Nope
         //this.selectedDateTime = gisportal.timeline.selectedDate.toISOString();
         layer.selectDateTimeLayer( gisportal.timeline.selectedDate );
         
         // Now display the layer on the timeline
         var startDate = new Date(layer.firstDate);
         var endDate = new Date(layer.lastDate);
         gisportal.timeline.addTimeBar(layer.name, layer.id, layer.name, startDate, endDate, layer.DTCache);   
                 
         // Update map date cache now a new temporal layer has been added
         gisportal.refreshDateCache();
         
         $('#viewDate').datepicker("option", "defaultDate", endDate);

         gisportal.zoomOverall();
      } else {
         layer.setVisibility(true);
      } 
      
      
      var index = _.findIndex(gisportal.selectedLayers, function(d) { return d === layer.id;  });
      gisportal.setLayerIndex(layer, gisportal.selectedLayers.length - index);
      
   };
    
   this.unselect = function() {
      var layer = this; 
      $('#scalebar-' + layer.id).remove(); 
      layer.selected = false;
      layer.setVisibility(false);
      gisportal.selectedLayers = _.pull(gisportal.selectedLayers, layer.id);
      if (layer.temporal) {
         if (gisportal.timeline.timebars.filter(function(l) { return l.name === layer.name; }).length > 0) {
            gisportal.timeline.removeTimeBarByName(layer.name);
         }
         
         gisportal.refreshDateCache();
         gisportal.zoomOverall();
      }
   };
   
   //--------------------------------------------------------------------------
   
   /**
    * Function which looks for a date within a layer. The date 
    * passed is in the format yyyy-mm-dd or is an empty string. 
    * Returns the array of date-times if there's a match or null
    * if not.
    * 
    * @method
    * 
    * @param {date} date - The date to look for.
    */
   this.matchDate = function(date) {
      var layer = this;
      var nearestDate = null; 
      var filtArray = $.grep(layer.DTCache, function(dt, i) {
         var datePart = dt.substring(0, 10);
         if (nearestDate === null || (datePart > nearestDate && datePart < date) || (datePart < nearestDate && datePart > date)) nearestDate = dt; 
         return (datePart == date);
      });
      
      if (filtArray.length > 0) {
         return filtArray;
      } 
      else  if (nearestDate != null) {
         console.log("Using nearest date: " + nearestDate);
         return [nearestDate];
      }
      else {
         return null;
      }
   };
   
   /**
    * Select the given temporal layer on the Map based on JavaScript date input
    * 
    * @param {Object} layer - The OpenLayers.Layer object to select
    * @param {Date} date - The currently selected view data as a JavaScript Date object
    *
    */
   this.selectDateTimeLayer = function(date) {
      var layer = this;
      
      if(date) {
         var uidate = gisportal.utils.ISODateString(date);
         var matchedDate = layer.matchDate(uidate);
         if(matchedDate) {
            layer.currentDateTimes = matchedDate;
            // Choose 1st date in the matched date-times for the moment - will expand functionality later
            layer.selectedDateTime = matchedDate[0];
            
            //----------------------- TODO: Temp code -------------------------
            var keys = Object.keys(layer.openlayers);
            for(var i = 0, len = keys.length; i < len; i++) {
               if(layer.type == 'opLayers') {
                  layer.mergeNewParams({time: layer.selectedDateTime});
               } else {
                  if($.isFunction(layer.openlayers[keys[i]].removeAllFeatures)) {
                     layer.openlayers[keys[i]].removeAllFeatures();
                     gisportal.getFeature(layer, layer.openlayers[keys[i]], layer.selectedDateTime);   
                  }
               }
            } 
            //-----------------------------------------------------------------       
            
            layer.setVisibility(layer.isVisible);
            console.info('Layer ' + layer.name + ' data available for date-time ' + layer.selectedDateTime + '. Layer selection and display: ' + layer.selected);
         }
         else {
            layer.currentDateTimes = [];
            layer.selectedDateTime = '';
            layer.setVisibility(false);
            console.info('Layer ' + layer.name + ' no data available for date-time ' + uidate + '. Not displaying layer.');
         }
      }
   };
   
   /**
    * Function which gets layers metadata asynchronously and sets up the 
    * map scale min and max parameters.
    *
    * It uses the metadataQueue so that if there is anything in the queue
    * it will run the callbacks. Then it sets metadataComplete so that
    * functions (such as scalebar) will know they are able to use the metadata.
    * 
    */
   this.getMetadata = function() {
      var layer = this;
      
      $.ajax({
         type: 'GET',
         url: OpenLayers.ProxyHost + layer.wmsURL + encodeURIComponent('item=layerDetails&layerName=' + layer.urlName + '&coverage=' + layer.id + '&request=GetMetadata'),
         dataType: 'json',
         async: true,
         success: function(data) {
            if (layer.origMinScaleVal === null) layer.origMinScaleVal = parseFloat(data.scaleRange[0]);
            if (layer.origMaxScaleVal === null) layer.origMaxScaleVal = parseFloat(data.scaleRange[1]);
            if (layer.minScaleVal === null) layer.minScaleVal = layer.origMinScaleVal;
            if (layer.maxScaleVal === null) layer.maxScaleVal = layer.origMaxScaleVal;
            layer.units = data.units; 
            layer.log = data.logScaling == true ? true : false;

            gisportal.layers[layer.id].metadataComplete = true; 
            layer.metadataComplete = true;
            _.each(gisportal.layers[layer.id].metadataQueue, function(d) { d(); delete d; });

         },
         error: function(request, errorType, exception) {
            layer.origMinScaleVal = 0;
            layer.origMaxScaleVal = 1;
            layer.minScaleVal = layer.origMinScaleVal;
            layer.maxScaleVal = layer.origMaxScaleVal;
            layer.log = false;
            
            var data = {
               type: 'layer MetaData',
               request: request,
               errorType: errorType,
               exception: exception,
               url: this.url
            };          
            gritterErrorHandler(data);
         }
      });
   };

   this.cacheUrl = function(){
     return portalLocation() + 'cache/layers/' + layer.serverName + '_' + layer.urlName.replace("/","-") + '.json'
   }

   /**
    * This function creates an Open Layers layer, such as a WMS Layer.
    * These are stored in layer.openlayers. Currently the implementation
    * only allows a single OL layer per gisportal.layer known as 'anID'
    * but in the future this should change to allow multiple OL layers.
    *
    * opLayers refer to operational layers, generally temporal WMS layers
    * refLayers refer to reference layers, generally WFS or KML.
    *
    * History:
    * The previous implementation had the idea of microlayers but over time
    * they grew into a confusing mess than has now been removed and merged
    * with gisportal.layer. 
    */
   this.createOLLayer = function() {
      var self = this,
         layer = null;
      
      // Create WMS layer.
      if(this.type == 'opLayers') {    
         
         layer = new OpenLayers.Layer.WMS (
            this.displayName(),
            this.wmsURL,
            { layers: this.urlName, transparent: true}, 
            { opacity: 1, wrapDateLine: true, transitionEffect: 'resize' }
         );
         layer.type = 'opLayers';
         
      } else if(this.type == 'refLayers') {
         
         if(typeof this.options.passthrough !== 'undefined' && this.options.passthrough) {               
            // GML or KML
            layer = new OpenLayers.Layer.Vector(self.name, {
               projection: gisportal.lonlat,
               strategies: [new OpenLayers.Strategy.Fixed()],    
               protocol: new OpenLayers.Protocol.HTTP({
                  url: self.wfsURL,
                  //format: new OpenLayers.Format.GML()
                  format: this.options.format == 'GML2' ? new OpenLayers.Format.GML() : new OpenLayers.Format.KML({ extractStyles: true, extractAttributes: true}) 
               }),                         
               styleMap: self.style
            });
            layer.type = 'refLayers';
               
         } else {

            // Vector      
            layer = new OpenLayers.Layer.Vector(this.name, {
               projection: gisportal.lonlat,
               styleMap: self.style,
               eventListeners: {
                  'featureselected': function(event) {
                     var feature = event.feature;
                     var popup = new OpenLayers.Popup.FramedCloud("popup",
                        OpenLayers.LonLat.fromString(feature.geometry.toShortString()),
                        null,
                        feature.attributes.message + "<br>" + feature.attributes.location,
                        null,
                        true,
                        null
                     );
                     popup.autoSize = true;
                     popup.maxSize = new OpenLayers.Size(400, 500);
                     popup.fixedRelativePosition = true;
                     feature.popup = popup;
                     map.addPopup(popup);
                  },
                  'featureunselected': function(event) {
                     var feature = event.feature;
                     map.removePopup(feature.popup);
                     feature.popup.destroy();
                     feature.popup = null;
                  }
               }
            }, {
               typeName: self.name, format: 'image/png', transparent: true, 
               exceptions: 'XML', version: '1.0', layers: '1'
            });
            layer.type = 'refLayers';
            
            var selector = gisportal.mapControls.selector;
            var layers = selector.layers;
   
            if (typeof layers === 'undefined' || layers === null)
               layers = [];
   
            layers.push(layer);     
            gisportal.mapControls.selector.setLayer(layers);
            
            if (typeof self.times !== 'undefined' && self.times && self.times.length) {
               self.temporal = true;
               var times = [];
               var dateToIDLookup = {};
               for(var i = 0; i < self.times.length; i++) {
                  var time = self.times[i];
                  times.push(time.startdate);
                  dateToIDLookup[time.startdate] = time.id;          
               }
               self.DTCache = times;
               self.WFSDatesToIDs = dateToIDLookup;
            }
         }
      }
      
      
      if (layer.events)  { 
         
         layer.events.on({
            "loadstart": gisportal.loading.increment,
            "loadend": gisportal.loading.decrement
         })
         
         if(layer.type != 'baseLayers') {   
            // Check the layer state when its visibility is changed
            layer.events.register("visibilitychanged", layer, function() {
            });
         }

      }
      
      return layer;
   };
  
   /**
    * Adds the OL layer to the map, to show the data.
    * It also increases numOpLayers or numRefLayers to show
    * how many operational and reference layers are on the map.
    *
    * @param {OL Layer} layer - The Open Layers layer to be added to map
    * @param {string} id - The id of the layer (Unused)
    * */
   this.addOLLayer = function(layer, id) {      
      
      // Add the layer to the map
      map.addLayer(layer);
 
      if(this.type == 'opLayers') {
         gisportal.numOpLayers++;
      } else if (this.type == 'refLayers') {
         gisportal.numRefLayers++;
      }

   };
  
   /**
    * Removes the Open Layers layer from layer.openlayers and the map
    * Also decrements the numOpLayers and numRefLayers counters.
    * 
    * @param {OL Layer} layer - The Open Layers layer to be added to map
    * @param {string} id - The id of the layer (Unused)
    */ 
   this.removeOLLayer = function(layer, id) {
      // Remove the layer from the map.
      // In this case layer.id is the id of the OL Layer
      // not of the indicator.
      map.removeLayer(map.getLayer(layer.id));
      
      if(this.type == 'opLayers') {
         gisportal.numOpLayers--;
      } else if(this.type == 'refLayers') {
         gisportal.numRefLayers--;
      }

   };
   
   
   // Store new layer.
   //gisportal.layers[this.id] = this;
};

/**
 * Setups up the layer, calls addOLLayer and updates scalebar
 * and visibility. 
 * 
 * @param {object} layer - The gisportal.layer object
 * @param {object} options - Extend the layer with options
 */
gisportal.addLayer = function(layer, options) {
   var options = options || {};   
  
   if (layer)  {
      layer.addOLLayer(layer.openlayers['anID'], layer.id);
   }
 
   if (options.minScaleVal || options.maxScaleVal)  {   
      if (options.minScaleVal !== null) gisportal.layers[layer.id].minScaleVal = options.minScaleVal; 
      if (options.maxScaleVal !== null) gisportal.layers[layer.id].maxScaleVal = options.maxScaleVal;
      layer.minScaleVal = gisportal.layers[layer.id].minScaleVal;
      layer.maxScaleVal = gisportal.layers[layer.id].maxScaleVal;
      gisportal.scalebars.updateScalebar(layer.id);
   }
  
   layer.setVisibility(options.visible); 
   gisportal.setCountryBordersToTopLayer();
};

/**
 * Removes a layer when passed the entire layer object
 * This function should be used because it removes
 * from selectedLayers as well as the map.
 * 
 * @param {object} layer - A gisportal.layer object
 */
gisportal.removeLayer = function(layer) {
   var index = _.indexOf(gisportal.selectedLayers, layer.id);
   
   // Using splice to remove the index from selectedLayers 
   if (index > -1) gisportal.selectedLayers.splice(index,1);

   var keys = Object.keys(layer.openlayers);
   for(var i = 0, len = keys.length; i < len; i++) {
      layer.removeOLLayer(layer.openlayers[keys[i]], keys[i]);
   }
};

/**
 * This function is used to order the layers correctly
 * on the map.
 * Please note - the index should be relative to
 * the other layers in gisportal.selectedLayers.
 * This function handles positioning the layer
 * correctly relative to base layers.
 * It also moves the vector layer to always be on top.
 *
 * @param {object} layer - A gisportal.layer object
 * @param {integer} index - The index to set the layer
 */
gisportal.setLayerIndex = function(layer, index) {
   var noLayers = gisportal.selectedLayers.length;
   var startIndex = map.layers.length - noLayers;
   var name = layer.openlayers['anID'].name;
   map.setLayerIndex(layer.openlayers['anID'], index);

   var vector = map.getLayersByName('POI Layer')[0];
   map.setLayerIndex(vector, map.layers.length - 1);
};

/**
 * Function to filter layers with date-time dependencies to given date.
 * 
 * @param {string} date - yyyy-mm-dd format date string to filter to
 *
 */
gisportal.filterLayersByDate = function(date) {
   $.each(gisportal.selectedLayers, function(index, id) {
      // Only filter date-dependent layers
      var layer = gisportal.layers[id];
      if (layer.temporal) {
         layer.selectDateTimeLayer(date);
      }
   });      
};

/**
 * Gets data layers asynchronously and creates operational layers for each one. 
 * This is the main function for dealing with new layers.
 *
 * @param {string} fileName - The file name for the specific JSON layer cache
 * @param {string} microLayer - The microLayer for the layer to be downloaded
 * @param {object} options - Any extra options for the layer
 */
gisportal.getLayerData = function(fileName, layer, options) {  
  var options = options || {};
  var id = layer.id; 

   $.ajax({
      type: 'GET',
      url: "./cache/layers/" + fileName,
      dataType: 'json',
      async: true,
      cache: false,
      success: function(data) {
         // Initialises the layer with the data from the AJAX call
         gisportal.layers[id].init(data, options);

         // Track the indicator change
         gisportal.analytics.events.layerChange( layer )
      },
      error: function(request, errorType, exception) {
         var data = {
            type: 'layer cache',
            request: request,
            errorType: errorType,
            exception: exception,
            url: this.url
         };          
         gritterErrorHandler(data);
      }
   });
};

