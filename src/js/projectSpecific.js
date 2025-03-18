/**------------------------------*\
 Project Specific Script
 This file adds the functionality 
 to have project specific tab added
 to the side panel
\*------------------------------------*/


gisportal.projectSpecific = {};

gisportal.projectSpecific.initDOM=function(){
    if(gisportal.config.hideMapSettings){
      document.getElementsByClassName('map-settings-list')[0].style.display='none';
      document.getElementsByClassName('js-map-options')[0].style.display='none';
    }
    if(gisportal.config.projectSpecificPanel){
      // Want to finalise initialisation if the user clicks the tab
      $('#project-specific-panel').on('click',function(){
        gisportal.projectSpecific.finaliseInitialisation();
      });
      
      // Want Enhanced Popups to initialise on Boot
      if (gisportal.config.enhancedPopupDetails){
        gisportal.projectSpecific.finaliseInitialisation();
      }
      
      document.getElementById('side-panel').style['min-width']='500px'; // Now we have an extra tab we need to increase the min-width

      document.getElementById('project-specific-panel').className='js-show-panel tab';
      
      // Load the Project HTML
      gisportal.projectSpecific.loadProjectHTML();

      // Load the Project CSS
      gisportal.projectSpecific.loadProjectCSS();

      // Decide appearance of timeline
      if (gisportal.config.hideTimeline){
        document.getElementsByClassName('timeline-container')[0].style.display='none';
      }
      // Decide appearance of Compare/Swipe buttons
      if (gisportal.config.hideCompareSwipeButtons){
        document.getElementById('compare-map').style.display='none';
        document.getElementById('swipe-map').style.display='none';
      }
    }
  };
gisportal.enhancedOverlay={};
gisportal.enhancedPopup={};
gisportal.inSitu={};

gisportal.projectSpecific.finaliseInitialisation=function(){
  if (gisportal.config.enhancedOverlayDetails){
    
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
      
      // Unhide first widget - there is a better way to do this
      document.getElementById('satellite-label').style.display='block';
      document.getElementById('overlay-satellite-picker').style.display='block';
      
      gisportal.enhancedOverlay.discoverAvailableOverlays();
      
      // Populate the available dates
      gisportal.enhancedOverlay.waitForOverlays(0);
      
    }
    
    else if (gisportal.config.enhancedPopupDetails){
      gisportal.enhancedPopup.popup={};
      gisportal.projectSpecific.alterPopupResponse=true;

      gisportal.enhancedPopup.populateWidgets();

    }

    else if (gisportal.config.inSituDetails){
      console.log('Now initilising for Synced-Ocean');
      gisportal.inSitu.overlays = {};
      gisportal.inSitu.overlays.markers = {};
      gisportal.inSitu.overlays.geoJSONS = {};

      gisportal.inSitu.initialisePlaceholderData();
      gisportal.inSitu.initialiseSyncedStyles();
      gisportal.inSitu.readDefaultgeoJSONS(); 
      gisportal.inSitu.addEventListenersToButtons();
      gisportal.projectSpecific.addMarker();
    }
    else{
    }

};
//************************//
// Tools for all projects //
//************************//

gisportal.projectSpecific.buildDropdownWidget=function(widgetName,arrayOfItems){
  
  var newHTMLStart='<select id="'+widgetName+'" class="js-'+gisportal.config.projectSpecificPanel.projectName+'-dropdown">';
  var newHTMLInnards='';
  var newHTMLEnd='</select>';
  for (var i = 0; i < arrayOfItems.length ; i ++){
      newHTMLInnards=newHTMLInnards+'<option value="'+arrayOfItems[i]+'">'+arrayOfItems[i]+'</option>';
    }
  var newHTMLAll=newHTMLStart+newHTMLInnards+newHTMLEnd;
  $('#'+widgetName).replaceWith(newHTMLAll);
  

};

