/**------------------------------*\
    Comparison Script
    This file is for the comparison 
    aids. This adds the ability to 
    compare layers across dates using
    either two maps (compare mode) 
    or one single map (swipe mode)
    which is split by a swipe bar.
\*------------------------------------*/

gisportal.comparison = {};

gisportal.comparison.initDOM = function(){
   // gisportal.createComparisonBaseLayers();
   gisportal.swipeBarPosition={};

    //Swipe map
   $('.js-swipe').on('click', gisportal.initialiseSwipeFeature);  
   
   //Compare map
   $('.js-compare').on('click', gisportal.initialiseCompareFeature);

   // Exit Button
   $('.js-exit-compare').on('click', gisportal.exitCompareViews);

 gisportal.isComparisonValid = function (comparisonType){
    // Read in the pre-existing layers on the map
    var map_layers=map.getLayers();
    
    // Decide whether we can use the swipe function based on pre-loaded indicators
    if (map_layers.array_.length===0 || map_layers.array_.length==1 ){
       $.notify(comparisonType+" function requires one base map and at least one indicator to be loaded");
       return false;
    }
    
    else{
       // Number of layers is at least two - need to check they are not just indicator layers
       // Confirm that the 0th item in array is a baseMap before doing anything else
       // Test that there is a baseMap layer loaded
       var zeroethIndexLayerID = map_layers.array_[0].values_.id;
       var availableBaseMaps=Object.keys(gisportal.baseLayers);
       var availableBaseMapsCount=availableBaseMaps.length;
       var exitFlag=true; // Assume there is not a baseMap
       var exitFlagBingMaps=false; // Assume that the baseMap is not from Bing
       // Loop over the available baseLayers
       for (var i=0; i<availableBaseMapsCount; i++){
          var baseMap = availableBaseMaps[i];
          if (baseMap==zeroethIndexLayerID){
            // Check to see if the layer is Bing or Ordnance Survey
             if (zeroethIndexLayerID.search('Bing')>-1){
               exitFlagBingMaps=true;
             }
             else{
                exitFlag=false;
             }
             break;
          }
       }
      //  Test that there is a WFS layer loaded - these will not be supported by the compare features
      var exitFlagWFSlayer=false;
      var layersLoadedToMap=gisportal.selectedLayers;
      for (var y=0;y<layersLoadedToMap.length;y++){
         try{
            if (gisportal.layers[layersLoadedToMap[y]].serviceType){
               exitFlag=true;
               exitFlagWFSlayer=true;
            }
         }
         catch (error){
         }
      }

       // Test that there is a countryBorder layer loaded - countryBorders are always the last item in the array
       var exitFlagCountryBorders=false;
       var lastIndexLayerID = map_layers.array_[map_layers.array_.length-1].values_.id;
       var availableCountryBorders=Object.keys(gisportal.countryBorderLayers);
       var availableCountryBordersCount=availableCountryBorders.length;
       // Loop over the available countryBorders
       for (var j=0; j<availableCountryBordersCount; j++){
          var countryBorders = availableCountryBorders[j];
          if (countryBorders==lastIndexLayerID){
             exitFlag=true;
             exitFlagCountryBorders=true;
             break;
          }
       }

      //  Test that if we are interested in comparing separate layers that only one layer is allowed
      var exitFlagSingleLayerOnly = false;
      var projectSpecificMessage = '';
      if (gisportal.config.compareSwipeDifferentLayers){
         var totalNumberOfDataLayers = 0;
         var allMapLayers = map.getLayers().array_;
         for (var z = 0; z < allMapLayers.length; z++){
            if (allMapLayers[z].values_.type == 'OLLayer'){
               totalNumberOfDataLayers++;
            }
         }
         if (totalNumberOfDataLayers > 1){
            exitFlag=true;
            exitFlagSingleLayerOnly=true;
         } 

         // Test that if we are comparing different data layers that there is no additional project specifics to cater for
         projectSpecificObject = gisportal.projectSpecific.confirmProjectSpecificComparison();
         exitFlagProjectSpecific = projectSpecificObject.flag;
         projectSpecificMessage = projectSpecificObject.message;
         
         if (exitFlagProjectSpecific){
            exitFlag = true;
         }
      }
       
       if (exitFlag){
          if (exitFlagWFSlayer){
            $.notify(comparisonType+" function does not currently support WFS layers");
          }
          if (exitFlagCountryBorders){
             $.notify(comparisonType+" function does not currently support any country borders");
          }
          else if (exitFlagBingMaps){
            $.notify(comparisonType+" function does not currently support any Bing or Ordnance Survey baseMaps. Try again with one of the following:\nEoX\nEoX Sentinel-2 Cloudless\nGEBCO\nBlue Marble\nBlack Marble\nOpen Street Map");
          }
          else if (exitFlagSingleLayerOnly){
             $.notify(comparisonType+" function only supports comparing a single data layer. Try again with one data layer loaded to your map");
            }
          else if (exitFlagProjectSpecific){
             $.notify(comparisonType+projectSpecificMessage);
          }
          else{
             $.notify(comparisonType+" function requires one base map and at least one indicator to be loaded.");
          }  
          return false;
         }
       
       else {
          // Notify users about the styling
          var warnFlag=false;
          var indicatorLayers =  map_layers.array_.slice(1); // Slice the remaining objects in the array
          indicatorLayers.forEach(function(indicatorLayer){
             try{
                var layerDefaultStyle=gisportal.layers[indicatorLayer.values_.id].defaultStyle;
                var layerDefaultMax=gisportal.layers[indicatorLayer.values_.id].defaultMaxScaleVal;
                var layerDefaultMin=gisportal.layers[indicatorLayer.values_.id].defaultMinScaleVal;
                
                var layerStyle=indicatorLayer.values_.source.params_.STYLES;
                var layerMax=indicatorLayer.values_.source.params_.colorscalerange.split(',')[1];
                var layerMin=indicatorLayer.values_.source.params_.colorscalerange.split(',')[0];
                
                if (layerDefaultStyle==layerStyle && layerDefaultMax==layerMax && layerDefaultMin==layerMin){
                }
                else{
                   warnFlag=true;
                }
             }
             catch(err){
                // Something went wrong with reading the default style for the layer - raise the warnFlag
                warnFlag=true;
             }
             });
             // Prevent re-occurence of this message if there is already aa swipe or comparison screen loaded
             if (warnFlag && document.getElementById('map-holder').className=='standard-view' && !gisportal.config.compareSwipeDifferentLayers){
                var firstString='The palette and/or colorscale range is different from the defaults set for this layer.\n';
                var secondString='This is not yet supported using this feature so you may notice differences in the styling of your comparison screens';
                $.notify(firstString+secondString);
             }

          return true;
       }
    }
 };

 gisportal.initialiseComparisonHUD = function(){
    // Hide the side panel to stop it from obscuring view and launch the Comparison Screen HUD
    document.getElementsByClassName('js-hide-panel')[0].click();
    document.getElementById('comparison-details').style.display='block';
       
    if (gisportal.config.compareSwipeDifferentLayers){
      // Hide the other table
      document.getElementById('comparison-dates').style.display='none';
      
      // Empty the date value for the Fixed Date:
      document.getElementById('fixed-layer').innerHTML='';

      // Add event listener for when the layer is changed
      // timelineDateEntry.addEventListener('change',updateComparisonHUDLayers);

      gisportal.updateComparisonHUDLayers();

    }
    else{
      // Hide the other table
      document.getElementById('comparison-layer').style.display='none';

      // Empty the date value for the Fixed Date:
      document.getElementById('fixed-date').innerHTML='';
   
      var timelineDateEntry=document.getElementsByClassName('js-current-date')[0];
      timelineDateEntry.addEventListener('change',gisportal.updateComparisonHUD);
   
      gisportal.updateComparisonHUD();
       
      }
    };

gisportal.updateComparisonHUDLayers = function(){
      
      // Read the layers from the maps
      var initialMapLayers=map.getLayers().array_.slice(1)[0];
      var initialCompareLayers=compare_map.getLayers().array_.slice(1)[0];
      
      var initialMapLayerName = layerOnly(initialMapLayers.values_.title);
      
      if (initialCompareLayers){
         var initialCompareLayerName = layerOnly(initialCompareLayers.values_.title);
         if (document.getElementById('fixed-layer').innerHTML===''){
            document.getElementById('fixed-layer').innerHTML=initialCompareLayerName;
         }
      }
      document.getElementById('scrollable-layer').innerHTML=initialMapLayerName;
   };
    
gisportal.updateComparisonHUD = function(){
      // Read the date from the calendar input
      variableDate=document.getElementsByClassName('js-current-date')[0].value;
      variableDate=dateOnly(variableDate);
      
      if (document.getElementById('fixed-date').innerHTML===''){
         document.getElementById('fixed-date').innerHTML=variableDate;
      }
      document.getElementById('scrollable-date').innerHTML=variableDate;
   };

    function dateOnly(fullDateTime){
       // Only if there is a ' ' in the time do we want to slice it:
       if (fullDateTime.search(' ')>0){
          fullDateTime=fullDateTime.slice(0,fullDateTime.search(' '));
          return fullDateTime;
       }
       else{
          return fullDateTime;
       } 
    }

    function layerOnly(fullLayerTitle){
       // Remove Plymouth_Marine_Laboratory if it exists in the title:
       if (fullLayerTitle.search(':')>-1){
          layerTitleOnly=fullLayerTitle.slice(fullLayerTitle.search(': ')+2);
          return layerTitleOnly;
       }
       else{
          return layerTitleOnly;
       } 
    }

 gisportal.initialiseSynchronisedMaps = function(){
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
    
    compare_map = new ol.Map({
       target: 'compare_map',
       overlays: [gisportal.dataReadingPopupOverlayCompare],
       view: new_view,
       logo: false
    });

    // add a click event to get the clicked point's data reading - COMPARE map 
    compare_map.on('singleclick', function(e){
    gisportal.displayDataPopup(e.pixel,compare_map);
});
    map.setView(new_view);
    map.addInteraction(new ol.interaction.Synchronize({maps:[compare_map]}));
    compare_map.addInteraction(new ol.interaction.Synchronize({maps:[map]}));
    map.updateSize();

 };

 gisportal.initialiseEventListeners = function(){
   if (gisportal.config.compareSwipeDifferentLayers){
      // Add listener to change in date
      var timelineDateEntry=document.getElementsByClassName('js-current-date')[0];
      timelineDateEntry.addEventListener('change',gisportal.updateCompareMapDate);
   }  
 };

 gisportal.initialiseBaseMaps = function(){
    // Initialise the baseMap
    
    // Read in the existing baseMap which is always to 0th index:
    var map_layers=map.getLayers();
    var currentBaseMap=map_layers.array_[0].values_.id;
    compare_map.addLayer(gisportal.comparisonBaseLayers[currentBaseMap]); // Add the actual layer from the comparisonBaseLayers object to stop OL fighting between layers

   //  Look to see if graticules are loaded onto the map
   if ($('#select-graticules').data().ddslick.selectedData.value=='On'){
      gisportal.createGraticules(compare_map);
   }

 };

 gisportal.initialiseOriginalLayers = function (){
    // Replicate the original layers onto the compare_map
    var map_layers=map.getLayers();
    if (gisportal.config.compareSwipeDifferentLayers){
      // Launch HUD for layer here
      // @TODO Handle HUD For Selecting a New Layer
      
      // Do deepCopyDifferently
      gisportal.deepCopyLayer('blank');
   }
   else{
    var indicatorLayers =  map_layers.array_.slice(1); // Slice the remaining objects in the array
    indicatorLayers.forEach(function(indicatorLayer){
       gisportal.deepCopyLayer(indicatorLayer);
    });
   }
 };

/**
 * For the swipe feature the standard map sits on top of the comparison map. As the swipe bar is
 * moved across the screen the standard map is "clipped" from the left hand side to reveal the comparison
 * map underneath. So with no clipping you will see only the standard map. With 100% clipping you
 * will see only the comparison map. When we are finished with the swipe function we want to "unclip" 
 * the standard map to show it in all of its glory.  
 */
 gisportal.unclipMap = function (){
    map_element=document.getElementById('map');
    ol_unselectable=map_element.getElementsByClassName('ol-unselectable')[0];
    ol_unselectable.style.clip='auto';
 };

 gisportal.closeExistingPopups = function (){
    // Read in existing popups (there could be more than one)
    existingPopupsCloseSymbols=document.getElementsByClassName('ol-popup-closer');
    for (var h=0;h<existingPopupsCloseSymbols.length;h++){
       existingPopupsCloseSymbols[h].click();
    }
 };

gisportal.initialiseComparisonFromShareState=function(){
   // Check to see if there is a comparisonState read from the State
   if (!gisportal.comparisonState.firstRequest){
      gisportal.comparisonState.firstRequest=true;   
     if(gisportal.comparisonState.view=='swipeh'){
        document.getElementById('swipe-map').click();
      }
     else if (gisportal.comparisonState.view=='compare'){
         document.getElementById('compare-map').click();
     }
     // Put the correct dates into the HUD:    
     document.getElementById('fixed-date').innerHTML=gisportal.comparisonState.fixedDate;
     document.getElementById('scrollable-date').innerHTML=gisportal.comparisonState.variableDate;

     // Move the swipe bar and clip the map if we are in swipe map:
     if (gisportal.comparisonState.view==('swipeh')){
        document.getElementsByClassName('ol-swipe')[0].left=gisportal.comparisonState.swipeBarPosition;
        var windowWidth=window.innerWidth;
        var floatPercentageBarPosition=gisportal.comparisonState.swipeBarPosition.substring(0,gisportal.comparisonState.swipeBarPosition.length-1);
        var widthToClipInPixels=(windowWidth/100)*floatPercentageBarPosition;
        var existingClip=document.getElementById('map').getElementsByClassName('ol-layers')[0].style.clip;
        var newClip=existingClip.substring(0,existingClip.lastIndexOf(' '))+' '+parseFloat(widthToClipInPixels)+'px)';
        document.getElementById('map').getElementsByClassName('ol-layers')[0].style.clip=newClip;
        $('.ol-swipe').css('left',parseFloat(widthToClipInPixels)+'px');
     }
  }
};

};
gisportal.initialiseSwipeFeature = function(){
   // Initialise the comparison base layers
   gisportal.createComparisonBaseLayers();
   
   // Decide whether we can use the swipe function based on existing layers
   if (!gisportal.isComparisonValid('Swipe')){
      return;
   }
   
   // Close any pop-ups that currently exist on the screen
   gisportal.closeExistingPopups();
   
   if (document.getElementById('map-holder').className == 'compare'){
      // compare_map={};
      document.getElementById('map-holder').className = 'standard-view';
      var compare_map_=document.getElementById('compare_map');
      compare_map_.innerHTML = '';
      map.updateSize();
      gisportal.removeCompareDataFromTimeline();
   }
   
   if (document.getElementById('map-holder').className == 'standard-view'){
      document.getElementById('map-holder').className = 'swipeh';
      
      // $.notify("Swipe Details:\nMove the slider to the position of interest.\nMove the timeline to update the layer on the RHS.");
      
      // Synchronise both maps
      gisportal.initialiseSynchronisedMaps();
      
      // Initialise the clipping of the map to the centre of the screen
      map_element=document.getElementById('map');
      ol_unselectable=map_element.getElementsByClassName('ol-unselectable')[0];
      ol_unselectable.style.clip='rect(0px,'+map_element.offsetWidth+'px, '+map_element.offsetHeight+'px, '+map_element.offsetWidth/2+'px)';
      var swipe = new ol.control.SwipeMap({ right: true  });
      map.addControl(swipe);
      swipeElement=document.getElementsByClassName('ol-swipe')[0];
      swipeElement.style.height='40px';
      
      //  Add an Event Listener to track movements for Collaboration and Walkthroughs        
      map_element.getElementsByClassName('ol-swipe')[0].addEventListener('mouseenter',gisportal.logInSwipeBarLocation);
      map_element.getElementsByClassName('ol-swipe')[0].addEventListener('mouseleave',gisportal.logOutSwipeBarLocation);
      
      // Add a basemap to the compare_map so that it is visible
      gisportal.initialiseBaseMaps();
      
      // Add the same layers to the compare_map 
      gisportal.initialiseOriginalLayers();
      
      // Change the HUD
      gisportal.initialiseComparisonHUD();

      gisportal.initialiseEventListeners(); 
      
   }
   // The swipe function can be used for the pre-loaded indicators so start formatting screen
   else{
      var swipe_element=document.getElementsByClassName('ol-swipe');
      // map.removeControl(swipe);
      
      if (swipe_element.length>0){
         swipe_element[0].remove();
      }
      else{
      }
      document.getElementById('map-holder').className = 'standard-view' ;
      var compare_map_element=document.getElementById('compare_map');
      compare_map_element.innerHTML = '';
      document.getElementById('comparison-details').style.display='none';
      map.updateSize();
      gisportal.unclipMap();
      document.getElementsByClassName('js-show-tools')[0].click();
      gisportal.removeCompareDataFromTimeline();

   }
   // Setup for collaboration
   var params = {
      "event" : "swipeButton.clicked"
   };
   gisportal.events.trigger('swipeButton.clicked', params); 
};

