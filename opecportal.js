/*====================================================================================*/
//Initialise javascript global variables and objects

// The OpenLayers map object
var map;

/*
Helper functions
*/

// Predefined map coordinate systems
/*   var googp = new OpenLayers.Projection("EPSG:900913");*/
var lonlat = new OpenLayers.Projection("EPSG:4326");

// Quick regions array in the format "Name",W,S,E,N
var quickRegion = [
   ["European Seas", -23.44, 20.14, 39.88, 68.82],
   ["Adriatic", 11.83, 39.00, 20.67, 45.80],
   ["Baltic", 9.00, 51.08, 30.50, 67.62],
   ["Biscay", -7.10, 44.00, -0.60, 49.00],
   ["Black Sea", 27.30, 38.50, 42.00, 49.80],
   ["English Channel", -5.00, 46.67, 4.30, 53.83],
   ["Eastern Med.", 20.00, 29.35, 36.00, 41.65],
   ["North Sea", -4.50, 50.20, 8.90, 60.50],
   ["Western Med.", -6.00, 30.80, 16.50, 48.10],
   ["Mediterranean", -6.00, 29.35, 36.00, 48.10]  
];
 // Define a proxy for the map to allow async javascript http protocol requests
 // This will always need changing when swapping between Windows and Linux
 //OpenLayers.ProxyHost = "xDomainProxy.ashx?url=";   // Windows only using ASP.NET (C#) handler
 OpenLayers.ProxyHost = 'Proxy.php?url='; // Linux or Windows using php proxy script
 //OpenLayers.ProxyHost = '/cgi-bin/proxy.cgi?url=';   // Linux using OpenLayers proxy
/*====================================================================================*/

// Create layers for the map from the getCapabilities request
function createOpLayers(map) 
{
   var theMap = map;
   $.each(theMap.getCapabilities.reverse(), function(i, item) 
   {
      // Add accordion for each sensor with layers
      if(item.Layers.length)
      {
         var sensorName = item.Sensor;
         // Create the accordion for the sensor
         addAccordionToPanel(sensorName, theMap);

         $.each(item.Layers, function(i, item) {
            if(item.Name && item.Name != "") {
               createOpLayer(item, sensorName, theMap);
            }
         });
      }
   });
}

// Create a layer to be displayed on the map
function createOpLayer(layerData, sensorName, map) 
{
   var layer = new OpenLayers.Layer.WMS (
      layerData.Name.replace("/","-"),
      'http://rsg.pml.ac.uk/ncWMS/wms?',
      { layers: layerData.Name, transparent: true}, 
      { opacity: 1 }
   );

   layer.temporal = layerData.Temporal; 
   if(layer.temporal) 
   {
      layer.createDateCache('./json/WMSDateCache/' + layer.name + '.json');
   }

   layer.title = layerData.Title;
   layer.abstract = layerData.Abstract;
   layer.sensor = sensorName.replace(/\s+/g, "");
   layer.styles = layerData.Styles;
   layer.exboundingbox = layerData.EX_GeographicBoundingBox;
   layer.boundingbox = layerData.BoundingBox;
   layer.setVisibility(false);     
   layer.selected = false;     
   map.addLayer(layer);
   addLayerToPanel(layer);
}

// Create all the base layers for the map
function createBaseLayers(map)
{
   // Add GEBCO base layer
   var gebco = new OpenLayers.Layer.WMS(
      "GEBCO",
      "http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?",
      { layers: 'gebco_08_grid' },
      { wrapDateLine: true }
   );
   map.addLayer(gebco);

   // Add Cubewerx layer
   var cube = new OpenLayers.Layer.WMS(
      'CubeWerx',
      'http://demo.cubewerx.com/demo/cubeserv/cubeserv.cgi?',
      { layers: 'Foundation.GTOPO30' },
      { wrapDateLine: true }
   );
   map.addLayer(cube);

   // Add NASA Landsat layer
   var landsat = new OpenLayers.Layer.WMS(
      'Landsat',
      'http://irs.gis-lab.info/?',
      { layers: 'landsat' },
      { wrapDateLine: true }
   );
   map.addLayer(landsat);
   
   // Get and store the number of base layers
   map.numBaseLayers = map.getLayersBy('isBaseLayer', true).length;
}

