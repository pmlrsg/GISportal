/*------------------------------------*\
    Selection Tools
    This file is for selecting features
    on the map, such as rectangles etc.
    It is separate from indicatorsPanel
    to make the code more future-proof.
\*------------------------------------*/

/*
Things missing that ol3 doesn't do or I can't work out how to implement:
- mouseover delete button for polygons
- draw regular boxes
- edit the coordinates textbox to add/change the polygon
- specifying polygon height/width/area - seems to be massively out on the area calculation (ol2 seems to be out too incidentally)

*/

gisportal.selectionTools = {};
gisportal.selectionTools.isDrawing = false;
gisportal.selectionTools.isSelecting = false;

var draw;

gisportal.selectionTools.init = function()  {
   gisportal.selectionTools.initDOM();

   gisportal.vectorLayer = new ol.layer.Vector({
      source : new ol.source.Vector(),
      style : new ol.style.Style({
         fill : new ol.style.Fill({
            color : 'rgba(47, 163, 11, 0.2)'
         }),
         stroke : new ol.style.Stroke({
            color : '#ffffff',
            width : 2
         }),
         image : new ol.style.Circle({
            radius : 7,
            fill : new ol.style.Fill({
               color : '#ffffff'
            })
         })
      }),
      map:map
   });

   var feature;
   // map.on('pointermove', function(evt) {
   //    feature = null;
   //    var features = gisportal.vectorLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
   //    if (features.length) {
   //       feature = features[0];
   //    }
   // });
      // map.on('pointermove', function(evt) {
      //  var pixel = evt.pixel;
      // map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      //    console.log(feature);
      //    console.log(layer);
       
         
      // //gisportal.featureOverlay.getSource().clear()

      //   // gisportal.featureOverlay.getSource().addFeature(feature)
      // });

  // });
   map.on('postrender', function(renderEvent) {
      if (feature) {
         //renderEvent.vectorContext.renderFeature(feature, highlightStyle);
      }
   });

   gisportal.wkt = new ol.format.WKT();
};

function cancelDraw() {
   $('.drawInProgress').toggleClass('drawInProgress', false);
   $(document).off( 'keydown' );
   sketch = null;
   if(draw){
      map.removeInteraction(draw);
   }
   gisportal.drawingOverlaySource.clear();
   gisportal.drawingPoints = [];
   gisportal.selectionTools.isSelecting = false;
   gisportal.selectionTools.isDrawing = false;
}

gisportal.selectionTools.initDOM = function()  {
   $('.js-indicators').on('change', '.js-coordinates', gisportal.selectionTools.updateROI)
   .on('change keyup paste', '.js-coordinates', function(e){
      var value = $(this).val();
      if(e.type == "paste"){
         try{
            value = e.originalEvent.clipboardData.getData('text/plain');
         }catch(err){}
      }
      gisportal.events.trigger('jsCoordinate.edit', e.type, value);
   })
   .on('change', '.js-upload-shape', gisportal.selectionTools.shapesUploaded)
   .on('focus', '.js-coordinates', function(){
      $(this).data('oldVal', $(this).val());
   })
   .on('click', '.js-draw-box', function()  {
      var hasntClass = !$(this).hasClass("drawInProgress");
      if(hasntClass){
         gisportal.selectionTools.toggleTool('Box');
      }else{
         cancelDraw();
      }
      $(this).toggleClass("drawInProgress", hasntClass);
      gisportal.events.trigger("drawBox.clicked");
   })
   .on('click', '.js-draw-polygon', function() {
      var hasntClass = !$(this).hasClass("drawInProgress");
      if(hasntClass){
         gisportal.selectionTools.toggleTool('Polygon');
      }else{
         cancelDraw();
      }
      $(this).toggleClass("drawInProgress", hasntClass);
      gisportal.events.trigger("drawPolygon.clicked");
   })
   .on('click', '.js-draw-select-polygon', function() {
      var hasntClass = !$(this).hasClass("drawInProgress");
      if(hasntClass){
         gisportal.selectionTools.toggleTool('SelectFromMap');
      }else{
         cancelDraw();
      }
      $(this).toggleClass("drawInProgress", hasntClass);
      gisportal.events.trigger("selectPolygon.clicked");
   })
   .on('click', '.js-remove-geojson', function() {
      $.ajax({
         url: gisportal.middlewarePath + '/plotting/delete_geojson?filename=' + $('.users-geojson-files').val(),
         success: function(filename){
            // Triggers a click so that all the selection information is cleared
            $('.js-clear-selection').trigger('click');
            $('.users-geojson-files option[value="' + filename + '"]').remove();
         },
         error: function(err){
            $.notify("Sorry, that didn't delete properly, please try again", "error");
         }
      });
      gisportal.events.trigger("removeGeoJSON.clicked");
   });


   // TODO, perhaps...
   // // map image export - problems with cross origin tainting the canvas are preventing this from working. 
   // // With cross origin set to 'anonymous' it should work but the headers at rsg.pml.ac.uk then prevent the 
   // // country borders from loading
   // $('<button class="js-export-image" title="Download current view as image" download="map.png"><span class="icon-download-10"></span></button>').appendTo('.ol-full-screen');
   // $('.js-export-image').on('click', function(e) {
   //    map.once('postcompose', function(event) {
   //    var canvas = event.context.canvas;
   //       $('.js-export-image').href = canvas.toDataURL('image/png');
   //    });
   //    map.renderSync();
   // })

};

