/**
 * Represents a joint OpenLayers and Cesium layer allowing interaction with 
 * both layers through one API.
 * 
 * NOT IN USE AT PRESENT!
 * 
 * @param {Object} name
 */
opec.layer = function(name) {
     
   this.displayName = name;
   
   // The times for each of the layers stored
   this.times = [];
   // OpenLayers layers
   this.openLayers = [];
   // Cesium layers
   this.cesiumLayers = [];
   
   // Layer Name with /
   this.urlName = '';
   
   // Layer title
   this.displayTitle = '';
   this.title = '';
   
   // Layer abstract
   this.productAbstract = '';
   
   // Layer sensor
   this.displaySensorName = '';
   this.sensorName = '';
   
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
   
   // Add a new property to the OpenLayers layer object to tell the UI which <ul>
   // control ID in the layers panel to assign it to - defaults to operational layer
   this.controlID = 'opLayers';
   
   // Set this to true of the layer is a temporal layer with date-time based data
   this.temporal = false;
   
   // Set this to true if the layer has an elevation component
   this.elevation = false;
   
   // Elevation default
   this.elevationDefault = null;
   
   this.elevationUnits = null;
   
   // A list of styles available for the layer
   this.styles = [];
   
   // The EX_GeographicBoundingBox for the layer
   this.exBoundingBox = [];
   
   // The BoundingBox for the layer
   this.boundingBox = [];
   
   // Holds cached date-times as array of ISO8601 strings for each layer based on data availability
   this.DTCache = [];
   
   this.WFSDatesToIDs = {};
   
   // Holds cached elevation numbers as an array
   this.elevationCache = [];
   
   // Holds an array of the current date-times for the current date and layer as an array of ISO8601 strings
   this.currentDateTimes = [];
   
   // Currently selected date-time for the current date and layer as an ISO8601 string
   this.selectedDateTime = '';
   
   // Is the layer selected for display in the GUI or not
   this.selected = false;
};