gisportal.projectSpecific.displayAlteredPopup=function(pixel,map){
  if (gisportal.config.enhancedPopupDetails){
    gisportal.enhancedPopup.usePreviousCoordinates = false;
    gisportal.projectSpecific.constructAlteredPopup(pixel,map);
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

gisportal.projectSpecific.loadProjectHTML=function(){
  $.ajax({
    url:  '.../../app/settings/read_project_html/'+gisportal.config.projectSpecificPanel.projectName,
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
};

gisportal.projectSpecific.loadProjectCSS=function(){
  $.ajax({
    url: gisportal.middlewarePath + '/settings/read_project_css',
    success:function(data){
      if (!data){
        return;
      }
      else{
      headTag = document.getElementsByTagName('head')[0];
      styleForProject=document.createElement('style');
        styleForProject.innerHTML=data;
        headTag.appendChild(styleForProject);
      }
    },
    error: function(e){
        $.notify('There was an issue reading the project css server side',e);
      }
  });
};

gisportal.projectSpecific.editArrayBeforeDisplaying = function(data){
  // This takes data returned from geoserver and sanitises the array before displaying in a table format
  if (gisportal.config.enhancedPopupDetails){
    editedOutput=[];
    for (var i = 0; i < data.length; i++){
      editedOutput.push(
        // Update object below you need to update the index for the colouring of the table
        {
          'Literature Type':data[i].Type_of_literature,
          'Subject/Taxa':data[i].Population_Level_2,
          'Habitat/Species':data[i].Population_Level_3,
          'Development Phase':data[i]['Intervention_-_Level_1'],
          'Ecosystem Service':data[i].ES_Only,          
          'Detailed Ecosystem Service':data[i].Environmental_Impact,
          'Article Reference':data[i].Article_Reference,
        }
        );
        }
    }
    return editedOutput;
};

// ***************** //
// Synced-Ocean Code //
// ***************** //
gisportal.inSitu.initialisePlaceholderData=function(){
  $.ajax({
    url: gisportal.middlewarePath + '/settings/read_project_json',
    success:function(data){
      
      var gliderInitialERDDAPPath = data.gliderInitialERDDAPPath;
      var l4InitialERDDAPPath = data.l4InitialERDDAPPath;
      var e1InitialERDDAPPath = data.e1InitialERDDAPPath;
      var questInitialERDDAPPath = data.questInitialERDDAPPath;

      document.getElementById('glider-plot').src = gliderInitialERDDAPPath;
    },
    error: function(e){
      $.notify('There was an issue initialising the project JSON file',e);
    },
  });
};

gisportal.inSitu.initialiseSyncedStyles=function(){
    gisportal.inSitu.iconStyles = {};
  
    // Define the style of the glider icon
    var gliderStyle = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5], 
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: 'images/glider_snap_edited.png', 
        scale: 0.1,
      }),
    });
  
    // Define the style of the l4 buoy
    var l4Style = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5], 
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: 'images/l4_no_bg_cropped_1.png', 
        scale: 0.1,
      }),
    });

    // Define the style of the e1 buoy
    var e1Style = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5], 
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: 'images/e1_edited.png', 
        scale: 0.21,
      }),
    });

    var textStyle = new ol.style.Style({
      text: new ol.style.Text({
        anchor: [0, 0],
        font: '21px Arial', // Set your font size and type
        text: 'Mission Area', // The text to display
        fill: new ol.style.Fill({ color: '#000000' }), // Text color
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }), // Optional outline for readability
        offsetY: 0, // Optional offset to position the text above a marker
      }),
    });

    gisportal.inSitu.iconStyles.glider = gliderStyle;
    gisportal.inSitu.iconStyles.l4 = l4Style;
    gisportal.inSitu.iconStyles.e1 = e1Style;
    gisportal.inSitu.iconStyles.missionText = textStyle;
};

gisportal.inSitu.initialiseIconPopUp=function(){
  var popupElement = document.createElement('div');
  popupElement.className = 'ol-popup-synced';
  popupElement.style.position = 'absolute';
  popupElement.style.backgroundColor = 'white';
  popupElement.style.padding = '10px';
  popupElement.style.borderRadius = '8px';
  popupElement.style.border = '1px solid black';
  popupElement.style.minWidth = '150px';
  popupElement.style.maxWidth = '200px';
  popupElement.style.fontSize = '12px';

  var popupOverlay = new ol.Overlay({
    element: popupElement,
    positioning: 'bottom-center', // Position popup at the bottom center of the clicked feature
    stopEvent: false,
    offset: [0, -15], // Offset so it sits just above the marker
  });

  map.addOverlay(popupOverlay);

  map.on('singleclick', function (event) {
    // Hide the popup by default
    popupOverlay.setPosition(undefined);
  
    // Detect features at the clicked location
    map.forEachFeatureAtPixel(event.pixel, function (feature) {
      var coordinates = feature.getGeometry().getCoordinates();
  
      // Get the feature's data (e.g., name, description) if you stored any attributes
      var featureInfo = feature.get('info') || 'No additional information';
  
      // Set the popup content
      popupElement.innerHTML = featureInfo;
  
      // Position the popup overlay at the feature's coordinates
      popupOverlay.setPosition(coordinates);
  
      return true; // Stop iteration over features when the first feature is found
    });
  });

  // var style = document.createElement('style');
  // style.innerHTML = '''
  //   .ol-popup {
  //     font-family: Arial, sans-serif;
  //     box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  //   }
  // ''';
  document.head.appendChild(style);
};