gisportal.selectionTools.shapesUploaded = function(){
   gisportal.loading.increment();
   var files_list = this.files;
   if(files_list.length > 0){
      var dbf_found, shp_found, shx_found, files_total_size = 0;
      var formData = new FormData($(this).parent()[0]);

      for(var i = 0; i < files_list.length; i++){
         this_file = files_list[i];
         // FOR STUPID WINDOWS (not reporting file types!!
         if(this_file.type === ""){
            var ext = this_file.name.split('.');
            ext = ext[ext.length-1];
            if(ext == "csv"){
               this_file.type = "text/csv";
            }else if(ext == "dbf"){
               this_file.type = "application/x-dbf";
            }else if(ext == "shp"){
               this_file.type = "application/x-esri-shape";
            }else if(ext == "shx"){
               this_file.type = "application/x-esri-shape-index";
            }
         }
         files_total_size += this_file.size;
         if(files_total_size > 5242880){
            $.notify("There is a  5MB limit on file uploads", "error");
            gisportal.loading.decrement();
            return;
         }
         if(this_file.type == "application/x-dbf"){
            dbf_found = true;
         }
         if(this_file.type == "application/x-esri-shape"){
            shp_found = true;
         }
         if(this_file.type == "application/x-esri-shape-index"){
            shx_found = true;
         }
         if(this_file.type == "text/csv"){
            gisportal.selectionTools.csvFound(formData);
            gisportal.loading.decrement();
            return true;
         }
      }
      if(files_list.length !== 3 || !dbf_found || !shp_found || !shx_found){
         $.notify("You must provide 3 Files (.shp & .dbf & .shx)", "error");
      }else{
         $.ajax({
            url: gisportal.middlewarePath + '/plotting/upload_shape',  //Server script to process data
            type: 'POST',
            xhr: function() {  // Custom XMLHttpRequest
               var myXhr = $.ajaxSettings.xhr();
               return myXhr;
            },
            success: function(d){
               gisportal.selectionTools.loadGeoJSON(d.geojson, d.shapeName);
               gisportal.loading.decrement();
            },
            error: function(e) {
               if(e.status == 401){
                  $.notify("Sorry, You nust be logged in to use this feature.", "error");
               }else{
                  $.notify("Sorry, There was an error with that: " + e.statusText, "error");
                  $('.js-upload-shape').val("");
               }
               gisportal.loading.decrement();
            },
            data: formData,
            cache: false,
            contentType: false,
            processData: false
         });
      }
   }
};