// Create all the reference layers for the map
function createRefLayers(map)
{
   // Add AMT cruise tracks 12-19 as GML Formatted Vector layer
   for(i = 12; i <= 19; i++) {
      // skip AMT18 as it isn't available
      if(i == 18) continue;
      // Style the AMT vector layers with different colours for each one
      var AMT_style = new OpenLayers.Style({
         'strokeColor': '${colour}'
      },
      {
         context: {
            colour: function(feature) {
               switch(feature.layer.title) {

                  case 'AMT12 Cruise Track':
                    return 'blue';
                    break;
                  case 'AMT13 Cruise Track':
                    return 'aqua';
                    break;
                  case 'AMT14 Cruise Track':
                    return 'lime';
                    break;
                  case 'AMT15 Cruise Track':
                    return 'magenta';
                    break;
                  case 'AMT16 Cruise Track':
                    return 'red';
                    break;
                  case 'AMT17 Cruise Track':
                    return 'orange';
                    break;
                  case 'AMT19 Cruise Track':
                    return 'yellow';
                    break;
               }
            }
         }
      });

      // Create a style map object and set the 'default' and 'selected' intents
      var AMT_style_map = new OpenLayers.StyleMap({ 'default': AMT_style });

      var cruiseTrack = new OpenLayers.Layer.Vector('AMT' + i + '_Cruise_Track', {
         protocol: new OpenLayers.Protocol.HTTP({
            url: 'http://rsg.pml.ac.uk/geoserver/rsg/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rsg:AMT' + i + '&outputFormat=GML2',
            format: new OpenLayers.Format.GML()
            }),
         strategies: [new OpenLayers.Strategy.Fixed()],
         projection: lonlat,
         styleMap: AMT_style_map
      });

      // Make this layer a reference layer         
      cruiseTrack.controlID = "refLayers";
      cruiseTrack.setVisibility(false);
      cruiseTrack.title = 'AMT' + i + ' Cruise Track';
      map.addLayer(cruiseTrack);
      addLayerToPanel(cruiseTrack);
   }

   // Setup Black sea outline layer (Vector)
   var blackSea = new OpenLayers.Layer.Vector('The_Black_Sea_KML', {
      projection: lonlat,
      strategies: [new OpenLayers.Strategy.Fixed()],
      protocol: new OpenLayers.Protocol.HTTP({
         url: 'black_sea.kml',
         format: new OpenLayers.Format.KML({
            extractStyles: true,
            extractAttributes: true
         })
      })
   });

   // Make this layer a reference layer
   blackSea.controlID = "refLayers";
   blackSea.selected = true;
   blackSea.title = "The Black Sea (KML)";
   map.addLayer(blackSea);
   addLayerToPanel(blackSea);

   // Setup Black sea outline layer (Vector)
   var blackSea = new OpenLayers.Layer.Vector('The_Blue_Sea_KML', {
      projection: lonlat,
      strategies: [new OpenLayers.Strategy.Fixed()],
      protocol: new OpenLayers.Protocol.HTTP({
         url: 'black_sea.kml',
         format: new OpenLayers.Format.KML({
            extractStyles: true,
            extractAttributes: true
         })
      })
   });

   // Make this layer a reference layer
   blackSea.controlID = "refLayers";
   blackSea.selected = true;
   blackSea.title = "The Black Sea (KML)";
   map.addLayer(blackSea);
   addLayerToPanel(blackSea);

   // Setup Black sea outline layer (Vector)
   var blackSea = new OpenLayers.Layer.Vector('The_Green_Sea_KML', {
      projection: lonlat,
      strategies: [new OpenLayers.Strategy.Fixed()],
      protocol: new OpenLayers.Protocol.HTTP({
         url: 'black_sea.kml',
         format: new OpenLayers.Format.KML({
            extractStyles: true,
            extractAttributes: true
         })
      })
   });

   // Make this layer a reference layer
   blackSea.controlID = "refLayers";
   blackSea.selected = true;
   blackSea.title = "The Black Sea (KML)";
   map.addLayer(blackSea);
   addLayerToPanel(blackSea);

   // Get and store the number of reference layers
   map.numRefLayers = map.getLayersBy('controlID', 'refLayers').length;
}

// Add a accordion to the layers panel
function addAccordionToPanel(accordionName, map)
{
   // Add the accordion
   $('#opLayers').prepend(
      '<div>' +
         '<h3><a href="#">' + accordionName + '</a></h3>' +
         '<div id="' + accordionName.replace(/\s+/g, "") + '" class="sensor-accordion"></div>' +
      '</div>'
   );

   // Makes each of the operational layers sortable
   $('#' + accordionName.replace(/\s+/g, "")).sortable({
      connectWith: ".sensor-accordion",
      appendTo:".sensor-accordion",
      helper:"clone",
      update: function() 
      {
         updateLayerOrder($(this));
      }
   }).disableSelection();
}

