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
    gisportal.enhancedOverlay.gifList=null;
    
    // Populate the available dates
    gisportal.enhancedOverlay.populateAvailableOverlays();
    
    gisportal.enhancedOverlay.waitForPopulatedOverlays(0);
    
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
gisportal.enhancedOverlay.populateAvailableOverlays = function(){
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

        gisportal.enhancedOverlay.directoryTop=directoryTop;
        gisportal.enhancedOverlay.gifList=gifList;
        
        gisportal.enhancedOverlay.rgb={};
        gisportal.enhancedOverlay.chl={};

        gisportal.enhancedOverlay.rgb.rgbDates=rgbDates;
        gisportal.enhancedOverlay.chl.chlDates=chlDates;

        var dateResultRGB=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(rgbDates);
        var dateResultChl=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(chlDates);

        gisportal.enhancedOverlay.rgb.missingRGB=dateResultRGB.missing;
        gisportal.enhancedOverlay.rgb.earliest=dateResultRGB.earliest;
        gisportal.enhancedOverlay.rgb.latest=dateResultRGB.latest;
        gisportal.enhancedOverlay.rgb.missingRGB=dateResultChl.missing;
        gisportal.enhancedOverlay.rgb.earliest=dateResultChl.earliest;
        gisportal.enhancedOverlay.rgb.latest=dateResultChl.latest;


     },
     error: function(e){
        console.log('Something went wrong');
     }
  });
};

gisportal.enhancedOverlay.findEarliestLatestAndMissingDates=function(dates) {
  // Convert string dates to Date objects
  var dateObjects = dates.map(function(dateStr) {
    return new Date(dateStr);
  });

  // Find the earliest and latest dates
  var earliestDate = new Date(Math.min.apply(null, dateObjects));
  var latestDate = new Date(Math.max.apply(null, dateObjects));

  // Generate an array of all dates between the earliest and latest dates
  var allDates = [];
  var currentDate = new Date(earliestDate);
  while (currentDate <= latestDate) {
    allDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Convert the input dates and all dates to strings (e.g., "YYYY-MM-DD")
  var inputDateStrings = dates;
  var allDateString = allDates.map(function(date) {
    return date.toISOString().split('T')[0];
  });

  // Find the missing dates by comparing the input dates with all dates
  var missingDates = allDateString.filter(function(date) {
    return !inputDateStrings.includes(date);
  });

  // Format the dates as strings (e.g., "YYYY-MM-DD")
  var earliestDateString = earliestDate.toISOString().split('T')[0];
  var latestDateString = latestDate.toISOString().split('T')[0];

  // Return the earliest, latest, and missing dates
  return {
    earliest: earliestDateString,
    latest: latestDateString,
    missing: missingDates
  };
};

gisportal.enhancedOverlay.waitForPopulatedOverlays=function(counter){
  if (counter>8){
    return;
  }

  if (gisportal.enhancedOverlay.gifList===null){
    setTimeout(function(){
      counter=counter+1;
      gisportal.enhancedOverlay.waitForPopulatedOverlays(counter);
    },1000);
  }
  
  else{
      $("#datepicker").datepicker({
        showButtonPanel: true,
        minDate:new Date(gisportal.enhancedOverlay.rgb.earliest),
        maxDate:new Date(gisportal.enhancedOverlay.rgb.latest),
        beforeShowDay: function(date){
          var string = $.datepicker.formatDate('yy-mm-dd', date);
          return [ gisportal.enhancedOverlay.rgb.missingRGB.indexOf(string) == -1 ];
        }
      });
  }
};
  
