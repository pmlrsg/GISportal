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
   this.toggleTool('pan'); // So that people don't misclick

   var bounds = feature.geometry.bounds;
   if (bounds)  {
      var coords = "";
      coords += bounds.bottom + ",";
      coords += bounds.left + ",";
      coords += bounds.right + ",";
      coords += bounds.top;
      $('.js-coordinates').val(coords);
   }
};