gisportal.selectionTools.csvFound = function(formData){
   $.ajax({
      url: gisportal.middlewarePath + '/plotting/upload_csv',  //Server script to process data
      type: 'POST',
      xhr: function() {  // Custom XMLHttpRequest
         var myXhr = $.ajaxSettings.xhr();
         return myXhr;
      },
      success: function(d){
         gisportal.selectionTools.loadGeoJSON(d.geoJSON);
         gisportal.methodThatSelectedCurrentRegion = {method:"csvUpload", value: d.filename, justCoords:false};
         gisportal.graphs.deleteActiveGraph();
      },
      error: function(e) {
         if(e.status == 401){
            $.notify("Sorry, You nust be logged in to use this feature.", "error");
         }else if(e.status == 413){
            $.notify("The server cannot take requests of that size \nPlease select a smaller file", {className:"error", autoHide: false});
         }else if(e.status == 400){
            $.notify("Sorry, There was an error with your File: " + e.responseText, {className:"error", autoHide: false});
         }else if(e.status == 415){
            $.notify("Sorry, There was an error with that: " + e.responseText, {className:"error", autoHide: false});
         }else{
            $.notify("Sorry, There was an error with that: " + e.statusText, {className:"error", autoHide: false});
         }
      },
      data: formData,
      cache: false,
      contentType: false,
      processData: false
   });
};

gisportal.selectionTools.loadGeoJSON = function(geojson, shapeName, selectedValue, fromSavedState){
   var geoJsonFormat = new ol.format.GeoJSON();
   var featureOptions = {
      'featureProjection': gisportal.projection
   };
   var features = geoJsonFormat.readFeatures(geojson, featureOptions);
   gisportal.vectorLayer.getSource().clear();
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
   cancelDraw();
   //MORETODO: remove the selected class from draw buttons
   gisportal.vectorLayer.getSource().addFeatures(features);
   // Zooms to the extent of the features just added
   if((!gisportal.current_view || !gisportal.current_view.noPan) && !fromSavedState){
      gisportal.mapFit(gisportal.vectorLayer.getSource().getExtent());
   }
   gisportal.currentSelectedRegion = gisportal.wkt.writeFeatures(features);
   $('.js-coordinates').val("");
   // If this is a newly created geojson
   if(shapeName){
      shapeName += ".shp";
      // Makes sure it adds the value or just selects the existing value
      if($(".users-geojson-files option[value='" + shapeName + "']").length === 0){
         $('.users-geojson-files').append("<option selected value='" +  shapeName + "'>" + shapeName + "</option>");
      }else{
         $('.users-geojson-files').val(shapeName);
      }
   }
   gisportal.methodThatSelectedCurrentRegion = {method:"geoJSONSelect", value: $('.users-geojson-files').val(), justCoords: false};
   if(selectedValue){
      gisportal.methodThatSelectedCurrentRegion.value = selectedValue;
   }
};

gisportal.selectionTools.toggleBboxDisplay = function() {
   $('.coordinates').disabled();
};

gisportal.selectionTools.getActiveControl = function() {
   activeControl = '';
   for (var key in gisportal.mapControls) {
      if (gisportal.mapControls[key].active) {
         activeControl = key;
      }
   }
   return activeControl;
};

gisportal.selectionTools.toggleTool = function(type)  {
   if (draw !== null) {
      cancelDraw();
   }
   
   if (type != 'None') {
      gisportal.selectionTools.isDrawing = true;

      if (type == "Polygon") {
         draw = new ol.interaction.Draw({
            source:gisportal.vectorLayer.getSource(),
            type: type
         });
         map.addInteraction(draw);
      }

      if (type == "Box") {
      
         var geometryFunction = function(coordinates, geometry) {
            if (!geometry) {
               geometry = new ol.geom.Polygon(null);
            }
            var start = coordinates[0];
            var end = coordinates[1];
            geometry.setCoordinates([
               [start, [start[0], end[1]], end, [end[0], start[1]], start]
            ]);
            return geometry;
         };
         
         draw = new ol.interaction.Draw({
            source: gisportal.vectorLayer.getSource(),
            type: 'LineString',
            geometryFunction: geometryFunction,
            maxPoints: 2
         });
         map.addInteraction(draw);
      }

      if (type == 'SelectFromMap') {
         gisportal.selectionTools.isSelecting = true;
      }


      if(draw){
         $(document).on( 'keydown', function ( e ) {
            if(e.keyCode == 27){
               cancelDraw();
               gisportal.events.trigger('body.keydown', e.keyCode);
            }
         });
         draw.on('drawstart',
            function(evt) {
               gisportal.events.trigger('olDraw.drawstart');
               gisportal.vectorLayer.getSource().clear();
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
               // set sketch
               sketch = evt.feature;
            }, this);

         draw.on('drawend',
            function(evt) {
               gisportal.selectionTools.ROIAdded(sketch);
               gisportal.events.trigger('olDraw.drawend', sketch.getGeometry().getCoordinates());
            }, this);
      }
   }
   map.ROI_Type = type;

};