gisportal.initialiseCompareFeature = function(){  
   // Initialise the comparison base layers
   gisportal.createComparisonBaseLayers();

   // Decide whether we can use the compare function based on existing layers
   if (!gisportal.isComparisonValid('Compare')){
      return;
   }
   
   // Close any pop-ups that currently exist on the screen
   gisportal.closeExistingPopups();
   
   if (document.getElementById('map-holder').className == 'swipeh'){
      var swipe_element=document.getElementsByClassName('ol-swipe');
      swipe_element[0].remove();
      gisportal.unclipMap();
      document.getElementById('map-holder').className = 'standard-view' ;
      var compare_map_element=document.getElementById('compare_map');
      compare_map_element.innerHTML = '';
      map.updateSize();
      gisportal.removeCompareDataFromTimeline();

   }
   
   if (document.getElementById('map-holder').className == 'standard-view') {
      document.getElementById('map-holder').className = 'compare';
      // Synchronise both maps
      gisportal.initialiseSynchronisedMaps();
      
      // Add a basemap to the compare_map so that it is visible
      gisportal.initialiseBaseMaps();
      
      // Add the same layers to the compare_map
      gisportal.initialiseOriginalLayers();
    
    // Unclip the map (required if we are coming from swiping)
    gisportal.unclipMap();
    
    // Change the HUD
    gisportal.initialiseComparisonHUD();

    gisportal.initialiseEventListeners(); 

   }
   else {
      // Then go back to original view
      document.getElementById('map-holder').className = 'standard-view';
      document.getElementById('comparison-details').style.display='none';
      var compare_map_=document.getElementById('compare_map');
      compare_map_.innerHTML = '';
      map.updateSize();
      gisportal.unclipMap();
      document.getElementsByClassName('js-show-tools')[0].click();
      gisportal.removeCompareDataFromTimeline();

   }
   
   // Setup for collaboration
   var params = {
    "event" : "compareButton.clicked"
   };
   gisportal.events.trigger('compareButton.clicked', params);
};

