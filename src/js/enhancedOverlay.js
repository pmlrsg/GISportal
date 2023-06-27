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

    // @TODO Move this to the config
    gisportal.enhancedOverlay.baseLineResolution=3459.145;
    
    gisportal.enhancedOverlay.discoverAvailableOverlays();
    
    // Populate the available dates
    gisportal.enhancedOverlay.waitForOverlays(0);
    
    // Initialise the widgets here
    $('#overlay-animation-picker').change(gisportal.enhancedOverlay.populateCalendarWidget);
    $('.js-overlay').on('click', gisportal.enhancedOverlay.overlayGIF); //@TODO 
};

gisportal.enhancedOverlay.overlayGIF=function(){
  // Read in the value from the widgets
  var overlayGIFDate=$("#datepicker").datepicker({dateFormat:'yyyy-mm-dd'}).val();
  var overlayGIFDateEdited=overlayGIFDate.replace(/\//g, "-");
  var overlayGIFType=$("#overlay-animation-picker").val();
  var overlayGIFTypeEdited;
  var lon;
  var lat;
  switch (overlayGIFType){
    case 'enhancedRGB':
      overlayGIFTypeEdited='RGB';
      lon=-1.85;
      lat=54.40;
      break;
      case 'chlorophyllA':
        overlayGIFTypeEdited='chl_ocx';
        lon=-1.45;
        lat=54.71;
      break;
    default:
  }


  var overlayGIFDirectory=gisportal.config.overlayAnimations.overlayMasterDirectory;
  var overlayGIFDirectoryEdited=overlayGIFDirectory.replace(/\//g,"$");

  var requestText=overlayGIFDateEdited+'&'+overlayGIFTypeEdited+'&'+overlayGIFDirectoryEdited;
  console.log('Request Text: ',requestText);

  // @TODO Destroy previous overlays
  
  // @TODO Add in callback for user to adjust opacity

  // Position the marker correctly @TODO Remove this after all animations are positioned
  // lon=$("#lon-input").val(); 
  // lat=$('#lat-input').val();  
  // var gifWidthRaw=$('#width-input').val(); // 668px
  // var gifHeightRaw=$('#height-input').val(); // 631px
  // var gifWidth = gifWidthRaw+'px';
  // var gifHeight = gifHeightRaw+'px';
  
  var gifWidth = '668px';
  var gifHeight = '643px';

  // Construct the gif_overlay 
  var pos = ol.proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
  var gif_overlay = new ol.Overlay({
    position: pos,
    positioning: 'center-center',
    element: document.getElementById('gif-overlay'),
    stopEvent: false
  });  
  
  // map.getView().setZoom($('#zoom-input').val());
  map.addOverlay(gif_overlay);
  // // var img = gif_overlay.getElement();
  // console.log('img here initially: ',img);
  document.getElementById('gif-overlay').style.display='block';
  document.getElementById('gif-overlay').style.background='url("../../overlay/'+requestText+'") no-repeat scroll 0% 0% transparent';
  document.getElementById('gif-overlay').style.backgroundSize='contain';
  document.getElementById('gif-overlay').style.height=gifHeight;
  document.getElementById('gif-overlay').style.width=gifWidth;
  
  // Need to scale the GIF according to resolution
  gisportal.enhancedOverlay.scaleGIF(map.getView().getResolution());

  // Need to track the resolution
  gisportal.enhancedOverlay.trackZoom();

};
gisportal.enhancedOverlay.discoverAvailableOverlays = function(){
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

        gisportal.enhancedOverlay.rgb.missing=dateResultRGB.missing;
        gisportal.enhancedOverlay.rgb.earliest=dateResultRGB.earliest;
        gisportal.enhancedOverlay.rgb.latest=dateResultRGB.latest;
        gisportal.enhancedOverlay.chl.missing=dateResultChl.missing;
        gisportal.enhancedOverlay.chl.earliest=dateResultChl.earliest;
        gisportal.enhancedOverlay.chl.latest=dateResultChl.latest;


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

gisportal.enhancedOverlay.waitForOverlays=function(counter){
  if (counter>8){
    return;
  }

  if (gisportal.enhancedOverlay.gifList===null){
    setTimeout(function(){
      counter=counter+1;
      gisportal.enhancedOverlay.waitForOverlays(counter);
    },1000);
  }
  
  else{
    // Do nothing and stop the loop
  }
};

gisportal.enhancedOverlay.populateCalendarWidget=function(){
  var overlaySelection='';
  
  // Read the Dropdown Widget
  var dropdownSelection = $("#overlay-animation-picker").val();

  switch (dropdownSelection){
    case 'enhancedRGB':
      overlaySelection='rgb';
      break;
      case 'chlorophyllA':
        overlaySelection='chl';
      break;
    default:
  }

  $("#datepicker").datepicker('destroy');
  if (!overlaySelection){
    // Do nothing
  }
  else{
    $("#datepicker").datepicker({
      minDate:new Date(gisportal.enhancedOverlay[overlaySelection].earliest),
      maxDate:new Date(gisportal.enhancedOverlay[overlaySelection].latest),
      // changeYear: true,
      beforeShowDay: function(date){
        var string = $.datepicker.formatDate('yy-mm-dd', date);
        return [ gisportal.enhancedOverlay[overlaySelection].missing.indexOf(string) == -1 ];
      }
    });
    $("#datepicker").datepicker('refresh');
  }
};

gisportal.enhancedOverlay.trackZoom = function(){
  map.on('moveend',function(){
    // We need to determine if the resolution has changed from the starting pre-cept
    gisportal.enhancedOverlay.scaleGIF(map.getView().getResolution());
  });
};

gisportal.enhancedOverlay.scaleGIF=function(resolution){
  var scaledResolution=resolution/(gisportal.enhancedOverlay.baseLineResolution);
  gisportal.enhancedOverlay.baseLineResolution=resolution;
  
  var existingWidth=document.getElementById('gif-overlay').style.width.slice(0,-2);
  var existingHeight=document.getElementById('gif-overlay').style.height.slice(0,-2);
  
  var newWidth=existingWidth*(1/scaledResolution);
  var newHeight=existingHeight*(1/scaledResolution);
  
  document.getElementById('gif-overlay').style.width=newWidth+'px';
  document.getElementById('gif-overlay').style.height=newHeight+'px';
};