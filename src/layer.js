/* @param {string} firstDate - The first date for which data is available
 * @param {string} lastDate - The last date for which data is available
 * @param {string} serverName - The server name which serves the layer
 * @param {string} wmsURL - The URL for the WMS service
 * @param {string} wcsURL - The URL for the WCS service
 * @param {string} sensorName - The name of the sensor for this layer (unescaped)
 * @param {string} exBoundingBox - The geographic bounds for data in this layer
 */

/**
 * Represents a joint OpenLayers and Cesium layer allowing interaction with 
 * both layers through one API.
 * 
 * @constructor
 * 
 * @param {Object} microlayer - The microlayer to use as a basis for the layer.
 */
gisportal.layer = function(name, title, productAbstract, type, opts) {
   var layer = this;
      
   this.id = name;      
   this.origName = name.replace("/","-");
   this.name = name.replace("/","-");
   this.urlName = name;
   this.displayTitle = title.replace(/_/g, " ");
   this.title = title;  
   this.productAbstract = productAbstract;
   this.type = type;
   // These queues feel like a hack, refactor?
   this.metadataComplete = false;
   this.metadataQueue = [];

   this.defaults = {
      firstDate : null,
      lastDate : null,
      scalebarOpen : null,
      serverName : null,
      wfsURL : null,
      wmsURL : null,
      wcsURL : null,
      sensorNameDisplay : null,
      sensorName : null,
      exBoundingBox : null,
      
      providerTag : null,
      tags : null,
      options : null
   };
   
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
         else  {
            if (this.tags[tag] instanceof Object)  {
               this.tags[tag] = _.map(this.tags[tag], function(d) { return d.toLowerCase(); });
            } 
            else  {
               this.tags[tag] = this.tags[tag].toLowerCase();
            }
         }
      }
   }


 
   this.metadataComplete = false;
   this.metadataQueue = []; 
   this.times = []; // The times for each of the layers stored
   this.openlayers = {}; // OpenLayers layers
   this.cesiumLayers = {}; // Cesium layers
   
   // Maintains the order of layers 
   this.order = [];
   
   
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
   
   this.spinner = false;
   
   /**
    * Constructor for the layer.
    */
   this.init = function(layerData, options) {
      var self = this;
      console.log(layerData); 
      this.displayName = function() { return this.providerTag + ': ' + this.name; };
      
      // A list of styles available for the layer
      this.styles = null; // Can be 'Null'.
      this.style = null;
      
      // The BoundingBox for the layer
      this.boundingBox = layerData.BoundingBox; // Can be 'Null'.
      

      if(this.type == "opLayers") {
         this.getMetadata();
         this.getDimensions(layerData); // Get dimensions.
         // A list of styles available for the layer
         this.styles = layerData.Styles; // Can be 'Null'.
         
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
            layer.firstDate = gisportal.utils.displayDateString(datetimes[0]);
            layer.lastDate = gisportal.utils.displayDateString(datetimes[datetimes.length - 1]);
         
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
      //this.openlayers['anID'] = $.extend(this.openlayers['anID'], object);   
      if (this.openlayers['anID']) this.openlayers['anID'].mergeNewParams(object);
   };
   
   // Is the layer visible? Even if selected, it might not be 
   // visible without a selected date.
   this.isVisible = true;  
   this.setVisibility = function(visibility) {
      if (this.openlayers['anID']) this.openlayers['anID'].setVisibility(visibility);
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

   this.setStyle = function(style)  {
      var indicator = this;
      indicator.style = style;
      gisportal.indicatorsPanel.scalebarTab(indicator.id, true);
   }; 
   
   this.select = function() {
      // Just in case it tries to add a duplicate
      if (_.indexOf(gisportal.selectedLayers, this.id) > -1) return false;
      var layer = this;
      
      layer.selected = true;
      gisportal.selectedLayers.unshift(layer.id);
      // If the layer has date-time data, use special select routine
      // that checks for valid data on the current date to decide if to show data
      if(layer.temporal) {
         var currentDate = gisportal.timeline.getDate();
         layer.selectDateTimeLayer(currentDate);
         
         
         // Now display the layer on the timeline
         var startDate = $.datepicker.parseDate('dd-mm-yy', layer.firstDate);
         var endDate = $.datepicker.parseDate('dd-mm-yy', layer.lastDate);
         gisportal.timeline.addTimeBar(layer.name, layer.id, layer.name, startDate, endDate, layer.DTCache);   
        			
         // Update map date cache now a new temporal layer has been added
         gisportal.refreshDateCache();
         $('#viewDate').datepicker("option", "defaultDate", $.datepicker.parseDate('dd-mm-yy', layer.lastDate));

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
                  layer.openlayers[keys[i]].mergeNewParams({time: layer.selectedDateTime});
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
    * @method
    * 
    * @param {Object} layer - The OpenLayers.Layer object
    */
   this.getMetadata = function() {
      var layer = this;
		console.log(layer);
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
            layer.log = data.log == 'true' ? true : false;

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
               //layer.firstDate = gisportal.utils.displayDateString(datetimes[0].startdate);
               //layer.lastDate = gisportal.utils.displayDateString(datetimes[datetimes.length - 1].startdate);
            }
         }
      }
      
      
      if (layer.events)  { 
         // Show the img when we are loading data for the layer
         layer.events.register("loadstart", layer, function(e) {
            self.spinner = true;
            self.updateSpinner();
         });
         
         // Hide the img when we have finished loading data
         layer.events.register("loadend", layer, function(e) {
            self.spinner = false;
            self.updateSpinner();
         });
         
         if(layer.type != 'baseLayers') {   
            // Check the layer state when its visibility is changed
            layer.events.register("visibilitychanged", layer, function() {
            });
         }

      }
      
      return layer;
   };
   
   this.addOLLayer = function(layer, id) {      
      
      // Add the layer to the map
      map.addLayer(layer);
 
      // TODO: be able to deal with all layer types.
      if(this.type == 'opLayers') {
         //map.events.register("click", layer, getFeatureInfo);
         // Increase the count of OpLayers
         gisportal.numOpLayers++;
      } else if (this.type == 'refLayers') {
         gisportal.numRefLayers++;
      }

   };
   
   this.removeOLLayer = function(layer, id) {
      // Remove the layer from the map.
      map.removeLayer(map.getLayer(layer.id));
      
      // Remove layer from the order array.
      for(var i = 0, len = this.order.length; i < len; i++) {
         if(id === this.order[i]) {
            gisportal.utils.arrayRemove(this.order, i, i);
         }
      }

      // TODO: be able to deal with all layer types.
      if(this.type == 'opLayers') {
         //map.events.unregister("click", layer, getFeatureInfo);
         // Decrease the count of OpLayers
         gisportal.numOpLayers--;
      } else if(this.type == 'refLayers') {
         gisportal.numRefLayers--;
      }

   };
   
   //--------------------------------------------------------------------------
   
   this.updateSpinner = function() {
      /*if(this.spinner === false && $element.is(':visible')) {
         $element.hide();
      } else if(this.spinner !== false && $element.is(':hidden')) {
         $element.show();
      }*/
   };
     
   //--------------------------------------------------------------------------
   
   
   // Store new layer.
   gisportal.layers[this.id] = this;
};