gisportal.selectionTools.updateROI = function()  {
   var this_bounds;
   try{
      this_bounds = $(this).val();
   }catch(e){}

   var new_bounds = this_bounds || gisportal.currentSelectedRegion;
   var this_feature;
   if(new_bounds.startsWith("POLYGON")){
      try{
         this_feature = gisportal.wkt.readFeature(new_bounds);
      }catch(e){}
   }else{
      try{
         var newer_bounds = new_bounds.split(",");
         var polygon = new Terraformer.Polygon( {
            "type": "Polygon",
            "coordinates": [[[newer_bounds[0], newer_bounds[1]], [newer_bounds[2], newer_bounds[1]], [newer_bounds[2], newer_bounds[3]], [newer_bounds[0], newer_bounds[3]], [newer_bounds[0], newer_bounds[1]]]]
         });
         this_feature = gisportal.wkt.readFeature(gisportal.coordinatesToPolygon(polygon.coordinates));
      }catch(e){}
   }
   try{
      gisportal.currentSelectedRegion = new_bounds;
      $('input.js-upload-shape')[0].value = "";
      var value = "default";
      if(gisportal.methodThatSelectedCurrentRegion.method == "geoJSONSelect"){
         value = gisportal.methodThatSelectedCurrentRegion.value;
      }
      $('.users-geojson-files').val(value);
      gisportal.methodThatSelectedCurrentRegion = {method:"drawBBox", value: gisportal.currentSelectedRegion};
      if(gisportal.currentSelectedRegion.indexOf("(") === -1){
         gisportal.methodThatSelectedCurrentRegion.justCoords = true;
      }
      gisportal.vectorLayer.getSource().clear();
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
      cancelDraw();
      gisportal.vectorLayer.getSource().addFeature(this_feature);
      if(!gisportal.current_view || !gisportal.current_view.noPan){
         gisportal.mapFit(this_feature.getGeometry().getExtent());
      }
      return;
   }catch(e){
      if(this_bounds){
         var _this = $(this);
         _this.closest('.analysis-coordinates').prepend('<div class="alert alert-danger">Sorry that didn\'t work<br/>Edit the data and try again or click <a class="js-revert-text">here</a> to revert to the previous value</div>');
         var my_timeout = setTimeout( function(){
            _this.siblings('div .alert-danger').remove();
         }, 6000 );
         _this.siblings('div .alert-danger').find('a.js-revert-text').on('click', function(){
            _this.siblings('div .alert-danger').remove();
            _this.val(_this.data('oldVal'));
            _this.trigger('change');
            clearTimeout(my_timeout);
         });
      }
   }
};

