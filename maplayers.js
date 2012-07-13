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
// Returns the 1st date if there's a match or null if not.
OpenLayers.Layer.prototype.matchDate = function (thedate){
	var thelayer = this;
	var filtArray = $.grep(thelayer.DTCache, function(dt, i) {
		var datePart = dt.substring(0, 10);
		return (datePart == thedate);
	});
	if (filtArray.length>0){
		return filtArray[0];
	}
	else{
		return null;
	}
}

/*// Map function to filter of all map layers with date-time dependencies to an ISO8601 format date
OpenLayers.Map.prototype.filterLayersByDate = function(isoDates){
	var themap = this;
	var dates = isoDates;
	$.each(themap.layers, function(index, value) {
		var layer = value;
		var display = false;
		if(layer.temporal){
			$.each(dates, function(index, value) {
				var d = value;
				// If we get a match, filter the layer to the exact date-time
				if($.inArray(d,layer.DTCache) > -1){
					layer.mergeNewParams({time: d});
					display = true;
					layer.setVisibility(layer.selected)
					// DEBUG
					console.info('Layer ' + layer.name + ' data available for date-time ' + d + '. Displaying layer: ' + layer.selected);
				}
			});
		}
	});		
};*/

// Map function to filter of all map layers with date-time dependencies to an yyyy-mm-dd format date
OpenLayers.Map.prototype.filterLayersByDate = function(dateText, inst){
	var themap = this;
	var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
	$.each(themap.layers, function(index, value) {
		var layer = value;
		themap.selectLayer(value, thedate);
	});		
};

// Select the given layer on the Map method based on JavaScript date input 
OpenLayers.Map.prototype.selectLayer = function(lyr, thedate){
	var layer = lyr;
	if(layer.temporal && thedate){
		var uidate = ISODateString(thedate);
		var mDate = layer.matchDate(uidate);
		if(mDate){
			layer.mergeNewParams({time: mDate});
			layer.setVisibility(layer.selected);
			// DEBUG
			console.info('Layer ' + layer.name + ' data available for date-time ' + mDate + '. Displaying layer: ' + layer.selected);
		}
		else{
			layer.setVisibility(false);
			// DEBUG
			console.info('Layer ' + layer.name + ' no data available for date-time ' + mDate + '. Not displaying layer.');
		}
	}
	else if(!layer.temporal && !layer.isBaseLayer){
		layer.setVisibility(layer.selected);
	}
};

// Map function which returns availability (boolean) of data for the given JavaScript date across all layers
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

/*// Map function which handles change of view date and filters available date-times to this date
OpenLayers.Map.prototype.changeViewDate = function(dateText, inst) {
	var themap = this;
	var d = inst.selectedDay;
	var m = inst.selectedMonth + 1;
	var y = inst.selectedYear;
	if(m < 10) { m = '0' + m; }
	if(d < 10) { d = '0' + d; }
	var uidate = y + '-' + m + '-' + d;
	// Filter the datetime array to see if it matches the date using jQuery grep utility
	var filtArray = $.grep(themap.enabledDays, function(dt, i) {
		var datePart = dt.substring(0, 10);
		return (datePart == uidate);
	});
	themap.filterLayersByDate(filtArray);
}*/
