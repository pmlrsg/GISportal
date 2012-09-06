/* OPEC namespace classes */
var OPEC = {};

/* Custom OpenLayers LayerData object */
OPEC.LayerData = function(name_id) {
   
   // Flag to say whether this is a full  layer object or just a  micro layer
   this.microLayer = true;

   // The layer name - must match the name of the OpenLayers.Layer object
   this.name = name_id;
   // The title of the layer (more descriptive)
   this.title = undefined;
   // The abstract information for the laye
   this.abstract = undefined;
   // Sensor name (used as name for accordion groupings of layers)
   this.sensorName = '';
   // The EX_GeographicBoundingBox for the layer
   this.exBoundingBox = [];
   // The BoundingBox for the layer
   this.boundingbox = [];
   
   // Date Range
   this.firstDate = undefined;
   this.lastDate = undefined;

   // Add a new property to the OpenLayers layer object to tell the UI which <ul>
   // control ID in the layers panel to assign it to - defaults to operational layer
   this.controlID = 'opLayers';

   // Set this to true of the layer is a temporal layer with date-time based data
   this.temporal = false;

   // A list of styles available for the layer
   this.styles = [];

   // Holds cached date-times as array of ISO8601 strings for each layer based on data availability
   this.DTCache = [];

   // Holds an array of the current date-times for the current date and layer as an array of ISO8601 strings
   this.currentDateTimes = [];

   // Currently selected date-time for the current date and layer as an ISO8601 string
   this.selectedDateTime = undefined;

   // Is the layer selected for display in the GUI or not
   this.selected = false;

   // Function which looks for a date within a layer.
   // The date passed is in the format yyyy-mm-dd or is an empty string
   // Returns the array of date-times if there's a match or null if not.
   this.matchDate = function(thedate) {
      var lData = this;
      var filtArray = $.grep(lData.DTCache, function(dt, i) {
         var datePart = dt.substring(0, 10);
         return (datePart == thedate);
      });
      if (filtArray.length > 0) {
         return filtArray;
      } else {
         return null;
      }
   }
}
// Add the OPEC.LayerData object to all OpenLayers.Layer objects
OpenLayers.Layer.prototype.layerData = null;

/* Custom OpenLayers MapData object */
OPEC.MapData = function(map_id) {
   
   // This is the common unique map identified
   this.id = map_id;
   
   // Array of ALL available date-times for all date-time layers where data's available
   // The array is populated once all the date-time layers have loaded
   this.enabledDays = [];

   // Stores the data provided by the master cache file on the server. This includes
   // layer names, titles, abstracts, etc.
   this.getCapabilities = [];

   // Used as offsets when sorting layers in groups
   this.numBaseLayers = 0;
   this.numRefLayers = 0;
   this.numOpLayers = 0;

   // Stores messages to be used by the gritter
   this.helperMessages = [];
   
   // Temporary version of microLayer and layer storage.
   this.microLayers = [];
   this.layerStore = [];

   // The unique id of the last tutorial message
   this.tutUID = undefined;

   // Store the type of the last drawn ROI within the map object ('', 'point', 'box', 'circle' or 'poly')
   this.ROI_Type = undefined;

   // Select the given temporal layer on the Map based on JavaScript date input
   this.selectDateTimeLayer = function(lyr, thedate) {
      var layer = lyr;
      var lData = lyr.layerData;
      if (thedate) {
         var uidate = ISODateString(thedate);
         var mDate = lData.matchDate(uidate);
         if (mDate) {
            lData.currentDateTimes = mDate;
            // Choose 1st date in the matched date-times for the moment - will expand functionality later
            lData.selectedDateTime = mDate[0];
            layer.mergeNewParams({
               time : lData.selectedDateTime
            });
            layer.setVisibility(lData.selected);
            // DEBUG
            console.info('Layer ' + lData.name + ' data available for date-time ' + lData.selectedDateTime + '. Layer selection and display: ' + lData.selected);
         } else {
            lData.currentDateTimes = [];
            lData.selectedDateTime = '';
            layer.setVisibility(false);
            // DEBUG
            console.info('Layer ' + lData.name + ' no data available for date-time ' + uidate + '. Not displaying layer.');
         }
      }
      checkLayerState(layer);
   }

   // Map function to filter of layers with date-time dependencies to an yyyy-mm-dd format date
   this.filterLayersByDate = function(dateText, inst) {
      var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
      $.each(map.layers, function(index, value) {
         var layer = value;
         var lData = layer.layerData;
         // Only filter date-dependent layers
         if (lData.temporal) {
            map.mapData.selectDateTimeLayer(value, thedate);
         }
      });
   }

   // Map function to re-generate the global date cache for selected layers
   this.refreshDateCache = function() {
      var mData = this;
      mData.enabledDays = [];
      $.each(map.layers, function(index, value) {
         var layer = value;
         var lData = layer.layerData;
         if (lData.selected && lData.temporal) {
            mData.enabledDays = mData.enabledDays.concat(lData.DTCache);
         }
      });
      mData.enabledDays = mData.enabledDays.deDupe();
      // Re-filter the layers by date now the date cache has changed
      // DEBUG
      console.info('Global date cache now has ' + mData.enabledDays.length + ' members.');
   }
   
   // Map function which returns availability (boolean) of data for the given JavaScript date across all layers
   // using the map object's global date cache. Used in conjunction with the jQuery UI datepicker control
   this.allowedDays = function(thedate) {
      var mData = this;
      var uidate = ISODateString(thedate);
      // Filter the datetime array to see if it matches the date using jQuery grep utility
      var filtArray = $.grep(mData.enabledDays, function(dt, i) {
         var datePart = dt.substring(0, 10);
         return (datePart == uidate);
      });
      // If the filtered array has members it has matched this day one or more times
      if (filtArray.length > 0) {
         return [true];
      } else {
         return [false];
      }
   }
   
   // Map function to get the master cache file from the server and stores it in the map object
   this.createMasterCache = function() {
      $.ajax({
         type : 'GET',
         url : "./cache/mastercache.json",
         dataType : 'json',
         asyc : true,
         success : layerDependent,
         error : function(request, errorType, exception) {
            gritterErrorHandler(null, 'master cache', request, errorType, exception);
         }
      });
   }

   this.getLayerData = function(name, sensorName, url) {
      $.ajax({
         type : 'GET',
         url : "./cache/layers/" + name,
         dataType : 'json',
         asyc : true,
         success : function(data) {
            createOpLayer(data, sensorName, url);
            console.log("Adding layer...");
            addOpLayer(data.Name.replace("/","-"));
            console.log("Added Layer");
         },
         error : function(request, errorType, exception) {
         }
      });
   }
}
// Add the OPEC.MapData object to all OpenLayers.Map objects
OpenLayers.Map.prototype.mapData = null;