/**------------------------------*\
    Indicators Panel
    This file is for the indicators 
    panel, which includes features such 
    as initialising scalebar, settings 
    etc. Each indicator uses a 
    mustache template.
\*------------------------------------*/

gisportal.indicatorsPanel = {};

gisportal.indicatorsPanel.open = function() {
   if ($('.js-show-panel[data-panel-name="active-layers"]').hasClass('hidden')) {
      // Show the layers tab if it is currently hidden
      $('.js-show-panel[data-panel-name="active-layers"]').toggleClass('hidden', false);
   }
   gisportal.panels.showPanel('active-layers');
};

gisportal.indicatorsPanel.initDOM = function() {
   $('.js-indicators').on('click', '.js-toggleVisibility', function() {
      var id = $(this).closest('[data-id]').data('id');
      if (gisportal.layers[id].isVisible) {
         gisportal.indicatorsPanel.hideLayer(id);
      } else {
         gisportal.indicatorsPanel.showLayer(id);
      }
   });

   $('.js-indicators').on('click', '.js-add-to-plot', function()  {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.addToPlot(id);
      var params = {
         "event": "addToPlot.clicked",
         "id": id
      };
      gisportal.events.trigger('addToPlot.clicked', params);
   });
   $('.js-indicators').on('click', '.js-make-new-plot', function()  {
      var id = $(this).data('id');
      gisportal.graphs.deleteActiveGraph();
      gisportal.graphs.creatorId = id;
      gisportal.indicatorsPanel.addToPlot(id);
      var params = {
         "event": "newPlot.clicked",
         "id": id
      };
      gisportal.events.trigger('newPlot.clicked', params);
   });

   $('.js-indicators').on('click', '.js-clear-selection', function()  {
      gisportal.vectorLayer.getSource().clear();
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
      gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
      gisportal.currentSelectedRegion = "";
      gisportal.methodThatSelectedCurrentRegion = {};
      cancelDraw();
      $('.js-coordinates').val("");
      $('.js-upload-shape').val("");
      $('.users-geojson-files').val("default");
      var params = {
         "event": "clearSelection.clicked"
      };
      gisportal.events.trigger('clearSelection.clicked', params);
   });

   $('.js-indicators').on('click', '.js-remove', function() {
      if (gisportal.selectedLayers.length <= 1) {
         // Hide the layers tab if no layers are selected
         $('.js-show-panel[data-panel-name="active-layers"]').toggleClass('hidden', true);
         gisportal.panels.showPanel('choose-indicator');
         // Clears the vector layer to avoid confusion
         gisportal.vectorLayer.getSource().clear();
         gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
         gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
      }
      var id = $(this).closest('[data-id]').data('id');
      gisportal.indicatorsPanel.removeFromPanel(id);
   });


   $('.js-start-again').on('click', function() {
      gisportal.panels.showPanel('choose-indicator');
   });


   $('.js-indicators, #graphPanel').on('click', '.js-export-button', function() {
      var id = $(this).data('id');
      gisportal.indicatorsPanel.exportData(id);
   });


   // Scale range event handlers
   $('.js-indicators').on('change', '.js-scale-min, .js-scale-max', function() {
      var id = $(this).data('id');
      $('.js-auto[data-id="' + id + '"]').prop('checked', false).trigger('change');
   });


   // Scale range event handlers
   $('.js-indicators').on('change', '.js-scale-min, .js-scale-max, .js-indicator-is-log,  .scalevalues > input[type="checkbox"]', function() {
      var id = $(this).data('id');
      // This removed the min val in the layer so that the data is refreshed on the map
      gisportal.layers[id].minScaleVal = null;
      var min = $('.js-scale-min[data-id="' + id + '"]').val();
      var max = $('.js-scale-max[data-id="' + id + '"]').val();
      gisportal.scalebars.validateScale(id, min, max);
   });

   $('.js-indicators').on('change', '.js-scale-min', function() { 
      var params = {
         "event" : "scalebar.min-set",
         "id" : $(this).data('id'),
         "value": $(this).val()
      };
      gisportal.events.trigger('scalebar.min-set', params);
   });

   $('.js-indicators').on('change', '.js-scale-max', function() { 
      var params = {
         "event" : "scalebar.max-set",
         "id" : $(this).data('id'),
         "value": $(this).val()
      };
      gisportal.events.trigger('scalebar.max-set', params);
   });

   $('.js-indicators').on('click', '.js-indicator-is-log', function() { 
      var params = {
         "event" : "scalebar.log-set",
         "id" : $(this).data('id'),
         "isLog": $(this).prop('checked')
      };
      gisportal.events.trigger('scalebar.log-set', params);
   });

   //Auto scale range
   $('.js-indicators').on('change', '.js-auto', function() {
      var id = $(this).data('id');
      var layer = gisportal.layers[id];
      layer.autoScale = $(this).prop('checked').toString();
      if($(this).prop('checked')){
         layer.minScaleVal = null;
         layer.maxScaleVal = null;
      }
      layer.setScalebarTimeout();
      var params = {
         "event" : "scalebar.autoscale-checkbox",
         "id" : id,
         "isChecked" : $(this).prop('checked')
      };
      gisportal.events.trigger('scalebar.autoscale-checkbox', params);
   });

   // Reset scale range
   $('.js-indicators').on('click', '.js-reset', function() {
      var id = $(this).data('id');
      var layer = gisportal.layers[id];
      layer.clearScalebarTimeout();
      layer.resetting = true;
      layer.autoScale = layer.originalAutoScale;
      layer.colorbands = layer.defaultColorbands;
      layer.aboveMaxColor = layer.defaultAboveMaxColor;
      layer.belowMinColor = layer.defaultBelowMinColor;
      layer.minScaleVal = layer.defaultMinScaleVal;
      layer.maxScaleVal = layer.defaultMaxScaleVal;
      layer.log = layer.defaultLog || false;
      layer.style = layer.defaultStyle || "boxfill/rainbow";

      $('#tab-' + id + '-colorbands').val(layer.colorbands);

      selectAboveMaxBelowMinOptions(id, layer.aboveMaxColor, layer.belowMinColor);

      $('#tab-' + id + '-layer-style').ddslick('select', {value: layer.style});
      $('#tab-' + id + '-log').prop( 'checked', layer.defaultLog || false );
      var autoScale = gisportal.getAutoScaleFromString(layer.autoScale);
      $('.js-auto[data-id="' + id + '"]').prop( 'checked', autoScale );
      if(autoScale){
         layer.minScaleVal = null;
         layer.maxScaleVal = null;
         if(layer.log && layer.minScaleVal <= 0){
            layer.log = false;
            $('#tab-' + id + '-log').prop( 'checked',false );
         }
         gisportal.scalebars.autoScale(id);
      }else{
         gisportal.scalebars.updateScalebar(id);
      }
      layer.resetting = false;
      gisportal.events.trigger('scale.reset', id);
   });


   // Show the demisions panel when you click the scale bar 
   $('.js-indicators').on('click', '.js-scalebar', function() {
      var id = $(this).closest('[data-id]').data('id');
      $('.js-indicators .indicator-header[data-id="' + id + '"] [title="Scalebar"]').click();
   });


   // on change for vector style selection
   $('.js-indicators').on('change', '.js-vector-style-select',function(evt) {
      var id = $(this).closest('[data-id]').data('id');
      var prop = evt.target.value;
      gisportal.layers[id].setStyleUI(gisportal.layers[id].OLLayer.getSource(), prop);

   });


   //  Zoom to data region
   $('.js-indicators').on('click', '.js-zoom-data', function() {
      var indicator = gisportal.layers[$(this).data('id')];
      if (indicator === null){
         return;
      }

      var bbox = [
         parseFloat(indicator.exBoundingBox.WestBoundLongitude),
         parseFloat(indicator.exBoundingBox.SouthBoundLatitude),
         parseFloat(indicator.exBoundingBox.EastBoundLongitude),
         parseFloat(indicator.exBoundingBox.NorthBoundLatitude)
      ];
      var extent = gisportal.reprojectBoundingBox(bbox, 'EPSG:4326', gisportal.projection);
      
      gisportal.mapFit(extent);
      var params = {
         "event": "zoomToData.clicked",
         "layer": indicator.id
      };
      gisportal.events.trigger('zoomToData.clicked', params);
   });

   //Swipe map
   $('.js-swipe').on('click', function() {

      // Decide whether we can use the swipe function based on existing layers
      if (!gisportal.isComparisonValid('Swipe')){
         return;
      }
      
      if (document.getElementById('compare').className == 'compare'){
         console.log('Compare GUI is present - hide it');
         // compare_map={};
         document.getElementById('compare').className = 'view1';
         var compare_map_=document.getElementById('compare_map');
         compare_map_.innerHTML = '';
         map.updateSize();
      }
      
      if (document.getElementById('compare').className == 'view1'){
         console.log('Swipe GUI non existent - show it');
         document.getElementById('compare').className = 'swipeh';
         
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

         
         // Add a basemap to the compare_map so that it is visible
         gisportal.initialiseBaseMaps();
         
         // Add the same layers to the compare_map 
         gisportal.initialiseOriginalLayers();

         // Change the HUD
         gisportal.initialiseComparisonHUD();
         
         var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutationRecord) {
              var swipePosition=swipeElement.style.left;
              console.log('The swipe bar is located at: ',swipePosition);

            });    
          });

         observer.observe(swipeElement, { 
            attributes: true, 
            attributeFilter: ['style'] 
          });
      }
      // The swipe function can be used for the pre-loaded indicators so start formatting screen
      else{
         console.log('Swipe GUI already there - hide it');
         var swipe_element=document.getElementsByClassName('ol-swipe');
         // map.removeControl(swipe);
         swipe_element[0].remove();
         document.getElementById('compare').className = 'view1' ;
         var compare_map_element=document.getElementById('compare_map');
         compare_map_element.innerHTML = '';
         document.getElementById('comparisonDetails').style.display='none';
         // compare_map.updateSize(); // @TODO To be deleted once not required
         map.updateSize(); // @TODO To be deleted once not required
         gisportal.unclipMap();
         
      } 
   });


   //Compare map
   $('.js-compare').on('click', function() {
      
      // Decide whether we can use the compare function based on existing layers
      if (!gisportal.isComparisonValid('Compare')){
         return;
      }

      if (document.getElementById('compare').className == 'swipeh'){
         console.log('Swipe GUI already there - hide it');
         var swipe_element=document.getElementsByClassName('ol-swipe');
         // map.removeControl(swipe);
         swipe_element[0].remove();
         gisportal.unclipMap();
         document.getElementById('compare').className = 'view1' ;
         var compare_map_element=document.getElementById('compare_map');
         compare_map_element.innerHTML = '';
         // compare_map.updateSize(); // @TODO To be deleted once not required
         map.updateSize(); // @TODO To be deleted once not required
      }

      if (document.getElementById('compare').className == 'view1') {
         console.log('Comparison not loaded');
         document.getElementById('compare').className = 'compare';
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
      }
      else {
         // Then go back to original view
         console.log('Comparison already loaded - so hiding it and clearing the compare-map object',document.getElementById('compare').className);
         // compare_map={};
         document.getElementById('compare').className = 'view1';
         document.getElementById('comparisonDetails').style.display='none';
         var compare_map_=document.getElementById('compare_map');
         compare_map_.innerHTML = '';
         map.updateSize(); // @TODO To be deleted once not required
         gisportal.unclipMap();
         
      }
   });
   
   gisportal.isComparisonValid = function (comparisonType){
      // Read in the pre-existing layers on the map
      var map_layers=map.getLayers();
      
      // Decide whether we can use the swipe function based on pre-loaded indicators
      if (map_layers.array_.length===0 || map_layers.array_.length==1 ){
         $.notify(comparisonType+" function requires one baseMap and at least one indicator to be loaded");
         return false;
      }
      
      else{
         // Number of layers is at least two - need to check they are not just indicator layers
         // Confirm that the 0th item in array is a baseMap before doing anything else
         var zeroethIndexLayerID = map_layers.array_[0].values_.id;
         var availableBaseMaps=Object.keys(gisportal.baseLayers);
         var availableBaseMapsCount=availableBaseMaps.length;
         var exitFlag=true;
         // Loop over the available baseLayers
         for (var i=0; i<availableBaseMapsCount; i++){
            var baseMap = availableBaseMaps[i];
            if (baseMap==zeroethIndexLayerID){
               exitFlag=false;
               break;
            }
         }
         if (exitFlag){
            $.notify(comparisonType+" function requires one baseMap and at least one indicator to be loaded");
            return false;
         }
         else {
            return true;
         }
      }
   };

   gisportal.initialiseComparisonHUD = function(){
      // Hide the side panel to stop it from obscuring view and launch the Comparison Screen HUD
      document.getElementsByClassName('js-hide-panel')[0].click();
      document.getElementById('comparisonDetails').style.display='block';

      // Initialise the Dates by reading the values of the 1st indicator:
      var map_layers=map.getLayers();
      var firstLayerDate=map_layers.array_[1].values_.source.params_.time;
      var timelineDateEntry=document.getElementsByClassName('js-current-date')[0];
      console.log('timelineDateEntry : ',timelineDateEntry);
      console.log('timelineDateEntry : ',timelineDateEntry.value);
      document.getElementById('fixedDate').innerHTML=firstLayerDate;
      document.getElementById('scrollableDate').innerHTML=firstLayerDate;
      
      timelineDateEntry.addEventListener('input',updateComparisonHUD);
      
      function updateComparisonHUD()
         {
            var map_layers=map.getLayers();
            var variableDate=map_layers.array_[1].values_.source.params_.time;
            console.log('The input date changed so updating the Variable Date: ',variableDate);
            document.getElementById('scrollableDate').innerHTML=variableDate;

         }
      // var dateChange = new MutationObserver(function(mutations) {
      //       mutations.forEach(function(mutationRecord) {
      //       });    
      //    });
         
      //    dateChange.observe(timelineDateEntry.value, { 
      //    characterData: true, subtree: true
      //  });
   };

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
         // overlays: [gisportal.dataReadingPopupOverlay],
         view: new_view,
         logo: false
      });
      map.setView(new_view);
      map.addInteraction(new ol.interaction.Synchronize({maps:[compare_map]}));
      compare_map.addInteraction(new ol.interaction.Synchronize({maps:[map]}));
      map.updateSize();

   };


   gisportal.initialiseBaseMaps = function(){
      // Initialise the baseMap
      // Wierd OL workAround here: Need to add a hidden baseMap so that when we add the same baseMap there is no fighting for the ol-layer between the maps
      
      // Read in the existing baseMap which is always to 0th index:
      var map_layers=map.getLayers();
      var currentBaseMap=map_layers.array_[0].values_.id;
      var hiddenLayer;
      if (currentBaseMap=='EOX'){
         hiddenLayer='GEBCO';
      }
      else{
         hiddenLayer='EOX';
      }
      compare_map.addLayer(gisportal.baseLayers[hiddenLayer]); // Add the hidden layer
      compare_map.addLayer(gisportal.baseLayers[currentBaseMap]); // Add the actual layer
   };

   gisportal.initialiseOriginalLayers = function (){
      // Replicate the original layers onto the compare_map
      var map_layers=map.getLayers();
      var indicatorLayers =  map_layers.array_.slice(1); // Slice the remaining objects in the array
      indicatorLayers.forEach(function(indicatorLayer){
         console.log('For Each Loop is here: ',indicatorLayer);
         deepCopyLayer(indicatorLayer);
      });
   };

   gisportal.unclipMap = function (){
      map_element=document.getElementById('map');
      ol_unselectable=map_element.getElementsByClassName('ol-unselectable')[0];
      ol_unselectable.style.clip='auto';
   };

   gisportal.indicatorsPanel.duplicateState = function (compare_state) {

      // console.log('Made it into duplicate state: ', compare_state);
      // console.log('Map component: ',compare_state.map);
      // console.log('Indicators component: ',compare_state.selectedIndicators);
      // console.log('Layers component: ',compare_state.selectedLayers);
      // console.log('Date component: ',compare_state.map.date);


      compare_map_baselayer = compare_state.map.baselayer;
      compare_map_layer = compare_state.selectedLayers;

      // console.log('BASEMAP: ',compare_map_baselayer);
      // // Check to see if baseMap is already loaded correctly
      // console.log('Get Layers Here: ',compare_map.getLayers());
      // // console.log('Get Properties Here: ',compare_map.getProperties());
      // // console.log('Get LayerGroup Here: ',compare_map.getLayerGroup());
      // console.log('Get FirstLayerDetails Here: ',compare_map.getLayers().array_[0].values_);

      // Sort out the baseMap
      // compare_map.removeLayer(compare_map.getLayers().array_[0]);
      // compare_map.addLayer(gisportal.baseLayers[compare_map_baselayer]);
      
      // SORT OUT THE LAYER ADDING HERE
      
      
      // 1. Make a copy of the gisportal.layers[layer_id]
      var original_layer=gisportal.layers[compare_state.selectedIndicators[0]];
      var original_layer_openLayers=gisportal.layers[compare_state.selectedIndicators[0]].openlayers;
      original_layer.openlayers={};
      cloned_layer=JSON.parse(JSON.stringify(original_layer));
      // cloned_layer.id=cloned_layer.id+'_compare';
      
      // Seperate Out the options:
      var layerOptions = { 
         //new
         "abstract": original_layer.abstract,
         "include": original_layer.include,
         "contactInfo": original_layer.contactInfo,
         "timeStamp":original_layer.timeStamp,
         "owner":original_layer.owner,
         "name": original_layer.name,
         "title": original_layer.title,
         "productAbstract": original_layer.productAbstract,
         "legendSettings": original_layer.LegendSettings,
         "type": "opLayers",
         "autoScale": original_layer.autoScale,
         "defaultMaxScaleVal": original_layer.defaultMaxScaleVal,
         "defaultMinScaleVal": original_layer.defaultMinScaleVal,
         "colorbands": original_layer.colorbands,
         "aboveMaxColor": original_layer.aboveMaxColor,
         "belowMinColor": original_layer.belowMinColor,
         "defaultStyle": original_layer.defaultStyle || gisportal.config.defaultStyle,
         "log": original_layer.log,

         //orginal
         "firstDate": original_layer.firstDate, 
         "lastDate": original_layer.lastDate, 
         "serverName": original_layer.serverName, 
         "wmsURL": original_layer.wmsURL, 
         "wcsURL": original_layer.wcsURL, 
         "sensor": original_layer.sensor, 
         "exBoundingBox": original_layer.exBoundingBox, 
         "providerTag": original_layer.providerTag,
         // "positive" : server.options.positive, 
         "provider" : original_layer.provider, 
         "offsetVectors" : original_layer.offsetVectors, 
         "tags": original_layer.tags
      };
      
      
      var blank_layer= new gisportal.layer(layerOptions);
      // var duplicated_layer = new gisportal.layer(cloned_layer);
      // blank_layer.id='chlor_a__Plymouth_Marine_Laboratory1';

      // Add back in the openlayers
      original_layer.openlayers=original_layer_openLayers;
      







      // new_layer_name=compare_state.selectedIndicators[0]+'_compare';
      new_layer_name=blank_layer.id;
      console.log(new_layer_name);

      gisportal.layers[new_layer_name]=blank_layer;
      var layer = gisportal.layers[new_layer_name];
      options={visible:true};
      style=undefined;
      console.log('Layer: ',layer);
      layer.urlName='chlor_a';
      console.log('Options: ',options);
      console.log('Style: ',style);

      
      gisportal.getLayerData(layer.serverName + '_' + layer.urlName + '.json', layer, options, style);
      // // Remove event listeners:
      // layer.openlayers.anID.listeners_={};
      
      
      
      setTimeout(function (){
         
         gisportal.layers[new_layer_name].selectedDateTime=gisportal.layers[new_layer_name].firstDate;

         console.log('New Name Layer here: ',gisportal.layers[new_layer_name]);
         
         gisportal.layers[new_layer_name].openlayers.anID.listeners_={};

         compare_map.addLayer(gisportal.layers[new_layer_name].openlayers.anID);
                   
       }, 5000);

      
      


      // console.log('Indicators ',compare_map_layer[compare_state.selectedIndicators[0]]);
      // console.log('Indicators id ',compare_map_layer[compare_state.selectedIndicators[0]].id);
      // // console.log('Gisportal Layers ',gisportal.layers[compare_map_layer[0].id]);
      // // console.log('Gisportal Layers Error',gisportal.layers[compare_map_layer[0].id]);
      // console.log('ID: ',compare_map_layer[compare_state.selectedIndicators[0]].id);
      // console.log('gisportal.layers read: ',gisportal.layers[compare_map_layer[compare_state.selectedIndicators[0]].id].openlayers);
      // // compare_map.removeLayer(compare_map.getLayers().array_[0]);

      // TODO Make deep copy test it
      // Then change uid (all ids)
      // Remove event listeners on the layer objects
      // Timeline event listener changes the values 

      // input_layer=gisportal.layers[compare_map_layer[compare_state.selectedIndicators[0]].id].openlayers.anID;
      // output_layer=deepClone(input_layer);
      // compare_map.addLayer(gisportal.layers[compare_map_layer[compare_state.selectedIndicators[0]].id].openlayers.anID);
      
      // var manual_output={};
      // manual_output={
      //    className:'ol-layer',
      //    disposed:false,
      //    ol_uid:'123',
      //    values_:{
      //       id:'chlor_a__Plymouth_Marine_Laboratory1',
      //       source:{params_:{
      //          time:'2005-12-31T00:00:00.000Z'
      //       }},
      //       urls:{0:'https://www.oceancolour.org/thredds/wms/CCI_ALL-v3.0-DAILY?'},
      //       title:'Plymouth_Marine_Laboratory: Chl-a  V3.0',
      //       type:'OLLayer'
      //    }
      // };
      

      
      
      // compare_map.addLayer(manual_output);


   //    function deepClone(obj, hash = new WeakMap()) {
   //       // Do not try to clone primitives or functions
   //       if (Object(obj) !== obj || obj instanceof Function) return obj;
   //       if (hash.has(obj)) return hash.get(obj); // Cyclic reference
   //       try { // Try to run constructor (without arguments, as we don't know them)
   //           var result = new obj.constructor();
   //       } catch(e) { // Constructor failed, create object without running the constructor
   //           result = Object.create(Object.getPrototypeOf(obj));
   //       }
   //       // Optional: support for some standard constructors (extend as desired)
   //       if (obj instanceof Map)
   //           Array.from(obj, ([key, val]) => result.set(deepClone(key, hash), 
   //                                                      deepClone(val, hash)) );
   //       else if (obj instanceof Set)
   //           Array.from(obj, (key) => result.add(deepClone(key, hash)) );
   //       // Register in hash    
   //       hash.set(obj, result);
   //       // Clone and assign enumerable own properties recursively
   //       return Object.assign(result, ...Object.keys(obj).map (
   //           key => ({ [key]: deepClone(obj[key], hash) }) ));
   //   }
      
      // console.log('Layer: ',compare_map_layer);
      // compare_map.addLayer(compare_map_layer);
      
      
      // // Load layers for state
      // var keys = compare_state.selectedIndicators;
      // var available_keys = [];

      // for(var key in keys){
      //    if (gisportal.layers[keys[key]]){
      //       available_keys.push(keys[key]);
      //    }
      // }

      // for (var i = 0, len = available_keys.length; i < len; i++) {
      //    console.log('i: ',i);
      //    var indicator = null;
      //    if (typeof available_keys[i] === "object") indicator = gisportal.layers[available_keys[i].id];
      //    else indicator = gisportal.layers[available_keys[i]];
      //    console.log('indicator: ',indicator);
         
      //    if (indicator && !gisportal.selectedLayers[indicator.id]) {
      //       if(indicator.serviceType != "WFS"){
               
      //          var state_indicator = compare_state.selectedLayers[indicator.id];
      //          console.log('Inside WMS state_indicator: ',indicator);
      //          gisportal.configurePanel.close();
      //          // this stops the map from auto zooming to the max extent of all loaded layers
      //          indicator.preventAutoZoom = true;
      //          if(state_indicator){
      //             indicator.minScaleVal = state_indicator.minScaleVal;
      //             indicator.maxScaleVal = state_indicator.maxScaleVal;
      //          }
      //          gisportal.indicatorsPanel.selectLayer(indicator.id);
      //          // gisportal.indicatorsPanel.addToPanel({id:indicator.id});
      //          // compare_map.addLayer(gisportal.layers[state_indicator]);
      //             }
      //          }
      //       }
      };





   //Share this map
   $('.js-share').on('click', function() {
      gisportal.share.showShare();
      gisportal.share.getLink();
   });

   // Store a layers current tab being viewed
   $('.js-indicators').on('change', '.js-tab-trigger', function() {
      var layerId = $(this).closest('[data-id]').data('id');
      var layer = gisportal.layers[layerId];
      layer.visibleTab = $(this).data('tab-name');
   });

   $('.js-indicators').on('click', '.show-more', function(e) {
      e.preventDefault();
      var id = $(this).data('id');
      var layer = gisportal.layers[id];
      if(gisportal.panelSlideout.isOut('metadata')){
         gisportal.panelSlideout.closeSlideout( 'metadata' );
      }
      else {
         gisportal.panelSlideout.openSlideout('metadata');
         $('.metadata-html').html(layer.metadataHTML);
      }
      var params = {
         "event": "more-info.clicked",
         "layerId": id
      };
      gisportal.events.trigger('more-info.clicked', params);      
   });

   $('.js-indicators').on('click', '.indicator-overlay', function(){
      gisportal.events.trigger('metadata.close');
   });

   $('.metadata-slideout').on('click', '.js-close-extrainfo', function() {
      gisportal.events.trigger('metadata.close');
   });

   $('body').on('click', '.js-focus-on-build-graph-component', function(){
      gisportal.indicatorsPanel.focusOnBuildGraphCompoent( $(this).data('id') );
   });


   $('.js-indicators').on('click', '.js-select-layer-tab', function(){
      var layerId = $(this).closest('[data-id]').data('id');
      var tabName = $(this).closest('[data-tab-name]').data('tab-name');
      gisportal.indicatorsPanel.selectTab( layerId, tabName );
   });

   // make the selected indicators list sortable, and the event to fire after sorting
   $('ul.js-indicators').addClass('sortable-list');

   $(".sortable-list").sortable({
      handle: "div.indicator-header",
      cancel: "span",
      start: function(event, ui) {
         $(ui.item).children('.indicator-header').addClass('indicator-header-moving');
      },
      stop : function(event, ui) {
         $(ui.item).children('div.indicator-header').removeClass('indicator-header-moving'); 
         gisportal.indicatorsPanel.reorderLayers();
      }
   });

   // WCS URL event handlers
   $('.js-indicators').on('click', 'button.js-wcs-url', function()  {
      gisportal.indicatorsPanel.add_wcs_url($(this));
   });

   $('.js-indicators').on('change', 'input.js-wcs-url', function()  {
      gisportal.indicatorsPanel.add_wcs_url($(this));
   });
   
   $('.js-indicators').on('click', '.js-select-layer-tab', function(){
      var layerId = $(this).closest('[data-id]').data('id');
      var tabName = $(this).closest('[data-tab-name]').data('tab-name');
      gisportal.indicatorsPanel.selectTab( layerId, tabName );
   });

   $('#indicatorsPanel').bind('scroll', function() {
      var scrollPercent = parseInt(100 * ($(this).scrollTop()/(this.scrollHeight - $(this).height())));
      var params = {
         "event": "indicatorspanel.scroll",
         "scrollPercent": scrollPercent
      };
      gisportal.events.trigger('indicatorspanel.scroll', params);
   });

   $('.js-indicators').on('click', '.related_layer', function(){
      var current_date = $('.scalebar-selected-date').text();
      // place holder whilst feature is developed
      // 2015-12-01 00:00 to 20170513_182525
      tdate = current_date.split(' ');
      layerDate = tdate[0].split('-')[0]+tdate[0].split('-')[1]+tdate[0].split('-')[2]+'_'+tdate[1].split(':')[0]+tdate[1].split(':')[1]+tdate[1].split(':')[2];
      // call gisportal.refinePanel.layerFound = function(layerId, style) with the layerid to add it to the map and do associated actions
      //gisportal.refinePanel.layerFound('rsg_','');
   });
};

