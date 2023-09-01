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
      
      console.log('Working on Project Specific Stuff here!');
      
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
gisportal.projectORIES={};

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
    
    else if (gisportal.config.projectSpecificPanel.projectName=='ories'){
      console.log('Made it into the ORIES Project here');
      gisportal.projectSpecific.oriesData={};
      gisportal.projectSpecific.alterPopupResponse=true;
      
      gisportal.projectORIES.populateWidgets();
      
    }
    else{
      console.log('Leaving this blank for the next project');
    }

    // @TODO Allow the user to decide how many responses are displayed in popup
};
//************************//
// Tools for all projects //
//************************//

gisportal.projectSpecific.buildDropdownWidget=function(widgetName,arrayOfItems){
  
  var newHTMLStart='<select id="'+widgetName+'" class="js-ories-dropdown">';
  var newHTMLInnards='';
  var newHTMLEnd='</select>';
  for (var i = 0; i < arrayOfItems.length ; i ++){
      newHTMLInnards=newHTMLInnards+'<option value="'+arrayOfItems[i]+'">'+arrayOfItems[i]+'</option>';
      // newHTMLInnards=newHTMLInnards+'<option value="'+speciesArrayFromDatabase[i].toLowerCase().split(' ').join('_')+'">'+speciesArrayFromDatabase[i]+'</option>'
    }
  var newHTMLAll=newHTMLStart+newHTMLInnards+newHTMLEnd;
  $('#'+widgetName).replaceWith(newHTMLAll);
  

};

// @TODO Need to handle this at the top to ensure people who load state from link experience same UX
gisportal.projectSpecific.displayAlteredPopup=function(pixel,map){
  console.log('Organising how to handle popups differently');
  // @TODO Safeguard this against compare/swipe map
  if (gisportal.config.projectSpecificPanel.projectName=='ories'){
    // Handle the case when the ORIES project is required
    gisportal.projectSpecific.oriesAlteredPopup(pixel,map);
  } 
};

gisportal.projectSpecific.checkLayerLoadedOntoMap=function(layerName){
  var allMapLayers=map.getLayers();

  for (var i=0; i<allMapLayers.array_.length; i++){
    if (allMapLayers.array_[i].values_.source.params_){
      if (allMapLayers.array_[i].values_.source.params_.LAYERS==layerName){
        return true;
      }
  }
}
};



//****************************************//
// Decision Making tool for ORIES project //
//****************************************// 
// Get a description of the columns 
//https://rsg.pml.ac.uk/geoserver/rsg/wfs?typename=ORIES_Offshore_Wind__Crown_Estate_EnglandWalesAndNI_&request=describeFeatureType
// &outputFormat=application/json

// Get values from those columns
//https://rsg.pml.ac.uk/geoserver/rsg/wfs?typename=ORIES_Offshore_Wind__Crown_Estate_EnglandWalesAndNI_&request=GetPropertyValue&valueReference=OBJECTID&outputFormat=application/json

// Click the windfarm region, get the ID of windfarm, build up request from the consequences layer
//https://docs.geoserver.org/2.21.x/en/user/services/wfs/reference.html

// Feature Request of single row 
//https://rsg.pml.ac.uk/geoserver/rsg/wfs?typename=ORIES_Offshore_Wind__Crown_Estate_EnglandWalesAndNI_&request=GetFeature&featureID=ORIES_Offshore_Wind__Crown_Estate_EnglandWalesAndNI_.58

// Feature Request of all values with same windfarm ID
//https://rsg.pml.ac.uk/geoserver/rsg/wfs?typename=portal_view_all_windfarms_v3&version=1.1.0&request=GetFeature&Windfarm_ID=68&outputFormat=application/json&filter=%3CFilter%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3EWindfarm_ID%3C/PropertyName%3E%3CLiteral%3E68%3C/Literal%3E%3C/PropertyIsEqualTo%3E%3C/Filter%3E

gisportal.projectORIES.populateWidgets=function(){
    $.ajax({
      url: gisportal.middlewarePath + '/settings/get_ories_dropdowns',
      data:{'project-name':'ories'},
      success:function(data){
        gisportal.projectSpecific.buildDropdownWidget('esimpact-picker',['Inconclusive','No Impact','Negative Impact','Positive Impact']);
        gisportal.projectSpecific.buildDropdownWidget('pop2-picker',data['Population_-_level_2'].sort());
        gisportal.projectSpecific.buildDropdownWidget('pop3-picker',data['Population_-_level_3'].sort());
      },
      error: function(e){
          console.log('There was an issue reading the widget details server side:',e);
          $.notify('There was an issue reading the widget details server side',e);
        }
    });
};

