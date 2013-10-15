/* @param {string} firstDate - The first date for which data is available
 * @param {string} lastDate - The last date for which data is available
 * @param {string} serverName - The server name which serves the layer
 * @param {string} wmsURL - The URL for the WMS service
 * @param {string} wcsURL - The URL for the WCS service
 * @param {string} sensorName - The name of the sensor for this layer (unescaped)
 * @param {string} exBoundingBox - The geographic bounds for data in this layer
 */

/**
 * Creates an opec.MicroLayer Object (layers in the selector but not yet map 
 * layers)
 * 
 * @constructor
 * @param {string} name - The layer name (unescaped)
 * @param {string} title - The title of the layer
 * @param {string} productAbstract - The abstract information for the layer
 */
opec.MicroLayer = function(name, title, productAbstract, type, opts) {
      
   this.id = name;      
   this.origName = name.replace("/","-");
   this.name = name.replace("/","-");
   this.urlName = name;
   this.displayTitle = title.replace(/_/g, " ");
   this.title = title;  
   this.productAbstract = productAbstract;
   this.type = type;
   
   this.defaults = {};
   this.defaults.firstDate = null;
   this.defaults.lastDate = null;
   
   this.defaults.serverName = null;
   this.defaults.wfsURL = null;
   this.defaults.wmsURL = null;
   this.defaults.wcsURL = null;
   this.defaults.sensorNameDisplay = null;   
   this.defaults.sensorName = null;  
   this.defaults.exBoundingBox = null; 
   
   this.defaults.providerTag = null;
   this.defaults.tags = null;
   this.defaults.options = null;
   this.defaults.times = [];
   
   $.extend(true, this, this.defaults, opts);

   this.sensorName = this.sensorName !== null ? this.sensorName.replace(/\s+/g, "") : null;
   this.sensorName = this.sensorName !== null ? this.sensorName.replace(/[\.,]+/g, "") : null;
   
   if(this.type == 'refLayers') {
      this.urlName = this.urlName.replace('-', ':');
   }
   
   if (typeof this.tags !== 'undefined' && this.tags !== null) {
      for(var tag in this.tags) {
         if(tag === 'niceName') {
            this.name = this.tags.niceName;
            this.tags.niceName = null;
         } else if(tag === 'niceTitle') {
            this.displayTitle = this.tags.niceTitle;
            this.tags.niceTitle = null;  
         }
      }
   }
};

/**
 * Represents a joint OpenLayers and Cesium layer allowing interaction with 
 * both layers through one API.
 * 
 * @constructor
 * 
 * @param {Object} microlayer - The microlayer to use as a basis for the layer.
 */
