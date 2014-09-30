
(function (window) {"use strict";

  // (C) WebReflection - Mit Style License
  // compatible with both yuno and all browsers

  var
    defineProperty = Object.defineProperty,
    methods = [
      "addListener", on,
      "on", on,
      "once", once,
      "removeListener", off,
      "off", off,
      "removeAllListeners", removeAllListeners,
      "setMaxListeners", setMaxListeners,
      "listeners", listeners,
      "emit", emit
    ],
    indexOf = methods.indexOf || function (v) {
      for (var i = 0, length = this.length; i < length && this[i] !== v; ++i);
      return i === length ? -1 : i - 1;
    },
    slice = methods.slice,
    i = 0,
    undefined
  ;

  try {
    if (!defineProperty({},"_",{value:1})._) {
      throw 0;
    }
  } catch(_) {
    defineProperty = function (o, k, d) {
      o[k] = d.value;
    };
  }

  function getHandlers(self, type) {
    var handler = self._events;
    return handler[type] || (handler[type] = []);
  }

  function on(type, listener) {
    var
      self = this,
      handlers = getHandlers(self, type),
      length = handlers.length
    ;
    if (length && length === self._maxListeners) {
      throw "too many listeners";
    }
    emit.call(self, "newListener", listener);
    handlers.push(listener);
    return self;
  }

  function once(type, listener) {
    var self = this;
    on.call(self, type, function once() {
      off.call(self, type, once);
      listener.apply(self, arguments);
    });
  }

  function off(type, listener) {
    var
      self = this,
      handlers = getHandlers(self, type),
      i = indexOf.call(handlers, listener)
    ;
    -1 < i && handlers.splice(i, 1);
    if (!handlers.length) delete self._events[type];
    return self;
  }

  function removeAllListeners(type) {
    if (type === undefined) {
      this._events = {};
    } else {
      delete this._events[type];
    }
    return this;
  }

  function setMaxListeners(maxListeners) {
    this._maxListeners = maxListeners;
  }

  function listeners(type) {
    return this._events[type] || [];
  }

  function emit(type) {
    for (var
      self = this,
      args = slice.call(arguments, 1),
      handlers = slice.call(self._events[type] || []),
      i = 0; i < handlers.length; ++i
    ) {
      handlers[i].apply(self, args);
    }
    return 0 < i;
  }

  function EventEmitter() {
    var descriptor = {value: {}, writable: true};
    defineProperty(this, "_events", descriptor);
    descriptor.value = 10;
    defineProperty(this, "_maxListeners", descriptor);
  }

  while (i < methods.length) {
    defineProperty(EventEmitter.prototype, methods[i], {value: methods[i + 1]});
    i += 2;
  }

  (window.events || (window.events = {})).EventEmitter = EventEmitter;
  window.EventEmitter = EventEmitter;

}(this));



function EventManager() {
   this._events = new EventEmitter();
}

EventManager.prototype.bind = function( eventType, callback ){
  this._events.on( eventType, callback );
  return this;
};
 
EventManager.prototype.trigger = function(eventType, data){
   args = [ eventType, {} ];

   for( var i = 1; i < arguments.length; i++ )
    args.push( args[i] );
   this._events.emit.apply( this._events, args );
   return ;
};


gisportal = gisportal || {};
gisportal.events = new EventManager();