gisportal.projectSpecific.oriesAlteredPopup=function(pixel,map){
  // @TODO Can All of this be replaced and captured at the getPointReading function?
  console.log('Handling the popup differently due to ORIES requirements');
  console.log('Pixel:',pixel);
  console.log('Map:',map);
  
  // Check to see the ORIES layer is loaded
  if (gisportal.projectSpecific.checkLayerLoadedOntoMap(gisportal.config.oriesProjectDetails.linkedWindfarmAndConsequenceLayerName)){
      var isFeature = false;
      var coordinate = map.getCoordinateFromPixel(pixel);
      var params;
      response = "";
      if (!isFeature && !gisportal.selectionTools.isDrawing && !gisportal.geolocationFilter.filteringByPolygon) {
        // AddDataPoint
        var point = gisportal.reprojectPoint(coordinate, gisportal.projection, 'EPSG:4326');
        var lon = gisportal.normaliseLongitude(point[0], 'EPSG:4326').toFixed(3);
        var lat = point[1].toFixed(3);
        var elementId = 'dataValue' + String(coordinate[0]).replace('.', '') + String(coordinate[1]).replace('.', '');
        response = '<p>Lat/lon: ' + lat + ', ' + lon + '</p><ul id="' + elementId + '"><li class="loading">Loading...</li></ul>';
        
        gisportal.dataReadingPopupContent.innerHTML = response;
        gisportal.dataReadingPopupOverlay.setPosition(coordinate);


        // GetPointReading
        elementId = '#dataValue'+ String(coordinate[0]).replace('.','') + String(coordinate[1]).replace('.','');
        console.log('Element ID = ',elementId);  
        var feature_found = false;
        $.each(gisportal.selectedLayers, function(i, selectedLayer) {
          if(gisportal.pointInsideBox(coordinate, gisportal.layers[selectedLayer].exBoundingBox)){
             feature_found = true;
             var layer = gisportal.layers[selectedLayer];
 
             var request=gisportal.buildFeatureInfoRequest(layer,map,pixel);
             console.log('Request here: ',request);
             
            //  Step1 - Send off initial request to determine the Windfarm_ID that was pressed
             if(request){
                $.ajax({
                   url:  gisportal.middlewarePath + '/settings/load_data_values?url=' + encodeURIComponent(request) + '&name=' + layer.descriptiveName + '&units=' + layer.units,
                   success: function(data){
                    gisportal.projectSpecific.dataFromInitialRequest=data; // @TODO Remove once finished dev
                    try{
                        console.log('All good ');
                        
                        //  Step2 - Send off request to get all of the elements for that Windfarm_ID
                        // Need to build new request 
                        var windfarmID=gisportal.projectORIES.findWindfarmID(data);
                        var newRequest=gisportal.projectORIES.constructWFSRequestWithAllWindfarmID(layer,windfarmID);
                        gisportal.projectORIES.processWFSRequest(newRequest,elementId);
                        }
                        catch(e){
                        console.log('Error1 ',e);
                        $(elementId +' .loading').remove();
                        $(elementId).prepend('<li>'+ layer.descriptiveName +'</br>N/A/li>');
                      }
                    },
                      error: function(e){
                      console.log('Error2 ',e);
                      $(elementId +' .loading').remove();
                      $(elementId).prepend('<li>' + layer.descriptiveName +'</br>N/A</li>');
                   }
                });
             }
          }

       });
        // gisportal.getPointReading(pixel,mapChoice);
        if(!feature_found){
          $(elementId +' .loading').remove();
          $(elementId).prepend('<li>You have clicked outside the bounds of all layers</li>');
       }
     }
  }
};

gisportal.projectORIES.processWFSRequest=function(request,elementId){
  $.ajax({
    url: gisportal.middlewarePath + '/settings/load_all_records?url=' + encodeURIComponent(request),
    success:function(data){
      try{
        console.log('Latest Data: ',data);
        var tableRows = data;
        // Initialise the Table:
        $(elementId +' .loading').remove();
        $(elementId).prepend('<table class="ories-table"></table');
        var table = document.getElementsByClassName("ories-table")[0];
        var headers = Object.keys(tableRows[0]);
        gisportal.generateTableHead(table, headers);
        gisportal.generateTable(table,tableRows,headers);
      }
      catch(e){
        console.log('Something errored on second ajax: ',e);
      }
    }
  });
};