gisportal.inSitu.readDefaultgeoJSONS=function(){
  $.ajax({
    url: gisportal.middlewarePath + '/plotting/get_default_shapes',
    success:function(data){
      gisportal.inSitu.defaultGeoJSON = data;
      console.log('Read the default JSONs into: ',gisportal.inSitu.defaultGeoJSON);
      },
    error: function(e){
        $.notify('There was an issue reading the default geoJSONs',e);
      }
  });
};

gisportal.inSitu.displayMissionArea = function(){
  gisportal.selectionTools.loadGeoJSON(gisportal.inSitu.defaultGeoJSON[2].data, 'Mission_Area', false,false,true);
  
  var textFeature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([-4.932, 50.0])), // Set your desired coordinates
  });

  textFeature.setStyle(gisportal.inSitu.iconStyles.missionText);
  var textSource = new ol.source.Vector({
    features: [textFeature],
  });

  var textLayer = new ol.layer.Vector({
    source: textSource,
  });
  
  map.addLayer(textLayer);
};


gisportal.inSitu.displayGliderWaypoints=function(){
  // Read in the current time / layers loaded
  // gisportal.inSitu.readVitals()
  
  // Get the top directory of the geoJSON store (SERVERSIDE)
  // Determine how many waypoints we need to upload for this date (SERVERSIDE)

  // Remove Existing Gliders
  gisportal.projectSpecific.removeGliderMarkers();

  // Initialise Empty Array to Store
  gisportal.inSitu.overlays.markers.gliders = [];
  
  // Waypoint GeoJSONs need to be added to a features dict;
  waypoint0 = {features:{0:gisportal.inSitu.defaultGeoJSON[0]}};
  waypoint0 = {features:{0:gisportal.inSitu.defaultGeoJSON[0]}};

  gisportal.selectionTools.loadGeoJSON(gisportal.inSitu.defaultGeoJSON[0].data, 'Glider480', false,false,true);
  gisportal.selectionTools.loadGeoJSON(gisportal.inSitu.defaultGeoJSON[1].data, 'Glider481', false,false,true);

  gisportal.projectSpecific.updateGliderMarker(gisportal.inSitu.defaultGeoJSON[0].data.geometry.coordinates[0]);
  gisportal.projectSpecific.updateGliderMarker(gisportal.inSitu.defaultGeoJSON[1].data.geometry.coordinates[0]);

};

gisportal.inSitu.readVitals=function(){
  // This function needs to read in the day / time stamp, the layers loaded and anything else that we need to rely on
  // Could this be a tool that others could lean on - abstract this up to project level

  // To return a dictionairy of the vitals 
};

gisportal.inSitu.addEventListenersToButtons=function(){
  var inSituButtons = document.getElementsByClassName('sidebar-plot');
  var updateButton = document.getElementById('update-plots');
  var addGliderWaypoints = document.getElementById('add-glider-waypoint');
  var addMissionArea = document.getElementById('add-mission-area');

  for (var i = 0; i < inSituButtons.length; i ++){
    inSituButtons[i].addEventListener('click',gisportal.inSitu.constructERDDAPLink);
  }
  updateButton.addEventListener('click',gisportal.inSitu.updatePlots);
  addGliderWaypoints.addEventListener('click',gisportal.inSitu.displayGliderWaypoints);
  addMissionArea.addEventListener('click',gisportal.inSitu.displayMissionArea);
};

gisportal.inSitu.updatePlots=function(){
  // Read in the time / data source / colour scheme
  // gisportal.inSitu.readVitals()

  // Construct the ERDDAP URL here:
  sourceURL = gisportal.inSitu.constructERDDAPLink();

  console.log('Updating the plots');
  document.getElementById('glider-plot').src = sourceURL;
};

gisportal.inSitu.constructERDDAPLink=function(){
  console.log('Constructing ERDDAPP in here');

  base_url = 'https://erddap.eofrom.space/erddap/tabledap/';

  var gliderErddap = gisportal.config.inSituDetails.gliderERDDAP;

  return gliderErddap;
};

gisportal.projectSpecific.removeGliderMarkers = function(){
  gliderLayersToRemove = gisportal.inSitu.overlays.markers.gliders;

  if (glidersLayersToRemove){
    for (var index = 0; index < gisportal.inSitu.overlays.markers.gliders.length; index ++){
      map.removeLayer(gliderLayersToRemove[index]);
    }
  }
};

