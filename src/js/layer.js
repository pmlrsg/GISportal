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

      provider: {},
      offsetVectors: null,
      serviceType: null,
   };

   $.extend(true, this, defaults, options);


   // id used to identify the layer internally 
   this.id = options.name.replace(/[^a-zA-Z0-9]/g, '_' ).replace(/_+/g, '_' ) + "__" + options.providerTag;


   // The autoScale options
   this.autoScale = options.autoScale;
   // This is used to keep track of the config autoScale setting so that the addLayers form isn't effected by any user changes 
   this.originalAutoScale = options.autoScale;

   this.defaultStyle = options.defaultStyle;

   this.colorbands = options.colorbands;
   this.defaultColorbands = options.colorbands;

   this.aboveMaxColor = options.aboveMaxColor;
   this.defaultAboveMaxColor = options.aboveMaxColor;
   this.belowMinColor = options.belowMinColor;
   this.defaultBelowMinColor = options.belowMinColor;

   // The grouped name of the indicator (eg Oxygen)
   this.name = options.tags.niceName || options.name.replace("/","-");

   // {indicator name} - {indicator region} - { indicator provider }
   this.descriptiveName = this.name;
   if (this.tags.region) this.descriptiveName += ' - ' + this.tags.region;
   if (this.providerTag) this.descriptiveName += ' - ' + this.providerTag.replace(/_/g, " ");

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

   
   //this.moreInfo = opts.moreInfo;
   // Used for sensor data from SOS, not tested as we have no sensor data
   this.sensorName = this.sensorName !== null ? this.sensorName.replace(/\s+/g, "") : null;
   this.sensorName = this.sensorName !== null ? this.sensorName.replace(/[\.,]+/g, "") : null;
   
   if(this.type == 'refLayers') {
      this.urlName = this.urlName.replace('-', ':');
   }
   

   this.tags.providerTag = this.providerTag;

   this.provider = this.providerTag;

   // I do not like the metadataQueue but it is used to
   // prevent race conditions of AJAX calls such as
   // for the scalebar.
   // Essentially, if metadata is complete then the scalebar
   // will use the data otherwise it will put a callback into
   // the queue.
   this.metadataComplete = false;

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
   this.defaultMaxScaleVal = options.defaultMaxScaleVal;
   this.minScaleVal = null;
   this.defaultMinScaleVal = options.defaultMinScaleVal;
   var log = gisportal.config.defaultLog;
   if(options.log === undefined){
      this.defaultLog = log;
      this.log = log;
   }else{
      this.defaultLog = options.log;
      this.log = options.log;
   }
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
   this.init = function(layerData, options, prev_style) {
      var self = this;
      this.displayName = function() { return this.providerTag + ': ' + this.name; };
      
      // A list of styles available for the layer
      this.styles = null;

      if(this.type == "opLayers") {
         this.getMetadata();
         this.getDimensions(layerData); // Get dimensions.
         if(!this.temporal) $('li[data-id="' + this.id + '"] .date-range-detail').hide();
         // A list of styles available for the layer
         this.styles = _.sortBy(layerData.Styles, function(style){return style.Name;}); // Can be 'Null'.
         var default_style = null;
         if(this.styles){
            $.each(this.styles, function(index, value){
               if(value.Name == gisportal.config.defaultStyle){
                  default_style = prev_style || value.Name;
               }
            });
            this.style = default_style || this.styles[0].Name;
         }       
      } else if(this.type == "refLayers") {
        //console.log("gett wfs metadat if block")
         // intended for WFS type layers that are not time related
      }
      
      var olLayer = this.createOLLayer(); // Create OL layer.
      
      this.openlayers.anID = olLayer;

      if (options.show !== false)  { 
         gisportal.checkIfLayerFromState(layer);
         gisportal.addLayer(layer, options);    
      }

      this.select();

      if(prev_style){
        this.mergeNewParams({STYLES:prev_style});
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

   this.setScalebarTimeout = function(){
      var layer = this;
      if(layer.resetting){
         return false;
      }
      layer.clearScalebarTimeout();
      var apply_changes = $('.js-apply-changes[data-id="' + layer.id + '"]')
      apply_changes.toggleClass('hidden', false).removeClass('progress-btn');
      // THIS IS IMPORTANT, it makes sure the animation is reset
      setTimeout(function(){
        apply_changes.offsetWidth = apply_changes.offsetWidth;
        apply_changes.addClass('progress-btn').off('click').on('click', function(){
           clearTimeout(layer.scalebarTimeout);
           apply_changes.toggleClass('hidden', true).toggleClass('progress-btn', false);
           gisportal.scalebars.autoScale(layer.id);
           gisportal.scalebars.updateScalebar(layer.id);
           gisportal.events.trigger('scalebar.apply-changes', layer.id);
        });
        layer.scalebarTimeout = setTimeout(function(){
           apply_changes.toggleClass('hidden', true).toggleClass('progress-btn', false);
           gisportal.scalebars.autoScale(layer.id);
           gisportal.scalebars.updateScalebar(layer.id);
        }, 10000);
      }, 200);
   };

   this.clearScalebarTimeout = function(){
      $('.js-apply-changes[data-id="' + layer.id + '"]').toggleClass('hidden', true).toggleClass('progress-btn', false);
      if(layer.scalebarTimeout){
         clearTimeout(layer.scalebarTimeout);
      }
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
      if (this.openlayers.anID) {
         var params = this.openlayers.anID.getSource().getParams();
         for(var prop in object) {
            params[prop] = object[prop];
         }
         this.openlayers.anID.getSource().updateParams(params);
         gisportal.scalebars.autoScale( this.id );
      }
   };
   
   /**
    * By default the layer is visible, to hide it
    * just call layer.setVisibility(false);
    *
    * @param {boolean} visibility - True if visible, false if hidden
    */
   this.isVisible = true;  
   this.setVisibility = function(visibility) {
      if (this.openlayers.anID) this.openlayers.anID.setVisible(visibility);
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

      } else {
         layer.setVisibility(true);
      }
      if (!(gisportal.current_view && gisportal.current_view.noPan) && (typeof(layer.preventAutoZoom) == 'undefined' || !layer.preventAutoZoom)) {
         gisportal.zoomOverall();   
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
      else  if (nearestDate !== null) {
         //console.log("Using nearest date: " + nearestDate);
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
            //console.info('Layer ' + layer.name + ' data available for date-time ' + layer.selectedDateTime + '. Layer selection and display: ' + layer.selected);
         }
         else {
            layer.currentDateTimes = [];
            layer.selectedDateTime = '';
            layer.setVisibility(false);
            //console.info('Layer ' + layer.name + ' no data available for date-time ' + uidate + '. Not displaying layer.');
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
         url: gisportal.ProxyHost + encodeURIComponent(layer.wmsURL + 'item=layerDetails&version=1.1.0&service=wms&layerName=' + layer.urlName + '&coverage=' + layer.id + '&request=GetMetadata'),
         //dataType: 'json',
         async: true,
         success: function(data) {
            try{
               json_data = JSON.parse(data);
               if (layer.defaultMinScaleVal === null || layer.defaultMinScaleVal === undefined){
                  layer.defaultMinScaleVal = parseFloat(json_data.scaleRange[0]);
               }
               if (layer.defaultMaxScaleVal === null || layer.defaultMaxScaleVal === undefined){
                 layer.defaultMaxScaleVal = parseFloat(json_data.scaleRange[1]);
               }
               if (layer.minScaleVal === null || layer.minScaleVal === undefined || isNaN(layer.minScaleVal)){
                  layer.minScaleVal = layer.defaultMinScaleVal;
               }
               if (layer.maxScaleVal === null || layer.maxScaleVal === undefined || isNaN(layer.maxScaleVal)){
                  layer.maxScaleVal = layer.defaultMaxScaleVal;
               }
               layer.units = json_data.units;
               if(layer.log === undefined){
                  layer.log = json_data.logScaling === true ? true : false;
               }
               // Makes sure that log is only true if it is valid 
               if(layer.minScaleVal <= 0){
                  layer.log = false;
               }
               layer.mergeNewParams({
                  colorscalerange: layer.minScaleVal + ',' + layer.maxScaleVal,
                  logscale: layer.log
               });
            }catch(e){
               //var layer.scaling = 'raw';
            }
            
            gisportal.layers[layer.id].metadataComplete = true;
            layer.metadataComplete = true;
            gisportal.events.trigger('layer.metadataLoaded', layer.id);

         },
         error: function(request, errorType, exception) {
            layer.defaultMinScaleVal = 0;
            layer.defaultMaxScaleVal = 1;
            layer.minScaleVal = layer.defaultMinScaleVal;
            layer.maxScaleVal = layer.defaultMaxScaleVal;
            layer.log = false;
            
            $.notify("Sorry\nThere was an error getting the metadata, the scale values are likely incorrect.", "error");
         }
      });
   };

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

         var style = this.style;
         if(this.defaultStyle){
            for(var i in this.styles){
               var this_style = this.styles[i];
               if(this_style.Name == this.defaultStyle){
                  this.style = style = this_style.Name;
               }
            }
         }
         layer = new ol.layer.Tile({
            title: this.displayName(),
            id: this.id,
            type: 'OLLayer',
            source: new ol.source.TileWMS({
               url:  this.wmsURL,
               crossOrigin: null,
               params: {
                  LAYERS: this.urlName,
                  TRANSPARENT: true,
                  wrapDateLine: true,
                  SRS: gisportal.projection,
                  VERSION: '1.1.1',
                  STYLES: style,
                  NUMCOLORBANDS: this.colorbands,
                  ABOVEMAXCOLOR: this.aboveMaxColor,
                  BELOWMINCOLOR: this.belowMinColor,
               },
               // this function is needed as at the time of writing this there is no 'loadstart' or 'loadend' events 
               // that existed in ol2. It is planned so this function could be replaced in time

               // TODO - work out how to handle tiles that don't finish loading before the map has been moved
               tileLoadFunction: function(tile, src) {
                  gisportal.loading.increment();

                  var tileElement = tile.getImage();
                  tileElement.onload = function() {
                     gisportal.loading.decrement();
                  };
                  tileElement.src = src;
               }
            })
         });

      } else if(this.type == 'refLayers') {
         // intended for WFS type layers that are not time related
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
      
      gisportal.removeLayersByProperty('id', id);
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
      map.removeLayer(layer);
      
      if(this.type == 'opLayers') {
         gisportal.numOpLayers--;
      } else if(this.type == 'refLayers') {
         gisportal.numRefLayers--;
      }

   };
   
   
   // Store new layer.
   //gisportal.layers[this.id] = this;
};