gisportal.indicatorsPanel.add_wcs_url = function(selected_this) {
   var wcs_url = $('input.js-wcs-url')[0].value;
   var layer = gisportal.layers[selected_this.closest('[data-id]').data('id')];
   var filename = layer.serverName;
   var user = layer.owner;
   var error_div = $("#" + layer.id + "-analysis-message");

   if (!(wcs_url.startsWith('http://') || wcs_url.startsWith('https://'))) {
      error_div.toggleClass('hidden', false);
      error_div.html("The URL must start with 'http://'' or 'https://'");
   } else {
      if (gisportal.user.info.email == user || gisportal.user.info.permission == 'admin') {
         $.ajax({
            url: gisportal.middlewarePath + '/settings/add_wcs_url?url=' + encodeURIComponent(wcs_url) + '&username=' + user + '&filename=' + filename,
            success: function(data) {
               layer.wcsURL = data;
               loadAnalysisTab();
            },
            error: function(e) {
               //show an error that tells the user what is wrong
               error_div.toggleClass('hidden', false);
               error_div.html('There was an error using that URL: ' + e.responseText);
            }
         });
      } else {
         for (var index in gisportal.layers) {
            var this_layer = gisportal.layers[index];
            if (this_layer.serverName == filename) {
               gisportal.layers[index].wcsURL = wcs_url.split("?")[0].split(" ")[0];
            }
         }
         loadAnalysisTab();
      }
   }

   function loadAnalysisTab() {
      gisportal.indicatorsPanel.analysisTab(layer.id);
      var message_div = $("#" + layer.id + "-analysis-message");
      message_div.toggleClass('hidden', false);
      message_div.html('The WCS URL has been added to this server.');
      message_div.toggleClass('alert-danger', false);
      message_div.toggleClass('alert-success', true);
   }
};

