var EventManager = {
    subscribe: function(event, fn) {
        $(this).bind(event, fn);
    },
    unsubscribe: function(event, fn) {
        $(this).unbind(event, fn);
    },
    publish: function(event, data) {
        $(this).trigger(event);
    }
};


// Display Options panel events
EventManager.subscribe("display-basemap-changed", function() {
    collaboration.setValueById(event.target.id, event.target.value, "Base map changed to "+event.target.options[event.target.selectedIndex].innerText);
});

EventManager.subscribe("display-countryborders-changed", function() {
    collaboration.setValueById(event.target.id, event.target.value, "Country borders set to '"+event.target.options[event.target.selectedIndex].innerText+"'");
});

EventManager.subscribe("map-zoomend", function() {
    console.log("zoooooooom");
    collaboration.mapZoom();    
});

EventManager.subscribe("map-moveend", function() {
    collaboration.mapMove();
});

// EventManager.publish("display-basemap-changed");

// EventManager.unsubscribe("tabClicked");

















