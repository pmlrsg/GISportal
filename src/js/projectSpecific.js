/**------------------------------*\
 Project Specific Script
 This file adds the functionality 
 to have project specific tab added
 to the side panel
\*------------------------------------*/


gisportal.projectSpecific = {};

gisportal.projectSpecific.initDOM=function(){
    
    if(gisportal.config.projectSpecificPanel){
      // Want to finalise initialisation if the user clicks the tab
      $('#project-specific-panel').on('click',function(){
        gisportal.projectSpecific.finaliseInitialisation();
      });
      
      console.log('Enhanced Overlay being developed here!');

      document.getElementById('side-panel').style['min-width']='500px'; // Now we have an extra tab we need to increase the min-width

      document.getElementById('project-specific-panel').className='js-show-panel tab';

      // Find the project specific html to build the side panel
      $.ajax({
        url:  '.../../app/settings/get_project_specific_html/'+gisportal.config.projectSpecificPanel.projectName,
        success: function(data){
          $('#project-to-replace').replaceWith(data.toString());
        },
        error: function(e){
          console.error('Error with sending off ajax: ',e);
          $.notify("Error finding the HTML File for this specific project side panel - please contact the data owner");
          $('#project-to-replace').replaceWith('<p>Error finding the HTML File for this specific project side panel - please contact the data owner</p>');
          return;
        }
      });
    }
  };
gisportal.enhancedOverlay={}; // Initialise empty object primrose overlays

gisportal.projectSpecific.finaliseInitialisation=function(){
    if (gisportal.config.projectSpecificPanel.projectName=='primrose'){

      // Check to see that the map projection will support it
      if (!gisportal.projection.includes('3857')){
        $.notify("GIF overlays are currently only supported on baseMaps with a projection of EPSG:3857");
        return;
      }
      
      // Initialise the widgets here
      $('#overlay-satellite-picker').change(gisportal.enhancedOverlay.actionSatelliteChange);
      $('#overlay-animation-picker').change(gisportal.enhancedOverlay.populateCalendarWidget);
      $('.js-overlay-hide').on('click', gisportal.enhancedOverlay.removeOverlayGIF); 
      $('.js-overlay-show').on('click', gisportal.enhancedOverlay.showOverlayGIF);
      $('.js-show-panel').on('click', gisportal.enhancedOverlay.hideButtons);
      $('#opacity-slider').slider({
        value:0.5,step:0.1,min:0,max:1.05,
        create:function(){
          $( "#custom-handle" ).text($(this).slider('value'));
        },
        slide:function(event,ui){
          document.getElementById('project-overlay').style.opacity=ui.value;
          $( "#custom-handle" ).text(ui.value);
          
          // Setup for collab/walkthrough
          opacitySelected=ui.value;
          var params = {
            "event" : "opacity.changed",
            "opacity" : opacitySelected
          };
          gisportal.events.trigger('opacity.changed', params);
        }
      }); 
      
      // Initialise Variables here
      gisportal.enhancedOverlay.gifList=null;
      gisportal.enhancedOverlay.baseLineResolution=gisportal.config.enhancedOverlayDetails.baseLineResolution;
      gisportal.enhancedOverlay.ultimateResolution=gisportal.enhancedOverlay.baseLineResolution;
      gisportal.enhancedOverlay.currentlySelectedDate='';
      gisportal.enhancedOverlay.markerOn=false;

      // Check to see if there is a Overlay state saved
      if (gisportal.projectState){
        if (gisportal.projectState.overlayState){

          gisportal.enhancedOverlay.gifList=null;
          gisportal.enhancedOverlay.discoverAvailableOverlays();
          gisportal.enhancedOverlay.waitForOverlaysFromStateLoad(0);
        }
        return;
      }
      
      // Unhide first widget - there is a better way to do this
      document.getElementById('satellite-label').style.display='block';
      document.getElementById('overlay-satellite-picker').style.display='block';
      
      gisportal.enhancedOverlay.discoverAvailableOverlays();
      
      // Populate the available dates
      gisportal.enhancedOverlay.waitForOverlays(0);
      
          }
          // $('#overlay-animation-picker').change(gisportal.enhancedOverlay.populateCalendarWidget);
    else{
      console.log('Leaving this blank for the next project');
    }
};

//************************************************** */
// Enhanced Overlay Code designed for Primrose Ext 2 //
//************************************************** */

