/*------------------------------------*\
    Selection Tools
    This file is for selecting features
    on the map, such as rectangles etc.
    It is separate from indicatorsPanel
    to make the code more future-proof.
\*------------------------------------*/

gisportal.selectionTools = {};

gisportal.selectionTools.init = function()  {
   gisportal.selectionTools.initDOM();
   var vectorLayer = new OpenLayers.Layer.Vector('POI Layer', {
      style : {
         strokeColor : 'white',
         fillColor : 'green',
         strokeWidth : 2,
         fillOpacity : 0.3,
         pointRadius: 5
      },
      preFeatureInsert : function(feature) {
         this.removeAllFeatures();
      },
      onFeatureInsert : function(feature) {
         gisportal.selectionTools.ROIAdded(feature);
      },
      rendererOptions: { zIndexing: true }
   }); 

   vectorLayer.controlID = "poiLayer";
   vectorLayer.displayInLayerSwitcher = false;

   map.addLayer(vectorLayer);

   gisportal.mapControls.box = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions:{sides: 4, irregular: true, persist: false }});

   map.addControls([gisportal.mapControls.box]);
 
};

gisportal.selectionTools.initDOM = function()  {
   $('.js-indicators').on('change', '.js-coordinates', gisportal.selectionTools.updateROI);

   $('.js-indicators').on('click', '.js-draw-box', function()  {
      gisportal.selectionTools.toggleTool('box');
   });
};

gisportal.selectionTools.toggleTool = function(tool)  {
   var vectorLayer = map.layers[map.layers.length - 1];

   var isActive = false;
   for (var key in gisportal.mapControls)  {
      var control = gisportal.mapControls[key];
      if (key === tool) {
         control.activate();
         isActive = true;
      }
      else  {
         control.deactivate();
      }
   } 

   if (!isActive) {
      console.log('There were no tools toggled, so pan has been activated');
      gisportal.mapControls['pan'].activate();
   }

   map.ROI_Type = tool;

};

gisportal.selectionTools.updateROI = function()  {
   var values = $(this).val().split(',');
   values[0] = gisportal.utils.clamp(values[0], -180, 180); // Long
   values[2] = gisportal.utils.clamp(values[2], -180, 180); // Long
   values[1] = gisportal.utils.clamp(values[1], -90, 90); // Lat
   values[3] = gisportal.utils.clamp(values[3], -90, 90); // Lat
   $(this).val(values[0] + ',' + values[1] + ',' + values[2] + ',' + values[3]);
   var feature = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(values[0], values[1], values[2], values[3]).toGeometry());
   
   // map.layers corrosponds to layers of the map,
   // such as base layer and vector, not indicators on the map
   var vectorLayer = map.layers[map.layers.length - 1];
   feature.layer = vectorLayer;
   var features = vectorLayer.features;
   if (features[0]) vectorLayer.features[0].destroy();
   vectorLayer.features[0] = feature;
   vectorLayer.redraw(); 
};

gisportal.selectionTools.ROIAdded = function(feature)  {
   var feature_type = map.ROI_Type;
   this.toggleTool('pan'); // So that people don't misclick

   var bounds = feature.geometry.bounds;
   var coords = "";
   coords += bounds.left + ",";
   coords += bounds.bottom + ",";
   coords += bounds.right + ",";
   coords += bounds.top;
   $('.js-coordinates').val(coords);
   $('.bbox-info').toggleClass('hidden', false);

   
   // Get the geometry of the drawn feature
   var geom = new OpenLayers.Geometry();
   geom = feature.geometry;

   var area_deg, area_km, height_deg, width_deg, height_km, width_km, radius_deg, ctrLat, ctrLon = 0;

   if(feature_type !== '' && feature_type != 'point') {
      area_deg = geom.getArea();
      area_km = (geom.getGeodesicArea()*1e-6);
      height_deg = bounds.getHeight();
      width_deg = bounds.getWidth();
      // Note - to get values in true ellipsoidal distances, we need to use Vincenty functions for measuring ellipsoidal
      // distances instead of planar distances (http://www.movable-type.co.uk/scripts/latlong-vincenty.html)
      ctrLon = geom.getCentroid().x;
      ctrLat = geom.getCentroid().y;
      height_km = OpenLayers.Util.distVincenty(new OpenLayers.LonLat(ctrLon,bounds.top),new OpenLayers.LonLat(ctrLon,bounds.bottom));
      width_km = OpenLayers.Util.distVincenty(new OpenLayers.LonLat(bounds.left,ctrLat),new OpenLayers.LonLat(bounds.right,ctrLat));
      radius_deg = ((bounds.getWidth() + bounds.getHeight())/4);

      var pretty_height_km, pretty_width_km, pretty_area_km
      // because not all browsers support Intl.NumberFormat ...
      try {
         pretty_height_km = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2}).format(height_km);
      } catch(e) {
         pretty_height_km = height_km.toPrecision(4);
      }
      try {
         pretty_width_km = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2}).format(width_km);
      } catch(e) {
         pretty_width_km = width_km.toPrecision(4);
      }
      try {
         pretty_area_km = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0}).format(area_km);
      } catch(e) {
         pretty_area_km = area_km.toPrecision(4);
      }
      
   }
  
   switch(feature_type) {
      case 'box': 
         $('.js-bbox-width').html(pretty_width_km+' km');
         $('.js-bbox-height').html(pretty_height_km +' km');
         $('.js-bbox-area').html(pretty_area_km +' km<sup>2</sup>');
         break;
      case 'point':
         // set the .bbox-info div to show lat/long
         break;
      case 'circle':
         // set the .bbox-info div to show lat/long of the centre, the radius, width, height and area
         break;
      case 'polgon':
         // set the .bbox-info div to show the centroid lat/long and area
         break;
   }



   
};