gisportal.events.bind('metadata.close', function() {
   $('.indicator-overlay').remove();
   gisportal.panelSlideout.closeSlideout('metadata');
});

gisportal.indicatorsPanel.refreshData = function(indicators) {
   $('.js-indicators').html('');
   for (var i = 0; i < indicators.length; i++) {
      this.addToPanel(indicators[i]);
   }
};

gisportal.indicatorsPanel.addToPanel = function(data) {
   for(var l in gisportal.selectedLayers){
      $('[data-id="' + gisportal.selectedLayers[l] + '"] .indicator-actions span').not('.toggleVisibility').toggleClass('active', false);
   }
   if ($('.js-indicators [data-id="' + data.id + '"]').length > 0) return false;

   var id = data.id;

   var layer = gisportal.layers[id];

   if( gisportal.graphs.activePlotEditor )
      layer.visibleTab = "analysis";

   user_allowed_to_add = false;
   user_allowed_to_edit = false;

   if(gisportal.user.info.permission != "guest" && layer.providerTag == "UserDefinedLayer"){
      user_allowed_to_add = true;
   }
   if(gisportal.user.info.permission != "guest" && layer.providerTag != "UserDefinedLayer" && layer.serviceType != "WFS"){
      if(layer.owner != gisportal.niceDomainName || gisportal.user.info.permission == "admin")
      user_allowed_to_edit = true;
   }

   var rendered = gisportal.templates.indicator({"layer":layer, "user_allowed_to_add":user_allowed_to_add, "user_allowed_to_edit":user_allowed_to_edit});

   $('.js-indicators').prepend(rendered);

   $('.js-indicators > li').sort(function(a, b) {
      return $(a).data('order') > $(b).data('order');
   }).appendTo('.js-indicators');

   if (data.refine) {
      var refine = data.refine;
      var cat = refine.cat;
      var tag = refine.tag;
      if (cat && tag) {
         var ids = group[cat][tag];
         group = gisportal.indicatorsPanel.refineData(ids, "none");
         refined = true;
      }
   }

   $('[data-id="' + id + '"] .js-toggleVisibility')
      .toggleClass('hidden', false)
      .toggleClass('active', gisportal.layers[id].isVisible);
   if(layer.serviceType != "WFS"){
      gisportal.indicatorsPanel.scalebarTab(id);
   }
   else {
      gisportal.indicatorsPanel.vectorStyleTab(id);
   }
   gisportal.indicatorsPanel.detailsTab(id);
   gisportal.indicatorsPanel.analysisTab(id);

   //Add the scale bar tooltip
   var renderedTooltip = gisportal.templates['tooltip-scalebar']( layer );
   $('[data-id="' + id + '"] .js-scalebar').tooltipster({
      contentCloning: true,
      contentAsHTML: true,
      content: renderedTooltip,
      position: "right",
      maxWidth: 200
   });

   //Add the edit/add layers listener to add the server to the form
   $('span.js-add-layer-server').on('click', function(){
      var params = {
         "event": "addLayerServer.clicked",
         "layer": $(this).data('layer'),
         "server": $(this).data('server')
      };
      gisportal.events.trigger('addLayerServer.clicked', params);
      gisportal.addLayersForm.addServerToForm($(this).data('server'), $(this).data('owner'), $(this).data('layer'));
   });
};