gisportal.enhancedOverlay.overlayGIF=function(){
  // Hide the existing gif whilst the new one loads
  if (gisportal.enhancedOverlay.markerOn){
    document.getElementById('project-overlay').style.display='none';
    gisportal.enhancedOverlay.markerOn=false;
  }

  // Display Loading Icon
  document.getElementsByClassName('global-loading-icon')[0].style.display='block';

  // Unhide the opacity-holder (now only visible after plot appears)
  document.getElementById('opacity-holder').style.display='block';
  document.getElementById('remove-holder').style.display='block';

  // Read in the value from the widgets
  var overlaySatellite=$('#overlay-satellite-picker').val();
  var overlayGIFDate=$("#datepicker").datepicker({dateFormat:'yyyy-mm-dd'}).val();
  gisportal.enhancedOverlay.currentlySelectedDate=overlayGIFDate;
  var overlayGIFDateEdited=overlayGIFDate.replace(/\//g, "-");
  var overlayGIFType=$("#overlay-animation-picker").val();
  var overlayGIFTypeEdited;
  var lon;
  var lat;
  var gifWidth;
  var gifHeight;
  switch (overlayGIFType){
    case 'enhancedRGB':
      overlayGIFTypeEdited='RGB';
      lon=gisportal.config.enhancedOverlayDetails.rgbMarkerDetails.lon;
      lat=gisportal.config.enhancedOverlayDetails.rgbMarkerDetails.lat;
      gifWidth=gisportal.config.enhancedOverlayDetails.rgbMarkerDetails.markerWidth;
      gifHeight=gisportal.config.enhancedOverlayDetails.rgbMarkerDetails.markerHeight;
      break;
    case 'chlorophyllA':
      overlayGIFTypeEdited='chl_ocx';
      lon=gisportal.config.enhancedOverlayDetails.chlMarkerDetails.lon;
      lat=gisportal.config.enhancedOverlayDetails.chlMarkerDetails.lat;
      gifWidth=gisportal.config.enhancedOverlayDetails.chlMarkerDetails.markerWidth;
      gifHeight=gisportal.config.enhancedOverlayDetails.chlMarkerDetails.markerHeight;
      break;
      default:
  }

  var overlayGIFName=gisportal.config.enhancedOverlayDetails.overlayName;
  var requestText=overlayGIFDateEdited+'&'+overlayGIFTypeEdited+'&'+overlaySatellite+'&'+overlayGIFName;
  
  // Construct the gif_overlay 
  var pos = ol.proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
  var gif_overlay = new ol.Overlay({
    position: pos,
    positioning: 'center-center',
    element: document.getElementById('project-overlay'),
    stopEvent: false
  });  
  
  map.addOverlay(gif_overlay);
  gisportal.enhancedOverlay.markerOn=true;
  
  $.ajax({
    url:  '../../app/get_single_overlay/'+requestText,
    success: function(data){
          // Turn off the Loading Icon
          document.getElementsByClassName('global-loading-icon')[0].style.display='none';
          
          // Turn on the overlay
          document.getElementById('project-overlay').style.display='block';
          document.getElementById('project-overlay').style.background='url("../../app/get_single_overlay/'+requestText+'") no-repeat scroll 0% 0% transparent';
          document.getElementById('project-overlay').style.backgroundSize='contain';
          document.getElementById('project-overlay').style.height=gifHeight;
          document.getElementById('project-overlay').style.width=gifWidth;
          gisportal.enhancedOverlay.markerOn=true;
          
          // Reset the baselineResolution if the user wants to re-initialise a new overlay
          if (gisportal.enhancedOverlay.ultimateResolution!=gisportal.enhancedOverlay.baseLineResolution){
            gisportal.enhancedOverlay.baseLineResolution=gisportal.enhancedOverlay.ultimateResolution;
          }
          // Need to scale the GIF according to resolution
          gisportal.enhancedOverlay.scaleGIF(map.getView().getResolution());
          
          // Need to track the resolution
          gisportal.enhancedOverlay.trackZoom();
          
        },
        error: function(e){
          // Turn off the Loading Icon
          document.getElementsByClassName('global-loading-icon')[0].style.display='none';
          $.notify("There was an error finding gif animations for this date - please contact the data owner");
    }
  });
    // Setup for collab/walkthrough
    var params = {
      "event" : "overlayDate.selected",
      "overlayDate" : overlayGIFDateEdited
    };
    gisportal.events.trigger('overlayDate.selected', params);
  
  
};
gisportal.enhancedOverlay.discoverAvailableOverlays = function(){
  // A request to populate the dropdown with the overlays
  $.ajax({
     url:  gisportal.middlewarePath + '/settings/get_overlay_list',
     data:{'name':gisportal.config.enhancedOverlayDetails.overlayName},
     dataType: 'json',
     success: function(data){
       gifList=data.gifList;
       gisportal.enhancedOverlay.gifList=true;

      //  Error Handling if we do not find anything of interest
      if (!gifList){
       $.notify("There was an error reading the GIF list - No overlays will be available");
       document.getElementById('overlay-satellite-picker').style.display='none';
       document.getElementById('satellite-label').innerHTML='Error finding overlays - please contact the data owner';
        return;
      }
      
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
            olciPaths.push(gifList[j]); // Any other file names we want to default to OLCI
          } 
        }

        gisportal.enhancedOverlay.satellite.viirs.rawPaths=viirsPaths;
        gisportal.enhancedOverlay.satellite.olci.rawPaths=olciPaths;
        gisportal.enhancedOverlay.satellite.other.rawPaths=otherPaths;
        
        // Organise the objects
        gisportal.enhancedOverlay.splitPathsIntoAnimationTypes(gisportal.enhancedOverlay.satellite.viirs);
        gisportal.enhancedOverlay.splitPathsIntoAnimationTypes(gisportal.enhancedOverlay.satellite.olci);

        // Interpret the dates
        gisportal.enhancedOverlay.organiseDatesForEachSatellite(gisportal.enhancedOverlay.satellite.viirs); 
        gisportal.enhancedOverlay.organiseDatesForEachSatellite(gisportal.enhancedOverlay.satellite.olci); 
        

      },
     error: function(e){
       $.notify("There was an error reading the GIF list - please contact the data owner");
       document.getElementById('overlay-satellite-picker').style.display='none';
       document.getElementById('satellite-label').innerHTML='Error finding overlays - please contact the data owner';
        return;
      }
    });
};