/** Takes a string parameter 'autoScale'
 *  Determines if the value should be the default
 *  or the value itself converted to a boolean
 */
gisportal.getAutoScaleFromString = function(autoScale){
   if(typeof(autoScale) == "undefined" || autoScale == "default"){
      return gisportal.config.autoScale;
   }else if(autoScale == "true" || autoScale == "True"){
      return true;
   }else{
      return false;
   }
};

gisportal.removeLayersByProperty = function(property, value){
  var array = map.getLayers().getArray();
  var layers_list = [];
  var layer;
  for(layer in array){
    var this_layer = array[layer];
    var properties = this_layer.getProperties();
    if(properties && properties[property] && properties[property] == value){
      layers_list.push(this_layer);
    }
  }
  for(layer in layers_list){
    map.removeLayer(layers_list[layer]);
  }
};

/**
 * Setups up the layer, calls addOLLayer and updates scalebar
 * and visibility. 
 * 
 * @param {object} layer - The gisportal.layer object
 * @param {object} options - Extend the layer with options
 */
gisportal.addLayer = function(layer, options) {
   options = options || {};   
  
   if (layer)  {
      layer.addOLLayer(layer.openlayers.anID, layer.id);
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
   gisportal.selectionTools.setVectorLayerToTop();
};

/**
 * Removes a layer when passed the entire layer object
 * This function should be used because it removes
 * from selectedLayers as well as the map.
 * 
 * @param {object} layer - A gisportal.layer object
 */
gisportal.removeLayer = function(layer) {
  //console.log("removing Layer");
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
   // var noLayers = gisportal.selectedLayers.length;
   // var startIndex = map.layers.length - noLayers;
   // var name = layer.openlayers.anID.name;
   // map.setLayerIndex(layer.openlayers.anID, index);

   // var vector = map.getLayersByName('POI Layer')[0];
   // map.setLayerIndex(vector, map.layers.length - 1);
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
gisportal.getLayerData = function(fileName, layer, options, style) {  
   options = options || {};
   var id = layer.id; 
   if (layer.serviceType=="WFS"){

      layer.init(options,layer);
   }else {
      $.ajax({
         type: 'GET',
         url: gisportal.middlewarePath + "/cache/layers/" + fileName,
         dataType: 'json',
         async: true,
         cache: false,
         success: function(data) {
            // Initialises the layer with the data from the AJAX call
            if(layer){
               layer.init(data, options, style);
            }
         },
         error: function() {
            $.notify("Sorry\nThere was a problem loading this layer, please try again", "error");
         }
      });
      var bbox = layer.exBoundingBox.WestBoundLongitude + "," +
            layer.exBoundingBox.SouthBoundLatitude + "," +
            layer.exBoundingBox.EastBoundLongitude + "," +
            layer.exBoundingBox.NorthBoundLatitude;
      var time = "";
      try{
         time = '&time=' + new Date(layer.selectedDateTime).toISOString();
      }
      catch(e){}
      $.ajax({
         url: gisportal.ProxyHost + encodeURIComponent(layer.wmsURL + 'item=minmax&layers=' + layer.urlName + time + '&bbox=' + bbox + '&srs=' + gisportal.projection + '&width=50&height=50&request=GetMetadata'),
         dataType: 'json',
         success: function( data ) {
            // If there is a min & max value returned the label and input are both shown.
            if(typeof(data.min) == "number" && typeof(data.max) == "number"){
               layer.autoMinScaleVal = data.min;
               layer.autoMaxScaleVal = data.max;
            }
         }
      });
      $.ajax({
         method: 'POST',
         url: gisportal.middlewarePath + "/settings/get_markdown_metadata",
         data: {tags: layer.tags, order: gisportal.config.markdownPriorities},
         success: function( data ) {
            if(data){
               layer.metadataHTML = data;
               $('.more-info-row[data-id="' + layer.id + '"]').toggleClass('hidden', false);
            }
         }
      });
   }
};