// this will be re-engineered when ol3 fixed layer ordering
gisportal.indicatorsPanel.reorderLayers = function() {
 var layers = [];
   $('.sortable-list .indicator-header').each(function() {
      layers.push($(this).parent().data('id'));
   });

   // so, ol3 doesn't have a nice way to reorder layers; therefore, we take 'em all off and then add 'em back on
   var currentLayers = map.getLayers().getArray();
   var oddFactor = 1 + currentLayers.length;
   if (currentLayers) {
      for (var i = 0; i < map.getLayers().getArray().length + oddFactor; i++) {
         map.removeLayer(map.getLayers().getArray()[0]);
      }
   }
   // stick the base layer back on
   var selectedBaseMap = $('#select-basemap').data().ddslick.selectedData.value;
   if (selectedBaseMap !== 'none') {
      map.addLayer(gisportal.baseLayers[selectedBaseMap]);   
   }
   // then the indicator layers;
   for (var l = layers.length - 1; l > -1; l--) {
      map.addLayer(gisportal.layers[layers[l]].openlayers.anID);
   }

   gisportal.setCountryBordersToTopLayer();

   var params = {
      "event" : "layer.reorder",
      "newLayerOrder" : layers
   };
   gisportal.events.trigger('layer.reorder', params);
};

gisportal.indicatorsPanel.removeFromPanel = function(id) {

   $('.js-indicators > li[data-id="' + id + '"]').remove();
   if (gisportal.layers[id]) gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);
   if(gisportal.layers[id]){
      gisportal.layers[id].log = null;
      gisportal.layers[id].style = null;
      gisportal.layers[id].colorbands = null;
   }

   var params = {
      "event" : "layer.remove",
      "id" : id,
      "layerName" : gisportal.layers[id].name
   };
   gisportal.events.trigger('layer.remove', params);
};

/* There is overlap here with configurePanel,
 * should refactor at some point */
gisportal.indicatorsPanel.selectLayer = function(id, style) {
   if (_.indexOf(gisportal.selectedLayers, id) > -1) return false;
   var layer = gisportal.layers[id];
   var options = {};
   if (layer) {
      options.visible = true;
      if(layer.servicetype=="WFS"){
         gisportal.getVectorLayerData(layer);
      }
      else {
         gisportal.getLayerData(layer.serverName + '_' + layer.urlName + '.json', layer, options, style);
      }
   }
};

