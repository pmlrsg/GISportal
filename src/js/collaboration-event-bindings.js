//--------------------------------------------------------------------------------------
//  Portal EventManager event bindings
//--------------------------------------------------------------------------------------

gisportal.events.bind("date.selected", function(event, date) {
   var params = {
       "event" : "date.selected",
       "date" : date
   }
   collaboration._emit('c_event', params);
});

gisportal.events.bind("date.zoom", function(event, startDate, endDate) {
   var params = {
       "event" : "date.zoom",
       "startDate" : startDate,
       "endDate": endDate
   }
   collaboration._emit('c_event', params);
});

gisportal.events.bind("ddslick.open", function(event, obj) {
   var params = {
       "event" : "ddslick.open",
       "obj" : obj.attr('id')
   }
   collaboration._emit('c_event', params);
});

gisportal.events.bind("ddslick.close", function(event, obj) {
   var params = {
       "event" : "ddslick.close",
       "obj" : obj.attr('id')
   }
   collaboration._emit('c_event', params);
});

gisportal.events.bind("ddslick.selectIndex", function(event, obj, index, doCallback) {
   var params = {
       "event" : "ddslick.selectIndex",
       "obj" : obj.attr('id'),
       "index": index,
       "doCallback": doCallback
   }
   collaboration._emit('c_event', params);
});


// new layer added
gisportal.events.bind("layer.addtopanel", function(event, data) {
   var params = {
       "event" : "layer.addtopanel",
       "layer" : data
   }
   collaboration._emit('c_event', params);
});

// hide a layer
gisportal.events.bind("layer.hide", function(event, id, layerName) {
   var params = {
        "event" : "layer.hide",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// layer removed from panel
gisportal.events.bind("layer.remove", function(event, id, layerName) {
   var params = {
        "event" : "layer.remove",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// layer order changed
gisportal.events.bind("layer.reorder", function(event, newLayerOrder) {
   var params = {
        "event" : "layer.reorder",
        "newLayerOrder" : newLayerOrder
    }
    collaboration._emit('c_event', params);
});

// layer is selected
gisportal.events.bind("layer.select", function(event, id, layerName) {
    var params = {
        "event" : "layer.select",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// show a layer
gisportal.events.bind("layer.show", function(event, id, layerName) {
   var params = {
        "event" : "layer.show",
        "id" : id,
        "layerName" : layerName
    }
    collaboration._emit('c_event', params);
});

// user moves the map, or zooms in/out
gisportal.events.bind("map.move", function(event, CentreLonLat, zoomLevel) {
   var params = { 
      "event" : "map.move",
      "centre" : CentreLonLat,
      "zoom": zoomLevel
   }
   collaboration._emit('c_event', params);
});

// show a panel
gisportal.events.bind("panels.showpanel", function(event, panelName) {
   var params = {
        "event" : "panels.showpanel",
        "panelName" : panelName
    }
    collaboration._emit('c_event', params);
});

// auto scale a layer
gisportal.events.bind("scalebar.autoscale", function(event, id, force) {
   var params = {
        "event" : "scalebar.autoscale",
        "id" : id,
        "force" : force
    }
    collaboration._emit('c_event', params);
});

// auto scale a layer
gisportal.events.bind("scalebar.autoscale-checkbox", function(event, id, isChecked) {
   var params = {
        "event" : "scalebar.autoscale-checkbox",
        "id" : id,
        "isChecked" : isChecked
    }
    collaboration._emit('c_event', params);
});

// indicator has logarithmic scale
gisportal.events.bind("scalebar.log-set", function(event, id, isLog) {
   var params = {
        "event" : "scalebar.log-set",
        "id" : id,
        "isLog": isLog
    }
    collaboration._emit('c_event', params);
});

// scalebar maximum value set
gisportal.events.bind("scalebar.max-set", function(event, id, value) {
   var params = {
        "event" : "scalebar.max-set",
        "id" : id,
        "value": value
    }
    collaboration._emit('c_event', params);
});

// scalebar minimum value set
gisportal.events.bind("scalebar.min-set", function(event, id, value) {
   var params = {
        "event" : "scalebar.min-set",
        "id" : id,
        "value": value
    }
    collaboration._emit('c_event', params);
});

// layer opacity changed
gisportal.events.bind("scalebar.opacity", function(event, id, value) {
   var params = {
        "event" : "scalebar.opacity",
        "id" : id,
        "value": value
    }
    collaboration._emit('c_event', params);
});

// auto scale a layer
gisportal.events.bind("scalebar.reset", function(event, id) {
   var params = {
        "event" : "scalebar.reset",
        "id" : id
    }
    collaboration._emit('c_event', params);
});


// search string changes
gisportal.events.bind("search.typing", function(event, searchValue) {
   var params = {
        "event" : "search.typing",
        "searchValue" : searchValue
    }
    collaboration._emit('c_event', params);
});

// search string changes
gisportal.events.bind("search.cancel", function(event) {
   var params = {
        "event" : "search.cancel"
    }
    collaboration._emit('c_event', params);
});

// search string changes
gisportal.events.bind("search.resultselected", function(event, searchResult) {
   var params = {
        "event" : "search.resultselected",
        "searchResult" : searchResult
    }
    collaboration._emit('c_event', params);
});

// Layer tab selected
gisportal.events.bind("tab.select", function(event, layerId, tabName) {
   var params = {
        "event" : "tab.select",
        "layerId": layerId,
        "tabName": tabName
    }
    collaboration._emit('c_event', params);
});


// jQuery events 


gisportal.events.bind('configurepanel.scroll', function(event, scrollTop) {
  var params = {
    "event": "configurepanel.scroll",
    "scrollTop": scrollTop
  }
  collaboration._emit('c_event', params);
})

gisportal.events.bind('indicatorspanel.scroll', function(event, scrollTop) {
  var params = {
    "event": "indicatorspanel.scroll",
    "scrollTop": scrollTop
  }
  collaboration._emit('c_event', params);
})