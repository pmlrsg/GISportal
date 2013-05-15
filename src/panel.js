/**
 * Left Panel
 * @namespace 
 */
opec.leftPanel = {};

opec.leftPanel.setup = function() {
   //$('#refLayers').multiOpenAccordion({
   //   active: 0
   //});
   
   // Makes each of the accordions sortable
   $('#opec-lPanel-operational').sortable({
      axis: 'y',
      distance: 10,
      handle: 'h3',
      update: function() {
         opec.leftPanel.updateGroupOrder($(this));
      }
   })
   .disableSelection();
   //.bind('sortstart', function(e, ui) {
   //   $(this).addClass('sort-start');
   //});
   
   // Makes each of the reference layers sortable
   $("#opec-lPanel-reference").sortable({
      axis: 'y',
      distance: 10,
      update: function() {
         opec.leftPanel.updateGroupOrder($(this));
         //var order = $("#opec-lPanel-reference").sortable('toArray');                 
         //$.each(order, function(index, value) {
            //var layer = opec.getLayerByID(value);
            //map.setLayerIndex(layer[0], map.numBaseLayers + order.length - index - 1);
         //});
      }
   });
   
   // Add dummy help layer
   opec.leftPanel.addDummyHelpLayer();
   
   // Add first Group
   opec.leftPanel.addNextGroupToPanel($('#opec-lPanel-operational'));
   
   //Hook up the other events for the general UI
   // Left slide panel show-hide functionality      
   $(".triggerL").click(function(e) {
      $(".lPanel").toggle("fast");
      $(this).toggleClass("active");
      return false;
   });
   
   // Left slide panel buttons
   $('#triggerL-buttonset').buttonset();
   
   // Add group on click
   $('#triggerL-add-accordion')
      .button({ label: 'Add a new group', icons: { primary: 'ui-icon-circle-plus'}, text: false })   
      .click(function(e) { 
         var $panel = $('.lPanel .opec-tab-content:visible');
         opec.leftPanel.addNextGroupToPanel($panel);
      });
   //$('#triggerL-remove-accordion').button({ icons: { primary: 'ui-icon-circle-minus'}, text: false });

   $('#triggerL-add-group').button();
   
   $('.lPanel .opec-tab-group').buttonset();
   $('#opec-lpanel-tab-operational').button();
   $('#opec-lpanel-tab-reference').button();
   $('#opec-lpanel-tab-options').button();
   
   $('.lPanel .opec-tab-group :button').click(function(e) { 
      var tabToShow = $(this).attr('href');
      $('#opec-lPanel-content .opec-tab-content').filter(function(i) { 
         return $(this).attr('id') != tabToShow.slice(1); 
      }).hide('fast');
      $(tabToShow).show('fast');
   });
};

/**
 * Add a group to the layers panel.
 */
opec.leftPanel.addGroupToPanel = function(id, displayName, $panelName) {
   // Add the accordion
   $panelName.prepend(
      '<div>' +
         '<h3><span class="ui-accordion-header-title">' + displayName + '</span></h3>' +
         '<div id="' + id + '" class="sensor-accordion"></div>' +
      '</div>'
   );

   // Creates the accordion
   $('#' + id).parent('div').multiOpenAccordion({
      active: 0,
      $panel: $panelName,
      showClose: function($panelName) {
         if($panelName.is("#opec-lPanel-reference") && $panelName.children().length <= 1)
            return false;
         else
            return true;
      },
      showDropdown: true,
      events: {
         close: function(id) {
            opec.leftPanel.removeGroupFromPanel(id);
         },
         dropdown: function($group) {
            $group.find('.ui-accordion-header-dropdown').first().contextMenu();
         } 
      }
   });
   
   //if ($panelName.attr('id') == 'opec-lPanel-operational') {
      // Makes each of the operational layers sortable
      $('#' + id).sortable({
         connectWith: ".sensor-accordion",
         appendTo:".sensor-accordion",
         helper:"clone",
         update: function() {
            opec.leftPanel.updateLayerOrder($(this));
         }
      }).disableSelection();
   //}
};

