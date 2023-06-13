/**------------------------------*\
    Enhanced Overlay Script
    This file add the functionality to 
    add additional overlays to the map
\*------------------------------------*/


gisportal.enhancedOverlay = {};

gisportal.enhancedOverlay.initDOM=function(){
    // Do something here to initialise something
    console.log('Enhanced Overlay being developed here!');
    
    $('.js-overlay').on('click', gisportal.overlayGIF);
    
};

gisportal.overlayGIF=function(){
    document.getElementsByClassName('js-hide-panel')[0].click();
    gisportal.createComparisonBaseLayers();

    // Initialise the two maps and synchronise
    var shared_view = map.getView().values_;
    
    // Synchronise the views of both maps by setting the same views
    new_view = new ol.View({
        projection: shared_view.projection,
        center: shared_view.center,
        minZoom: shared_view.minZoom,
        maxZoom: shared_view.maxZoom,
        resolution: shared_view.resolution,
        rotation: shared_view.rotation,
        zoom: shared_view.zoom,
    });
    
    // Synchronise the baseMap
    var map_layers=map.getLayers();
    var currentBaseMap=map_layers.array_[0].values_.id;
    var base_layer = gisportal.comparisonBaseLayers[currentBaseMap];

    // Construct the gif_overlay 
    var pos = ol.proj.fromLonLat([-1.97, 54.6]);
    var gif_overlay = new ol.Overlay({
      position: pos,
      positioning: 'center-center',
      element: document.getElementById('gif-overlay'),
      stopEvent: false
    });

      document.getElementsByClassName('ol-viewport')[0].style.display="none";

      // The map
      var map_paris = new ol.Map ({
        target: 'map',
        view: new_view,
        layers: [base_layer]
      });

      map_paris.addOverlay(gif_overlay);
};