// OpenLayers Map object and map layers handling

// Array of ALL available date-times for all date-time layers where data's available
// The array is populated once all the date-time layers have loaded
OpenLayers.Map.prototype.enabledDays = [];

// Add a new property to the OpenLayers layer object to tell the UI which <ul>
// control ID in the layers panel to assign it to - defaults to operational layer
OpenLayers.Layer.prototype.controlID = 'opLayers';

// Holds cached date-times as array of ISO8601 strings for each layer based on data availability
OpenLayers.Layer.prototype.DTCache = [];

// Layer function to create it's date-time cache based on a JSON cacheFile
// This is an asynchronous AJAX load of the JSON data
OpenLayers.Layer.prototype.createDateCache = function(cacheFile){
	var layer = this;
	$.getJSON(cacheFile, function(data) {
		layer.DTCache = data.date;
	});		
};

// Extend Map object allowing filtering of all map layers with date-time dependencies by ISO8601 date
OpenLayers.Map.prototype.filterLayersByDate = function(isoDate){
	var themap = this;
	var d = isoDate;
	$.each(themap.layers, function(index, value) {
		var layer = value;
		if(layer.DTCache.length>0) {
			layer.mergeNewParams({time: d});
			// DEBUG
			console.info('Filtering: ' + layer.name + ' to date ' + d);
		}
	});		
};