opec.layer = function(microlayer, layerData) {
   
   // Check the microlayer we got is valid.
   if (typeof microlayer === 'undefined' || microlayer == 'null') {
      // Error: Could not get a layer object
      console.log("Error: Could not get a layer object");
      return null;
   }
   
   this.times = []; // The times for each of the layers stored
   this.openlayers = {}; // OpenLayers layers
   this.cesiumLayers = {}; // Cesium layers
   
   // Maintains the order of layers 
   this.order = [];
   
   // Element in the left hand panel.
   this.$layer = null;
   
   // Is the layer selected for display in the GUI or not
   this.selected = false;
   
   // Date Range
   this.firstDate = '';
   this.lastDate = '';
   
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
   
   this.WFSDatesToIDs = {};
   
   this.spinnerValue = 0;
   
   /**
    * Constructor for the layer.
    */
   this.init = function(microlayer, layerData) {
      var self = this;
      
      this.id = microlayer.id;
      this.providerTag = microlayer.providerTag;  
      this.name = microlayer.name;
      this.displayName = function() { return this.providerTag + ': ' + this.name; };
      this.origName = microlayer.origName; // Required for communication with the server.
      this.urlName = microlayer.urlName; // Layer Name with '/'
      
      // Layer title
      this.displayTitle = microlayer.displayTitle;
      this.title = microlayer.title;
      
      // Layer abstract
      this.productAbstract = microlayer.productAbstract;
      
      // Add a new property to the OpenLayers layer object to tell the UI which <ul>
      // control ID in the layers panel to assign it to
      this.controlID = microlayer.type;
      
      // Layer sensor
      this.displaySensorName = microlayer.sensorNameDisplay; // Can be 'Null'.
      this.sensorName = microlayer.sensorName; // Can be 'Null'.
      
      // URLs
      //this.url = microlayer.url;
      this.wfsURL = microlayer.wfsURL; // Can be 'Null'.
      this.wmsURL = microlayer.wmsURL; // Can be 'Null'.
      this.wcsURL = microlayer.wcsURL; // Can be 'Null'.
      
      // A list of styles available for the layer
      this.styles = null; // Can be 'Null'.
      this.style = null;
      
      // The EX_GeographicBoundingBox for the layer
      this.exBoundingBox = microlayer.exBoundingBox; // Can be 'Null'.
      
      // The BoundingBox for the layer
      this.boundingBox = layerData.BoundingBox; // Can be 'Null'.
      
      if(this.controlID == "opLayers") {
         // A list of styles available for the layer
         this.styles = layerData.Styles; // Can be 'Null'.
         
      } else if(this.controlID == "refLayers") {
         this.options = microlayer.options;
         this.style = new OpenLayers.StyleMap(microlayer.options.style);
         this.times = microlayer.times;
      }
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
            layer.firstDate = opec.utils.displayDateString(datetimes[0]);
            layer.lastDate = opec.utils.displayDateString(datetimes[datetimes.length - 1]);
         
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
   
   this.mergeNewParams = function(object) {
      var self = this;
      
      var keys = Object.keys(this.openlayers);
      for(var i = 0, len = keys.length; i < len; i++) {
         self.openlayers[keys[i]].mergeNewParams(object);
      }  
   };
   
   // Is the layer visible? Even if selected, it might not be 
   // visible without a selected date.
   this.isVisible = false;  
   this.setVisibility = function(visibility) {
      var self = this;
      
      // Set the visibility of all layers
      var keys = Object.keys(this.openlayers);
      for(var i = 0, len = keys.length; i < len; i++) {
         self.openlayers[keys[i]].setVisibility(visibility);
      }
      
      this.isVisible = visibility;
   };
   
   // Layer opacity for OL or Cesium layers that don't have one.
   // OL or Cesium layers may have individual values set.
   this.opacity = null;
   this.setOpacity = function(opacityValue) {
      var self = this;
      
      // Set the opacity for all layers
      var keys = Object.keys(this.openlayers);
      for(var i = 0, len = keys.length; i < len; i++) {
         self.openlayers[keys[i]].setOpacity(opacityValue);
      }
      
      this.opacity = opacityValue;
   };
   
   this.select = function() {
      var layer = this;
      
      layer.selected = true;
      
      // If the layer has date-time data, use special select routine
      // that checks for valid data on the current date to decide if to show data
      if(layer.temporal) {
         layer.selectDateTimeLayer($('#viewDate').datepicker('getDate'));
         
         // Now display the layer on the timeline
         var startDate = $.datepicker.parseDate('dd-mm-yy', layer.firstDate);
         var endDate = $.datepicker.parseDate('dd-mm-yy', layer.lastDate);
         opec.timeline.addTimeBar(layer.name, layer.displayTitle, startDate, endDate, layer.DTCache);   
                  
         // Update map date cache now a new temporal layer has been added
         opec.refreshDateCache();
         $('#viewDate').datepicker("option", "defaultDate", $.datepicker.parseDate('dd-mm-yy', layer.lastDate));
      } else {
         layer.setVisibility(true);
         layer.checkLayerState();
      }    
   };
   
   this.unselect = function() {
      var layer = this;
      
      layer.selected = false;
      layer.setVisibility(false);
      layer.checkLayerState();
      
      if(layer.temporal) {
         // Remove the layer display on the timeline
         opec.timeline.removeTimeBarByName(layer.name); 
         
         // Update map date cache now a new temporal layer has been removed
         opec.refreshDateCache();
      }     
   };
   
   //this.setLayerIndex = function(id, index) {      
      //var layer = this.openlayers[id];
      //layer.setLayerIndex(index);
   //};
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
      
      var filtArray = $.grep(layer.DTCache, function(dt, i) {
         var datePart = dt.substring(0, 10);
         return (datePart == date);
      });
      
      if (filtArray.length > 0) {
         return filtArray;
      } else {
         return null;
      }
   };
   
   this.closestDate = function(date) {
      var layer = this;
      
      
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
         var uidate = opec.utils.ISODateString(date);
         var matchedDate = layer.matchDate(uidate);
         if(matchedDate) {
            layer.currentDateTimes = matchedDate;
            // Choose 1st date in the matched date-times for the moment - will expand functionality later
            layer.selectedDateTime = matchedDate[0];            
            
            //----------------------- TODO: Temp code -------------------------
            var keys = Object.keys(layer.openlayers);
            for(var i = 0, len = keys.length; i < len; i++) {
               if(layer.controlID == 'opLayers') {
                  layer.openlayers[keys[i]].mergeNewParams({time: layer.selectedDateTime});
               } else {
                  if($.isFunction(layer.openlayers[keys[i]].removeAllFeatures)) {
                     layer.openlayers[keys[i]].removeAllFeatures();
                     opec.getFeature(layer, layer.openlayers[keys[i]], layer.selectedDateTime);   
                  }
               }
            } 
            //-----------------------------------------------------------------       
            
            layer.setVisibility(layer.selected);
            console.info('Layer ' + layer.name + ' data available for date-time ' + layer.selectedDateTime + '. Layer selection and display: ' + layer.selected);
         }
         else {
            layer.currentDateTimes = [];
            layer.selectedDateTime = '';
            layer.setVisibility(false);
            console.info('Layer ' + layer.name + ' no data available for date-time ' + uidate + '. Not displaying layer.');
         }
      }
      layer.checkLayerState();
   };
   
   /**
    * Function which gets layers metadata asynchronously and sets up the 
    * map scale min and max parameters.
    * 
    * @method
    * 
    * @param {Object} layer - The OpenLayers.Layer object
    */
   this.getMetadata = function() {
      var layer = this;
      $.ajax({
         type: 'GET',
         url: OpenLayers.ProxyHost + layer.wmsURL + encodeURIComponent('item=layerDetails&layerName=' + layer.urlName + '&request=GetMetadata'),
         dataType: 'json',
         asyc: true,
         success: function(data) {
            layer.origMinScaleVal = parseFloat(data.scaleRange[0]);
            layer.origMaxScaleVal = parseFloat(data.scaleRange[1]);
            layer.minScaleVal = layer.origMinScaleVal;
            layer.maxScaleVal = layer.origMaxScaleVal;
            
            layer.log = data.log == 'true' ? true : false;
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
   
   this.createOLLayer = function() {
      var self = this,
         layer = null;
      
      // Create WMS layer.
      if(this.controlID == 'opLayers') {    
         
         layer = new OpenLayers.Layer.WMS (
            this.displayName(),
            this.wmsURL,
            { layers: this.urlName, transparent: true}, 
            { opacity: 1, wrapDateLine: true, transitionEffect: 'resize' }
         );
         layer.controlID = 'opLayers';
         
      } else if(this.controlID == 'refLayers') {
         
         if(typeof this.options.passthrough !== 'undefined' && this.options.passthrough) {               
            // GML or KML
            layer = new OpenLayers.Layer.Vector(self.name, {
               projection: opec.lonlat,
               strategies: [new OpenLayers.Strategy.Fixed()],    
               protocol: new OpenLayers.Protocol.HTTP({
                  url: self.wfsURL,
                  //format: new OpenLayers.Format.GML()
                  format: this.options.format == 'GML2' ? new OpenLayers.Format.GML() : new OpenLayers.Format.KML({ extractStyles: true, extractAttributes: true}) 
               }),                         
               styleMap: self.style
            });
            layer.controlID = 'refLayers';
               
         } else {

            // Vector      
            layer = new OpenLayers.Layer.Vector(this.name, {
               projection: opec.lonlat,
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
            layer.controlID = 'refLayers';
            
            var selector = opec.mapControls.selector;
            var layers = selector.layers;
   
            if (typeof layers === 'undefined' || layers === null)
               layers = [];
   
            layers.push(layer);     
            opec.mapControls.selector.setLayer(layers);
            
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
               //layer.firstDate = opec.utils.displayDateString(datetimes[0].startdate);
               //layer.lastDate = opec.utils.displayDateString(datetimes[datetimes.length - 1].startdate);
            }
         }
      }
      
      layer.setVisibility(false);
      
      // Show the img when we are loading data for the layer
      layer.events.register("loadstart", layer, function(e) {
         self.spinnerValue += 1;
         self.updateSpinner();
      });
      
      // Hide the img when we have finished loading data
      layer.events.register("loadend", layer, function(e) {
         self.spinnerValue -= 1;
         self.updateSpinner();
      });
      
      if(self.controlID != 'baseLayers') {   
         // Check the layer state when its visibility is changed
         layer.events.register("visibilitychanged", layer, function() {
            self.checkLayerState();
         });
      }
      
      return layer;
   };
   
   this.addOLLayer = function(layer, id) {      
      this.order.push(id);
      
      // Add the layer to the map
      map.addLayer(layer);
      //map.setLayerIndex(layer, opec.numBaseLayers + opec.numOpLayers);
      
      // TODO: be able to deal with all layer types.
      if(this.controlID == 'opLayers') {
         //map.events.register("click", layer, getFeatureInfo);
         // Increase the count of OpLayers
         opec.numOpLayers++;
      } else if (this.controlID == 'refLayers') {
         opec.numRefLayers++;
      }

   };
   
   this.removeOLLayer = function(layer, id) {
      // Remove the layer from the map.
      map.removeLayer(layer);
      
      // Remove layer from the order array.
      for(var i = 0, len = this.order.length; i < len; i++) {
         if(id === this.order[i]) {
            opec.utils.arrayRemove(this.order, i, i);
         }
      }

      // TODO: be able to deal with all layer types.
      if(this.controlID == 'opLayers') {
         //map.events.unregister("click", layer, getFeatureInfo);
         // Decrease the count of OpLayers
         opec.numOpLayers--;
      } else if(this.controlID == 'refLayers') {
         opec.numRefLayers--;
      }

   };
   
   //--------------------------------------------------------------------------
   
   this.updateSpinner = function() {
      if(this.$layer === null)
         return;
         
      var $element = this.$layer.find('img[src="img/ajax-loader.gif"]');
      if(this.spinnerValue === 0 && $element.is(':visible')) {
         $element.hide();
      } else if(this.spinnerValue !== 0 && $element.is(':hidden')) {
         $element.show();
      }
   };
   
   /**
    * Checks to see if a layer is not visible and selected.
    * 
    * @method
    */
   this.checkLayerState = function() {
      if(!this.isVisible && this.selected)
         this.$layer.find('img[src="img/exclamation_small.png"]').show();
      else
         this.$layer.find('img[src="img/exclamation_small.png"]').hide();
   };
   
   //--------------------------------------------------------------------------
   
   this.init(microlayer, layerData);
   if(this.controlID == 'opLayers') {
      this.getDimensions(layerData); // Get dimensions.
      this.getMetadata();
   }
   
   //---------------------------------- Temp ----------------------------------
   var olLayer = this.createOLLayer(); // Create OL layer.
   this.openlayers['anID'] = olLayer;
   //this.addOLLayer(olLayer);
   // Create Cesium layer.
   //--------------------------------------------------------------------------
   
   // Store new layer.
   opec.layers[this.id] = this;
   opec.nonSelectedLayers[this.id] = this;
   
};

opec.addLayer = function(layer) {   
   delete opec.nonSelectedLayers[layer.id];
   opec.selectedLayers[layer.id] = layer;
   
   var keys = Object.keys(layer.openlayers);
   for(var i = 0, len = keys.length; i < len; i++) {
      layer.addOLLayer(layer.openlayers[keys[i]], keys[i]);
   }
   
   // Layer visibility may have been set to true.
   layer.setVisibility(false);
  
   if(layer.controlID == 'opLayers') {
      // Add the layer to the panel
      opec.leftPanel.addLayerToGroup(layer, opec.leftPanel.getFirstGroupFromPanel($('#opec-lPanel-operational')));
   } else if (layer.controlID == 'refLayers') {
      opec.leftPanel.addLayerToGroup(layer, opec.leftPanel.getFirstGroupFromPanel($('#opec-lPanel-reference')));
   }
   
   
   // TODO: Too tightly coupled
   opec.leftPanel.open();
   layer.select();
   $('input[name="' + layer.id + '"]').prop('checked', true);
   
   // Hide the ajax-loader and the exclamation mark initially
   layer.$layer.find('img[src="img/ajax-loader.gif"]').hide();
   layer.$layer.find('img[src="img/exclamation_small.png"]').hide();  
};

opec.removeLayer = function(layer) {
   //var layer = opec.getLayerByID(id);
   
   // Remove the layer from the panel
   opec.leftPanel.removeLayerFromGroup(layer);
   
   delete opec.selectedLayers[layer.id];
   opec.nonSelectedLayers[layer.id] = layer;
   
   var keys = Object.keys(layer.openlayers);
   for(var i = 0, len = keys.length; i < len; i++) {
      layer.removeOLLayer(layer.openlayers[keys[i]], keys[i]);
   }
};

opec.setLayerIndex = function(layer, index) {
   var keys = Object.keys(layer.openlayers);
   for(var i = 0, len = keys.length; i < len; i++) {
      map.setLayerIndex(layer.openlayers[keys[i]], index);
   }
};

/**
 * Function to filter layers with date-time dependencies to given date
 * Used as the onselect callback function for the jQuery UI current view date DatePicker control
 * 
 * @param {string} dateText - yyyy-mm-dd format date string to filter to
 * @param {Object} inst - The instance of the jQuery UI DatePicker view date control
 *
 */
opec.filterLayersByDate = function(date) {
   $.each(opec.selectedLayers, function(index, layer) {
      // Only filter date-dependent layers
      if (layer.temporal) {
         layer.selectDateTimeLayer(date);
      }
   });      
};

/**
 * Map function which gets data layers asynchronously and creates operational layers for each one
 * 
 * @param {string} fileName - The file name for the specific JSON layer cache
 * @param {string} microLayer - The microLayer for the layer to be downloaded
 */
opec.getLayerData = function(fileName, microlayer) {   
   $.ajax({
      type: 'GET',
      url: "./cache/layers/" + fileName,
      dataType: 'json',
      asyc: true,
      cache: false,
      success: function(data) {
         // Convert the microlayer. 
         // COMMENT: might change the way this works in future.
         var layer = new opec.layer(microlayer, data);        
         
         console.log("Adding layer..."); // DEBUG
         opec.addLayer(layer);           
         console.log("Added Layer"); // DEBUG
         
         // If the layer was loaded as part of a state load set some of the 
         // values of the layer to the cached versions.
         opec.checkIfLayerFromState(layer);
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