gisportal.projectSpecific.updateGliderMarker = function(start_position){
  var glider_feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([start_position[0],start_position[1]])), // Set to your desired coordinates
  });
  
  glider_feature.setStyle(gisportal.inSitu.iconStyles.glider);
  glider_feature.set('info', 'GLIDER INFO');

  // Create a vector source and add the feature
  var vectorSource = new ol.source.Vector({
    features: [glider_feature],
  });

  // Create a vector layer with the vector source
  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  // Add the vector layer to the map
  map.addLayer(vectorLayer);
  
  // Add the layer to the array so we can remove them layer
  var gliderMarkerToRemove = gisportal.inSitu.overlays.markers.gliders;
  gliderMarkerToRemove.push(vectorLayer);
  gisportal.inSitu.overlays.markers.gliders = gliderMarkerToRemove;
};

gisportal.projectSpecific.addMarker = function(){
  var l4_feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([-4.217, 50.250])), // Set to your desired coordinates
  });
  var e1_feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([-4.374, 50.044])), // Set to your desired coordinates
  });

  // Apply the style to the feature
  l4_feature.setStyle(gisportal.inSitu.iconStyles.l4);
  e1_feature.setStyle(gisportal.inSitu.iconStyles.e1);
  l4_feature.set('info','INFO for l4');
  e1_feature.set('info','INFO for e1');
  e1_feature.set('htmlContent','<li class=""><div class="panel-tab no-gap active clearix instructions"><span><img src="/images/qc_outputs_table.png" class="sidebar-plot"></span></div></li>)');
  // Create a vector source and add the feature
  var vectorSource = new ol.source.Vector({
    features: [l4_feature,e1_feature],
  });

  // Create a vector layer with the vector source
  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  // Add the vector layer to the map
  map.addLayer(vectorLayer);
};

//*********************//
// Enhanced Popup Code //
//*********************// 

gisportal.enhancedPopup.populateWidgets=function(){
    $.ajax({
      url: gisportal.middlewarePath + '/settings/read_project_json',
      success:function(data){
        var literatureArray = data.Literature.sort();
        var population2Array = data['Population_-_level_2'].sort();
        var developmentArray = data.Development.sort();
        var esimpactArray = data.Services.sort();
        var directionArray = data.Direction.sort();

        // Add No Filter here so that so this is the top most entry 
        literatureArray.unshift('No Filter');
        population2Array.unshift('No Filter');
        developmentArray.unshift('No Filter');
        esimpactArray.unshift('No Filter');
        directionArray.unshift('No Filter');

        if ($(gisportal.config.enhancedPopupDetails.filterDropDownElements[0]).val()){
          // If there are already values in the filters then we don't want to overwrite them
          return;
        }

        gisportal.projectSpecific.buildDropdownWidget('lit-picker',literatureArray); 
        gisportal.projectSpecific.buildDropdownWidget('pop2-picker',population2Array);
        gisportal.projectSpecific.buildDropdownWidget('devphase-picker',developmentArray); 
        gisportal.projectSpecific.buildDropdownWidget('esimpact-picker',esimpactArray); 
        gisportal.projectSpecific.buildDropdownWidget('esdirection-picker',directionArray); 

        // Add event listeners to the widgets
        gisportal.enhancedPopup.addEventListenersToFilterDropdowns();
        
        if (gisportal.projectState){
          if (gisportal.projectState.popupState && gisportal.projectState.filterValues && !gisportal.projectState.initialLoadComplete){
            var filterArray = gisportal.config.enhancedPopupDetails.filterDropDownElements;

            for (var i = 0 ; i < filterArray.length ; i ++){
              $(filterArray[i]).val(gisportal.projectState.filterValues[filterArray[i]]);
            }
            gisportal.enhancedPopup.usePreviousCoordinates=true;
            gisportal.enhancedPopup.bbox=gisportal.projectState.popupState.bbox;
            gisportal.enhancedPopup.coordinate=gisportal.projectState.popupState.coordinate;
            gisportal.projectSpecific.constructAlteredPopup(gisportal.projectState.popupState.pixel,map);
            gisportal.projectState.initialLoadComplete=true;
          }
        }
      },
      error: function(e){
          $.notify('There was an issue reading the widget details server side',e);
        }
    });
};

gisportal.projectSpecific.resetFilterDropdowns=function(){
  var filterArray = gisportal.config.enhancedPopupDetails.filterDropDownElements;
  for (var i = 0 ; i < filterArray.length ; i ++){
    $(filterArray[i]).val('No Filter');
  }
  gisportal.projectSpecific.decideDropdownDecision();
};

gisportal.projectSpecific.decideDropdownDecision=function(){
  
  // There is a popup already on the screen so we want to repeat the popup request
  if (document.getElementsByClassName('ol-overlay-container')[0].style.display=='none'){
  }
  else{
    gisportal.enhancedPopup.usePreviousCoordinates = true;
    gisportal.projectSpecific.constructAlteredPopup(gisportal.enhancedPopup.pixel,gisportal.enhancedPopup.map);
    
  }
};