gisportal.exitCompareViews = function(){
   
   currentView=document.getElementById('map-holder').className;
   
   // Hide the HUD
   document.getElementById('comparison-details').style.display='none';
   
   // Close any pop-ups that currently exist on the screen
   gisportal.closeExistingPopups();
   
   if (currentView=='swipeh'){
      gisportal.initialiseSwipeFeature();
      document.getElementsByClassName('js-show-tools')[0].click();
   }
   else if (currentView=='compare'){
      gisportal.initialiseCompareFeature();
      document.getElementsByClassName('js-show-tools')[0].click();
   }
   
   // Setup for collaboration
   var params = {
         "event" : "exitCompareButton.clicked"
      };
   gisportal.events.trigger('exitCompareButton.clicked', params);
};

gisportal.deepCopyLayer=function(indicatorLayer){
    var indicatorLayerName = '';
    var duplicatedLayerName = '';
    var comparisonTime = '';
    if (gisportal.config.compareSwipeDifferentLayers){
      var preparedLayerName = gisportal.projectSpecific.determineCompareLayer();
      var preparedLayerTime = gisportal.projectSpecific.returnTimeStamp();
      
      indicatorLayerName=preparedLayerName;
      duplicatedLayerName=indicatorLayerName+'_copy';
      comparisonTime=preparedLayerTime;
    }
    else{
       indicatorLayerName=indicatorLayer.values_.id;
       duplicatedLayerName=indicatorLayerName+'_copy';
       comparisonTime=indicatorLayer.values_.source.params_.time;
    }
 
    var originalLayer=gisportal.layers[indicatorLayerName];
 
    // Seperate Out the options:
    var layerOptions = { 
       //new
       "abstract": originalLayer.abstract,
       "include": originalLayer.include,
       "contactInfo": originalLayer.contactInfo,
       "timeStamp":originalLayer.timeStamp,
       "owner":originalLayer.owner,
       "name": originalLayer.name,
       "title": originalLayer.title,
       "productAbstract": originalLayer.productAbstract,
       "legendSettings": originalLayer.LegendSettings,
       "type": "opLayers",
       "autoScale": originalLayer.autoScale,
       "defaultMaxScaleVal": originalLayer.defaultMaxScaleVal,
       "defaultMinScaleVal": originalLayer.defaultMinScaleVal,
       "colorbands": originalLayer.colorbands,
       "aboveMaxColor": originalLayer.aboveMaxColor,
       "belowMinColor": originalLayer.belowMinColor,
       "defaultStyle": originalLayer.defaultStyle || gisportal.config.defaultStyle,
       "log": originalLayer.log,
 
       //orginal
       "firstDate": originalLayer.firstDate, 
       "lastDate": originalLayer.lastDate, 
       "serverName": originalLayer.serverName, 
       "wmsURL": originalLayer.wmsURL, 
       "wcsURL": originalLayer.wcsURL, 
       "sensor": originalLayer.sensor, 
       "exBoundingBox": originalLayer.exBoundingBox, 
       "providerTag": originalLayer.providerTag, 
       "provider" : originalLayer.provider, 
       "offsetVectors" : originalLayer.offsetVectors, 
       "tags": originalLayer.tags
    };
 
    var duplicateLayer= new gisportal.layer(layerOptions);
    duplicateLayer.id=duplicatedLayerName;
    gisportal.layers[duplicatedLayerName]=duplicateLayer;
 
    // Now read the new layer and add it to the map 
    var layer = gisportal.layers[duplicatedLayerName];
    options={visible:true};
    var duplicatedLayerURLName=originalLayer.urlName;
    layer.urlName=duplicatedLayerURLName;
 
    comparisonObject={
       'duplicatedLayerName':duplicatedLayerName,
       'comparisonTime':comparisonTime,
    };
    layer.comparisonObject=comparisonObject;
    gisportal.getLayerData(layer.serverName + '_' + layer.urlName + '.json', layer, options);
    
 };

 gisportal.removeCompareDataFromTimeline = function(){
   if (gisportal.config.compareSwipeDifferentLayers){
      var preparedLayerName = gisportal.projectSpecific.determineCompareLayer();
      gisportal.timeline.removeTimeBarById(preparedLayerName);
   }
 };