/**
 * Remove a group from the layers panel. 
 */
opec.leftPanel.removeGroupFromPanel = function(id) {
   var $id = $('#' + id);
   if($id.length) {    
      // Check if the accordion is empty
      $id.children('li').each(function() {
         var layer = opec.getLayerByID($(this).attr('id'));
         if(typeof layer !== 'undefined') {
            opec.removeOpLayer(layer);
            // Deselect layer on layer selector
            opec.layerSelector.toggleSelectionFromLayer(layer);
         }

      });
          
      // Remove the accordion we were asked to remove   
      $id.parent('div').multiOpenAccordion('destroy');
      $id.parent('div').remove();
   }
   
   // Do a search for any others that need to be removed
   //$.each($('.sensor-accordion'), function(index, value) {
      //if($(this).children('li').length == 0)
         //$(this).parent('div').remove();
   //});
};

opec.leftPanel.getFirstGroupFromPanel = function($panelName) {
   return $panelName.find('.sensor-accordion')
      .filter(function(i) {
         return !$(this).hasClass('opec-help');
      })
      .first();
};

opec.leftPanel.addNextGroupToPanel = function($panelName) {
   var number = ($panelName.find('.sensor-accordion')
      .filter(function(i) {
         return !$(this).hasClass('opec-help');
      })
      .length + 1);
      
   while($('#group' + number).length !== 0) {
      number++;
   }
      
   opec.leftPanel.addGroupToPanel('group' + number, 'Group ' + number, $panelName);
};

/**
 * Add a layer to a group on the layers panel.
 */ 
opec.leftPanel.addLayerToGroup = function(layer, $group) {
   // if not already on list and not a base layer, populate the layers panel (left slide panel)
   if(!$('#' + layer.id).length && layer.displayInLayerSwitcher) {
      // jQuery selector for the layer controlID
      //var selID = layer.controlID == 'opLayers' ? '#' + layer.displaySensorName : '#' + layer.controlID; 
      
      var data = {
         name: layer.id,
         visibility: layer.visibility,
         displayTitle: layer.displayTitle,
         type: layer.controlID
      };
      
      // Add the html to the document using a template
      $group.prepend(
         opec.templates.layer(data)
      );

      var $layer = $('#' + layer.id);

      // Show the img when we are loading data for the layer
      layer.events.register("loadstart", layer, function(e) {
         $('#' + this.id).find('img[src="img/ajax-loader.gif"]').show();
      });
      
      // Hide the img when we have finished loading data
      layer.events.register("loadend", layer, function(e) {
         $('#' + this.id).find('img[src="img/ajax-loader.gif"]').hide();
      });
      
      // Hide the ajax-loader and the exclamation mark initially
      $layer.find('img[src="img/ajax-loader.gif"]').hide();
      $layer.find('img[src="img/exclamation_small.png"]').hide();
         
      if(layer.controlID != 'baseLayers') {   
         // Check the layer state when its visibility is changed
         layer.events.register("visibilitychanged", layer, function() {
            opec.checkLayerState(layer);
         });
      }
      
      // Remove the dummy layer
      //removeDummyHelpLayer()
   }
};

/**
 * Remove a layer from its group on the layers panel. 
 */
opec.leftPanel.removeLayerFromGroup = function(layer) {
   if($('#' + layer.id).length)
      $('#' + layer.id).remove();
};

/**
 * Updates all the layer indexes in all the layer accordions.
 */ 
opec.leftPanel.updateGroupOrder = function($panel) {
   $.each($panel.find('.sensor-accordion'), function(index, value) {
      //if($(this).children('li').length == 0)
         //opec.leftPanel.removeGroupFromPanel($(this).attr('id'));
      //else    
         opec.leftPanel.updateLayerOrder($(this));
   });
};

/**
 * Updates the position of layers based on their new 
 * position on the stack.
 */ 
