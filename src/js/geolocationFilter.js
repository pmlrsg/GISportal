gisportal.geolocationFilter = {};

gisportal.geolocationFilter.init = function(){
   gisportal.geolocationFilter.geocoder = new Geocoder('nominatim', {
      provider: 'photon',
      lang: 'en',
      placeholder: 'Search for a place...',
      limit: 7,
      keepOpen: true,
      preventDefault: true
   });
   map.addControl(gisportal.geolocationFilter.geocoder);

   gisportal.geolocationFilter.geocoder.on('addresschosen', function(evt) {
      $('.ol3-geocoder-search-expanded').toggleClass('ol3-geocoder-search-expanded', false);
      $('#gcd-input').val("");
      $('.ol3-geocoder-result').html("");
      if(gisportal.geolocationFilter.filteringByText){
         gisportal.currentSearchedPoint = gisportal.reprojectPoint(evt.coordinate, gisportal.projection, 'EPSG:4326');
         $('.js-place-search-filter').toggleClass('searchInProgress', false);
         gisportal.geolocationFilter.filteringByText = false;
         gisportal.currentSearchedBoundingBox = null;
         gisportal.geolocationFilter.drawCurrentFilter();
      }

      // Makes sure that there is a sensible zoom level.
      var details = evt.address.details;
      if(details.postcode){
         map.getView().setZoom(19);
      }else if(details.city){
         map.getView().setZoom(17);
      }else if(details.state){
         map.getView().setZoom(13);
      }else if(details.country){
         map.getView().setZoom(5);
      }else{
         map.getView().setZoom(3);
      }
      map.getView().setCenter(evt.coordinate);
   });

   $('.js-place-search-filter-radius').on('change', function(){
      gisportal.geolocationFilter.drawCurrentFilter();
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
      }
      $('.ol3-geocoder-btn-search').trigger('click');
   });

   $('.js-box-search-filter').on('click', function(){
      if($(this).hasClass('searchInProgress')){
         gisportal.geolocationFilter.cancelDraw();
      }else{
         gisportal.geolocationFilter.toggleDraw('Box');
      }
   });

   $('.js-polygon-search-filter').on('click', function(){
      if($(this).hasClass('searchInProgress')){
         gisportal.geolocationFilter.cancelDraw();
      }else{
         gisportal.geolocationFilter.toggleDraw('Polygon');
      }
   });
};

gisportal.geolocationFilter.toggleDraw = function(type)  {
   cancelDraw();
   if (gisportal.geolocationFilter.draw !== null) {
      gisportal.geolocationFilter.cancelDraw();
   }
   
   if (type != 'None') {
      if (type == "Polygon") {
         gisportal.geolocationFilter.draw = new ol.interaction.Draw({
            source:gisportal.geolocationFilter.geocoder.getSource(),
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
            source: gisportal.geolocationFilter.geocoder.getSource(),
            type: 'LineString',
            geometryFunction: geometryFunction,
            maxPoints: 2
         });
         map.addInteraction(gisportal.geolocationFilter.draw);
      }


      if(gisportal.geolocationFilter.draw){
         $(document).on( 'keydown', function ( e ) {
            if(e.keyCode == 27){
               gisportal.geolocationFilter.cancelDraw();
               gisportal.events.trigger('body.keydown', e.keyCode);
            }
         });
         gisportal.geolocationFilter.draw.once('drawstart',
            function(evt) {
               gisportal.geolocationFilter.geocoder.getSource().clear();
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
               gisportal.currentSearchedBoundingBox = wkt;
               if(gisportal.projection != 'EPSG:4326'){
                  wkt.toGeographic();
               }
               gisportal.geolocationFilter.drawCurrentFilter();
            }, this);
      }
   }
};

gisportal.geolocationFilter.cancelDraw = function(){
   $(document).off( 'keydown' );
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
         poly.toMercator();
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