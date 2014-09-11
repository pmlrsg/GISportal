

function EventManager(name) {
   this.name = name;
   this.eventBeacon = $(document.createElement("beacon"));
   this.eventBeacon.data("preTrigger", {});
}

EventManager.prototype.bind = function(eventType, callback) {
   if (!this.eventBeacon.data("preTrigger")[eventType]) {
      this.eventBeacon.bind(eventType, jQuery.proxy(this.preTrigger, this));
      this.eventBeacon.data( "preTrigger" )[ eventType ] = true;
   }

   arguments[ arguments.length - 1 ] = jQuery.proxy(arguments[arguments.length - 1], this);
   jQuery.fn.bind.apply(this.eventBeacon, arguments );
 
   return(this);
}
EventManager.prototype.unbind = function(eventType, callback){
   this.eventBeacon.unbind(eventType, callback);
   return( this );
};
 
EventManager.prototype.trigger = function(eventType, data){
   this.eventBeacon.trigger(eventType, data);
   return( this );
};
 
EventManager.prototype.preTrigger = function(event){
   event.target = this;
};






var portalevent = new EventManager('portalevent');

var mapHandler = null;
var indicatorHandler = null;

// user zooms in/out
portalevent.bind(
   "map.zoom",
   {
      handlerType: "mapZoomHandler"
   },
   mapZoomHandler = function(event, zoomLevel) {
      collaboration.mapZoom(zoomLevel);
   }
)

// user moves the map
portalevent.bind(
   "map.move",
   {
      handlerType: "mapMoveHandler"
   },
   mapMoveHandler = function(event, CenterLonLat) {
      collaboration.mapMove(CenterLonLat);
   }  
)

// Base map changed
portalevent.bind(
   "displayoptions.basemap",
   { handlerType: "setValueByIdHandler"},

   setValueByIdHandler = function(event, id, value, logmsg) {
      collaboration.setValueById(id, value, logmsg);
   }
)

// Country borders changed
portalevent.bind(
   "displayoptions.countryborders",
   { handlerType: "setValueByIdHandler"},

   setValueByIdHandler = function(event, id, value, logmsg) {
      collaboration.setValueById(id, value, logmsg);
   }
)



 
// based on http://www.bennadel.com/blog/2000-powering-publish-and-subscribe-functionality-with-native-jquery-event-management.htm












