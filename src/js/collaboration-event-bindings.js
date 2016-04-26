//--------------------------------------------------------------------------------------
//  Portal EventManager event bindings
//--------------------------------------------------------------------------------------

gisportal.events.bind("date.selected", function(event, date) {
   var params = {
      "event" : "date.selected",
      "date" : date
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind("date.zoom", function(event, startDate, endDate) {
   var params = {
      "event" : "date.zoom",
      "startDate" : startDate,
      "endDate": endDate
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind("ddslick.open", function(event, obj) {
   var params = {
      "event" : "ddslick.open",
      "obj" : obj.attr('id')
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind("ddslick.close", function(event, obj) {
   var params = {
      "event" : "ddslick.close",
      "obj" : obj.attr('id')
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind("ddslick.selectValue", function(event, obj, value, doCallback) {
   var params = {
      "event" : "ddslick.selectValue",
      "obj" : obj.attr('id'),
      "value": value,
      "doCallback": doCallback
   };
   collaboration._emit('c_event', params);
});

// hide a layer
gisportal.events.bind("layer.hide", function(event, id, layerName) {
   var params = {
      "event" : "layer.hide",
      "id" : id,
      "layerName" : layerName
   };
   collaboration._emit('c_event', params);
});

// layer removed from panel
gisportal.events.bind("layer.remove", function(event, id, layerName) {
   var params = {
      "event" : "layer.remove",
      "id" : id,
      "layerName" : layerName
   };
   collaboration._emit('c_event', params);
});

// layer order changed
gisportal.events.bind("layer.reorder", function(event, newLayerOrder) {
   var params = {
      "event" : "layer.reorder",
      "newLayerOrder" : newLayerOrder
   };
   collaboration._emit('c_event', params);
});

// show a layer
gisportal.events.bind("layer.show", function(event, id, layerName) {
   var params = {
      "event" : "layer.show",
      "id" : id,
      "layerName" : layerName
   };
   collaboration._emit('c_event', params);
});

// user moves the map, or zooms in/out
gisportal.events.bind("map.move", function(event, CentreLonLat, zoomLevel) {
   var params = { 
      "event" : "map.move",
      "centre" : CentreLonLat,
      "zoom": zoomLevel
   };
   collaboration._emit('c_event', params);
});

// show a panel
gisportal.events.bind("panels.showpanel", function(event, panelName) {
   var params = {
      "event" : "panels.showpanel",
      "panelName" : panelName
   };
   collaboration._emit('c_event', params);
});

// auto scale a layer
gisportal.events.bind("scalebar.autoscale", function(event, id, force) {
   var params = {
      "event" : "scalebar.autoscale",
      "id" : id,
      "force" : force
   };
   collaboration._emit('c_event', params);
});

// auto scale a layer
gisportal.events.bind("scalebar.autoscale-checkbox", function(event, id, isChecked) {
   var params = {
      "event" : "scalebar.autoscale-checkbox",
      "id" : id,
      "isChecked" : isChecked
   };
   collaboration._emit('c_event', params);
});

// indicator has logarithmic scale
gisportal.events.bind("scalebar.log-set", function(event, id, isLog) {
   var params = {
      "event" : "scalebar.log-set",
      "id" : id,
      "isLog": isLog
   };
   collaboration._emit('c_event', params);
});

// scalebar maximum value set
gisportal.events.bind("scalebar.max-set", function(event, id, value) {
   var params = {
      "event" : "scalebar.max-set",
      "id" : id,
      "value": value
   };
   collaboration._emit('c_event', params);
});

// scalebar minimum value set
gisportal.events.bind("scalebar.min-set", function(event, id, value) {
   var params = {
      "event" : "scalebar.min-set",
      "id" : id,
      "value": value
   };
   collaboration._emit('c_event', params);
});

// layer opacity changed
gisportal.events.bind("scalebar.opacity", function(event, id, value) {
   var params = {
      "event" : "scalebar.opacity",
      "id" : id,
      "value": value
   };
   collaboration._emit('c_event', params);
});

// auto scale a layer
gisportal.events.bind("scalebar.reset", function(event, id) {
   var params = {
      "event" : "scalebar.reset",
      "id" : id
   };
   collaboration._emit('c_event', params);
});


// search string changes
gisportal.events.bind("search.typing", function(event, searchValue) {
   var params = {
      "event" : "search.typing",
      "searchValue" : searchValue
   };
   collaboration._emit('c_event', params);
});

// wms string changes
gisportal.events.bind("wms.typing", function(event, typedValue, eType) {
   var params = {
      "event" : "wms.typing",
      "typedValue" : typedValue,
      "eType" : eType
   };
   collaboration._emit('c_event', params);
});

// refresh cache box changed
gisportal.events.bind("refreshCacheBox.clicked", function(event, checked) {
   var params = {
      "event" : "refreshCacheBox.clicked",
      "checked" : checked
   };
   collaboration._emit('c_event', params);
});

// wms submitted
gisportal.events.bind("wms.submitted", function() {
   var params = {
      "event" : "wms.submitted"
   };
   collaboration._emit('c_event', params);
});

// more info clicked
gisportal.events.bind("moreInfo.clicked", function() {
   var params = {
      "event" : "moreInfo.clicked"
   };
   collaboration._emit('c_event', params);
});

// reset list clicked
gisportal.events.bind("resetList.clicked", function() {
   var params = {
      "event" : "resetList.clicked"
   };
   collaboration._emit('c_event', params);
});

// add layers form clicked
gisportal.events.bind("addLayersForm.clicked", function() {
   var params = {
      "event" : "addLayersForm.clicked"
   };
   collaboration._emit('c_event', params);
});

// search string changes
gisportal.events.bind("search.cancel", function(event) {
   var params = {
      "event" : "search.cancel"
   };
   collaboration._emit('c_event', params);
});

// search string changes
gisportal.events.bind("search.resultselected", function(event, searchResult) {
   var params = {
      "event" : "search.resultselected",
      "searchResult" : searchResult
   };
   collaboration._emit('c_event', params);
});

// Layer tab selected
gisportal.events.bind("tab.select", function(event, layerId, tabName) {
   var params = {
      "event" : "tab.select",
      "layerId": layerId,
      "tabName": tabName
   };
   collaboration._emit('c_event', params);
});


// jQuery events 


gisportal.events.bind('configurepanel.scroll', function(event, scrollPercent) {
   var params = {
      "event": "configurepanel.scroll",
      "scrollPercent": scrollPercent
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('mapsettingspanel.scroll', function(event, scrollPercent) {
   var params = {
      "event": "mapsettingspanel.scroll",
      "scrollPercent": scrollPercent
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('indicatorspanel.scroll', function(event, scrollPercent) {
   var params = {
      "event": "indicatorspanel.scroll",
      "scrollPercent": scrollPercent
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('addLayersForm.scroll', function(event, scrollPercent) {
   var params = {
      "event": "addLayersForm.scroll",
      "scrollPercent": scrollPercent
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('addLayersForm.input', function(event, inputValue, field) {
   var params = {
      "event": "addLayersForm.input",
      "field": field,
      "inputValue": inputValue
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('addLayersForm.close', function(event) {
   var params = {
      "event": "addLayersForm.close"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('body.keydown', function(event, code) {
   var params = {
      "event": "body.keydown",
      "code": code
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('paginator.selected', function(event, page) {
   var params = {
      "event": "paginator.selected",
      "page": page
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('zoomToData.clicked', function(event, id) {
   var params = {
      "event": "zoomToData.clicked",
      "layer": id
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('submitLayers.clicked', function(event) {
   var params = {
      "event": "submitLayers.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('cancelChanges.clicked', function(event) {
   var params = {
      "event": "cancelChanges.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('toggleAllLayers.clicked', function(event) {
   var params = {
      "event": "toggleAllLayers.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('addToAll.clicked', function(event, field) {
   var params = {
      "event": "addToAll.clicked",
      "field": field
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('addScalePointsToAll.clicked', function(event) {
   var params = {
      "event": "addScalePointsToAll.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('addTagInput.clicked', function(event) {
   var params = {
      "event": "addTagInput.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('userFeedback.close', function(event) {
   var params = {
      "event": "userFeedback.close"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('userFeedback.submit', function(event) {
   var params = {
      "event": "userFeedback.submit"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('userFeedback.input', function(event, inputValue) {
   var params = {
      "event": "userFeedback.input",
      "inputValue": inputValue
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('drawBox.clicked', function(event) {
   var params = {
      "event": "drawBox.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('drawPolygon.clicked', function(event) {
   var params = {
      "event": "drawPolygon.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('selectPolygon.clicked', function(event) {
   var params = {
      "event": "selectPolygon.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('removeGeoJSON.clicked', function(event) {
   var params = {
      "event": "removeGeoJSON.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('jsCoordinate.edit', function(event, eventType, value) {
   var params = {
      "event": "jsCoordinate.edit",
      "eventType":eventType,
      "value":value
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('clearSelection.clicked', function(event) {
   var params = {
      "event": "clearSelection.clicked"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('olDraw.click', function(event, coordinate) {
   var params = {
      "event": "olDraw.click",
      "coordinate": coordinate
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('olDraw.drawstart', function(event) {
   var params = {
      "event": "olDraw.drawstart"
   };
   collaboration._emit('c_event', params);
});

gisportal.events.bind('olDraw.drawend', function(event, coordinates) {
   var params = {
      "event": "olDraw.drawend",
      "coordinates": coordinates
   };
   collaboration._emit('c_event', params);
});