var OpenLayers = {};

/**
 * @param {(number|Array.<number, number>)} lon
 * @param {number} lat
 */
OpenLayers.LonLat = function(lon, lat) {};

/**
 * 
 * @param {(DOMElement|string)} div
 * @param {Object} options
 */
OpenLayers.Map = function(div, options) {};

/**
 * 
 * @param {string} name
 * @param {Object} options
 */
OpenLayers.Layer = function(name, options) {};

/**
 * 
 * @param {string} name
 * @param {string} url
 * @param {Object} params
 * @param {Object} options
 */
OpenLayers.Layer.WMS = function(name, url, params, options) {}; 

/**
 * 
 * @param {string} name
 * @param {Object} options
 */
OpenLayers.Layer.Vector = function(name, options) {};

/**
 * @param {string} id
 * @param {OpenLayers.LonLat} lonlat
 * @param {OpenLayers.Size} contentSize
 * @param {string} contentHTML
 * @param {boolean} closeBox
 * @param {function(...[*]): *} closeBoxCallback
 */
OpenLayers.Popup = function(id, lonlat, contentSize, contentHTML, closeBox, closeBoxCallback) {};

/**
 * 
 * @param {string} projCode
 * @param {Object} options
 */
OpenLayers.Projection = function(projCode, options) {};

/**
 * 
 * @param {Object} options
 */
OpenLayers.Protocol = function(options) {};

/**
 * 
 * @param {Object} options
 */
OpenLayers.Protocol.HTTP = function(options) {};

/**
 * 
 * @param {number} w
 * @param {number} h
 */
OpenLayers.Size = function(w, h) {};

/**
 * 
 * @param {Object} style
 * @param {Object} options
 */
OpenLayers.Style = function(style, options) {};

/**
 * 
 * @param {Object} style
 * @param {Object} options
 */
OpenLayers.StyleMap = function(style, options) {};