/*------------------------------- Deprecated ----------------------------------
// Map layers elements - add data layers in reverse order to ensure
// last added appear topmost in the UI as they are topmost in the layer stack
// also populate the dates of data availability for all data layers
function updateLayerList(map)
{
   for(i = (map.layers.length - 1); i >= 0; i--) {
      var layer = map.layers[i];
      addLayerToPanel(layer);
   }
}
-----------------------------------------------------------------------------*/

// Add a layer to the layers panel
function addLayerToPanel(layer)
{
   // if not already on list and not a base layer, populate the layers panel (left slide panel)
   if(!$('#' + layer.name).length && layer.displayInLayerSwitcher && !layer.isBaseLayer) {
      // jQuery selector for the layer controlID
      var selID = layer.controlID == 'opLayers' ? '#' + layer.sensor : '#' + layer.controlID; 

      $(selID).prepend(
         '<li id="' + layer.name + '">' +
            '<img src="img/ajax-loader.gif"/>' +
            '<input type="checkbox"' + (layer.visibility ? ' checked="yes"' : '') + '" name="' + layer.name + '" value="' + layer.name + '" />' + 
            layer.title + 
            '<a id="layer-exclamation" href="#">' +
               '<img src="img/exclamation_small.png"/>' +
            '</a>' +           
         '</li>');

      // Show the img when we are loading data for the layer
      layer.events.register("loadstart", layer, function(e) {
         $('#' + this.name).find('img[src="img/ajax-loader.gif"]').show();
      });
      // Hide the img when we have finished loading data
      layer.events.register("loadend", layer, function(e) {
         $('#' + this.name).find('img[src="img/ajax-loader.gif"]').hide();
      });
      // Hide the ajax-loader and the exclamation mark initially
      $('#' + layer.name).find('img[src="img/ajax-loader.gif"]').hide();
      $('#' + layer.name).find('img[src="img/exclamation_small.png"]').hide();

      // Check the layer state when its visibility is changed
      layer.events.register("visibilitychanged", layer, function() {
         checkLayerState(layer);
      });
   }
}

// Creates a list of custom args that will be added to the
// permalink url.
function customPermalinkArgs()
{
   var args = OpenLayers.Control.Permalink.prototype.createParams.apply(
      this, arguments
   );
}

// Updates all the layer index's in all the layer accordions
function updateAccordionOrder()
{
   $.each($('.sensor-accordion'), function(index, value) {
      updateLayerOrder($(this));
   });
}

// Updates the position of layers based on their new position on the stack
function updateLayerOrder(layer)
{
   var layerOffset = 0;
   $.each(layer.parent('div').nextAll('div').children('.sensor-accordion'), function(index, value) {
      layerOffset += $(this).children('li').length;
   });
   console.info('offset: ' + layerOffset);

   var order = layer.sortable('toArray');                  
   $.each(order, function(index, value) {
      var layer = map.getLayersByName(value)[0];
      map.setLayerIndex(layer, map.numBaseLayers + map.numRefLayers + layerOffset + order.length - index - 1);
   });
}

// Checks to see if a layer is not visible and selected
function checkLayerState(layer)
{
   if(!layer.visibility && layer.selected)
      $('#' + layer.name).find('img[src="img/exclamation_small.png"]').show();
   else
      $('#' + layer.name).find('img[src="img/exclamation_small.png"]').hide();
}

// Start mapInit() - the main function for setting up the map
// plus its controls, layers, styling and events.
function mapInit() 
{
   map = new OpenLayers.Map('map', {
      projection: lonlat,
      displayProjection: lonlat,
      controls: []
   });


   // Get the master cache file from the server. This file contains some of 
   // the data from a getCapabilities query.
   map.createMasterCache();

   // Create the base layers and then add them to the map
   createBaseLayers(map);
   // Create the reference layers and then add them to the map
   createRefLayers(map);

   // Add a couple of useful map controls
   //var mousePos = new OpenLayers.Control.MousePosition();
   //var permalink =  new OpenLayers.Control.Permalink();
   //map.addControls([mousePos,permalink]);

   if(!map.getCenter()) {
      map.zoomTo(3);
   }
}