opec.leftPanel.updateLayerOrder = function(accordion) {
   var layerOffset = 0;
   $.each(accordion.parent('div').nextAll('div').children('.sensor-accordion'), function(index, value) {
      layerOffset += $(this).children('li').length;
   });

   var order = accordion.sortable('toArray');   
   if(order.length > 0) {         
      $.each(order, function(index, value) {
         var layer = opec.getLayerByID(value);
         if(typeof layer !== 'undefined') {
            var positionOffset = layer.controlID == 'opLayers' ? map.numBaseLayers : (map.numBaseLayers + map.numOpLayers);
            map.setLayerIndex(layer, positionOffset + layerOffset + order.length - index - 1);
         }
      });
   }
   else
      ;//opec.leftPanel.removeGroupFromPanel(accordion.attr('id'));
};

/**
 * Adds a dummy layer to help the user. 
 */
opec.leftPanel.addDummyHelpLayer = function() {
   opec.leftPanel.addGroupToPanel("Need-Help", "Need Help?", $('#opec-lPanel-operational'));
   
   $('#Need-Help')
      .addClass('opec-help')
      .prepend(
      '<li id="Help" class="notSelectable">' +
         'You Need to add some layers! Use the ' +      
         '<a id="dmhLayerSelection" href="#">Layer Selection</a>' +  
         ' panel.' +
      '</li>');
   
   // Open the layer panel on click
   $('#dmhLayerSelection').click(function(e) {
      if($('#layerSelection').extendedDialog('isOpen')) {
         $('#layerSelection').parent('div').fadeTo('slow', 0.3, function() { $(this).fadeTo('slow', 1); });
      }
      else {
         $('#layerPreloader').fadeTo('slow', 0.3, function() { $(this).fadeTo('slow', 1); });
      }
      
      return false;
   });
};

///**
// * Removes dummy layer 
// */
//opec.leftPanel.removeDummyHelpLayer = function() {
   //opec.leftPanel.removeGroupFromPanel("Need-Help");
//}

/**
 * Right Panel
 * @namespace 
 */
opec.rightPanel = {};

opec.rightPanel.setup = function() {
   
   // Right slide panel show-hide functionality
   $(".triggerR").click(function(e) {
      $(".rPanel").toggle("fast");
      $(this).toggleClass("active");
      return false;
   });
   
   // Custom-made jQuery interface elements: multi-accordion sections (<h3>)
   // for data layers (in left panel) and data analysis (in right panel)
   $("#opec-rPanel-content").children('div').multiOpenAccordion({
      active: [0, 1]
   });
   
   // Regions of interest drawing control buttons - with custom styling
   $('#ROIButtonSet').buttonset();
   $('#point').button({ icons: { primary: 'ui-icon-drawpoint'} });
   $('#box').button({ icons: { primary: 'ui-icon-drawbox'} });
   $('#circle').button({ icons: { primary: 'ui-icon-drawcircle'} });
   $('#polygon').button({ icons: { primary: 'ui-icon-drawpoly'} });
   
   // Data Analysis panel tabs and accordions
   $("#opec-tab-analyses").multiOpenAccordion({ collapsible: true, heightStyle: 'content', active: [-1, -1, -1, -1] });
   $("#spatial").multiOpenAccordion({ collapsible: true, heightStyle: 'content', active: [-1, -1] });
   $("#temporal").multiOpenAccordion({ collapsible: true, heightStyle: 'content', active: [-1, -1] }); 
   
   $('.rPanel .opec-tab-group').buttonset();
   $('#opec-button-selection').button();
   $('#opec-button-analyses').button();
   $('#opec-button-export').button();
   
   $('.rPanel .opec-tab-group :button').click(function(e) { 
      var tabToShow = $(this).attr('href');
      $('#opec-rPanel-content .opec-tab-content').filter(function(i) { 
         return $(this).attr('id') != tabToShow.slice(1); 
      }).hide('fast');
      $(tabToShow).show('fast');
   });
   
   opec.rightPanel.setupDrawingControls();
   opec.rightPanel.setupGraphingTools();
   opec.rightPanel.setupDataExport();
   
};

/**
 * Sets up the drawing controls to allow for the selection 
 * of ROI's. 
 * 
 */