gisportal.indicatorsPanel.hideLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(false);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', false);

      var params = {
         "event" : "layer.hide",
         "id" : id,
         "layerName" : gisportal.layers[id].name
      };
      gisportal.events.trigger('layer.hide', params);
   }
};

gisportal.indicatorsPanel.showLayer = function(id) {
   if (gisportal.layers[id]) {
      gisportal.layers[id].setVisibility(true);
      $('[data-id="' + id + '"] .indicator-header .js-toggleVisibility').toggleClass('active', true);

      var params = {
         "event" : "layer.show",
         "id" : id,
         "layerName" : gisportal.layers[id].name
      };
      gisportal.events.trigger('layer.show', params);
   }
};

gisportal.indicatorsPanel.detailsTab = function(id) {
   var indicator = gisportal.layers[id];

   var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
   indicator.modifiedName = modifiedName;
   indicator.modified = gisportal.utils.nameToId(indicator.name);

   // load the tag values based on the currently enabled gisportal.browseCategories
   indicator.displayTags = [];
   for (var index in gisportal.browseCategories) {
      var name = gisportal.browseCategories[index];
      var val = indicator.tags[index];
      if (val) {
         if (typeof(val) == "string") val = val.split(',');
         indicator.displayTags.push({
            displayName: name,
            displayValues: val
         });      
      }
   }
   var rendered = gisportal.templates['tab-details'](indicator);
   $('[data-id="' + id + '"] .js-tab-details').html(rendered);
   $('[data-id="' + id + '"] .js-icon-details').toggleClass('hidden', false);
};

gisportal.indicatorsPanel.analysisTab = function(id) {
   var indicator = gisportal.layers[id];
   if (indicator.temporal) {
      var onMetadata = function(){
         var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
         indicator.modified = gisportal.utils.nameToId(indicator.name);
         indicator.modifiedName = modifiedName;
         indicator.loggedIn = gisportal.user.info.permission != "guest";
         indicator.noOAuth = gisportal.noOAuth;
         var rendered = gisportal.templates['tab-analysis'](indicator);
         $('[data-id="' + id + '"] .js-tab-analysis').html(rendered);
         $('.js-google-auth-button').click(function() {
         window.top.open(gisportal.middlewarePath + '/user/auth/google','authWin','left=20,top=20,width=700,height=700,toolbar=1');
         });
         $('.js-analysis-elevation').on('change', function(){
            var value = $(this).val();
            var params = {
               "event": "layerDepth.change",
               "value":value
            };
            gisportal.events.trigger('layerDepth.change', params);
         });
         $('[data-id="' + id + '"] .js-icon-analyse').toggleClass('hidden', false);

         if(gisportal.methodThatSelectedCurrentRegion.method == "drawBBox"){
            $('.js-coordinates').val(gisportal.methodThatSelectedCurrentRegion.value);
         }

         gisportal.indicatorsPanel.addAnalysisListeners();
         gisportal.indicatorsPanel.populateShapeSelect();
      };
      if(indicator.metadataComplete) {
         onMetadata();
      } else { 
         gisportal.events.bind_once('layer.metadataLoaded',onMetadata);
      }
      // show the time range details that may have previously been hiden by a previous run of this function
      $('li[data-id="' + id + '"] .date-range-detail').show();
   } else {
      // hide the analysis tab for layers with no time dimension
      $('[data-id="' + id + '"] .js-icon-analyse').toggleClass('hidden', true);
      // and the date range li on the info tab
      $('li[data-id="' + id + '"] .date-range-detail').hide();
   }
};

gisportal.indicatorsPanel.geoJSONSelected = function(selectedValue, fromSavedState){
   $.ajax({
      url: gisportal.middlewarePath + '/cache/' + gisportal.niceDomainName + '/user_' + gisportal.user.info.email + "/" + selectedValue + ".geojson" ,
      dataType: 'json',
      success: function(data){
         gisportal.selectionTools.loadGeoJSON(data, false, selectedValue, fromSavedState);
         var params = {
            "event": "indicatorsPanel.geoJSONSelected",
            "geojson": data,
            "selectedValue": selectedValue,
            "fromSavedState": fromSavedState
         };
         gisportal.events.trigger('indicatorsPanel.geoJSONSelected', params);
      },
      error: function(e){
         gisportal.vectorLayer.getSource().clear();
         $.notify("Sorry, There was an error with that: " + e.statusText, "error");
      }
   });
};

gisportal.indicatorsPanel.addAnalysisListeners = function(){
   $('.users-geojson-files').on('change', function(){
      gisportal.indicatorsPanel.geoJSONSelected(this.value);
   });
   var addCoordinatesToProfile = function(name){
      var feature = gisportal.vectorLayer.getSource().getFeatures()[0];
      var geojson = gisportal.featureToGeoJSON(feature, gisportal.projection, "EPSG:4326");
      $.ajax({
         method: 'post',
         url:  gisportal.middlewarePath + '/plotting/save_geoJSON?filename=' + name,
         data:{'data': JSON.stringify(geojson)},
         success: function(data){
            if($(".users-geojson-files option[value='" + data + "']").length === 0){
               $('.users-geojson-files').append("<option selected value='" + data + "'>" + data + "</option>");
            }else{
               $('.users-geojson-files').val(data);
            }
            $('.users-geojson-files').trigger('change');
         },
         error: function(e){
            $.notify("Sorry, There was an error with that: " + e.statusText, "error");
         }
      });
   };

   $('.js-add-coordinates-to-profile').on('click', function(){
      gisportal.panels.userFeedback("Please enter a name to use for your file", addCoordinatesToProfile);
      var params = {
         "event": "coordinates.save"
      };
      gisportal.events.trigger('coordinates.save', params);
   });
};

gisportal.indicatorsPanel.populateShapeSelect = function(){
   // A request to populate the dropdown with the users polygons
   $.ajax({
      url:  gisportal.middlewarePath + '/plotting/get_shapes',
      dataType: 'json',
      success: function(data){
         var selected_value;
         if(gisportal.methodThatSelectedCurrentRegion.method == "geoJSONSelect"){
            selected_value = gisportal.methodThatSelectedCurrentRegion.value;
         }
         if($('.users-geojson-files')[0]){
            var current_val = $('.users-geojson-files')[0].value;
            if(current_val != "default"){
               selected_value = $('.users-geojson-files')[0].value;
            }
         }
         // Empties the dropdown
         $('.users-geojson-files').html("");
         selectValues = data.list;
         if(selectValues.length > 0){
            $('.users-geojson-files').html("<option value='default' disabled>Please select a file...</option>");
            $.each(selectValues, function(key, value) {   
               $('.users-geojson-files')
                  .append($("<option></option>")
                  .attr("value",value)
                  .text(value));
            });
            if(selected_value){
               $('.users-geojson-files').val(selected_value);
            }else{
               $('.users-geojson-files').val("default");
            }            
         }else{
            $('.users-geojson-files').html("<option value='default' selected disabled>You have no files yet, please add some</option>");
         }
      },
      error: function(e){
         $('.users-geojson-files').html("<option selected value='default' disabled>You must be logged in to use this feature</option>");
      }
   });
};

/**
 * Redraws the legend bar which will reflect changes to the legend colour and range
 *
 * @param String layerId The ID of the layer to reload
 */
gisportal.indicatorsPanel.redrawScalebar = function(layerId) {
   var indicator = gisportal.layers[layerId];
   var scalebarDetails = gisportal.scalebars.getScalebarDetails(layerId);
   if (scalebarDetails) {
      indicator.legend = scalebarDetails.url;
      indicator.scalePoints = scalebarDetails.scalePoints;
      try{
         indicator.angle = indicator.legendSettings.Rotation;
      }catch(err){
         indicator.angle = 0;
      }
      try{
         indicator.legendURL = indicator.legendSettings.URL || encodeURIComponent(gisportal.scalebars.createGetLegendURL(indicator, indicator.legend));
      }catch(err){
         indicator.legendURL = encodeURIComponent(gisportal.scalebars.createGetLegendURL(indicator, indicator.legend));
      }
      indicator.middleware = gisportal.middlewarePath;

      // TODO add logic to this when adding support for layers with no date
      indicator.hasDate = true;
      // Put the date in a nice format for displaying next to the scalebar
      indicator.niceSelectedDateTime = moment.utc(indicator.selectedDateTime).format('YYYY-MM-DD HH:mm:ss');
      if (!indicator.temporal) {
         indicator.niceSelectedDateTime = '';
      }
      var renderedScalebar = gisportal.templates.scalebar(indicator);


      $('[data-id="' + indicator.id + '"] .js-scalebar').html(renderedScalebar);

   } else {
      $('[data-id="' + indicator.id + '"] .js-scalebar').html("");
   }
};