/**
 *    Function that builds a comparison table for the overlay when selecting pixels in swipe mode
 */
 gisportal.reorganiseSwipePopup=function(layerDataReturned,elementId){
    var fixedDateData={Date:document.getElementById('fixed-date').innerHTML};
    var variableDateData={Date:document.getElementById('scrollable-date').innerHTML};
    
    // Loop over the layerDataReturned
    for (var l = 0; l<layerDataReturned.length; l++){
       
       // Layer name corresponds to the fixed map
       if (layerDataReturned[l].name.search('_copy')>0){
         fixedDateData[gisportal.layers[layerDataReturned[l].name].descriptiveName]=gisportal.getOverlayCellValue(layerDataReturned[l].result);
       }
      //  Layer name corresponds to the variable map
       else{
         variableDateData[gisportal.layers[layerDataReturned[l].name].descriptiveName]=gisportal.getOverlayCellValue(layerDataReturned[l].result);
          }
       }
    tableRows=[fixedDateData,variableDateData];
    
    // Initialise the Table:
    $(elementId +' .loading').remove();
    $(elementId).prepend('<table class="swipe-table"></table');
    var table = document.getElementsByClassName("swipe-table")[0];
    var headers = Object.keys(tableRows[0]);
    gisportal.generateTableHead(table, headers);
    gisportal.generateTable(table,tableRows,headers);
 };

