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

// Map function to filter of all map layers with date-time dependencies to an ISO8601 format date
OpenLayers.Map.prototype.filterLayersByDate = function(isoDates){
	var themap = this;
	var dates = isoDates;
	$.each(themap.layers, function(index, value) {
		var matchDate = false;
		var layer = value;
		if(layer.DTCache.length > 0){
			$.each(dates, function(index, value) {
				var d = value;
				if($.inArray(d,layer.DTCache) > -1){
					layer.mergeNewParams({time: d});
					// DEBUG
					console.info('Filtered: ' + layer.name + ' to date ' + d);	
					matchDate = true;
					layer.display(true);
				}
			});
			// If the layer does not have data for any of the dates, do not display it
			if (!matchDate){
				layer.display(false);
				// DEBUG
				console.info('No date match for  ' + layer.name);	
			}
		}
	});		
};

// Map function which returns availability (boolean) of data for the given date across all layers
OpenLayers.Map.prototype.allowedDays = function(date) {
	var themap = this;
	var m = date.getMonth() + 1, d = date.getDate(), y = date.getFullYear();
	if(m < 10) { m = '0' + m; }
	if(d < 10) { d = '0' + d; }
	var uidate = y + '-' + m + '-' + d;
	// Flter the datetime array to see if it matches the date using jQuery grep utility
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

// Map function which handles change of view date and filters available date-times to this date
OpenLayers.Map.prototype.changeViewDate = function(dateText, inst) {
	var themap = this;
	var d = inst.selectedDay;
	var m = inst.selectedMonth + 1;
	var y = inst.selectedYear;
	if(m < 10) { m = '0' + m; }
	if(d < 10) { d = '0' + d; }
	var uidate = y + '-' + m + '-' + d;
	// Flter the datetime array to see if it matches the date using jQuery grep utility
	var filtArray = $.grep(themap.enabledDays, function(dt, i) {
		var datePart = dt.substring(0, 10);
		return (datePart == uidate);
	});
	themap.filterLayersByDate(filtArray);
}