// Anything that needs to be done after the layers are loaded goes here
function layerDependent(data)
{
   map.getCapabilities = data;
   createOpLayers(map);

   // Custom-made jQuery interface elements: multi-accordion sections (<h3>)
   // for data layers (in left panel) and data analysis (in right panel)
   $("#layerAccordion, #dataAccordion").multiOpenAccordion({
      active: [0, 1],
   });

   $('#opLayers > div').multiOpenAccordion({
      active: 0,
      click: function(e) {
         var parent = $(this).parent('div');
         if(parent.hasClass('test')) {
            parent.removeClass('test');
            return false;
         }
      },
   });

   $('#refLayers').multiOpenAccordion({
      active: 0,
   });

   // Makes each of the accordions sortable
   $('#opLayers').sortable({
      axis: 'y',
      handle: 'h3',
      update: function() 
      {
         updateAccordionOrder();
      },
   })
   .disableSelection()
   .bind('sortstart', function(e, ui) {
      $(this).addClass('test');
   });
   //.bind('sortstop', function(e, ui) {
   //   $(this).removeClass('test');
   //});

   // Makes each of the reference layers sortable
   $("#refLayers").sortable({
      update: function() {
         var order = $("#refLayers").sortable('toArray');                 
         $.each(order, function(index, value) {
            var layer = map.getLayersByName(value);
            map.setLayerIndex(layer[0], map.numBaseLayers + order.length - index - 1);
         });
      }
   });

   // set the max height of each of the accordions relative to the size of the window
   $('#layerAccordion').css('max-height', $(window).height() - 120);
   $('#opLayers').css('max-height', ($(document).height() - 120) / 2 - 40);
   $('#refLayers').css('max-height', ($(document).height() - 120) / 2 - 40);

   $(window).resize(function() {
      $('#layerAccordion').css('max-height', $(window).height() - 120);
      $('#opLayers').css('max-height', ($(document).height() - 120) / 2 - 40);
      $('#refLayers').css('max-height', ($(document).height() - 120) / 2 - 40);
   });

   // Handle selection of visible layers
   $('.lPanel li').click(function(e) {
       var itm = $(this);
       var child = itm.children('input').first();
       if(child.is(':checked')) {
           $('.lPanel li').each(function(index) {
               $(this).removeClass('selectedLayer');
           });
           itm.addClass('selectedLayer');
       }
       else {
           itm.removeClass('selectedLayer');
       }
   });

   // Toggle visibility of data layers
   $('#opLayers :checkbox, #refLayers :checkbox').click(function(e) {
      var v = $(this).val();
      var layer = map.getLayersByName(v)[0];
      if($(this).is(':checked')) {
         layer.selected = true;
         // If the layer has date-time data, use special select routine
         // that checks for valid data on the current date to decide if to show data
         if(layer.temporal) {
            map.selectDateTimeLayer(layer, $('#viewDate').datepicker('getDate'));
            // Update map date cache now a new temporal layer has been added
            map.refreshDateCache();
         }
         else {
            layer.setVisibility(true);
            checkLayerState(layer);
         }
      }
      else {
         layer.selected = false;
         layer.setVisibility(false);
         checkLayerState(layer);
         // Update map date cache now a new temporal layer has been removed
         if(layer.temporal){map.refreshDateCache();}
      }
   });

   gritterLayerHelper();

   setupDrawingControl();
}

/*====================================================================================*/