gisportal.addNewLayer = function(id, options)  {
   var layer = gisportal.layers[id];
   var options = options || {};
   if (layer)  {
      gisportal.getLayerData(layer.serverName + '_' + layer.origName + '.json', layer,options);
   }
};

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

   /* loading icon here */
};

gisportal.removeLayer = function(layer) {
  var index = _.indexOf(gisportal.selectedLayers, layer.id); 
   if (index > -1) gisportal.selectedLayers.splice(index,1);
   var keys = Object.keys(layer.openlayers);
   for(var i = 0, len = keys.length; i < len; i++) {
      layer.removeOLLayer(layer.openlayers[keys[i]], keys[i]);
   }
};

gisportal.setLayerIndex = function(layer, index) {
   var noLayers = gisportal.selectedLayers.length;
   // Assume that we want them before the last layer, which is vector
   var startIndex = map.layers.length - noLayers;
   var name = layer.openlayers['anID'].name;
   map.setLayerIndex(layer.openlayers['anID'], index);

   var vector = map.getLayersByName('POI Layer')[0];
   map.setLayerIndex(vector, map.layers.length - 1);
};

/**
 * Function to filter layers with date-time dependencies to given date
 * Used as the onselect callback function for the jQuery UI current view date DatePicker control
 * 
 * @param {string} dateText - yyyy-mm-dd format date string to filter to
 * @param {Object} inst - The instance of the jQuery UI DatePicker view date control
 *
 */
gisportal.filterLayersByDate = function(date) {
   $.each(gisportal.selectedLayers, function(index, layer) {
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
         gisportal.layers[id].init(data, options);
         gisportal.configurePanel.refreshIndicators();
         
         
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
