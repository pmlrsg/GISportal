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
    
    // Populate the available dates
    gisportal.populateAvailableOverlays();
    
    // Display the calendar widget with dates disabled: https://stackoverflow.com/questions/15400775/jquery-ui-datepicker-disable-array-of-dates
    $("#datepicker").datepicker({
      showButtonPanel: true
    });
    
    $('.js-overlay').on('click', gisportal.overlayGIF);
    
};

gisportal.overlayGIF=function(){
  // @TODO Zoom user to appropriate level and lock zoom
  
  // @TODO Add in callback for user to adjust opacity
  
  // @TODO Read in the existing files and populate calender with approrpriate dates
  
  // @TODO Default date of calendar to the latest date available

  // @TODO Read the available files (Figure out how to handle the start dates)

  // Construct the gif_overlay 
  var pos = ol.proj.fromLonLat([-1.97, 54.6]);
  var gif_overlay = new ol.Overlay({
    position: pos,
    positioning: 'center-center',
    element: document.getElementById('gif-overlay'),
    stopEvent: false
  });
  
  map.addOverlay(gif_overlay);
  document.getElementById('gif-overlay').style.display='block';
  document.getElementById('gif-overlay').style.background='url("../../static/movie.gif") no-repeat scroll 0% 0% transparent';
  document.getElementById('gif-overlay').style.width='668px';
  document.getElementById('gif-overlay').style.height='631px';
  document.getElementById('gif-overlay').style.backgroundSize='cover';

};

gisportal.populateAvailableOverlays = function(){
  // A request to populate the dropdown with the shared polygons
  $.ajax({
     url:  gisportal.middlewarePath + '/settings/get_enhanced_overlays',
     dataType: 'json',
     success: function(data){
        gifList=data.gifList;
        directoryTop=data.directoryTop;
      
        // Build up list of array for RGB and OLCI
        var rgbFiles=[];
        var rgbDates=[];
        var chlFiles=[];
        var chlDates=[];
        var otherFiles=[];
        
        for (var i=0;i<gifList.length;i++){
          if (gifList[i].toLowerCase().includes('rgb')){
            rgbFiles.push(gifList[i]);
            rgbDates.push(gifList[i].substring(0,10));
          }
          else if (gifList[i].toLowerCase().includes('chl')){
            chlFiles.push(gifList[i]);
            chlDates.push(gifList[i].substring(0,10));
          }
          else{
            otherFiles.push(gifList[i]);
          }  
        }
        console.log('Directory Top: ',directoryTop);
        console.log('Number of files in total: ',gifList.length);
        console.log('Number of rgbFiles: ',rgbFiles.length);
        console.log('Number of chlFiles: ',chlFiles.length);
        console.log('Number of others: ',otherFiles.length);

     },
     error: function(e){
        console.log('Something went wrong');
     }
  });
};