function nonLayerDependent()
{
   //Configure and generate the UI elements

   // Update our latlng on the mousemove event
   map.events.register("mousemove", map, function(e) 
   { 
      var position =  map.getLonLatFromPixel(e.xy);
      if(position)
         $('#latlng').text('Mouse Position: ' + position.lon.toFixed(3) + ', ' + position.lat.toFixed(3));
   });

   // Populate the base layers drop down menu
   $.each(map.layers, function(index, value) {
       var layer = value;
       // Add map base layers to the baseLayer drop-down list from the map
       if(layer.isBaseLayer) {
           $('#baseLayer').append('<option value="' + layer.name + '">' + layer.name + '</option>');
       }
   });

   // Populate Quick Regions from the quickRegions array
   for(i = 0; i < quickRegion.length; i++) {
       $('#quickRegion').append('<option value="' + i + '">' + quickRegion[i][0] + '</option>');
   }

   // jQuery UI elements
   $('#viewDate').datepicker({
       showButtonPanel: true,
       dateFormat: 'dd-mm-yy',
       changeMonth: true,
       changeYear: true,
       beforeShowDay: function(date) {return map.allowedDays(date);},
       onSelect: function(dateText, inst) { return map.filterLayersByDate(dateText, inst); }
   });

   $('#panZoom').buttonset();
   $('#pan').button({ icons: { primary: 'ui-icon-arrow-4-diag'} });
   $('#zoomIn').button({ icons: { primary: 'ui-icon-circle-plus'} });
   $('#zoomOut').button({ icons: { primary: 'ui-icon-circle-minus'} });

   // I just set up the basic buttons, you will need to set the icons and any css
   $('#ROIButtonSet').buttonset();
   $('#point').button({ icons: { primary: 'ui-icon-drawpoint'} });
   $('#box').button({ icons: { primary: 'ui-icon-drawbox'} });
   $('#circle').button({ icons: { primary: 'ui-icon-drawcircle'} });
   $('#polygon').button({ icons: { primary: 'ui-icon-drawpoly'} });

   $("#dataTabs").tabs();
   // Must bind the creation of accordions under the tabs in this way to avoid messing up nested controls
   $('#dataTabs').bind('tabshow', function(event, ui) {
       $("#analyses").accordion({ collapsible: true, autoHeight: false });
       $("#spatial").accordion({ collapsible: true, autoHeight: false });
       $("#temporal").accordion({ collapsible: true, autoHeight: false });
   });

   // Custom-made jQuery interface elements: multi-accordion sections (<h3>)
   // for data layers (in left panel) and data analysis (in right panel)
   //$("#layerAccordion, #dataAccordion").multiAccordion();

   //Hook up the other events for the general UI

   // Left slide panel show-hide functionality      
   $(".triggerL").click(function(e) {
      $(".lPanel").toggle("fast");
      $(this).toggleClass("active");
      return false;
   });
   // Right slide panel show-hide functionality
   $(".triggerR").click(function(e) {
      $(".rPanel").toggle("fast");
      $(this).toggleClass("active");
      return false;
   });

   // Add map options panel rollover functionality
   $('#mapOptionsBtn').hover(function() {
      clearTimeout($(this).data('timeout'));
      $('#mapOptions').show('fast');
   }, function() {
      var t = setTimeout(function() {
         $('#mapOptions').hide('fast');
      }, 500);
      $(this).data('timeout', t);
   });

   $('#mapOptions').hover(function() {
      clearTimeout($('#mapOptionsBtn').data('timeout'));
      $('#mapOptions').show();
   }, function() {
      var t = setTimeout(function() {
         $('#mapOptions').hide('fast');
      }, 300);
      $(this).data('timeout', t);
   });

   // Add permalink share panel click functionality
   $('#shareMapToggleBtn').click(function() {
      $('#shareOptions').toggle();
      return false;
   });

   // Add toggle info dialog functionality
   $('#infoToggleBtn').click(function(e) {
      if($('#info').dialog('isOpen')) {
        $('#info').dialog('close');
      }
      else {
        $('#info').dialog('open');
      }
      return false;
   })

   // Add toggle map info dialog functionality
   $('#mapInfoToggleBtn').click(function(e) {
      if($('#mapInfo').dialog('isOpen')) {
        $('#mapInfo').dialog('close');
      }
      else {
        $('#mapInfo').dialog('open');
      }
      return false;
   })

   // Change of base layer event handler
   $('#baseLayer').change(function(e) {
       map.setBaseLayer(map.getLayersByName($('#baseLayer').val())[0]);
   });

   // Change of quick region event handler
   $('#quickRegion').change(function(e) {
       var qr_id = $('#quickRegion').val();
       var bbox = new OpenLayers.Bounds(
                   quickRegion[qr_id][1],
                   quickRegion[qr_id][2],
                   quickRegion[qr_id][3],
                   quickRegion[qr_id][4]
                ).transform(map.displayProjection, map.projection);
       map.zoomToExtent(bbox);
   });

   createContextMenu();
}

/*====================================================================================*/