/**
 *    Function that builds a comparison table for the overlay when selecting pixels in swipe mode and with two different data layers
 */
 gisportal.reorganiseSwipePopupDifferentLayers=function(layerDataReturned,elementId){
    var fixedDateData={Layer:document.getElementById('fixed-layer').innerHTML};
    var variableDateData={Layer:document.getElementById('scrollable-layer').innerHTML};
    
    // Loop over the layerDataReturned
    for (var l = 0; l<layerDataReturned.length; l++){
       
      if (layerDataReturned[l].name.search('_copy')>0){
         // Layer name corresponds to the comparison map
         fixedDateData[gisportal.layers[layerDataReturned[l].name].descriptiveName]=gisportal.getOverlayCellValue(layerDataReturned[l].result);
      }
      else if (layerDataReturned[l].name == gisportal.comparison.compareSwipeDifferentLayers.comparemapLayer){
         //  Layer name corresponds to the comparison map
          fixedDateData[gisportal.layers[layerDataReturned[l].name].descriptiveName]=gisportal.getOverlayCellValue(layerDataReturned[l].result);
       }
      //  Layer name corresponds to the variable map
       else{
         variableDateData[gisportal.layers[layerDataReturned[l].name].descriptiveName]=gisportal.getOverlayCellValue(layerDataReturned[l].result);
          }
       }
    tableRows=[fixedDateData,variableDateData];
    
    // Initialise the Table:
    $(elementId +' .loading').remove();
    $(elementId).prepend('<table class="swipe-table"></table');
    var table = document.getElementsByClassName("swipe-table")[0];
    var headers = Object.keys(tableRows[0]);
    gisportal.generateTableHead(table, headers);
    gisportal.generateTable(table,tableRows,headers);
 };
 /**
  *    Function (top-level) that tries to match the compare map overlay to the map overlay
  *    If there are any issues attempting this then just load the details to the compare map overlay in any order
  */
 gisportal.reorganiseComparePopup=function(layerDataReturned,elementId,elementIdCompare){
   // Throw out any layers which were detected to be outside the bounds
   // We need to do this because only layers inside bounds are displayed in map overlay 
   indexToRemove=[];
   // Build an array of indices to be removed 
   for (var s=0;s<layerDataReturned.length;s++){
      if (layerDataReturned[s].result=='outside'){
         indexToRemove.push(s);
      }
   }
   // Remove the indices here
   for (var item=0;item<indexToRemove.length;item++){
      if (layerDataReturned.length==1){
         layerDataReturned.pop(); // We need to pop the last element 
      }
      else{
         layerDataReturned.splice(item,1);
      }
   }
   var counter=0;
    // Try to match the order between the map overlay and compare map. When it fails just put them in any old order
    try{
       gisportal.waitForMapOverlayToFullyPopulate(counter,layerDataReturned,elementId,elementIdCompare);
    }   
    catch(e){
       gisportal.loadDataToCompareOverlay(layerDataReturned,elementIdCompare);
    }
 };

/**
 *  Function which updates the date of the layer(s) on the compare map to be displayed
 */

 gisportal.updateCompareMapDate = function(){
   // Need to find the appropriate layer
   compare_layers = compare_map.getLayers().array_.slice(1);
   for (var compareIndex = 0; compareIndex < compare_layers.length; compareIndex++){
      if (compare_layers[compareIndex].values_.type=='OLLayer'){
         initialCompareLayer = compare_layers[compareIndex];
         // Remove the existing layer
         compare_map.removeLayer(initialCompareLayer);
      }
   }
   
   var compareLayerDate = initialCompareLayer.values_.id;
   var compareLayerDates = gisportal.layers[compareLayerDate].DTCache;
   
  
   // Determine the closest date to the user selection be displayed
   var movedDate = document.getElementsByClassName('js-current-date')[0].value;
   var closestDate = findClosestLeftDate(compareLayerDates,movedDate);
   
   var params = {
      time: closestDate
   };

   // Determine the legend values from the existing layer
   if (gisportal.config.compareSwipeDifferentLayers.matchDisplaySettings){

      var layerToMatchSettings = map.getLayers().array_[1];
      var paramsToMatch = layerToMatchSettings.values_.source.params_;
      
      params = {
         time: closestDate,
         ABOVEMAXCOLOR: paramsToMatch.ABOVEMAXCOLOR,
         BELOWMINCOLOR: paramsToMatch.BELOWMINCOLOR,
         ELEVATION: paramsToMatch.ELEVATION,
         NUMCOLORBANDS: paramsToMatch.NUMCOLORBANDS,
         SRS: paramsToMatch.SRS,
         STYLES: paramsToMatch.STYLES,
         TRANSPARENT: paramsToMatch.TRANSPARENT,
         colorscalerange: paramsToMatch.colorscalerange,
         logscale: paramsToMatch.logscale,
         numcolorbands: paramsToMatch.numcolorbands
      };
   }

   gisportal.layers[compareLayerDate].mergeNewParams(params);
   compare_map.addLayer(gisportal.layers[compareLayerDate].openlayers.anID);
   
   // Re-initialise any markers which may have fallen behind layers
   gisportal.projectSpecific.compareSwipeInitialisation('compare_map'); 
 };

 /**
  * Function which takes a date value from the calendar and returns the left most closest date
  */