opec.rightPanel.setupDrawingControls = function() {
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
      },
      rendererOptions: { zIndexing: true }
   }); 

   vectorLayer.controlID = "poiLayer";
   vectorLayer.displayInLayerSwitcher=false;
   map.addLayer(vectorLayer);

   // Function called once a ROI has been drawn on the map
   function ROIAdded(feature) {
      // Get the geometry of the drawn feature
      var geom = new OpenLayers.Geometry();
      geom = feature.geometry;
      
      // Special HTML character for the degree symbol
      var d = '&deg;';
      
      // Get bounds of the feature's geometry
      var bounds = new OpenLayers.Bounds();
      bounds = geom.getBounds();
       
      // Some metrics for the ROI
      var area_deg, area_km, height_deg, width_deg, height_km, width_km, radius_deg, ctrLat, ctrLon = 0;
      
      // Get some values for non-point ROIs
      if(map.ROI_Type !== '' && map.ROI_Type != 'point') {
         area_deg = geom.getArea();
         area_km = (geom.getGeodesicArea()*1e-6);
         height_deg = bounds.getHeight();
         width_deg = bounds.getWidth();
         // Note - to get values in true ellipsoidal distances, we need to use Vincenty functions for measuring ellipsoidal
         // distances instead of planar distances (http://www.movable-type.co.uk/scripts/latlong-vincenty.html)
         ctrLon = geom.getCentroid().x;
         ctrLat = geom.getCentroid().y;
         height_km = OpenLayers.Util.distVincenty(new OpenLayers.LonLat(ctrLon,bounds.top),new OpenLayers.LonLat(ctrLon,bounds.bottom));
         width_km = OpenLayers.Util.distVincenty(new OpenLayers.LonLat(bounds.left,ctrLat),new OpenLayers.LonLat(bounds.right,ctrLat));
         radius_deg = ((bounds.getWidth() + bounds.getHeight())/4);
      }
        
      switch(map.ROI_Type) {
         case 'point':
            $('#dispROI').html('<h3>Point ROI</h4>');
            $('#dispROI').append('<img src="./img/pointROI.png" title ="Point Region Of Interest" alt="Map Point" />');
            $('#dispROI').append('<p>Lon, Lat: ' + geom.x.toPrecision(4) + d + ', ' + geom.y.toPrecision(4) + d + '</p>');
            break;
         case 'box':
            var bbox = bounds;
            // If the graphing dialog is active, place the BBOX co-ordinates in it's BBOX text field
            if ($('#graphcreator-bbox').size()){
               $('#graphcreator-bbox').val(bbox.toBBOX(5, false));
               opec.selection.bbox = bbox.toBBOX(5, false);
               $(opec.selection).trigger('selection_updated', {bbox: true});
            }
            $('#dispROI').html('<h3>Rectangular ROI</h4>');
            // Setup the JavaScript canvas object and draw our ROI on it
            $('#dispROI').append('<canvas id="ROIC" width="100" height="100"></canvas>');
            var c = document.getElementById('ROIC');
            var ctx = c.getContext('2d');
            ctx.lineWidth = 4;
            ctx.fillStyle = '#CCCCCC';
            var scale = (width_deg > height_deg) ? 90/width_deg : 90/height_deg;
            ctx.fillRect(5,5,width_deg*scale,height_deg*scale);
            ctx.strokeRect(5,5,width_deg*scale,height_deg*scale);
            //
            $('#dispROI').append('<p>Width: ' + width_deg.toPrecision(4) + d + ' (' + width_km.toPrecision(4) + ' km)</p>');
            $('#dispROI').append('<p>Height: ' + height_deg.toPrecision(4) + d + ' (' + height_km.toPrecision(4) + ' km)</p>');           
            $('#dispROI').append('<p>Projected Area: ' + area_km.toPrecision(4) + ' km<sup>2</sup></p>');
            break;
         case 'circle':
            $('#dispROI').html('<h3>Circular ROI</h4>');
            $('#dispROI').append('<img src="./img/circleROI.png" title ="Circular Region Of Interest" alt="Map Point" />');
            $('#dispROI').append('<p>Radius: ' + radius_deg.toPrecision(4) + d + '</p>');
            $('#dispROI').append('<p>Centre lat, lon: ' + ctrLat.toPrecision(4) + ', ' + ctrLon.toPrecision(4) + '</p>');
            $('#dispROI').append('<p>Width: ' + width_deg.toPrecision(4) + d + ' (' + width_km.toPrecision(4) + ' km)</p>');
            $('#dispROI').append('<p>Height: ' + height_deg.toPrecision(4) + d + ' (' + height_km.toPrecision(4) + ' km)</p>');
            $('#dispROI').append('<p>Projected Area: ' + area_km.toPrecision(4) + ' km<sup>2</sup></p>');
            break;
         case 'polygon':
            // Get the polygon vertices
            var vertices = geom.getVertices();
            $('#dispROI').html('<h3>Custom Polygon ROI</h4>');     
            // Setup the JavaScript canvas object and draw our ROI on it
            $('#dispROI').append('<canvas id="ROIC" width="100" height="100"></canvas>');
            var c = document.getElementById('ROIC');
            var ctx = c.getContext('2d');
            ctx.lineWidth = 4;
            ctx.fillStyle = '#CCCCCC';
            var scale = (width_deg > height_deg) ? 90/width_deg : 90/height_deg;
            ctx.beginPath();
            var x0 = 5 + (vertices[0].x-bounds.left)*scale;
            var y0 = 5 + (bounds.top-vertices[0].y)*scale;
            ctx.moveTo(x0,y0);
            for(var i=1,j=vertices.length; i<j; i++){
               var x = 5 + (vertices[i].x-bounds.left) * scale;
               var y = 5 + (bounds.top-vertices[i].y) * scale;
               ctx.lineTo(x, y);
            }
            ctx.lineTo(x0,y0);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            //
            $('#dispROI').append('<p>Centroid Lat, Lon:' + ctrLat.toPrecision(4) + d + ', ' + ctrLon.toPrecision(4) + d + '</p>');
            $('#dispROI').append('<p>Projected Area: ' + area_km.toPrecision(4) + ' km<sup>2</p>');
            break;
      }
   }
   
   opec.mapControls.point = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point);
   opec.mapControls.box = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions:{sides: 4, irregular: true, persist: false }});
   opec.mapControls.circle = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions:{sides: 50}, persist: false});
   opec.mapControls.polygon = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Polygon);
   
   map.addControls([opec.mapControls.point, opec.mapControls.box, opec.mapControls.circle, opec.mapControls.polygon]);
   
   // Function which can toggle OpenLayers drawing controls based on the value of the clicked control
   function toggleDrawingControl(element) {
      opec.toggleControl(element);
      vectorLayer.removeAllFeatures();
      map.ROI_Type = element.value;
      // DEBUG
      //console.info(map.ROI_Type);
   }
   
   // Manually Handle drawing control radio buttons click event - each button has a class of "iconBtn"
   $('#ROIButtonSet input:radio').click(function(e) {
      toggleDrawingControl(this);
   });
   
   // TRAC Ticket #58: Fixes flaky non-selection of jQuery UI buttons (http://bugs.jqueryui.com/ticket/7665)
   $('#panZoom label.ui-button, #ROIButtonSet label.ui-button').unbind('mousedown').unbind('mouseup').unbind('mouseover').unbind('mouseout').unbind('click', 
      function(e) { h.disabled && ( e.preventDefault(), e.stopImmediatePropagation() ); }
   ).bind('mousedown', function() {
      $(this).addClass('opec_click');
   }).bind('mouseup', function() {
      if ($(this).hasClass('opec_click')) {
         $(this).click();
      }
      $(this).removeClass('opec_click');
   }); 
};

