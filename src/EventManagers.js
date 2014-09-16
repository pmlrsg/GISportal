
function EventManager() {
   this.eventBeacon = $(document.createElement("beacon"));
   this.eventBeacon.data("preTrigger", {});
}

EventManager.prototype.on = function(eventType, callback) {
   if (!this.eventBeacon.data("preTrigger")[eventType]) {
      this.eventBeacon.bind(eventType, jQuery.proxy(this.preTrigger, this));
      this.eventBeacon.data( "preTrigger" )[ eventType ] = true;
   }

   arguments[ arguments.length - 1 ] = jQuery.proxy(arguments[arguments.length - 1], this);
   jQuery.fn.bind.apply(this.eventBeacon, arguments );
 
   return(this);
}

EventManager.prototype.bind = EventManager.prototype.on;

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