function findClosestLeftDate(datesArray, newDate) {
    var newDateObj = new Date(newDate);
    var closestDate = null;
    var smallestDiff = Infinity;

    for (var i = 0; i < datesArray.length; i++) {
        var dateStr = datesArray[i];
        var dateObj = new Date(dateStr);
        var diff = newDateObj - dateObj; // Difference in time (newDate - currentDate)
        if (diff > 0 && diff < smallestDiff) {
            smallestDiff = diff;
            closestDate = dateStr;
        }
    }
    return closestDate;
}
 /**
  *    Function that adds any new layer added to the compare_map to the timeline. 
  *    It also appends (Compare) to the name so that it is obvious to the user. 
  */
gisportal.addCompareLayerToTimeline = function(layer){
   var startDate = layer.firstDate;
   var endDate = layer.lastDate;
   gisportal.timeline.addTimeBar(layer.name, layer.id, layer.name, startDate, endDate, layer.DTCache);
   document.querySelector('li[data-id="' + layer.id + '"]').innerHTML = document.querySelector('li[data-id="' + layer.id + '"]').innerHTML + ' (Compare)' ;
};

 /**
  *    Function that waits until the map overlay has fully loaded. 
  *    If the map overlay has not yet loaded, wait for half a second and then try again. 
  *    If the map overlay never fully loads, load the details to the compare map overlay with the chance they will be in the wrong order
  */
 gisportal.waitForMapOverlayToFullyPopulate = function (counter,layerDataReturned,elementId,elementIdCompare){
    setTimeout(function(){
       var orderedList=gisportal.determineIfMapOverlayContentsLoaded(layerDataReturned);
       counter=counter+1;
       if (counter < 5 && !orderedList){
          gisportal.waitForMapOverlayToFullyPopulate(counter,layerDataReturned,elementId,elementIdCompare);
       }
       else {
          // check to see there is something in the orderedList because it might have time out
          if (orderedList){
             gisportal.loadDataToCompareOverlay(orderedList,elementIdCompare);
          }
          else{
             gisportal.loadDataToCompareOverlay(layerDataReturned,elementIdCompare);
          }
       }
    },500); //BODTODO Swap out 500 for a constant
 };
 /**
  *    Function to load data to the comparison map overlay
  */
 gisportal.loadDataToCompareOverlay = function (dataToUpload,elementIdCompare){
   for (var p=dataToUpload.length-1;p>=0;p--){ // Reverse read the list because we loaded it top to bottom
       $(elementIdCompare +' .loading').remove();
 
       if (dataToUpload[p].result){
          $(elementIdCompare).prepend('<li>'+ dataToUpload[p].result +'</li>');
       }
       else{
          $(elementIdCompare).prepend('<li>'+ gisportal.layers[dataToUpload[p].name].descriptiveName+'</br>N/A ' +'</li>');
       }
    }
 };
 /**
  *    Function to determine if the map overlay has finished loading. 
  *    Returns the orderlist from the map overlay once it has fully loaded
  *    Returns nothing if the map overlay has not fully loaded
  */
 gisportal.determineIfMapOverlayContentsLoaded = function(layerDataReturned){
    layersFromMapOverlay=document.getElementById('data-reading-popup').getElementsByTagName('li');
    orderedList=[];

   // Handle case when user has clicked outside of all bounds
   if (layersFromMapOverlay[0].innerHTML.search('You have clicked outside')>-1) { // This message will only appear once
      orderedList.push({name:'BLANK',result:'You have clicked outside the bounds of all layers'});
      return orderedList;
   }
   
   // Handle case when user is comparing different layers. In which case we don't worry about order - just return the input
   if (gisportal.config.compareSwipeDifferentLayers){
      orderedList = layerDataReturned;
      return orderedList;
   }
    
   // Handle the case when everything is behaving as it should do (n layers on both compare_map and map overlays)
   if (layerDataReturned.length==document.getElementById('data-reading-popup').getElementsByTagName('li').length){
       for (var f = 0; f<layersFromMapOverlay.length; f++){
          var mapOverlayCheck=gisportal.subsetLayerNamesFromFeatureInformation(layersFromMapOverlay[f].innerHTML);
          for (var i=0; i<layerDataReturned.length; i++){
             var compareOverlayCheck=gisportal.subsetLayerNamesFromFeatureInformation(layerDataReturned[i].result);
             if (!compareOverlayCheck){
                // If there was an upstream error then the subset function will return nothing. Need to revert to the descriptive name 
                compareOverlayCheck=gisportal.layers[layerDataReturned[i].name].descriptiveName;
             }
             if (compareOverlayCheck==mapOverlayCheck){
                orderedList.push(layerDataReturned[i]);
                break;
             }
             }
          }
          return orderedList;
       }
    else{
       return "";
    }
 };
 /**
  *    Extract the data of the layer from the AJAX request to determine pixel value
  */
 gisportal.subsetDataFromFeaturesInformation = function(featureInformation){
    var featureInformationDataSubsetted;
    if (featureInformation.search('<')>0){
       featureInformationDataSubsetted=featureInformation.substring(featureInformation.search('>')+1);
    }
    else if (featureInformation.search('N/A')>0){
       featureInformationDataSubsetted=featureInformation.substring(featureInformation.search('N/A'));
    }
    else{
       featureInformationDataSubsetted='';
    }
    return featureInformationDataSubsetted;
 };
 /**
  *    Extract the name of the layer from the AJAX request to determine pixel value
  */
 gisportal.subsetLayerNamesFromFeatureInformation = function(featureInformation){
    var featureInformationNameSubsetted;
    // Check to see if there is a new line
    if (featureInformation.search('<')>0){
       featureInformationNameSubsetted=featureInformation.substring(0,featureInformation.search('<'));
    }
    else if(featureInformation.search('N/A')>0){
       featureInformationNameSubsetted=featureInformation.substring(0,featureInformation.search('N/A')-1);
    }
    else {
       featureInformationNameSubsetted='';
    }
    return featureInformationNameSubsetted;
 };
 
 /**
  *    Build a table header row with coloumns for the date and each layer's descriptive name
  */
 
 gisportal.generateTableHead = function(table,data){
    var thead=table.createTHead();
    var row = thead.insertRow();

    if (gisportal.config.compareSwipeDifferentLayers){
      var swipeLHS = document.createElement("th");
      var swipeRHS = document.createElement("th");
      swipeLHS.className='swipe-table-edge';
      swipeRHS.className='swipe-table-edge';
      var lhsTitle = document.createTextNode('Layer');
      var rhsTitle = document.createTextNode('Value');
      swipeLHS.appendChild(lhsTitle);
      swipeRHS.appendChild(rhsTitle);
      row.appendChild(swipeLHS);
      row.appendChild(swipeRHS);
    } 
    else{
       for (var index=0;index<data.length;index++) {
          var th = document.createElement("th");
          th.className='swipe-table-edge';
          var text = document.createTextNode(gisportal.formatSwipeTableOverlayHeaders(data[index]));
          th.appendChild(text);
          row.appendChild(th);
       }
    } 
 };
 /**
  *    Build the table with details from the data returned from the AJAX calls
  */
 gisportal.generateTable = function(table, data,headers) {
    var headerCapturedAlready = [];
    var valueCapturedAlready = [];
    for (var jindex=0;jindex<data.length;jindex++) {
       var row = table.insertRow();
       for (var index=0;index<headers.length;index++) {
          var text = '';
          var usefulHeaderLayer = '';
         
          if (gisportal.config.compareSwipeDifferentLayers){
            // TODO Improve this pathway. This is neccessarily hacky due to the way the data is organised up until this point
            // We need to read in the layer name and then add that as a cell.
            // Then read the associated value and add that as a cell 

            // Cell List:
            var cellLayerList = [];
            var cellValueList = [];

            // Get the HeaderList
            var headerList = data[jindex];

            for (var headerIndex = 0; headerIndex < Object.entries(headerList)[0].length; headerIndex++){
               
               var headerArrayLayer = Object.entries(headerList)[headerIndex]; // This converts the object into arraus to allow us to loop over  
               var headerPotential = headerArrayLayer[0];
               
               if (headerPotential.search('Layer')===0){
                  // We want to extract the short name for the cell here
                  usefulHeaderLayer = headerPotential;
                  text = document.createTextNode(gisportal.formatSwipeTableOverlayHeaders(data[jindex][usefulHeaderLayer]));
                  
                  if (cellLayerList.length === 0 && !headerCapturedAlready.includes(text.data) ){
                     cell = row.insertCell();
                     cell.appendChild(text);
                     cellLayerList.push(text);
                     headerCapturedAlready.push(text.data);
                  }
               }
               else if (headerPotential.search('Layer')==-1){
                  // We want to extract the value for the cell here
                  usefulHeaderLayer = headerPotential;
                  text = document.createTextNode(gisportal.formatSwipeTableOverlayHeaders(data[jindex][usefulHeaderLayer]));
                  if (cellValueList.length === 0 && !valueCapturedAlready.includes(text.data+usefulHeaderLayer)){
                     cell = row.insertCell();
                     cell.appendChild(text);
                     cellValueList.push(text);
                     valueCapturedAlready.push(text.data+usefulHeaderLayer);
                  }
               }
            }
          }
          else{
             var cellNormal = row.insertCell();
             var textNormal = '';
             textNormal = document.createTextNode(gisportal.formatSwipeTableOverlayHeaders(data[jindex][headers[index]]));
             cellNormal.appendChild(textNormal);
          }
      }
    }
 };
 /**
  *    Function to format the headers to smaller names so that tables are not ginormous in width
  *    Returns existing header name if the length is less than 31 characters.
  *    Returns header name with line returns in so that the header is split over several lines to reduce width if larger than 31 characters
  */
 gisportal.formatSwipeTableOverlayHeaders = function (rawText){
    var finalHeader='';
    var formattedString='';
    var formattedStringComponents=[];
    if (rawText.length>31){
       var textComponents=rawText.split(' ');
       for (var index=0; index<textComponents.length;index++){
          if ((formattedString.length+textComponents[index].length)>31){
             // Will go over the 31 max so we need to bank what we have here:
             formattedStringComponents.push(formattedString);
             // Restart with the next word in the list
             formattedString='';
             formattedString=formattedString+' '+textComponents[index];
            }
            else{
             formattedString=formattedString+' '+textComponents[index];
          }  
       }
       // Bank whatever is left after the loop is finished
       formattedStringComponents.push(formattedString);
       formattedStringComponents=formattedStringComponents.filter(function(x){return x.length>0;});
       finalHeader=formattedStringComponents.join('\n');
       return finalHeader;
    }
    else{
       // Don't do anything our header is less than 31 characters
       return rawText;
    }
 };

 /**
  * Take the ajax response for the point value and extract the value to put into the table cell 
  */