opec.rightPanel.setupGraphingTools = function() {
   //var graphCreator = $('#graphCreator');
   // If there is an open version, close it
   //if(graphCreator.length)
      //graphCreator.extendedDialog('close');
      
   var data = {
      advanced: true
   };
   
   // Add the html to the document using a template
   $('#opec-graphing').append(opec.templates.graphCreatorWindow(data));
   //$(document.body).append(opec.templates.graphCreatorWindow(data));
   
   var graphCreator = $('#graphCreator');           
   var graphCreatorGenerate = graphCreator.find('#graphcreator-generate').first();
   
   /*
   // Turn it into a dialog box
   graphCreator.extendedDialog({
      position: ['center', 'center'],
      width:340,
      resizable: false,
      autoOpen: false,
      close: function() {
         // Remove on close
         $('#graphCreator').remove(); 
      },
      showHelp: true,
      showMinimise: true,
      dblclick: "collapse",
      help : function(e, dlg) {
         opec.gritter.showNotification ('graphCreatorTutorial', null);
      }
   }); */

   // Add the jQuery UI datepickers to the dialog
   $('#graphcreator-time, #graphcreator-time2').datepicker({
      showButtonPanel: true,
      dateFormat: 'yy-mm-dd',
      changeMonth: true,
      changeYear: true
   });
   // Set the datepicker controls to the current view date if set
   var viewDate = $('#viewDate').datepicker('getDate');
   if (viewDate !== ""){
      $('#graphcreator-time').datepicker('setDate', viewDate);
      $('#graphcreator-time2').datepicker('setDate', viewDate);
   }
   
   
   var layerID = $('.selectedLayer:visible').attr('id');
   
   // We need to check if a layer is selected
   if(typeof layerID !== 'undefined') {
      // Get the currently selected layer
      var layer = opec.getLayerByID(layerID);
      $('#graphcreator-baseurl').val(layer.wcsURL);
      $('#graphcreator-coverage').val(layer.origName);
   }
   
   // Check for changes to the selected layer
   $('.lPanel').bind('selectedLayer', function(e) {
      var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
      $('#graphcreator-baseurl').val(layer.wcsURL);
      $('#graphcreator-coverage').val(layer.origName);
   });
   
   graphCreatorGenerate.find('img[src="img/ajax-loader.gif"]').hide();
                     
   // When selecting the bounding box text field, request user to draw the box to populate values
   $('#graphcreator-bbox').click(function() {
      opec.gritter.showNotification('bbox', null);
   });
   
   // Event to open and close the panels when clicked
   $('.ui-control-header').click(function() {
      $(this)
         .toggleClass("ui-control-header-active")
         .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
         .next().toggleClass("ui-control-content-active").slideToggle();
      return false;
   });
   
   // Gets the top layer that's checkbox is checked and puts it's ID into the coverage box
   $('#graphcreator-coverage-button').click(function() {
      $.each($('.sensor-accordion').children('li').children(':checkbox').get().reverse(), function(index, value) {
         if($(this).is(':checked')) {
            var layerID = $(this).parent('li').attr('id');
            var layer = opec.getLayerByID(layerID);
            $('#graphcreator-coverage').val(layer.origName);          
            $('#graphcreator-baseurl').val(layer.wcsURL);   
         }
      });

      return false;
   });
   
   graphCreator.unbind('.loadGraph').bind('ajaxStart.loadGraph', function() {
      $(this).find('img[src="img/ajax-loader.gif"]').show();
   }).bind('ajaxStop.loadGraph', function() {
      $(this).find('img[src="img/ajax-loader.gif"]').hide();
   });
   
   $('#graphcreator-barwidth-button').click(function() {
      return false;
   });
   
   // Close histogram, advanced and format panels
   $('#histogram-inputs-header').trigger('click');
   $('#advanced-inputs-header').trigger('click');
   $('#graph-format-header').trigger('click');
   
   // Create and display the graph
   graphCreatorGenerate.on('click', ':button', function(e) {
      // Extract the date-time value from the datepickers either as single date-time or date-time range
      var dateRange = $('#graphcreator-time').val();         
      if ($('#graphcreator-time2').val() !== "") {
         dateRange += ("/" + $('#graphcreator-time2').val());
      }
      
      var graphXAxis = null,
      graphYAxis = null;
      
      if ( $('#graphcreator-type').val() == 'hovmollerLon' ) {
         graphXAxis = 'Lon';
         graphYAxis = 'Time';
      }
      else if ( $('#graphcreator-type').val() == 'hovmollerLat' ) {
         graphXAxis = 'Time';
         graphYAxis = 'Lat';
      }
      
      var params = {
         baseurl: $('#graphcreator-baseurl').val(),
         coverage: $('#graphcreator-coverage').val(),
         type: $('#graphcreator-type').val(),
         bins: $('#graphcreator-bins').val(),
         time: dateRange,
         bbox: $('#graphcreator-bbox').val(),
         graphXAxis: graphXAxis,
         graphYAxis: graphYAxis,
         graphZAxis: $('#graphcreator-coverage').val()
      };
      
      var request = $.param( params );
      
      $.ajax({
         type: 'GET',
         url: opec.wcsLocation + request,
         dataType: 'json',
         asyc: true,
         success: function(data) {
            opec.graphs.create(data);
         },
         error: function(request, errorType, exception) {
            var data = {
               type: 'wcs data',
               request: request,
               errorType: errorType,
               exception: exception,
               url: this.url
            };          
            gritterErrorHandler(data);
         }
      });
   }); 
            
   // Open the dialog box
   //graphCreator.extendedDialog('open');   
};