gisportal.indicatorsPanel.vectorStyleTab = function(id) {
         var layer = gisportal.layers[id];
         //
         //layer.setStyle();

         var rendered = gisportal.templates['tab-vectorstyles'](layer);
         $('[data-id="' + id + '"] .js-tab-dimensions').html(rendered);
         if(id+"__"+layer.defaultProperty in gisportal.vectorStyles.cache) {
            gisportal.vectorStyles.cache[id+"__"+layer.defaultProperty].unit = layer.unit;
            var indicator = gisportal.vectorStyles.cache[id+"__"+layer.defaultProperty];
            indicator.zoomable = true;
            if(gisportal.current_view && gisportal.current_view.noPan){
               indicator.zoomable = false;
            }
      var renderedStyleUI = gisportal.templates['vector-style-ui'](indicator);
      $('[data-id="' + layer.id + '"] .dimensions-tab .vector-style-container').html(renderedStyleUI);
   }
};

gisportal.indicatorsPanel.scalebarTab = function(id) {
   var layer = gisportal.layers[id];
   
   var onMetadata = function(){
      var indicator = gisportal.layers[id];
      if (indicator.elevationCache && indicator.elevationCache.length > 0) {
         indicator.hasElevation = true;
      }

      if (indicator.styles && indicator.styles.length > 0) {
         indicator.hasStyles = true;
      }


      var modifiedName = id.replace(/([A-Z])/g, '$1-'); // To prevent duplicate name, for radio button groups
      indicator.modifiedName = modifiedName;
      indicator.modified = gisportal.utils.nameToId(indicator.name);

      gisportal.indicatorsPanel.redrawScalebar(id);

      indicator.zoomable = true;
      if(gisportal.current_view && gisportal.current_view.noPan){
         indicator.zoomable = false;
      }
      var rendered = gisportal.templates['tab-dimensions'](indicator);

      $('[data-id="' + indicator.id + '"] .js-tab-dimensions').html(rendered);
      if(!gisportal.config.showTutorialLinks || gisportal.walkthrough.is_playing){
         $('.walkthrough-tutorial-btn').toggleClass('hidden', true);
      }
      $('[data-id="' + indicator.id + '"] .js-icon-scalebar').toggleClass('hidden', false);

      if($('#tab-' + indicator.id + '-opacity').length > 0){
         $('#tab-' + indicator.id + '-opacity').noUiSlider({
            start: [ indicator.opacity * 100 ],
            margin: 20,
            connect: "lower",
            range: {
               'min': [   0 ],
               'max': [ 100 ]
            },
            serialization: {
               lower: [
                  $.Link({
                     target: $('#tab-' + indicator.id + '-opacity-value'),
                     method: setOpacityValue
                  })
               ],
            }
         });
      }

      if($('#tab-' + indicator.id + '-colorbands').length > 0){
         $('#tab-' + indicator.id + '-colorbands').noUiSlider({
            start: [ gisportal.layers[indicator.id].colorbands || gisportal.config.colorbands ],
            margin: 20,
            connect: "lower",
            range: {
               'min': [   1 ],
               'max': [ 255 ]
            },
            serialization: {
               lower: [
                  $.Link({
                     target: $('#tab-' + indicator.id + '-colorbands-value'),
                     method: setColorbandsValue
                  })
               ],
            }
         });
      }
      
      function setOpacityValue(value) {
         $(this).html(parseInt(value) +'%');
      }
      
      function setColorbandsValue(value) {
         $(this).val(parseInt(value));
         gisportal.layers[indicator.id].colorbands = parseInt(value);
      }

      $('#tab-' + indicator.id + '-opacity').on('slide', function() {
         var opacity = ($(this).val() / 100).toFixed(2);

         var params = {
            "event" : "scalebar.opacity",
            "id" : indicator.id,
            "value": opacity
         };
         gisportal.events.trigger('scalebar.opacity', params);
         gisportal.layers[indicator.id].setOpacity( opacity );
      });

      $('#tab-' + indicator.id + '-colorbands').on('change', function() {
         var colorbands = parseInt($(this).val());

         var params = {
            "event" : "scalebar.colorbands",
            "id" : indicator.id,
            "value": colorbands
         };
         gisportal.events.trigger('scalebar.colorbands', params);
         gisportal.layers[indicator.id].setScalebarTimeout();
      });

      var colorbands_keydown_timeout;

      $('#tab-' + indicator.id + '-colorbands-value').on('change', function(){
         if(isNaN($(this).val())){
            $(this).val("1");
         }
         $('#tab-' + indicator.id + '-colorbands').val($(this).val()).trigger('change');
      })
      .on('keydown', function(e){
         clearTimeout(colorbands_keydown_timeout);
         var val = parseInt($(this).val());
         var _this = $(this);
         if(e.keyCode == 38){
            if(_this.val() < 255){
               _this.val(val + 1);
            }
         }
         if(e.keyCode == 40){
            if(_this.val() > 1){
               _this.val(val - 1);
            }
         }
         colorbands_keydown_timeout = setTimeout(function(){
            _this.trigger('change');
         }, 500);
      });

      $('#tab-' + indicator.id + '-elevation').ddslick({
         onSelected: function(data) {
            if (data.selectedData) {
               gisportal.layers[indicator.id].selectedElevation = data.selectedData.value;
               gisportal.layers[indicator.id].setScalebarTimeout();  
            }
         }
      });

      $('#tab-' + indicator.id + '-layer-style').ddslick({
         onSelected: function(data) {
            if (data.selectedData) {
               gisportal.layers[indicator.id].style = data.selectedData.value;
               gisportal.layers[indicator.id].setScalebarTimeout();
            }
         }
      });

      $('#tab-' + indicator.id + '-aboveMaxColor').ddslick({
         onSelected: function(data) {
            if (data.selectedData) {
               if(data.selectedData.value == "0"){
                  data.selectedData.value = null;
               }
               if (data.selectedData.value == 'custom') {
                  var customInput = $('.js-custom-aboveMaxColor[data-id="' + indicator.id + '"]');
                  customInput.toggleClass('hidden', false);
                  if(customInput.val()) {
                     customInput.trigger('change');
                  }
               } else {
                  $('.js-custom-aboveMaxColor[data-id="' + indicator.id + '"]').toggleClass('hidden', true);
                  gisportal.layers[indicator.id].aboveMaxColor = data.selectedData.value;
                  gisportal.layers[indicator.id].setScalebarTimeout();
               }
            }
         }
      });

      $('#tab-' + indicator.id + '-belowMinColor').ddslick({
         onSelected: function(data) {
            if (data.selectedData) {
               if (data.selectedData.value == "0") {
                  data.selectedData.value = null;
               }
               if (data.selectedData.value == 'custom') {
                  var customInput = $('.js-custom-belowMinColor[data-id="' + indicator.id + '"]');
                  customInput.toggleClass('hidden', false);
                  if(customInput.val()) {
                     customInput.trigger('change');
                  }
               } else {
                  $('.js-custom-belowMinColor[data-id="' + indicator.id + '"]').toggleClass('hidden', true);
                  gisportal.layers[indicator.id].belowMinColor = data.selectedData.value;
                  gisportal.layers[indicator.id].setScalebarTimeout();
               }
            }
         }
      });

      $('.js-custom-aboveMaxColor[data-id="' + indicator.id + '"]').on('change', function() {
         var colour = $(this).val();
         gisportal.layers[indicator.id].aboveMaxColor = colour;

         var params = {
            "event" : "scalebar.custom-aboveMaxColor",
            "id" : indicator.id,
            "value": colour
         };
         gisportal.events.trigger('scalebar.custom-aboveMaxColor', params);
         gisportal.layers[indicator.id].setScalebarTimeout();
      });

      $('.js-custom-belowMinColor[data-id="' + indicator.id + '"]').on('change', function() {
         var colour = $(this).val();
         gisportal.layers[indicator.id].belowMinColor = colour;

         var params = {
            "event" : "scalebar.custom-belowMinColor",
            "id" : indicator.id,
            "value": colour
         };
         gisportal.events.trigger('scalebar.custom-belowMinColor', params);
         gisportal.layers[indicator.id].setScalebarTimeout();
      });

      selectAboveMaxBelowMinOptions(id, indicator.aboveMaxColor, indicator.belowMinColor);
   };
   if(layer.metadataComplete) onMetadata();
   else gisportal.events.bind_once('layer.metadataLoaded',onMetadata);
};

// Needs a refactor

gisportal.indicatorsPanel.initialiseSliders = function(id) {
   // The dates stored in layer are DD-MM-YYYY instead of YYYY-MM-DD
   var firstDate = gisportal.layers[id].firstDate;
   var lastDate = gisportal.layers[id].lastDate;

   var from = $('.js-min[data-id="' + id + '"]');
   var to = $('.js-max[data-id="' + id + '"]');

   if (firstDate !== '' && lastDate !== '' && from.length > 0 && to.length > 0) {
      var min = new Date(firstDate).getTime();
      var max = new Date(lastDate).getTime();
      var slider = $('.range-slider[data-id="' + id + '"]');

      try {
         slider.noUiSlider({
            start: [min, max],
            connect: true,
            behaviour: 'tap-drag',
            range: {
               'min': min,
               'max': max
            },
            serialization: {
               lower: [
                  $.Link({
                     target: from,
                     method: setDate
                  })
               ],
               upper: [
                  $.Link({
                     target: to,
                     method: setDate
                  })
               ],
               format: {
                  decimals: 0
               }
            }
         });
      } catch (e) {}

      slider.on('slide', function(event, val) {
         var interval;

         interval = setInterval(function() {
            if (val[0] <= min) {
               $(this).val([val - 1, null]);
            }

            if (val[1] > max) {
               $(this).val([null, val + 1]);
            }

         }, 100);

         $(this).on('set', function() {
            clearInterval(interval);
         });

         from.val(new Date(+val[0]).toISOString());
         to.val(new Date(+val[1]).toISOString());
      });
   }
};

