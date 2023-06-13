/**------------------------------*\
    Enhanced Overlay Script
    This file add the functionality to 
    add additional overlays to the map
\*------------------------------------*/


gisportal.enhancedOverlay = {};

gisportal.enhancedOverlay.initDOM=function(){
    // Do something here to initialise something
    
    if(gisportal.config.overlayAnimations){
      console.log('Enhanced Overlay being developed here!');
      // Unhide the tab at the top
      document.getElementById('overlay-animations').className='js-show-panel tab';
    }

    // Display the calendar widget with dates disabled: https://stackoverflow.com/questions/15400775/jquery-ui-datepicker-disable-array-of-dates
    $("#datepicker").datepicker({
      showButtonPanel: true
    });

    $('.js-overlay').on('click', gisportal.overlayGIF);
    
};

gisportal.overlayGIF=function(){
    // Construct the gif_overlay 
    var pos = ol.proj.fromLonLat([-1.97, 54.6]);
    var gif_overlay = new ol.Overlay({
      position: pos,
      positioning: 'center-center',
      element: document.getElementById('gif-overlay'),
      stopEvent: false
    });

      map.addOverlay(gif_overlay);
};