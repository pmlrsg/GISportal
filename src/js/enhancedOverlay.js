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
    gisportal.enhancedOverlay.ultimateResolution=gisportal.enhancedOverlay.baseLineResolution;
    gisportal.enhancedOverlay.markerOn=false;
    
    gisportal.enhancedOverlay.discoverAvailableOverlays();
    
    // Populate the available dates
    gisportal.enhancedOverlay.waitForOverlays(0);
    
    // Initialise the widgets here
    $('#overlay-satellite-picker').change(gisportal.enhancedOverlay.actionSatelliteChange);
    $('#overlay-animation-picker').change(gisportal.enhancedOverlay.populateCalendarWidget);
    $('.js-overlay-hide').on('click', gisportal.enhancedOverlay.removeOverlayGIF); 
    $('.js-overlay-show').on('click', gisportal.enhancedOverlay.showOverlayGIF); 
    $('#opacity-slider').slider({
      value:0.5,step:0.1,min:0,max:1.05,
      create:function(){
        $( "#custom-handle" ).text($(this).slider('value'));
      },
      slide:function(event,ui){
        document.getElementById('gif-overlay').style.opacity=ui.value;
        $( "#custom-handle" ).text(ui.value);
      }
    }); 

};

gisportal.enhancedOverlay.overlayGIF=function(){
  // Unhide the opacity-holder (now only visible after plot appears)
  document.getElementById('opacity-holder').style.display='block';
  document.getElementById('remove-holder').style.display='block';

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
        lat=54.65;
      break;
    default:
  }


  var overlayGIFDirectory=gisportal.config.overlayAnimations.overlayMasterDirectory;
  var overlayGIFDirectoryEdited=overlayGIFDirectory.replace(/\//g,"$");

  var requestText=overlayGIFDateEdited+'&'+overlayGIFTypeEdited+'&'+overlayGIFDirectoryEdited;
  console.log('Request Text: ',requestText);

  // @TODO Destroy previous overlays
    
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
  
  map.addOverlay(gif_overlay);
  gisportal.enhancedOverlay.markerOn=true;

  document.getElementById('gif-overlay').style.display='block';
  document.getElementById('gif-overlay').style.background='url("../../overlay/'+requestText+'") no-repeat scroll 0% 0% transparent';
  document.getElementById('gif-overlay').style.backgroundSize='contain';
  document.getElementById('gif-overlay').style.height=gifHeight;
  document.getElementById('gif-overlay').style.width=gifWidth;
  
  // Reset the baselineResolution if the user wants to re-initialise a new overlay
  if (gisportal.enhancedOverlay.ultimateResolution!=gisportal.enhancedOverlay.baseLineResolution){
    gisportal.enhancedOverlay.baseLineResolution=gisportal.enhancedOverlay.ultimateResolution;
  }
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
      
        // Build up objects to store olchi and viirs
        var viirsPaths=[];
        var olciPaths=[];
        var otherPaths=[];

        gisportal.enhancedOverlay.satellite={};
        gisportal.enhancedOverlay.satellite.viirs={};
        gisportal.enhancedOverlay.satellite.olci={};
        gisportal.enhancedOverlay.satellite.other={};

        for (var j=0;j<gifList.length;j++){
          if (gifList[j].toLowerCase().includes('final_viirs')){
            viirsPaths.push(gifList[j]);
          }
          else if (gifList[j].toLowerCase().includes('final_olci')){
            olciPaths.push(gifList[j]);
          }
          else{
            otherPaths.push(gifList[j]);
          } 
        }

        gisportal.enhancedOverlay.satellite.viirs.rawPaths=viirsPaths;
        gisportal.enhancedOverlay.satellite.olci.rawPaths=olciPaths;
        gisportal.enhancedOverlay.satellite.other.rawPaths=otherPaths;

        // Organise the objects
        gisportal.enhancedOverlay.splitPathsIntoAnimationTypes(gisportal.enhancedOverlay.satellite.viirs);
        gisportal.enhancedOverlay.splitPathsIntoAnimationTypes(gisportal.enhancedOverlay.satellite.olci);
        gisportal.enhancedOverlay.splitPathsIntoAnimationTypes(gisportal.enhancedOverlay.satellite.other);

        gisportal.enhancedOverlay.directoryTop=directoryTop;

        // Interpret the dates
        gisportal.enhancedOverlay.organiseDatesForEachSatellite(gisportal.enhancedOverlay.satellite.viirs); 
        gisportal.enhancedOverlay.organiseDatesForEachSatellite(gisportal.enhancedOverlay.satellite.olci); 
        gisportal.enhancedOverlay.organiseDatesForEachSatellite(gisportal.enhancedOverlay.satellite.other); 


     },
     error: function(e){
        console.log('Something went wrong');
     }
  });
};