function setDate(value) {
   $(this).val(new Date(+value).toISOString());
}

gisportal.indicatorsPanel.removeIndicators = function(id) {
   gisportal.removeLayer(gisportal.layers[id]);
   gisportal.timeline.removeTimeBarById(id);
};


gisportal.indicatorsPanel.getParams = function(id) {
   var dateRange = $('.js-min[data-id="' + id + '"]').val(); // Find date range
   dateRange += "/" + $('.js-max[data-id="' + id + '"]').val();
   var graphXAxis = null,
      graphYAxis = null;

   // Some providers change direction of depth,
   // so this makes it match direction
   var depthDirection = function(id) {
      var layer = gisportal.layers[id];
      var elevation = layer.selectedElevation;
      return elevation;
   };

   var indicator = gisportal.layers[id];

   var exBoundingBox = indicator.exBoundingBox;

   var bbox = gisportal.currentSelectedRegion;
   if(bbox === ""){
      bbox = exBoundingBox.WestBoundLongitude + "," + exBoundingBox.SouthBoundLatitude + "," + exBoundingBox.EastBoundLongitude + "," + exBoundingBox.NorthBoundLatitude;
      bbox = gisportal.reprojectBoundingBox(bbox.split(","), "EPSG:4326", gisportal.projection).join(",");
   }
   // TODO: add bins for histogram!
   var graphParams = {
      baseurl: indicator.wcsURL,
      coverage: indicator.urlName,
      type: $('#tab-' + id + '-graph-type option:selected').val(),
      bins: '',
      time: dateRange,
      //bbox: $('#graphcreator-bbox').val(),
      bbox: bbox,
      depth: depthDirection(id),
      graphXAxis: graphXAxis,
      graphYAxis: graphYAxis,
      graphZAxis: indicator.urlName
   };
   return graphParams;
};


gisportal.indicatorsPanel.exportData = function(id) {
   gisportal.panelSlideout.openSlideout('export-raw');
   var indicator = gisportal.layers[id];
   var rendered = gisportal.templates['export-raw']({
      indicator: indicator
   });

   var content = $('.js-export-raw-slideout  .js-slideout-content')
      .html(rendered);
   

   var startDateStamp = new Date(indicator.firstDate).getTime();
   var lastDateStamp = new Date(indicator.lastDate).getTime();

   var from = content.find('.js-min');
   var to = content.find('.js-max');
   var slider = content.find('.js-range-slider');

    slider.noUiSlider({
      connect: true,
      behaviour: 'tap-drag',
      start: [startDateStamp, lastDateStamp],
      range: {
         'min': startDateStamp,
         'max': lastDateStamp
      },
      serialization: {
         lower: [
            $.Link({
               target: from,
               method: setDate
            })
         ],
         upper: [
            $.Link({
               target: to,
               method: setDate
            })
         ],
         format: {
            decimals: 0
         }
      }
   });

   from.change(function(){
      var currentRange = slider.val();
      var newStart = new Date( $(this).val() ).getTime();
      if( ! isNaN( newStart ) ){
         var newRange = [ newStart, currentRange[1] ];
         slider.val( newRange );
      }
   });
   to.change(function(){
      var currentRange = slider.val();
      var newEnd = new Date( $(this).val() ).getTime();
      if( ! isNaN( newEnd ) ){
         var newRange = [ currentRange[0], newEnd ];
         slider.val( newRange );
      }
   });


   content.find('.js-download').click(function(){
      gisportal.loading.increment();
      var download_data = gisportal.indicatorsPanel.exportRawUrl( id );
      if(download_data.irregular){
         $.ajax({
            url:  download_data.url,
            method:"POST",
            data: {'data': JSON.stringify(download_data.data)},
            success: function(data){
               window.open(gisportal.middlewarePath + '/download?filename=' + data.filename + '&coverage=' + data.coverage, "_blank");
               gisportal.loading.decrement();
            },
            error: function(e){
               $.notify('There was an error downloading the netCDF: ' + e.statusText, "error");
               gisportal.loading.decrement();
            }
         });
      }else{
         window.open(download_data.url, "_blank");
         gisportal.loading.decrement();
      }

   });

};

gisportal.indicatorsPanel.exportRawUrl = function(id) {
   var indicator = gisportal.layers[id];
   var graphParams = (this.getParams(id));
   var fullBounds = false;

   var download_data = null;
   var urlParams = {
      service: 'WCS',
      version: '1.0.0',
      request: 'GetCoverage',
      crs: 'OGC:CRS84',
      format: 'NetCDF3'
   };

   urlParams.coverage = indicator.urlName;

   //This block converts the bbox for the download ... TODO: This might be simplifiyable (similar to selectedRegionProjectionChange function)
   if(gisportal.projection != "EPSG:4326"){
      if(gisportal.methodThatSelectedCurrentRegion.justCoords){
         urlParams.bbox = gisportal.reprojectBoundingBox(gisportal.currentSelectedRegion.split(","), gisportal.projection, "EPSG:4326").toString();
      }else{
         var feature, this_feature;
         var features = gisportal.vectorLayer.getSource().getFeatures();
         for(feature in features){
            this_feature = features[feature];
            features[feature] = gisportal.geoJSONToFeature(gisportal.featureToGeoJSON(this_feature, gisportal.projection, "EPSG:4326"));
         }
         urlParams.bbox = gisportal.wkt.writeFeatures(features);
      }
   }else{
      urlParams.bbox = gisportal.currentSelectedRegion;
   }
   urlParams.time = $('.js-export-raw-slideout .js-min').val() + "/" + $('.js-export-raw-slideout .js-max').val();

   if( $('[data-id="' + indicator.id + '"] .js-analysis-elevation').length > 0 ){
      var vert = $('[data-id="' + indicator.id + '"] .js-analysis-elevation').val();
      if( indicator.positive == "down" )
        urlParams.vertical = Math.abs( vert );
     else
         urlParams.vertical = '-' + Math.abs( vert );
   }

   if(!urlParams.bbox){
      urlParams.bbox = indicator.exBoundingBox.WestBoundLongitude + "," +
            indicator.exBoundingBox.SouthBoundLatitude + "," +
            indicator.exBoundingBox.EastBoundLongitude + "," +
            indicator.exBoundingBox.NorthBoundLatitude;
      fullBounds = true;
   }
   graphParams.type = 'file';
   graphParams.time = urlParams.time;
   graphParams.bbox = urlParams.bbox;
   graphParams.depth = urlParams.vertical;


   var request = $.param(urlParams);
   if (gisportal.methodThatSelectedCurrentRegion.justCoords !== true && !fullBounds) {
      download_data = {url:gisportal.middlewarePath + "/prep_download?", data: graphParams, irregular:true};
   } else {
      download_data = {url:indicator.wcsURL.replace(/\?/, "") + "?" + request, irregular:false};
   }
   return download_data;
};

gisportal.indicatorsPanel.addToPlot = function( id )  {
   var graphParams = this.getParams( id );
   var bound_error;
   var errorElement;
   // Gets any error with the bounding box and puts it into the div
   if(gisportal.methodThatSelectedCurrentRegion.method != "csvUpload"){
      bound_error = gisportal.indicatorsPanel.doesCurrentlySelectedRegionFallInLayerBounds( id );
      if( bound_error !== true ){
         errorHtml = '<div class="alert alert-danger">' + bound_error + '</div>';
         errorElement = $( errorHtml ).prependTo('.js-tab-analysis[data-id="' + id + '"] .analysis-coordinates');
         setTimeout( function(){
            errorElement.remove();
         }, 6000 );
         return;
      }
   }
   else {
      bound_error = gisportal.indicatorsPanel.doesTransectPointsFallInLayerBounds( id );
      if( bound_error !== true ){
         errorHtml = '<div class="alert alert-danger">' + bound_error + '</div>';
         errorElement = $( errorHtml ).prependTo('.js-tab-analysis[data-id="' + id + '"] .analysis-coordinates');
         setTimeout( function(){
            errorElement.remove();
         }, 6000 );
         return;
      }
   }
   
   var component = {
      indicator: id,
      bbox: graphParams.bbox
   };

   var elevationSelect = $('.js-tab-analysis[data-id="' + id + '"] .js-analysis-elevation');
   if( elevationSelect.length == 1 )
      component.elevation = elevationSelect.val();

   gisportal.graphs.addComponentToGraph( component );
   
};

