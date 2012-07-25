// OpenLayers Map object and map layers handling

// Array of ALL available date-times for all date-time layers where data's available
// The array is populated once all the date-time layers have loaded
OpenLayers.Map.prototype.enabledDays = [];

// Add a new property to the OpenLayers layer object to tell the UI which <ul>
// control ID in the layers panel to assign it to - defaults to operational layer
OpenLayers.Layer.prototype.controlID = 'opLayers';

// Set this to true of the layer is a temporal layer with date-time based data
OpenLayers.Layer.prototype.temporal = false;

// Holds cached date-times as array of ISO8601 strings for each layer based on data availability
OpenLayers.Layer.prototype.DTCache = [];

// Holds an array of the current date-times for the current date and layer as an array of ISO8601 strings
OpenLayers.Layer.prototype.currentDateTimes = [];

// Currently selected date-time for the current date and layer as an ISO8601 string
OpenLayers.Layer.prototype.selectedDateTime = '';

// Is the layer selected for display in the GUI or not
OpenLayers.Layer.prototype.selected = false;

// Layer function to create it's date-time cache based on a JSON cacheFile
// This is an asynchronous AJAX load of the JSON data
OpenLayers.Layer.prototype.createDateCache = function(cacheFile){
	var layer = this;
	$.getJSON(cacheFile, function(data) {
		layer.DTCache = data.date;
	});		
};

// Function which looks for a date within a layer.
// The date passed is in the format yyyy-mm-dd or is an empty string
// Returns the array of date-times if there's a match or null if not.
OpenLayers.Layer.prototype.matchDate = function (thedate){
	var thelayer = this;
	var filtArray = $.grep(thelayer.DTCache, function(dt, i) {
		var datePart = dt.substring(0, 10);
		return (datePart == thedate);
	});
	if (filtArray.length>0){
		return filtArray;
	}
	else{
		return null;
	}
}

// Select the given temporal layer on the Map based on JavaScript date input 
OpenLayers.Map.prototype.selectDateTimeLayer = function(lyr, thedate){
	var layer = lyr;
	if(thedate){
		var uidate = ISODateString(thedate);
		var mDate = layer.matchDate(uidate);
		if(mDate){
			lyr.currentDateTimes = mDate;
			// Choose 1st date in the matched date-times for the moment - will expand functionality later
			lyr.selectedDateTime = mDate[0];
			layer.mergeNewParams({time: lyr.selectedDateTime});
			layer.setVisibility(layer.selected);
			// DEBUG
			console.info('Layer ' + layer.name + ' data available for date-time ' + lyr.selectedDateTime + '. Layer selection and display: ' + layer.selected);
		}
		else{
			lyr.currentDateTimes = [];
			lyr.selectedDateTime = '';
			layer.setVisibility(false);
			// DEBUG
			console.info('Layer ' + layer.name + ' no data available for date-time ' + uidate + '. Not displaying layer.');
		}
	}
};

// Map function to filter of layers with date-time dependencies to an yyyy-mm-dd format date
OpenLayers.Map.prototype.filterLayersByDate = function(dateText, inst){
	var themap = this;
	var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
	$.each(themap.layers, function(index, value) {
		var layer = value;
		// Only filter date-dependent layers
		if (layer.temporal){
			themap.selectDateTimeLayer(value, thedate);
		}
	});		
};

// Map function to re-generate the global date cache for selected layers
OpenLayers.Map.prototype.refreshDateCache = function(){
	var map = this;
	map.enabledDays = [];
	$.each(map.layers, function(index, value) {
		var layer = value;
		if(layer.selected && layer.temporal) {
			map.enabledDays = map.enabledDays.concat(layer.DTCache);
		}
	});
	map.enabledDays = map.enabledDays.deDupe();
	// Re-filter the layers by date now the date cache has changed
	// DEBUG
	console.info('Global date cache now has ' + map.enabledDays.length + ' members.');
}

// Map function which returns availability (boolean) of data for the given JavaScript date across all layers
// using the map object's global date cache. Used in conjunction with the jQuery UI datepicker control
OpenLayers.Map.prototype.allowedDays = function(thedate) {
	var themap = this;
	var uidate = ISODateString(thedate);
	// Filter the datetime array to see if it matches the date using jQuery grep utility
	var filtArray = $.grep(themap.enabledDays, function(dt, i) {
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
}