function setupDrawingControl()
{
   // Add the Vector drawing layer for POI drawing
   var vectorLayer = new OpenLayers.Layer.Vector('POI Layer', {
      style : {
         strokeColor : 'red',
         fillColor : 'red',
         strokeWidth : 2,
         fillOpacity : 0.3,
         pointRadius: 5
      },
      preFeatureInsert : function(feature) {
         this.removeAllFeatures();
      },
      onFeatureInsert : function(feature) {
         ROIAdded(feature);
      }
   }); 

   vectorLayer.displayInLayerSwitcher=false;
   map.addLayer(vectorLayer);

   // Function called once a ROI has been drawn on the map
   function ROIAdded(feature) {
      $('#dispROI').html('<h3>ROI Details</h3>');
      switch(map.ROI_Type) {
         case 'point':
            $('#dispROI').append('<h4>Point ROI</h4>');
            $('#dispROI').append('<p>lat,lon=' + feature.geometry.x + ',' + feature.geometry.y + '</p>');
            break;
         case 'box':
            $('#dispROI').append('<h4>Rectangular ROI</h4>');
            break;
         case 'circle':
            $('#dispROI').append('<h4>Circular ROI</h4>');
            $('#dispROI').append('<p>Radius (deg)=' + feature.geometry.getBounds().getWidth()/2 + ',' + feature.geometry.getBounds().getHeight()/2 + '</p>');
            $('#dispROI').append('<p>Centre (lat, lon)=</p><p>(' + feature.geometry.getCentroid().x + ',' + feature.geometry.getCentroid().y + ')</p>');
            break;
         case 'polygon':
            $('#dispROI').append('<h4>Custom Polygon ROI</h4>');
            break;
      }
   }

   // Function which can toggle OpenLayers controls based on the clicked control
   // The value of the value of the underlying radio button is used to match 
   // against the key value in the mapControls array so the right control is toggled
   function toggleControl(element) {
      for(key in mapControls) {
         var control = mapControls[key];
         if($(element).val() == key) {
            $('#'+key).attr('checked', true);
            control.activate();
         }
         else {
            $('#'+key).attr('checked', false);
            control.deactivate();
         }
      }
      $('#panZoom input:radio').button('refresh');
   }

   // Function which can toggle OpenLayers drawing controls based on the value of the clicked control
   function toggleDrawingControl(element) {
      toggleControl(element);
      vectorLayer.removeAllFeatures();
      map.ROI_Type = element.value;
      // DEBUG
      console.info(map.ROI_Type);
   }

   /* 
   Set up event handling for the map including as well as mouse-based 
   OpenLayers controls for jQuery UI buttons and drawing controls
   */

   // Create map controls identified by key values which can be activated and deactivated
   var mapControls = {
      zoomIn: new OpenLayers.Control.ZoomBox(
         { out: false, alwaysZoom: true }
      ),
      zoomOut: new OpenLayers.Control.ZoomBox(
         { out: true, alwaysZoom: true }
      ),
      pan: new OpenLayers.Control.Navigation(),
      point: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point),
      box: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions:{sides: 4, irregular: true, persist: false }}),
      circle: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions:{sides: 50}, persist: false}),
      polygon: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Polygon)
   };

   // Add all the controls to the map
   for(var key in mapControls) {
       var control = mapControls[key];
       map.addControl(control);
   }

   // Handle jQuery UI icon button click events - each button has a class of "iconBtn"
   $('#panZoom input:radio').click(function(e) {
       toggleControl(this);
   });

   // Handle drawing control radio buttons click events - each button has a class of "iconBtn"
   $('#ROIButtonSet input:radio').click(function(e) {
      toggleDrawingControl(this);
   });
}

/*====================================================================================*/

//This code runs once the page has loaded - jQuery initialised
$(document).ready(function() {

   // Need to render the jQuery UI info dialog before the map due to z-index issues!
   $('#info').dialog({
       position: ['left', 'bottom'],
       width: 230,
       height: 220,
       resizable: false
   });

   // Show the scalebar for a selected layer
   $('#scalebar').dialog({
      position: ['center', 'center'],
      width: 120,
      height: 310,
      resizable: true,
      autoOpen: false
   });

   // Show metadata for a selected layer
   $('#metadata').dialog({
      position: ['center', 'center'],
      width: 400,
      height: 200,
      resizable: true,
      autoOpen: false
   });

   // Show map info such as latlng
   $('#mapInfo').dialog({
      position: ['center', 'center'],
      width: 220,
      height: 200,
      resizable: true,
      autoOpen: false
   });

   // Setup the gritter so we can use it for error messages
   setupGritter();
   // Set and display the welcome message
   createWelcomeMessage();

   // Set up the map
   // any layer dependent code is called in a callback in mapInit
   mapInit();

   // Start setting up anything that is not layer dependent
   nonLayerDependent();
});