gisportal.indicatorsPanel.focusOnBuildGraphCompoent = function( layerId ){
   gisportal.panelSlideout.peakSlideout( 'active-plot' );
   gisportal.panels.showPanel( 'active-layers' );
   gisportal.indicatorsPanel.selectTab( layerId, 'analysis' );
};

gisportal.indicatorsPanel.vectorSelectSwitch = function( layerID , tabName) {
   //Why is this empty??!!
};

gisportal.indicatorsPanel.selectTab = function( layerId, tabName ){
   // Select tab
   if(tabName=="analysis"){
      gisportal.vectorSelectionTest( layerId, tabName );
   }
   $('#tab-' + layerId + '-' + tabName).prop( 'checked', true ).trigger('change');

   //Scroll to layer
   var containerScroll = $('#indicatorsPanel').scrollTop();
   var layerTop = $('#indicatorsPanel > ul > [data-id="' + layerId + '"]').position().top;

   var newLocation = containerScroll + layerTop;
   $('#indicatorsPanel').stop().animate({
      scrollTop: newLocation,
      duration: 150
   }, 2000).one('mousewheel', function(){
      $(this).stop();
   });
};

gisportal.indicatorsPanel.bboxToWKT = function( bboxString ){
   var elements = bboxString.split( "," );
   if( elements.length === false ) return false;
   var newPoints = [
      elements[0] + " " + elements[1],
      elements[0] + " " + elements[3],

      elements[2] + " " + elements[3],
      elements[2] + " " + elements[1],

      elements[0] + " " + elements[1],
   ];

   return 'POLYGON((' + newPoints.join(",") + '))';
};

gisportal.indicatorsPanel.polygonToWKT = function( polygon ){
   var elements = polygon[0];
   if( elements.length === false ) return false;
   var newPoints = [];
   for(var coordinate in elements){
      newPoints.push(elements[coordinate].join(' '));
   }

   return 'POLYGON((' + newPoints.join(",") + '))';
};

gisportal.indicatorsPanel.convertBboxCoords = function(coordsArray, from_proj, to_proj){
   for(var point in coordsArray){
      if(typeof(coordsArray[point][0]) == "object"){
         gisportal.indicatorsPanel.convertBboxCoords(coordsArray[point], from_proj, to_proj);
      } else{
         coordsArray[point] = gisportal.reprojectPoint(coordsArray[point], from_proj, to_proj);
      }
   }
};


gisportal.indicatorsPanel.doesTransectPointsFallInLayerBounds = function( layerId ){
   if( gisportal.currentSelectedRegion === "" ) return true;

   var tar = gisportal.currentSelectedRegion.split('GEOMETRYCOLLECTION(POINT(')[1].split('),POINT(');
   tar[tar.length-1] = tar[tar.length-1].split(')')[0];

   var layer = gisportal.layers[ layerId ];
   var bounds = layer.exBoundingBox;

   var arr = [
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ],
      [
         Number(bounds.EastBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ],
      [
         Number(bounds.EastBoundLongitude),
         Number(bounds.SouthBoundLatitude)
      ],
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.SouthBoundLatitude)
      ],
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ]
   ];

   bb2 = new Terraformer.Polygon( {
      "type": "Polygon",
      "coordinates": [arr] 
   });

   for(var x = 0; x < tar.length -1; x++ ){
      var t_point = new Terraformer.Point({
         "type" : "Point",
         "coordinates" :gisportal.reprojectPoint([Number(tar[x].split(' ')[0]), Number(tar[x].split(' ')[1])], gisportal.projection, "EPSG:4326")
      });
      // test if point inside bbox
      if(bb2.contains(t_point)){
         return true;
      }
   }
   return "None of the points uploaded are contained within the bounding box of the data selected.";


};

gisportal.indicatorsPanel.doesCurrentlySelectedRegionFallInLayerBounds = function( layerId ){
   // Skip if empty
   if( gisportal.currentSelectedRegion === "" ) return true;

   var bb1, point;
   // Try to see if its WKT string
   var temp_bbox = gisportal.currentSelectedRegion;
   // This bit just makes sure that the Terraformer can interprate the values as it doesn't work with scientific notation
   temp_bbox = temp_bbox.split(",");
   for(var val in temp_bbox){
      temp_bbox[val] = Number(temp_bbox[val]);
   }
   temp_bbox = temp_bbox.join(",");
   try{
      bb1 = Terraformer.WKT.parse( gisportal.currentSelectedRegion );
   }catch( e ){
      // Assume the old bbox style
      try{
         bb1 = Terraformer.WKT.parse( gisportal.indicatorsPanel.bboxToWKT(temp_bbox) );
      }catch(err){
         $.notify("This shape is not a polygon and cannot be used to select data for graphing, please try another shape", "error");
      }
   }

   var current_proj = gisportal.projection;

   gisportal.indicatorsPanel.convertBboxCoords(bb1.coordinates, current_proj, "EPSG:4326");

   var proj_bounds = gisportal.availableProjections[current_proj].bounds;
   // A different message is displayed if the user clicks off the earth
   var bb2 = new Terraformer.Polygon( {
      "type": "Polygon",
      "coordinates": [[[proj_bounds[0], proj_bounds[3]], [proj_bounds[2], proj_bounds[3]], [proj_bounds[2], proj_bounds[1]], [proj_bounds[0], proj_bounds[1]], [proj_bounds[0], proj_bounds[3]]]]
   });
   if(current_proj !== "EPSG:4326"){
      for(point in bb2.coordinates[0]){
         bb2.coordinates[0][point] = gisportal.reprojectPoint(bb2.coordinates[0][point], current_proj, "EPSG:4326");
      }
   }
   // INFO: This could eventually be replaced if a bounding box that intersects the current world can be split into multi-polygons.
   if(!bb1.within( bb2 )){
      return "The bounding box cannot wrap around the International Date Line, please redraw it.";
   }

   var layer = gisportal.layers[ layerId ];
   var bounds = layer.exBoundingBox;

   var arr = [
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ],
      [
         Number(bounds.EastBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ],
      [
         Number(bounds.EastBoundLongitude),
         Number(bounds.SouthBoundLatitude)
      ],
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.SouthBoundLatitude)
      ],
      [
         Number(bounds.WestBoundLongitude),
         Number(bounds.NorthBoundLatitude)
      ]
   ];

   bb2 = new Terraformer.Polygon( {
      "type": "Polygon",
      "coordinates": [arr] 
   });

   if(bb1.intersects( bb2 )){
      return true;
   }
   else{
      return "The bounding box selected contains no data for this indicator.";
   }
};

function selectAboveMaxBelowMinOptions(id, aboveMaxColor, belowMinColor) {
   // Select custom if the above max or below min value doesn't match a dropdown value
   try {
      $('#tab-' + id + '-aboveMaxColor').ddslick('select', {value: aboveMaxColor || "0"});
   } catch (err) {
      $('#tab-' + id + '-aboveMaxColor').ddslick('select', {value: 'custom'});
      $('.js-custom-aboveMaxColor[data-id="' + id + '"]').val(aboveMaxColor);
   }
   try {
      $('#tab-' + id + '-belowMinColor').ddslick('select', {value: belowMinColor || "0"});
   } catch (err) {
      $('#tab-' + id + '-belowMinColor').ddslick('select', {value: 'custom'});
      $('.js-custom-belowMinColor[data-id="' + id + '"]').val(belowMinColor);
   }
}

function deepCopyLayer(indicatorLayer){
   var indicatorLayerName=indicatorLayer.values_.id;
   var duplicatedLayerName=indicatorLayerName+'_swipe';
   var comparisonTime=indicatorLayer.values_.source.params_.time;

   var originalLayer=gisportal.layers[indicatorLayerName];
   var duplicatedLayerURLName=originalLayer.urlName;
   // var originalLayerOpenLayersComponent=gisportal.layers[indicatorLayerName].openlayers;
   // var sourceParams=originalLayerOpenLayersComponent.anID.values_.source.params_;
   // originalLayer.openLayers={};

   // var duplicateLayer=JSON.parse(JSON.stringify(originalLayer));

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
      // "positive" : server.options.positive, 
      "provider" : originalLayer.provider, 
      "offsetVectors" : originalLayer.offsetVectors, 
      "tags": originalLayer.tags
   };

   var duplicateLayer= new gisportal.layer(layerOptions);
   // originalLayer.openlayers=originalLayerOpenLayersComponent; // Add back in the openLayers component to the original layer
   console.log('DuplicatedLayerName:', duplicatedLayerName);
   gisportal.layers[duplicatedLayerName]=duplicateLayer;

   // Now read the new layer and add it to the map 
   var layer = gisportal.layers[duplicatedLayerName];
   options={visible:true};
   style=undefined;
   layer.urlName=duplicatedLayerURLName;

   comparisonObject={
      'duplicatedLayerName':duplicatedLayerName,
      'comparisonTime':comparisonTime,
   };
   layer.comparisonObject=comparisonObject;
   gisportal.getLayerData(layer.serverName + '_' + layer.urlName + '.json', layer, options, style);
   
}