gisportal.projectSpecific.constructAlteredPopup=function(pixel,map){
  // Store the position of the last click 
  gisportal.enhancedPopup.pixel=pixel;
  gisportal.enhancedPopup.map=map;
  
  // Check to see if a specific layer is loaded
  if (gisportal.projectSpecific.checkLayerLoadedOntoMap(gisportal.config.enhancedPopupDetails.linkedWindfarmAndConsequenceLayerName)){
      var isFeature = false;
      var coordinate;
      if (gisportal.enhancedPopup.usePreviousCoordinates){
        coordinate = gisportal.enhancedPopup.coordinate;
      }
      else{
        coordinate = map.getCoordinateFromPixel(pixel);
        gisportal.enhancedPopup.coordinate=coordinate;
      }

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
        var feature_found = false;
        $.each(gisportal.selectedLayers, function(i, selectedLayer) {
          if(gisportal.pointInsideBox(coordinate, gisportal.layers[selectedLayer].exBoundingBox)){
             feature_found = true;
             var layer = gisportal.layers[selectedLayer];

             var request=gisportal.buildFeatureInfoRequest(layer,map,pixel);
             gisportal.enhancedPopup.request=request;

            //  Need to intercept the request here if this is the first load from a share state
            if (gisportal.projectState){
              if (!gisportal.projectState.initialLoadComplete){
                request=gisportal.projectState.popupState.request;
              }
            }
             
            //  Step1 - Send off initial request to determine the Windfarm_ID that was pressed
             if(request && layer.urlName==gisportal.config.enhancedPopupDetails.linkedWindfarmAndConsequenceLayerName){
                $.ajax({
                   url:  gisportal.middlewarePath + '/settings/load_data_values?url=' + encodeURIComponent(request) + '&name=' + layer.descriptiveName + '&units=' + layer.units,
                   success: function(data){
                    try{
                        
                        // Check to see that we clicked inside a windfarm region:
                        if (data.includes('no features were found')){
                          $(elementId +' .loading').remove();
                          $(elementId).prepend('<li>'+ layer.descriptiveName +'</br>No Features Were Found');
                        }
                        else{
                          // ** Step2 - Send off request to get all of the elements for that Windfarm_ID **
                              
                          // Build request 
                          var windfarmID=gisportal.enhancedPopup.findWindfarmID(data);
                          gisportal.enhancedPopup.popup.windfarmID=windfarmID;
                          
                          // Determine if we should filter the data
                          var filteringPossible = true;
                          if (data.includes('No information found')){
                            filteringPossible = false;
                          }
                          gisportal.enhancedPopup.popup.filteringPossible=filteringPossible;

                          var newRequest=gisportal.enhancedPopup.constructWFSRequestWithAllWindfarmID(layer,windfarmID,filteringPossible);
                          gisportal.enhancedPopup.processWFSRequest(newRequest,elementId);
                        }
                        }
                        catch(e){
                        $(elementId +' .loading').remove();
                        $(elementId).prepend('<li>'+ layer.descriptiveName +'</br>N/A/li>');
                      }
                    },
                      error: function(e){
                      $(elementId +' .loading').remove();
                      $(elementId).prepend('<li>' + layer.descriptiveName +'</br>N/A</li>');
                   }
                });
             }

             else{
              $.ajax({
                url:  gisportal.middlewarePath + '/settings/load_data_values?url=' + encodeURIComponent(request) + '&name=' + layer.descriptiveName + '&units=' + layer.units,
                success: function(data){
                  if (!document.getElementById('popup-other-layers')){
                    $(elementId).append('<p id="popup-other-layers">Other Layers</li>');
                  }
                   try{
                      $(elementId +' .loading').remove();
                      $(elementId).append('<li>'+ data +'</li>');
                    }
                    catch(e){
                      $(elementId +' .loading').remove();
                      $(elementId).append('<li>'+ layer.descriptiveName +'</br>N/A/li>');
                   }
                },
                error: function(e){
                   $(elementId +' .loading').remove();
                   $(elementId).append('<li>' + layer.descriptiveName +'</br>N/A</li>');
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

gisportal.enhancedPopup.addEventListenersToFilterDropdowns=function(){
  var filterArray = gisportal.config.enhancedPopupDetails.filterDropDownElements;
  for (var i = 0 ; i < filterArray.length ; i ++){
    $(filterArray[i]).change(gisportal.projectSpecific.decideDropdownDecision);
  }
  $('#clear-filters').click(gisportal.projectSpecific.resetFilterDropdowns);      
};

gisportal.enhancedPopup.readFilterValues=function(){
  filterValues={};
  var filterArray = gisportal.config.enhancedPopupDetails.filterDropDownElements;
  for (var i = 0 ; i < filterArray.length ; i ++){
    filterValues[filterArray[i]]=$(filterArray[i]).val();
  }
  return filterValues;
};

gisportal.enhancedPopup.processWFSRequest=function(request,elementId){
  $.ajax({
    url: gisportal.middlewarePath + '/settings/query_geoserver?url=' + encodeURIComponent(request),
    success:function(data){
      try{
        var createTable = true;
        var colourTable = gisportal.config.enhancedPopupDetails.colourTable;
        var editedData = gisportal.projectSpecific.editArrayBeforeDisplaying(data);
        var tableRows = editedData;
        // Initialise the Table:
        $(elementId +' .loading').remove();

        // Check to see if there is a table already there - this prevents seeing the same table twice 
        if (document.getElementById('table-scroll')){
          return;
        }
        $(elementId).prepend('<div id="table-scroll"><table class="popup-table"></table></div>');
        
        // Sort out table styling for few rows
        if (data.length===0){
          $(elementId).prepend('Current filters returned no records');
          document.getElementById('table-scroll').style.height='auto';
        }
        
        else if (data.length<5){
          if (data.length==1){
            // Check to see if there is no information in the table
            if (data[0].Article_Reference=='No information found'){
              $(elementId).prepend('<div id="no_data">No information relating to Ecosystem Services found </div>');
              createTable = false;
            }
          }
          document.getElementById('table-scroll').style.height='auto';
        }

        // Add additional Details Above Table
        gisportal.enhancedPopup.popup.windfarmName=data[0].Windfarm_Name;
        gisportal.enhancedPopup.popup.totalRecords=data.length;
        
        // Create new containers for positioning
        $(elementId).prepend('<div id="popup-info-parent"></div>');
        
        if (createTable){
          gisportal.enhancedPopup.generatePopupHTML();
        }

        if (Object.keys(gisportal.enhancedPopup.popup.filterObject).length>0 && createTable){
          $(elementId).append('<div id="filters_applied">** Filters Applied: '+JSON.stringify(gisportal.enhancedPopup.popup.filterObject)+' **</div>');
        }
        if (gisportal.enhancedPopup.popup.windfarmName){
          if (createTable){
            $('#popup-info-wfdetails').prepend('<button id="download-data-table" class=""><span class="icon-filled-download-2">  Download Data</span></button>');
            $('#download-data-table').on('click', gisportal.enhancedPopup.downloadTable);
            $('#popup-info-wfdetails').prepend('<div id="total_records">Number of Records: '+gisportal.enhancedPopup.popup.totalRecords+'</div>');
          }
          $('#popup-info-wfdetails').prepend('<div id="windfarm_name">Windfarm: '+gisportal.enhancedPopup.popup.windfarmName+'</div>');
        }
        if (createTable){
          var table = document.getElementsByClassName("popup-table")[0];
          var headers = Object.keys(tableRows[0]);
          gisportal.generateTableHead(table, headers);
          gisportal.generateTable(table,tableRows,headers);
          if (gisportal.config.enhancedPopupDetails.mergeReferences){
            gisportal.enhancedPopup.mergeCommonReferences(table);
          }
        }
        if (colourTable){
          rows=document.getElementsByClassName('popup-table')[0].getElementsByTagName('tr');
          for (var i = 1; i < rows.length; i++){
            cells=rows[i].getElementsByTagName('td');
            if (cells[5].innerHTML.includes('Negative')){
              rows[i].className = "negative-row";
            }
            else if (cells[5].innerHTML.includes('Positive')){
              rows[i].className = "positive-row";
            }
            else if (cells[5].innerHTML.includes('No')){
              rows[i].className = "no-row";
            }
            else if (cells[5].innerHTML.includes('Inconclusive')){
              rows[i].className = "inconclusive-row";
            }
            else{
              // Do nothing - no colour
            }
          }
        }
      }
      catch(e){
      }
    }
  });
};

gisportal.enhancedPopup.mergeCommonReferences=function(table){
  var rowCounter;
  var previousReference='';
  
  // Identify the rows of interest
  var rowsToAdjust=table.getElementsByTagName('tr');
  
  for (var j = 1; j < rowsToAdjust.length; j++){
    // Identify the cells in that row
    var articleCell = rowsToAdjust[j].getElementsByTagName('td')[rowsToAdjust[j].getElementsByTagName('td').length-1];
    var currentReference = articleCell.textContent;
    articleCell.className = 'blank-col'; // This will make the entire reference column blank
    if (!previousReference){
      rowCounter=0;
      previousReference=currentReference;
    }
    else{
      if (currentReference==previousReference){
        rowCounter++;
        articleCell.remove();
        articleCellToExtend=rowsToAdjust[j-rowCounter].getElementsByTagName('td')[rowsToAdjust[j-rowCounter].getElementsByTagName('td').length-1];
        articleCellToExtend.rowSpan=1+rowCounter;
        // articleCellToExtend.className = 'blank-col'; // This will make the extended reference cells blank
      }
      else{
        rowCounter=0;
        previousReference=currentReference;
      }
    }
  }
};

gisportal.enhancedPopup.generatePopupHTML=function(){
  $('#popup-info-parent').prepend('<div id="popup-info-key-holder"></div>');
  $('#popup-info-parent').prepend('<div id="popup-info-wfdetails"></div>');
  
  $('#popup-info-key-holder').prepend('<div id="popup-info-right-col"></div>');
  $('#popup-info-key-holder').prepend('<div id="popup-info-left-col"></div>');
  $('#popup-info-key-holder').prepend('<div id="popup-info-key"></div>');

  $('#popup-info-key').prepend('<p>Key:</p>');
  $('#popup-info-left-col').prepend('<div id="negative-square" class="key-square">Negative</div>');
  $('#popup-info-left-col').prepend('<div id="positive-square" class="key-square">Positive</div>');
  $('#popup-info-right-col').prepend('<div id="no-square" class="key-square">No Impact</div>');
  $('#popup-info-right-col').prepend('<div id="inconclusive-square" class="key-square">Inconclusive</div>');

};

gisportal.enhancedPopup.constructWFSRequestWithAllWindfarmID=function(layer,windfarmID,filteringPossible){
  
  // Custom Filter Return
  var wfsURL = layer.wmsURL.replace(gisportal.config.enhancedPopupDetails.linkedWindfarmAndConsequenceLayerStringReplacement,'wfs?'); 
  var requestType = 'GetFeature';
  var typeName = gisportal.config.enhancedPopupDetails.linkedWindfarmAndConsequenceLayerName;
  var outputFormat = 'application/json';
  var filter='<Filter><And><PropertyIsEqualTo><PropertyName>Windfarm_ID</PropertyName><Literal>'+windfarmID+'</Literal></PropertyIsEqualTo>';

  // Additional Filtering Here
  var combinedString = '';

  if (filteringPossible){
    combinedString = gisportal.enhancedPopup.constructFilterString('table');
  }

  var wfsRequest=
    wfsURL +
    'typename='+typeName+'&' +
    'request='+requestType+'&' +
    'outputFormat='+outputFormat+'&' +
    'filter='+filter+combinedString+'</And></Filter>';
  return wfsRequest;
};

gisportal.enhancedPopup.downloadTable=function(){
  // Find the layer loaded onto the map
  var downloadLayerName = '';
  var allLayers=map.getLayers().array_;
  for (var i = 0; i < allLayers.length; i++){
    if (allLayers[i].values_.id.includes(gisportal.config.enhancedPopupDetails.linkedWindfarmAndConsequenceLayerName)){
      downloadLayerName = allLayers[i].values_.id;
    } 
  }
  layer = gisportal.layers[downloadLayerName];

  // Need to consider if the data is filtered
  var wfsURL = layer.wmsURL.replace(gisportal.config.enhancedPopupDetails.linkedWindfarmAndConsequenceLayerStringReplacement,'wfs?');
  var requestType = 'GetFeature';
  var typeName = gisportal.config.enhancedPopupDetails.linkedDownloadLayerName;
  var outputFormat = 'csv';
  var filter='<Filter><And><PropertyIsEqualTo><PropertyName>Windfarm_ID</PropertyName><Literal>'+gisportal.enhancedPopup.popup.windfarmID+'</Literal></PropertyIsEqualTo>';
  var combinedString = '';

  if (gisportal.enhancedPopup.popup.filteringPossible){
    combinedString = gisportal.enhancedPopup.constructFilterString('download');
  }

  wfsRequest=
    wfsURL+
    'typename='+typeName+'&' +
    'request='+requestType+'&' +
    'outputFormat='+outputFormat+'&' +
    'filter='+filter+combinedString+'</And></Filter>';
  
  window.open(wfsRequest);
};

gisportal.enhancedPopup.constructFilterString=function(process){

  var litType = 'litType';
  var esDirection = 'esDirection';
  var esImpact = 'esImpact';
  var devPhase = 'devPhase';
  var pop2 = 'pop2';

  var litFilterQuery='';
  var esDirectionFilterQuery='';
  var esImpactFilterQuery='';
  var devPhaseFilterQuery='';
  var population2FilterQuery='';
  var filterObject={};

  var litFilter=$('#lit-picker').val();
    if (litFilter!='No Filter' && litFilter!==null ){
      litFilterQuery='<PropertyIsLike wildCard="*" singleChar="." escape="!"><PropertyName>'+gisportal.config.enhancedPopupDetails.filterNameObject[process][litType]+'</PropertyName><Literal>*'+litFilter+'*</Literal></PropertyIsLike>';
      filterObject.Lit_Type=litFilter;
    }
  var esDirectionFilter=$('#esdirection-picker').val();
    if (esDirectionFilter!='No Filter' && esDirectionFilter!==null ){
      esDirectionFilterQuery='<PropertyIsLike wildCard="*" singleChar="." escape="!"><PropertyName>'+gisportal.config.enhancedPopupDetails.filterNameObject[process][esDirection]+'</PropertyName><Literal>*'+esDirectionFilter+'*</Literal></PropertyIsLike>';
      filterObject.ES_Direction=esDirectionFilter;
    }

    var esImpactFilter=$('#esimpact-picker').val();
    if (esImpactFilter!='No Filter' && esImpactFilter!==null ){
      esImpactFilterQuery='<PropertyIsLike wildCard="*" singleChar="." escape="!"><PropertyName>'+gisportal.config.enhancedPopupDetails.filterNameObject[process][esImpact]+'</PropertyName><Literal>*'+esImpactFilter+'*</Literal></PropertyIsLike>';
      filterObject.ES_Impact=esImpactFilter;
    }

    var devPhaseFilter=$('#devphase-picker').val();
    if (devPhaseFilter!='No Filter' && devPhaseFilter!==null ){
      devPhaseFilterQuery='<PropertyIsLike wildCard="*" singleChar="." escape="!"><PropertyName>'+gisportal.config.enhancedPopupDetails.filterNameObject[process][devPhase]+'</PropertyName><Literal>*'+devPhaseFilter+'*</Literal></PropertyIsLike>';
      filterObject.Development_Phase=devPhaseFilter;
    }
    
    var population2Filter=$('#pop2-picker').val();
    if (population2Filter!='No Filter' && population2Filter!==null ){
      population2FilterQuery='<PropertyIsLike wildCard="*" singleChar="." escape="!"><PropertyName>'+gisportal.config.enhancedPopupDetails.filterNameObject[process][pop2]+'</PropertyName><Literal>*'+population2Filter+'*</Literal></PropertyIsLike>';
      filterObject.Subject_Taxa=population2Filter;
    }
    
    gisportal.enhancedPopup.popup.filterObject=filterObject;

    var returnString=litFilterQuery+esDirectionFilterQuery+esImpactFilterQuery+devPhaseFilterQuery+population2FilterQuery;
    return returnString;
};

gisportal.enhancedPopup.findWindfarmID=function(featureInfoResponse){
  lineBreakString='--------------------------------------------<br />'; 
  lengthOfLineBreakString=lineBreakString.length;
  indexOfLineBreak=featureInfoResponse.indexOf(lineBreakString); 

  leftoverRecord=featureInfoResponse.slice(indexOfLineBreak+lengthOfLineBreakString); // Remove the top part of the response which we are not interested in
  indexOfWindfarmIDNewLine=leftoverRecord.indexOf('<br');

  windfarmIDContents=leftoverRecord.slice(0,indexOfWindfarmIDNewLine);
  windfarmIDEqualsIndex=windfarmIDContents.indexOf('=');
  windfarmIDValue=leftoverRecord.slice(windfarmIDEqualsIndex+2,indexOfWindfarmIDNewLine); // Need to add two here to slice inclusively and remove the proceeding ' '
  return(windfarmIDValue);

};


gisportal.enhancedPopup.constructAJAX=function(columnName){
  gisportal.enhancedPopup[columnName]={};
  
  // Build Route:
  tagSearch='rsg:'+columnName;
  baseURL=gisportal.config.enhancedPopupDetails.baseURL;
  consequencesLayerName=gisportal.config.enhancedPopupDetails.consequencesLayerName;
  ajaxURL=baseURL+'typename='+consequencesLayerName+'&valueReference='+columnName+'&request=GetPropertyValue';
  
  $.ajax({
    url:  encodeURI(ajaxURL),
    datatype:'xml',
    success: function(data){
          var xmlElements = data.getElementsByTagName(tagSearch);
          
          gisportal.enhancedPopup[columnName]=gisportal.enhancedPopup.createUniqueArray(xmlElements);
        },
        error: function(e){
          $.notify("Something went wrong with the AJAX request");
    }
  });
};

gisportal.enhancedPopup.createUniqueArray=function(array){
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

//***********************//
// Enhanced Overlay Code //
//***********************//

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

// Fix the URL not working for Geoserver SLD styling