gisportal.geolocationFilter = {};

gisportal.geolocationFilter.init = function(){
   gisportal.geolocationFilter.geocoder =  new ol.control.SearchPhoton({
     //target: $(".options").get(0),
     lang:"en",		// Force preferred language
     reverse: true,
     position: true,	// Search, with priority to geo position
     title:'Search',
     placeholder: 'Search for an area...' 
   });
   map.addControl(gisportal.geolocationFilter.geocoder);

 // Select feature when click on the reference index
//  search.on('select', function(e) {
//    // console.log(e);
//    map.getView().animate({
//      center:e.coordinate,
//      zoom: Math.max (map.getView().getZoom(),16)
//    });
//  });

   gisportal.geolocationFilter.geocoder.on('select', function(evt) {
      console.log('Event here: ',evt);
      gisportal.geolocationFilter.filterByPlace(evt.coordinate, evt.search);
   });

   $('.js-place-search-filter-radius').on('change', function(){
      gisportal.geolocationFilter.drawCurrentFilter();
      var params = {
         "event": "geocoderRadius.changed",
         "value": $(this).val()
      };
      gisportal.events.trigger('geocoderRadius.changed', params);
   });

   $('.ol3-geocoder-input-search').on('keyup', function(e){
      var params = {
         "event": "geocoderInput.typing",
         "value": $(this).val()
      };
      gisportal.events.trigger('geocoderInput.typing', params);
   });
   
   $('.ol-viewport .ol-overlaycontainer-stopevent').append('<div class="ol-unselectable ol-control "><span class="ol-geocoder-trigger icon-magnifier btn" title="Search for a place"></span></div>');

   $('.ol-geocoder-trigger').on('click', function(){
      $('.js-place-search-filter').toggleClass('searchInProgress', false);
      gisportal.geolocationFilter.filteringByText = false;
      $('.ol3-geocoder-btn-search').trigger('click');
   });

   $('.js-place-search-filter').on('click', function(){
      if(gisportal.geolocationFilter.filteringByText){
         $(this).toggleClass('searchInProgress', false);
         gisportal.geolocationFilter.filteringByText = false;
      }else if($(".ol3-geocoder-search-expanded").length === 0){
         $(this).toggleClass('searchInProgress', true);
         gisportal.geolocationFilter.filteringByText = true;
         gisportal.geolocationFilter.cancelDraw();
      }
      $('.ol3-geocoder-btn-search').trigger('click');
      var params = {
         "event": "placeSearchFilter.clicked"
      };
      gisportal.events.trigger("placeSearchFilter.clicked", params);
   });

   $('.js-box-search-filter').on('click', function(){
      $('.js-place-search-filter').toggleClass('searchInProgress', false);
      if($('.ol3-geocoder-search-expanded').length > 0){
         $('.ol-geocoder-trigger').trigger('click');
      }
      if($(this).hasClass('searchInProgress')){
         $(this).toggleClass('searchInProgress', false);
         gisportal.geolocationFilter.cancelDraw();
      }else{
         gisportal.geolocationFilter.toggleDraw('Box');
         $(this).toggleClass('searchInProgress', true);
         gisportal.geolocationFilter.filteringByPolygon = true;
      }
      var params = {
         "event": "drawFilterBox.clicked"
      };
      gisportal.events.trigger("drawFilterBox.clicked", params);
   });

   $('.js-polygon-search-filter').on('click', function(){
      $('.js-place-search-filter').toggleClass('searchInProgress', false);
      if($('.ol3-geocoder-search-expanded').length > 0){
         $('.ol-geocoder-trigger').trigger('click');
      }
      if($(this).hasClass('searchInProgress')){
         $(this).toggleClass('searchInProgress', false);
         gisportal.geolocationFilter.cancelDraw();
      }else{
         gisportal.geolocationFilter.toggleDraw('Polygon');
         $(this).toggleClass('searchInProgress', true);
         gisportal.geolocationFilter.filteringByPolygon = true;
      }
      var params = {
         "event": "drawFilterPolygon.clicked"
      };
      gisportal.events.trigger("drawFilterPolygon.clicked", params);
   });
   $('.show-geocoder').on('click', function() {
      var geocoder_block = $('.js-geolocation-filter');
      if(geocoder_block.is(':visible')){
         $(this).find('p').html("Geographic filters").next().toggleClass('icon-arrow-65', true).toggleClass('icon-arrow-66', false);
         geocoder_block.slideUp();
      }else{
         $(this).find('p').html("Hide").next().toggleClass('icon-arrow-65', false).toggleClass('icon-arrow-66', true);
         geocoder_block.slideDown();
      }
      var params = {
         "event" : "showGeocoder.clicked"
      };
      gisportal.events.trigger('showGeocoder.clicked', params);
   });
};

gisportal.geolocationFilter.filterByPlace = function(coordinate, address){
   console.log('Address in filterByPlace',address);
   var address_details = address.properties;
   $('.ol3-geocoder-search-expanded').toggleClass('ol3-geocoder-search-expanded', false);
   $('#gcd-input').val("");
   $('.ol3-geocoder-result').html("");
   if(gisportal.geolocationFilter.filteringByText){
      gisportal.currentSearchedPoint = gisportal.reprojectPoint(coordinate, gisportal.projection, 'EPSG:4326');
      $('.js-place-search-filter').toggleClass('searchInProgress', false);
      gisportal.geolocationFilter.filteringByText = false;
      gisportal.currentSearchedBoundingBox = null;
      gisportal.geolocationFilter.drawCurrentFilter();
   }

   // Makes sure that there is a sensible zoom level.
   if(address_details){
      if(address_details.postcode){
         map.getView().setZoom(19);
      }else if(address_details.city){
         map.getView().setZoom(17);
      }else if(address_details.state){
         map.getView().setZoom(13);
      }else if(address_details.country){
         map.getView().setZoom(5);
      }else{
         map.getView().setZoom(3);
      }
   }
   map.getView().setCenter(coordinate);
   var params = {
      "event": "geolocationFilter.filterByPlace",
      "coordinate":coordinate,
      "address": address_details.extent
   };
   gisportal.events.trigger('geolocationFilter.filterByPlace', params);
};