gisportal.enhancedOverlay.organiseDatesForEachSatellite=function(object){
  
  var rgbDates=object.rgb.rgbDates;
  var chlDates=object.chl.chlDates;
  var otherDates=object.other.otherDates;

  
  var dateResultRGB=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(rgbDates);
  var dateResultChl=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(chlDates);
  if (otherDates.length>0){
    var dateResultOther=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(otherDates);
    object.other.missing=dateResultOther.missing;
    object.other.earliest=dateResultOther.earliest;
    object.other.latest=dateResultOther.latest;
  }

  object.rgb.missing=dateResultRGB.missing;
  object.rgb.earliest=dateResultRGB.earliest;
  object.rgb.latest=dateResultRGB.latest;
  object.chl.missing=dateResultChl.missing;
  object.chl.earliest=dateResultChl.earliest;
  object.chl.latest=dateResultChl.latest;
};

gisportal.enhancedOverlay.splitPathsIntoAnimationTypes=function(object) {  
    object.rgb={};
    object.chl={};
    object.other={};
  
    var gifList=object.rawPaths;
  
    // Build up list of array for RGB and OLCI
    var rgbFiles=[];
    var rgbDates=[];
    var chlFiles=[];
    var chlDates=[];
    var otherFiles=[];
    var otherDates=[];
    
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
        otherDates.push(gifList[i].substring(0,10));
      }  
    }
     object.rgb.rgbFiles=rgbFiles;
     object.rgb.rgbDates=rgbDates;
     object.chl.chlFiles=chlFiles;
     object.chl.chlDates=chlDates;
     object.other.otherFiles=otherFiles;
     object.other.otherDates=otherDates;

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

gisportal.enhancedOverlay.actionSatelliteChange=function(){
  if (document.getElementById('choose-animation-label').style.display===''){
    // Unhide both label and widget
    document.getElementById('choose-animation-label').style.display='block';
    document.getElementById('choose-animation-widget').style.display='block';
  }
  else{
    // We are now changing the widget with a calendar loaded so we need to destroy and recreate
    $("#datepicker").datepicker('destroy');
    gisportal.enhancedOverlay.populateCalendarWidget();
  }
};

gisportal.enhancedOverlay.populateCalendarWidget=function(){
  // Display calendar holder once populated 
  document.getElementById('calendar-holder').style.display='block';

  var satelliteSelection='';
  var typeSelection='';
  
  // Read the Dropdown Widgets
  var satelliteDropdownSelection = $("#overlay-satellite-picker").val();
  var typeDropdownSelection = $("#overlay-animation-picker").val();

  switch(satelliteDropdownSelection){
    case 'satellite-selection':
      return;
    case 'olci':
      satelliteSelection='olci';
      break;
    case 'viirs':
        satelliteSelection='viirs'; 
        break;
    default:
        satelliteSelection='other'; 
        break;
  }
  switch (typeDropdownSelection){
    case 'overlayType':
      return;
    case 'enhancedRGB':
      typeSelection='rgb';
      break;
      case 'chlorophyllA':
        typeSelection='chl';
      break;
    default:
      return;
  }

  $("#datepicker").datepicker('destroy');
  if (!typeSelection){
    // Do nothing
  }
  else{
    $("#datepicker").datepicker({
      minDate:new Date(gisportal.enhancedOverlay.satellite[satelliteSelection][typeSelection].earliest),
      maxDate:new Date(gisportal.enhancedOverlay.satellite[satelliteSelection][typeSelection].latest),
      // changeYear: true,
      beforeShowDay: function(date){
        var string = $.datepicker.formatDate('yy-mm-dd', date);
        return [ gisportal.enhancedOverlay.satellite[satelliteSelection][typeSelection].missing.indexOf(string) == -1 ];
      },
      onSelect:gisportal.enhancedOverlay.overlayGIF,
    });
    $("#datepicker").datepicker('refresh');
  }
};

gisportal.enhancedOverlay.trackZoom = function(){
  map.on('movestart',function(){
    // Need to determine if the overlay should be on or not
    if (gisportal.enhancedOverlay.markerOn){
      document.getElementById('gif-overlay').style.display='none';
    }
  });
  map.on('moveend',function(){
    // We need to determine if the resolution has changed from the starting pre-cept
    gisportal.enhancedOverlay.scaleGIF(map.getView().getResolution());
    // Need to determine if the overlay should be on or not
    if (gisportal.enhancedOverlay.markerOn){
      document.getElementById('gif-overlay').style.display='block';
    }
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

gisportal.enhancedOverlay.removeOverlayGIF=function(){
  document.getElementById('gif-overlay').style.display='none';
  gisportal.enhancedOverlay.markerOn=false;
};

gisportal.enhancedOverlay.showOverlayGIF=function(){
  document.getElementById('gif-overlay').style.display='block';
  gisportal.enhancedOverlay.markerOn=true;
};