gisportal.enhancedOverlay.organiseDatesForEachSatellite=function(object){
  
  var rgbDates=object.rgb.rgbDates;
  var chlDates=object.chl.chlDates;
  var otherDates=object.other.otherDates;

  
  var dateResultRGB=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(rgbDates,'date');
  var dateResultChl=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(chlDates,'date');
  if (otherDates.length>0){
    var dateResultOther=gisportal.enhancedOverlay.findEarliestLatestAndMissingDates(otherDates,'date');
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

gisportal.enhancedOverlay.findEarliestLatestAndMissingDates=function(dates,arrayDateType) {
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
  var inputDateStrings;
  if (arrayDateType == 'datetime'){
    inputDateStrings = dates.map(function(date) {
      return new Date(date).toISOString().split('T')[0];
    });
  }
  else{
    inputDateStrings = dates;
  }

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
  // Setup for collab/walkthrough
  satelliteSelected=$("#overlay-satellite-picker").val();
  var params = {
    "event" : "satellite.selected",
    "satellite" : satelliteSelected
  };
  gisportal.events.trigger('satellite.selected', params);
};

gisportal.enhancedOverlay.populateCalendarWidget=function(){
  // Display calendar holder once populated 
  document.getElementById('calendar-holder').style.display='block';

  var satelliteSelection='';
  var typeSelection='';
  
  // Read the Dropdown Widgets
  var satelliteDropdownSelection = $("#overlay-satellite-picker").val();
  var typeDropdownSelection = $("#overlay-animation-picker").val();
  
  // Setup for collab/walkthrough
  var params = {
    "event" : "animation.selected",
    "animation" : typeDropdownSelection
  };
  gisportal.events.trigger('animation.selected', params);

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
        return;
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

    if (gisportal.enhancedOverlay.currentlySelectedDate){
      $('#datepicker').datepicker("setDate", gisportal.enhancedOverlay.currentlySelectedDate);
    }

    $("#datepicker").datepicker('refresh');
  }
};

gisportal.enhancedOverlay.trackZoom = function(){
  // Hide Loading Icon
  document.getElementsByClassName('global-loading-icon')[0].style.display='none';
  
  map.on('movestart',function(){
      // Need to determine if the overlay should be on or not. If we are moving the map, keep the display visible
      if (gisportal.enhancedOverlay.markerOn && map.getView().getResolution()!=gisportal.enhancedOverlay.baseLineResolution){
        document.getElementById('project-overlay').style.display='none';
      }
  });
  map.on('moveend',function(){
      // We need to determine if the resolution has changed from the starting pre-cept
      gisportal.enhancedOverlay.scaleGIF(map.getView().getResolution());
      // Need to determine if the overlay should be on or not
      if (gisportal.enhancedOverlay.markerOn){
        document.getElementById('project-overlay').style.display='block';
      }
  });
};

gisportal.enhancedOverlay.scaleGIF=function(resolution){
  var scaledResolution=resolution/(gisportal.enhancedOverlay.baseLineResolution);
  gisportal.enhancedOverlay.baseLineResolution=resolution;
  
  var existingWidth=document.getElementById('project-overlay').style.width.slice(0,-2);
  var existingHeight=document.getElementById('project-overlay').style.height.slice(0,-2);
  
  var newWidth=existingWidth*(1/scaledResolution);
  var newHeight=existingHeight*(1/scaledResolution);
  
  document.getElementById('project-overlay').style.width=newWidth+'px';
  document.getElementById('project-overlay').style.height=newHeight+'px';
};

gisportal.enhancedOverlay.removeOverlayGIF=function(){
  document.getElementById('project-overlay').style.display='none';
  gisportal.enhancedOverlay.markerOn=false;

  // Setup for collab/walkthrough
  var params = {
    "event" : "overlay.hide",
    "overlayDisplay" : gisportal.enhancedOverlay.markerOn
  };
  gisportal.events.trigger('overlay.hide', params);
};

gisportal.enhancedOverlay.showOverlayGIF=function(){
  document.getElementById('project-overlay').style.display='block';
  gisportal.enhancedOverlay.markerOn=true;

  // Setup for collab/walkthrough
  var params = {
    "event" : "overlay.show",
    "overlayDisplay" : gisportal.enhancedOverlay.markerOn
  };
  gisportal.events.trigger('overlay.show', params);
};

gisportal.enhancedOverlay.hideButtons=function(){
  document.getElementById('opacity-holder').style.display='none';
  document.getElementById('remove-holder').style.display='none';
};

gisportal.enhancedOverlay.waitForOverlaysFromStateLoad=function(counter){
  if (counter>10){
    return;
  }
  if (gisportal.enhancedOverlay.gifList===null){
    setTimeout(function(){
      counter=counter+1;
      gisportal.enhancedOverlay.waitForOverlaysFromStateLoad(counter);
    },1000);
  }
  else{
    gisportal.enhancedOverlay.finaliseOverlayFromStateLoad();
  }
};

gisportal.enhancedOverlay.finaliseOverlayFromStateLoad=function(){
    // Unhide the Widgets
    document.getElementById('satellite-label').style.display='block';
    document.getElementById('overlay-satellite-picker').style.display='block';
    document.getElementById('choose-animation-label').style.display='block';
    document.getElementById('choose-animation-widget').style.display='block';
    
    // Set the Widgets with values
    var satelliteFromState = gisportal.projectState.overlayState.overlaySelectors.satellite; 
    var gifTypeFromState = gisportal.projectState.overlayState.overlaySelectors.gifType; 
    var dateFromState = gisportal.projectState.overlayState.overlaySelectors.date;
    var opacityFromState = gisportal.projectState.overlayState.overlaySelectors.opacity;
    // @TODO Need to handle Opacity
    
    jquerySatelliteText="#overlay-satellite-picker option[value="+satelliteFromState+"]";
    jQueryGIFType="#choose-animation-widget option[value="+gifTypeFromState+"]";
    
    $(jquerySatelliteText).attr('selected','selected');
    $(jQueryGIFType).attr('selected','selected');
    
    gisportal.enhancedOverlay.populateCalendarWidget();

    // Set the calendar date to the one from the state
    $('#datepicker').datepicker("setDate", new Date(dateFromState)); 

    // Get and display the Overlay with correct Opacity
    gisportal.enhancedOverlay.overlayGIF();
    document.getElementById('custom-handle').style.left=(opacityFromState*100).toString()+'%';
    document.getElementById('custom-handle').innerHTML=opacityFromState;
    document.getElementById('project-overlay').style.opacity=opacityFromState;

};