gisportal.projectORIES.constructWFSRequestWithAllWindfarmID=function(layer,windfarmID){
  // Custom Filter Return
  var wfsURL = layer.wmsURL.replace('wms?','wfs?');
  var requestType = 'GetFeature';
  var typeName = gisportal.config.oriesProjectDetails.linkedWindfarmAndConsequenceLayerName;
  var outputFormat = 'application/json';
  var filter='<Filter><PropertyIsEqualTo><PropertyName>Windfarm_ID</PropertyName><Literal>'+windfarmID+'</Literal></PropertyIsEqualTo></Filter>';

  var wfsRequest=
    wfsURL +
    'typename='+typeName+'&' +
    'request='+requestType+'&' +
    'outputFormat='+outputFormat+'&' +
    'filter='+filter;

  return wfsRequest;
};

gisportal.projectORIES.findWindfarmID=function(featureInfoResponse){
  // @TODO Do this with the Windfarm_Name so we don't need additional column in the view 
  lineBreakString='--------------------------------------------<br />'; // @TODO Move this constant to the top?
  lengthOfLineBreakString=lineBreakString.length;
  indexOfLineBreak=featureInfoResponse.indexOf(lineBreakString); 

  leftoverRecord=featureInfoResponse.slice(indexOfLineBreak+lengthOfLineBreakString); // Remove the top part of the response which we are not interested in
  indexOfWindfarmIDNewLine=leftoverRecord.indexOf('<br');

  windfarmIDContents=leftoverRecord.slice(0,indexOfWindfarmIDNewLine);
  windfarmIDEqualsIndex=windfarmIDContents.indexOf('=');
  windfarmIDValue=leftoverRecord.slice(windfarmIDEqualsIndex+2,indexOfWindfarmIDNewLine); // Need to add two here to slice inclusively and remove the proceeding ' '
  return(windfarmIDValue);

};


gisportal.projectORIES.constructAJAX=function(columnName){
  gisportal.projectSpecific.oriesData[columnName]={};
  
  // Build Route:
  tagSearch='rsg:'+columnName;
  baseURL=gisportal.config.oriesProjectDetails.baseURL;
  consequencesLayerName=gisportal.config.oriesProjectDetails.consequencesLayerName;
  ajaxURL=baseURL+'typename='+consequencesLayerName+'&valueReference='+columnName+'&request=GetPropertyValue';
  
  $.ajax({
    url:  encodeURI(ajaxURL),
    datatype:'xml',
    success: function(data){
          console.log('Data - Within: ',columnName);
          
          // gisportal.projectSpecific.oriesData[columnName]=data;
          var xmlElements = data.getElementsByTagName(tagSearch);
          
          gisportal.projectSpecific.oriesData[columnName]=gisportal.projectORIES.createUniqueArray(xmlElements);
          console.log(gisportal.projectORIES.createUniqueArray(xmlElements),gisportal.projectORIES.createUniqueArray(xmlElements).length);
        },
        error: function(e){
          $.notify("Something went wrong with the AJAX request");
    }
  });
};

gisportal.projectORIES.createUniqueArray=function(array){
  uniqueArray=[];
  for (var i = 0; i < array.length; i++){
    cellContents=array[i].textContent.split(';');
    
    for (var j = 0; j < cellContents.length; j++){
      if (cellContents[j].indexOf(' ')===0){
        cellContents[j]=cellContents[j].substring(1);
      }
      if (!uniqueArray.includes(cellContents[j])){
        uniqueArray.push(cellContents[j]);
      }
    }
  }
  return uniqueArray;
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
  var overlayGIFDate=$("#datepicker").datepicker({dateFormat:'yyyy-mm-dd'}).val();
  gisportal.enhancedOverlay.currentlySelectedDate=overlayGIFDate;
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

  var overlayGIFName=gisportal.config.enhancedOverlayDetails.overlayName;
  var requestText=overlayGIFDateEdited+'&'+overlayGIFTypeEdited+'&'+overlayGIFName;
  var gifWidth = '668px';
  var gifHeight = '643px';
  
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



// GLOBAL TODOs FROM ORIES: Find these using global search of TODO-ORIES
// gisportal.js - Move this check later on in popup processing chain TODO
// server -  settingsroutes.js - Change name of this TODO
// server - settings.js TODO
// comparison.js - check that changes to table builder does not impact swipe table
// ?domain= Network tab error that occurs when logged out 