gisportal.getOverlayCellValue=function(layerDataReturnedResult){
   if (layerDataReturnedResult){
      if (layerDataReturnedResult.search('outside')>-1){
         return 'Outside Bounds';
      }
      else{
         return gisportal.subsetDataFromFeaturesInformation(layerDataReturnedResult);
      }
   }
   else{
      return 'N/A';
   }
};
gisportal.logInSwipeBarLocation=function(event){
   gisportal.swipeBarPosition=document.getElementsByClassName('ol-swipe')[0].style.left;
};
gisportal.logOutSwipeBarLocation=function(event){
   // Read in the swipeBarPosition
   if (document.getElementsByClassName('ol-swipe')[0].style.left != gisportal.swipeBarPosition){
      map_element=document.getElementById('map');
      ol_unselectable=map_element.getElementsByClassName('ol-unselectable')[0];
      var percentageLocation=((event.x)/(window.innerWidth))*100;
      
      // Setup for collaboration
      var params = {
      "event" : "swipeBar.moved",
      "swipeBarPercentage" : percentageLocation
      };
      gisportal.events.trigger('swipeBar.moved', params);
   }
   else{
      // Do nothing as the swipe bar has not moved
   }
};

 /**
 * Create all the base layers for the comparison map.
 */
gisportal.createComparisonBaseLayers = function() {
   gisportal.comparisonFlicker={};
   gisportal.comparisonFlicker.unixTimestamp=Date.now();
   gisportal.comparisonFlicker.loadingThreshold=75; // If there are more than 75 new requests for a comparison baseMap in one second, something is going wrong so we need to exit
   var counter=0;
   var comparisonBaseLayerTileLoadFunction = function(tile, src) {
      // Read the unixTimestamp and see if one second has passed
      var currentTime=Date.now();
      var inputTimestamp=gisportal.comparisonFlicker.unixTimestamp;
      if (currentTime-1000>gisportal.comparisonFlicker.unixTimestamp){
         // 1 second has passed since the last time we saved the timestamp
         if (counter>gisportal.comparisonFlicker.loadingThreshold){
            // Something is going wrong so stop execution here
            console.log('Something is causing too many requests so graciously exiting the compare feature here');
            var currentView=document.getElementById('map-holder').className;
            gisportal.comparisonBaseLayers=null;
            if (currentView=='swipeh'){
               document.getElementById('swipe-map-mini').click();
               document.getElementsByClassName('js-show-tools')[0].click();
               return;
            }
            else if (currentView=='compare'){
               document.getElementById('compare-map-mini').click();
               document.getElementsByClassName('js-show-tools')[0].click();
               return;
            }
            counter=0;
         }
         else{
            // Everything seems in order reset the counter to 0]          
            counter=0;
         }
         gisportal.comparisonFlicker.unixTimestamp=Date.now();
      }

      gisportal.loading.increment();

      var tileElement = tile.getImage();
      tileElement.onload = function() {
         gisportal.loading.decrement();
      };
      tileElement.onerror = function() {
         gisportal.loading.decrement();
      };
      if(src.startsWith("http://")){
         src = gisportal.ImageProxyHost + encodeURIComponent(src);
      }
      tileElement.src = src;
      counter++;
   };
   // BODTODO Centralise this with the standard map layers 
   gisportal.comparisonBaseLayers = {
      EOX: new ol.layer.Tile({
         id: 'EOX',                       // required to populate the display options drop down list
         title: 'EOX',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: 'Terrain Light { Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors and <a href="#data">others</a>, Rendering &copy; <a href="http://eox.at">EOX</a> }',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'terrain-light', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true, TRANSPARENT:false },
            tileLoadFunction: comparisonBaseLayerTileLoadFunction
         }),
         viewSettings: {
            maxZoom: 13,
         }
      }),
      EOXs2cloudless: new ol.layer.Tile({
         id: 'EOXs2cloudless',                       // required to populate the display options drop down list
         title: 'EOX Sentinel-2 Cloudless',
         description: 'EPSG:4326 only, Europe only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: '<a href="https://s2maps.eu/">Sentinel-2 cloudless</a> by <a href="https://eox.at/">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2016)',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 's2cloudless', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true, TRANSPARENT:false },
            tileLoadFunction: comparisonBaseLayerTileLoadFunction
         }),
         viewSettings: {
            maxZoom: 14,
         }
      }),
      GEBCO: new ol.layer.Tile({
         id: 'GEBCO',
         title: 'GEBCO',
         projections: ['EPSG:4326', 'EPSG:3857'],
         source: new ol.source.TileWMS({
            attributions: 'Imagery reproduced from the GEBCO_2021 Grid, GEBCO Compilation Group (2021) GEBCO 2021 Grid (doi:10.5285/c6612cbe-50b3-0cff-e053-6c86abc09f8f)',
            url: 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?',
            crossOrigin: null,
            params: {LAYERS: 'GEBCO_LATEST_2', VERSION: '1.1.1', SRS: gisportal.projection, FORMAT: 'image/jpeg', wrapDateLine: true, TRANSPARENT:false },
            tileLoadFunction: comparisonBaseLayerTileLoadFunction
         }),
         viewSettings: {
            maxZoom: 7,
         }
      }),
      BlueMarble: new ol.layer.Tile({
         id: 'BlueMarble',
         title: 'Blue Marble',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: 'Blue Marble { &copy; <a href="http://nasa.gov">NASA</a> }',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'bluemarble', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true, TRANSPARENT:false },
            tileLoadFunction: comparisonBaseLayerTileLoadFunction
         }),
         viewSettings: {
            maxZoom: 8,
         }
      }),
      BlackMarble: new ol.layer.Tile({
         id: 'BlackMarble',
         title: 'Black Marble',
         description: 'EPSG:4326 only',
         projections: ['EPSG:4326'],
         source: new ol.source.TileWMS({
            attributions: 'Black Marble { &copy; <a href="http://nasa.gov">NASA</a> }',
            url: 'https://tiles.maps.eox.at/wms/?',
            crossOrigin: null,
            params: {LAYERS : 'blackmarble', VERSION: '1.1.1', SRS: gisportal.projection, wrapDateLine: true, TRANSPARENT:false },
            tileLoadFunction: comparisonBaseLayerTileLoadFunction
         }),
         viewSettings: {
            maxZoom: 8,
         }
      }),
      OSM: new ol.layer.Tile({
         id: 'OSM',
         title: 'Open Street Map',
         description: 'EPSG:3857 only',
         projections: ['EPSG:3857'],
         source: new ol.source.OSM({
            projection: gisportal.projection
         }),
         viewSettings: {
            maxZoom: 19,
         }
      }),
   };
};