gisportal.geolocationFilter.toggleDraw = function(type)  {
   cancelDraw();
   if (gisportal.geolocationFilter.draw !== null) {
      gisportal.geolocationFilter.cancelDraw();
   }
   
   if (type != 'None') {
      if (type == "Polygon") {
         gisportal.geolocationFilter.draw = new ol.interaction.Draw({
            source:gisportal.vectorLayer.getSource(),
            type: type
         });
         map.addInteraction(gisportal.geolocationFilter.draw);
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
         
         gisportal.geolocationFilter.draw = new ol.interaction.Draw({
            source: gisportal.vectorLayer.getSource(),
            type: 'Circle', // This circle looks wrong but actually you need it for rectangular things
            geometryFunction: ol.interaction.Draw.createBox(),
            maxPoints: 2
         });
         map.addInteraction(gisportal.geolocationFilter.draw);
      }


      if(gisportal.geolocationFilter.draw){
         $(document).on('keydown', gisportal.geolocationFilter.keydownListener);
         gisportal.geolocationFilter.draw.once('drawstart',
            function(evt) {
               var params = {
                  "event": "olDraw.drawstart"
               };
               gisportal.events.trigger('olDraw.drawstart', params);
               gisportal.vectorLayer.getSource().clear();
               gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'filter');
               gisportal.currentSearchedPoint = null;
               sketch = evt.feature;
            }, this);

         gisportal.geolocationFilter.draw.once('drawend',
            function(evt) {
               var coordinates = sketch.getGeometry().getCoordinates();
               for(var poly in coordinates){
                  for(var coor in coordinates[poly]){
                     for(var num in coordinates[poly][coor]){
                        coordinates[poly][coor][num] = Math.round(coordinates[poly][coor][num] * 1000 ) / 1000;
                     }
                  }
               }
               setTimeout(function() {
                  gisportal.geolocationFilter.cancelDraw();
               }, 1000);
               var wkt = Terraformer.WKT.parse(gisportal.wkt.writeGeometry(sketch.getGeometry()));
               if(gisportal.projection != 'EPSG:4326'){
                  wkt.toGeographic();
               }
               gisportal.currentSearchedBoundingBox = wkt;
               gisportal.geolocationFilter.drawCurrentFilter();
               var params = {
                  "event": "filterDraw.drawend",
                  "wkt": wkt
               };
               gisportal.events.trigger('filterDraw.drawend', params);
            }, this);
      }
   }
};

gisportal.geolocationFilter.keydownListener = function(e){
   if(e.keyCode == 27){
      gisportal.geolocationFilter.cancelDraw();
      gisportal.events.trigger('body.keydown', e.keyCode);
   }
};

gisportal.geolocationFilter.cancelDraw = function(){
   $(document).off('keydown', gisportal.geolocationFilter.keydownListener);
   sketch = null;
   $('.js-box-search-filter, .js-polygon-search-filter').toggleClass('searchInProgress', false);
   if(gisportal.geolocationFilter.draw){
      map.removeInteraction(gisportal.geolocationFilter.draw);
      gisportal.geolocationFilter.draw = false;
      gisportal.geolocationFilter.filteringByPolygon = false;
   }
};

gisportal.geolocationFilter.drawCurrentFilter = function(){
   var feature, new_feature;
   if(gisportal.currentSearchedPoint){
      var radius = parseInt($('.js-place-search-filter-radius').val()) * 1000 || 1000;
      circle = new Terraformer.Circle(gisportal.currentSearchedPoint, radius, 64);
      var nice_circle = circle;
      if(gisportal.projection != 'EPSG:4326'){
         nice_circle.toMercator();
      }
      feature = gisportal.wkt.readFeature(gisportal.coordinatesToPolygon(nice_circle.geometry.coordinates));
      new_feature = new ol.Feature({geometry:feature.getGeometry(), overlayType:"filter"});
      gisportal.mapFit(new_feature.getGeometry().getExtent());
   }else if(gisportal.currentSearchedBoundingBox){
      var poly = gisportal.currentSearchedBoundingBox;
      var nice_poly = poly;
      if(gisportal.projection != 'EPSG:4326'){
         nice_poly.toMercator();
      }
      feature = gisportal.wkt.readFeature(gisportal.coordinatesToPolygon(nice_poly.coordinates));
      new_feature = new ol.Feature({geometry:feature.getGeometry(), overlayType:"filter"});
   }else{
      gisportal.configurePanel.resetPanel();
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'filter');
      return;
   }
   var wkt = Terraformer.WKT.parse(gisportal.wkt.writeGeometry(new_feature.getGeometry()));
   if(gisportal.projection != 'EPSG:4326'){
      wkt.toGeographic();
   }
   gisportal.configurePanel.filterLayersByGeometry(wkt);
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'filter');
   gisportal.featureOverlay.getSource().addFeature(new_feature);
};