opec.rightPanel.setupDataExport = function() {
   
   var dataExport = $('#dataTools');
   var selectedLayer = dataExport.children('div').first();
   var selectedBbox = selectedLayer.next('div');
   var dataDownloadURL = dataExport.children('a').first();
   
   var url = null;
   var urlParams = {
      service: 'WCS',
      version: '1.0.0',
      request: 'GetCoverage',
      crs: 'OGC:CRS84',
      format: 'NetCDF3'
   };
   
   var layerID = $('.selectedLayer:visible').attr('id');
   
   // We need to check if a layer is selected
   if(typeof layerID !== 'undefined') {
      // Get the currently selected layer
      var layer = opec.getLayerByID(layerID);
      selectedLayer.html('<b>Selected Layer: </b>' + layer.displayTitle);
      
      // Not using dot notation, so Closure doesn't change it.
      urlParams['coverage'] = layer.urlName;
      url = layer.wcsURL;  
      updateURL();
   }
   
   // Check for changes to the selected layer
   $('.lPanel').bind('selectedLayer', function(e) {
      var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
      selectedLayer.html('<b>Selected Layer: </b>' + layer.displayTitle);
      
      // Not using dot notation, so Closure doesn't change it.
      urlParams['coverage'] = layer.urlName;
      url = layer.wcsURL; 
      updateURL();
   });
   
   $(opec.selection).bind('selection_updated', function(event, params) {
      if(typeof params.bbox !== 'undefinded' && params.bbox) {
         var bbox = opec.selection.bbox.split(',');
         selectedBbox.html('<b>Selected Bbox: </b>' + bbox[0] + ', ' + bbox[1] + ', ' + bbox[2] + ', ' + bbox[3]);
         urlParams.bbox = opec.selection.bbox;
         updateURL();
      }
   });
   
   function updateURL() {
      var request = $.param( urlParams );
      dataDownloadURL.attr('href', url + request);
   }
   
   dataDownloadURL.click(function() {
      // Check if there is data to download and catch spam clicks.
      if($(this).attr('href') == '#' && $(this).text() != 'No Data To Download') {
         dataDownloadURL.text('No Data To Download');
         setTimeout(function() {
            dataDownloadURL.text('Download Data');
         }, 1000);
         
         return false;
      }
      // If the text is hasn't changed then download the data.
      else if($(this).text() == 'Download Data') {
         // TODO: We could use this to keep track of what data the user has
         // downloaded. They might need to see what they have or have not
         // downloaded.
      }
      // Top check will fail if the user spam clicks, but we still need to 'return false'.
      else {
         return false;
      }
   });
};