gisportal.currentSelectedRegion = "";
gisportal.methodThatSelectedCurrentRegion = {};
gisportal.feature_type = "";
gisportal.selectionTools.ROIAdded = function(feature)  {
   gisportal.methodThatSelectedCurrentRegion.justCoords = false;
   setTimeout(function() {
               gisportal.selectionTools.isDrawing = false;
            }, 500);
   var feature_type = map.ROI_Type;
   gisportal.feature_type = feature_type;

   // Get the geometry of the drawn feature
   var geom = new ol.Feature();
   geom = feature.getGeometry();

   //var bounds;
   var wkt_feature;
   if (feature_type === "Polygon") {
      wkt_feature = gisportal.wkt.writeGeometry(geom);
      
      wkt_feature = wkt_feature.replace(/[\d\.]+/g, function(num){
         return Math.round(num * 1000 ) / 1000;
      });

      gisportal.currentSelectedRegion = wkt_feature;
      //$('.bbox-info').toggleClass('hidden', false);
      $('.js-edit-polygon').attr('disabled', false);
   }
   else if(feature_type === 'Line') {
      wkt_feature = gisportal.wkt.writeGeometry(geom);
      
      wkt_feature = wkt_feature.replace(/[\d\.]+/g, function(num){
         return Math.round(num * 1000 ) / 1000;
      });

      gisportal.currentSelectedRegion = wkt_feature;
      //$('.bbox-info').toggleClass('hidden', false);
      $('.js-edit-polygon').attr('disabled', false);
   } else {
      bounds = feature.getGeometry().getExtent();
      gisportal.methodThatSelectedCurrentRegion.justCoords = true;

      var coords = "";
      if (bounds) {
         coords += bounds[0] + ",";
         coords += bounds[1] + ",";
         coords += bounds[2] + ",";
         coords += bounds[3];
         
         coords = coords.replace(/[\d\.]+/g, function(num){
            return Math.round(num * 1000 ) / 1000;
         });
      
         gisportal.currentSelectedRegion = coords;
         //$('.bbox-info').toggleClass('hidden', false);
         $('.js-edit-polygon').attr('disabled', false);
      }
   }
   $('.js-coordinates').val(gisportal.currentSelectedRegion);
   $('input.js-upload-shape')[0].value = "";
   $('.users-geojson-files').val("default");
   cancelDraw();
   gisportal.methodThatSelectedCurrentRegion.method = "drawBBox";
   gisportal.methodThatSelectedCurrentRegion.value = gisportal.currentSelectedRegion;
   this.toggleTool('None'); // So that people don't misclick

  
   
// TODO: The whole size and area calculation is a bit screwy and doesn't seem to give anything like
// accurate figures so it needs re-visiting at some point, or removing completely.

   // var area_deg, area_km, height_deg, width_deg, height_km, width_km, radius_deg, ctrLat, ctrLon = 0;

   // if(feature_type !== '' && feature_type != 'point' && bounds) {
   //    area_deg = geom.getArea();
   //    area_km = (geom.getGeodesicArea()*1e-6);
   //    height_deg = bounds.getHeight();
   //    width_deg = bounds.getWidth();
   //    // Note - to get values in true ellipsoidal distances, we need to use Vincenty functions for measuring ellipsoidal
   //    // distances instead of planar distances (http://www.movable-type.co.uk/scripts/latlong-vincenty.html)
   //    ctrLon = geom.getCentroid().x;
   //    ctrLat = geom.getCentroid().y;
   //    height_km = OpenLayers.Util.distVincenty(new OpenLayers.LonLat(ctrLon,bounds.top),new OpenLayers.LonLat(ctrLon,bounds.bottom));
   //    width_km = OpenLayers.Util.distVincenty(new OpenLayers.LonLat(bounds.left,ctrLat),new OpenLayers.LonLat(bounds.right,ctrLat));
   //    radius_deg = ((bounds.getWidth() + bounds.getHeight())/4);

   //    var pretty_height_km, pretty_width_km, pretty_area_km
   //    // because not all browsers support Intl.NumberFormat ...
   //    try {
   //       pretty_height_km = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2}).format(height_km);
   //    } catch(e) {
   //       pretty_height_km = height_km.toPrecision(4);
   //    }
   //    try {
   //       pretty_width_km = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2}).format(width_km);
   //    } catch(e) {
   //       pretty_width_km = width_km.toPrecision(4);
   //    }
   //    try {
   //       pretty_area_km = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0}).format(area_km);
   //    } catch(e) {
   //       pretty_area_km = area_km.toPrecision(4);
   //    }
      
   // }
  
   // switch(feature_type) {
   //    case 'box': 
   //       $('.js-bbox-width').html(pretty_width_km+' km');
   //       $('.js-bbox-height').html(pretty_height_km +' km');
   //       $('.js-bbox-area').html(pretty_area_km +' km<sup>2</sup>');
   //       break;
   //    case 'point':
   //       // set the .bbox-info div to show lat/long
   //       break;
   //    case 'circle':
   //       // set the .bbox-info div to show lat/long of the centre, the radius, width, height and area
   //       break;
   //    case 'polygon':
   //       // set the .bbox-info div to show the centroid lat/long and area
   //       $('.js-bbox-width').html('');
   //       $('.js-bbox-height').html('');
   //       $('.js-bbox-area').html(pretty_area_km + ' km<sup>2</sup>');
   //       break;
   // }
 
   this.setVectorLayerToTop();
};

gisportal.selectionTools.setVectorLayerToTop = function() {
   map.removeLayer(gisportal.vectorLayer);
   map.addLayer(gisportal.vectorLayer);
};
