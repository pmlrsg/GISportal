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
   
   // Populate the base layers drop down menu
   $.each(map.layers, function(index, value) {
       var layer = value;
       // Add map base layers to the baseLayer drop-down list from the map
       if(layer.isBaseLayer) {
           $('#baseLayer').append('<option value="' + layer.name + '">' + layer.name + '</option>');
       }
   });
   
   // Change of base layer event handler
   $('#baseLayer').change(function(e) {
       map.setBaseLayer(opec.baseLayers[$('#baseLayer').val()]);
   });
   
   // Create quick region buttons
   $('.lPanel .opec-quickRegion-reset').button({ label: 'Reset' }).click(function() {
      var id = $('.lPanel .opec-quickRegion-select').val();
      
      $('.lPanel .opec-quickRegion-name').val(opec.quickRegion[id][0]);
      $('.lPanel .opec-quickRegion-left').val(opec.quickRegion[id][1]);
      $('.lPanel .opec-quickRegion-bottom').val(opec.quickRegion[id][2]);
      $('.lPanel .opec-quickRegion-right').val(opec.quickRegion[id][3]);
      $('.lPanel .opec-quickRegion-top').val(opec.quickRegion[id][4]);  
   });
     
   $('.lPanel .opec-quickRegion-save').button({ label: 'Save'}).click(function() {
      var select = $('.lPanel .opec-quickRegion-select'),
         id = select.val();

      opec.quickRegion[id][0] = $('.lPanel .opec-quickRegion-name').val();
      opec.quickRegion[id][1] = $('.lPanel .opec-quickRegion-left').val();
      opec.quickRegion[id][2] = $('.lPanel .opec-quickRegion-bottom').val();
      opec.quickRegion[id][3] = $('.lPanel .opec-quickRegion-right').val();
      opec.quickRegion[id][4] = $('.lPanel .opec-quickRegion-top').val();
      
      $(".opec-quickRegion-select").each(function() {
         $(this).find('option').eq(id).html(opec.quickRegion[id][0]);
      });
   });
   
   $('.lPanel .opec-quickRegion-add').button({ label: 'Add as new region' }).click(function() {
      opec.addQuickRegion($('.lPanel .opec-quickRegion-name').val(), {
         left: $('.lPanel .opec-quickRegion-left').val(),
         bottom: $('.lPanel .opec-quickRegion-bottom').val(),
         right: $('.lPanel .opec-quickRegion-right').val(),
         top: $('.lPanel .opec-quickRegion-top').val()
      });
   });
   
   $('.lPanel .opec-quickRegion-remove').button({ label: 'Remove selected region' }).click(function() {
      var select = $('.lPanel .opec-quickRegion-select'),
         id = select.val();
         
      opec.removeQuickRegion(id);
   });
};

/**
 * Adds a group to the layers panel.
 * 
 * @param {number} id - The id to use for the panel.
 * @param {string} displayName - The panel name to show.
 * @param {Object} $panelName - jQuery object representing the panel.
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
 * 
 * @param {string} id - The id of the panel to remove.
 */
opec.leftPanel.removeGroupFromPanel = function(id) {
   var $id = $('#' + id);
   if($id.length) {    
      // Check if the accordion is empty
      $id.children('li').each(function() {
         var layer = opec.getLayerByID($(this).attr('id'));
         if(typeof layer !== 'undefined') {
            opec.removeLayer(layer);
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

/**
 * Returns the first group from the panel. If there is no first group, it 
 * creates one.
 * 
 * @param {Object} $panelName - jQuery object representing the panel.
 * 
 * @return {Object} Returns the first group. 
 */
opec.leftPanel.getFirstGroupFromPanel = function($panelName) {
   var $firstGroup = $panelName.find('.sensor-accordion')
      .filter(function(i) {
         return !$(this).hasClass('opec-help');
      })
      .first();
      
   if($firstGroup.length > 0) {
      return $firstGroup;
   } else {
      opec.leftPanel.addNextGroupToPanel($panelName);
      return opec.leftPanel.getFirstGroupFromPanel($panelName);
   }
};

/**
 * Adds an empty group to the panel.
 * 
 * @param {Object} $panelName - jQuery object representing the panel.
 */
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
   // if not already on list, populate the layers panel (left slide panel)
   if(!$('#' + layer.id).length) {
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

      layer.$layer = $('#' + layer.id);
      
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
   var layersBelowOffset = 0;
   $.each(accordion.parent('div').nextAll('div').children('.sensor-accordion'), function(index, value) {
      //layersBelowOffset += $(this).children('li').length;
      $(this).children('li').each(function() {
         if($(this).hasClass('opec-layer')) {
            layersBelowOffset += opec.layers[$(this).attr('id')].order.length;
         }
      });
   });

   var layerGroupOrder = accordion.sortable('toArray');   
   if(layerGroupOrder.length > 0) {         
      $.each(layerGroupOrder, function(index, value) {
         var layer = opec.getLayerByID(value);
         if(typeof layer !== 'undefined') {
            var positionOffset = layer.controlID == 'opLayers' ? map.numBaseLayers : (map.numBaseLayers + map.numOpLayers);
            
            for(var i = 0, len = layer.order.length; i < len; i++) {
               map.setLayerIndex(layer.openlayers[layer.order[i]], positionOffset + layersBelowOffset + (layerGroupOrder.length - index - 1) + i);
            }           
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
      if($('#opec-layerSelection').extendedDialog('isOpen')) {
         $('#opec-layerSelection').parent('div').fadeTo('slow', 0.3, function() { $(this).fadeTo('slow', 1); });
      }
      else {
         $('#layerPreloader').fadeTo('slow', 0.3, function() { 
            $(this).fadeTo('slow', 1).fadeTo('slow', 0.3, function() { 
               $(this).fadeTo('slow', 1); 
            }); 
         });
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
 */
opec.rightPanel.setupDrawingControls = function() {
   // Add the Vector drawing layer for POI drawing
   var vectorLayer = new OpenLayers.Layer.Vector('POI Layer', {
      style : {
         strokeColor : 'white',
         fillColor : 'green',
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
   
   // So that changing the input box changes the visual selection box on map
   $('#opec-graphing').on('change', '#graphcreator-bbox', function() {
      var values = $('#graphcreator-bbox').val().split(',');
      values[0] = opec.utils.clamp(values[0], -180, 180); // Long
      values[2] = opec.utils.clamp(values[2], -180, 180); // Long
      values[1] = opec.utils.clamp(values[1], -90, 90); // Lat
      values[3] = opec.utils.clamp(values[3], -90, 90); // Lat
      $('#graphcreator-bbox').val(values[0] + ',' + values[1] + ',' + values[2] + ',' + values[3]);
      var feature = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(values[0], values[1], values[2], values[3]).toGeometry());
      feature.layer = map.layers[map.layers.length -1];
      var features = map.layers[map.layers.length -1].features;
      if (features[0]) map.layers[map.layers.length -1].features[0].destroy();
      map.layers[map.layers.length -1].features[0] = feature;
      map.layers[map.layers.length -1].redraw();
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

/**
 * Sets up the graphing tools.
 */
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
   $('#graphcreator-time').datepicker({
      showButtonPanel: true,
      dateFormat: 'yy-mm-dd',
      changeMonth: true,
      changeYear: true,
      beforeShowDay: function(date) { 
         if($('#graphcreator-time2').datepicker('getDate')) {
            var compareDate = $('#graphcreator-time2').datepicker('getDate');
            if(opec.utils.compareDates(date, compareDate) != true)  {
               return [false];
            }
         }
         return opec.allowedDays(date); 
      },
   });
   
   $('#graphcreator-time2').datepicker({
      showButtonPanel: true,
      dateFormat: 'yy-mm-dd',
      changeMonth: true,
      changeYear: true,
      beforeShowDay: function(date) { 
         if($('#graphcreator-time').datepicker('getDate')) {
            var compareDate = $('#graphcreator-time').datepicker('getDate');
            if(opec.utils.compareDates(compareDate, date) != true)  {
               return [false]
            }
         }
         return opec.allowedDays(date); 
      },
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

   $('#graphcreator-gallery').buttonset();
   $('#timeseries').button({ icons: { primary: 'gallery_timeseries'}, text: false });
   $('#hovmollerLat').button({ icons: { primary: 'gallery_hov_lat'}, text: false });
   $('#hovmollerLon').button({ icons: { primary: 'gallery_hov_long'}, text: false });
   $('#histogram').button({ icons: { primary: 'gallery_histogram'}, text: false });
   
   $('#graphcreator-gallery').change(function() {
      if(!$('#graphcreator-gallery input[value="histogram"]').prop("checked")) {
         $('#histogram-inputs').parent().hide();
      }
      else  {
         $('#histogram-inputs').parent().show();
      }
   });
   
   $('#graphcreator-gallery').change(); // Initialise states
   
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
      
      if ( $('#graphcreator-gallery input[value="hovmollerLon"]').prop("checked") ) {
         graphXAxis = 'Lon';
         graphYAxis = 'Time';
      }
      else if ( $('#graphcreator-gallery input[value="hovmollerLat"]').prop("checked") ) {
         graphXAxis = 'Time';
         graphYAxis = 'Lat';
      }
      
      var params = {
         baseurl: $('#graphcreator-baseurl').val(),
         coverage: $('#graphcreator-coverage').val(),
         type: $('#graphcreator-gallery input[name="gallery"]:checked').val(),
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
            console.log("success");
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

/**
 * Top bar
 * @namespace 
 */
opec.topbar = {};

opec.topbar.setup = function() {
   
   // Add jQuery UI datepicker
   $('#viewDate').datepicker({
      showButtonPanel: true,
      dateFormat: 'dd-mm-yy',
      changeMonth: true,
      changeYear: true,
      beforeShowDay: function(date) { return opec.allowedDays(date); },
      onSelect: function(dateText, inst) {
         var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
         // Synchronise date with the timeline
         opec.timeline.setDate(thedate);
         // Filter the layer data to the selected date
         opec.filterLayersByDate(thedate);
      }
   });

   //--------------------------------------------------------------------------
   
   // Pan and zoom control buttons
   $('#panZoom').buttonset();
   $('#pan').button({ icons: { primary: 'ui-icon-arrow-4-diag'} });
   $('#zoomIn').button({ icons: { primary: 'ui-icon-circle-plus'} });
   $('#zoomOut').button({ icons: { primary: 'ui-icon-circle-minus'} });
   
   // Function which can toggle OpenLayers controls based on the clicked control
   // The value of the value of the underlying radio button is used to match 
   // against the key value in the mapControls array so the right control is toggled
   opec.toggleControl = function(element) {
      for(var key in opec.mapControls) {
         var control = opec.mapControls[key];
         if($(element).val() == key) {
            $('#'+key).attr('checked', true);
            control.activate();
            
            if(key == 'pan') {
               opec.mapControls.selector.activate();
            }
         }
         else {
            if(key != 'selector') {
               if(key == 'pan') {
                  opec.mapControls.selector.deactivate();
               }
               
               $('#' + key).attr('checked', false);
               control.deactivate();
            }
         }
      }
      $('#panZoom input:radio').button('refresh');
   };
   
   // Making sure the correct controls are active
   opec.toggleControl($('#panZoom input:radio'));

   // Manually Handle jQuery UI icon button click event - each button has a class of "iconBtn"
   $('#panZoom input:radio').click(function(e) {
      opec.toggleControl(this);
   });
   
   //--------------------------------------------------------------------------
   
   // Create buttons
   $('#opec-toolbar-actions')
      .buttonset().children('button:first, input[type="button"]')
      .button({ label: '', icons: { primary: 'ui-icon-opec-globe-info'} })
      .next().button({ label: '', icons: { primary: 'ui-icon-opec-globe-link'} })
      .next().next().button({ label: '', icons: { primary: 'ui-icon-opec-layers'} })
      .next().button({ label: '', icons: { primary: 'ui-icon-opec-globe'} })
      .click(function(e) {
         if(map.globe.is3D) {
            map.show2D();
         } 
         else {
            map.show3D();
            opec.gritter.showNotification('3DTutorial', null);
         }
      })
      .next().next().button({ label: '', icons: { primary: 'ui-icon-opec-info'} });
   
   // Add toggle functionality for dialogs
   addDialogClickHandler('#infoToggleBtn', '#info');
   addDialogClickHandler('#mapInfoToggleBtn', '#mapInfo');
   addDialogClickHandler('#layerPreloader', '#opec-layerSelection');

   // Add permalink share panel click functionality
   $('#shareMapToggleBtn').click(function() {
      $('#shareOptions').toggle();
   });
   
   function addDialogClickHandler(idOne, idTwo) {
      $(idOne).click(function(e) {
         if($(idTwo).extendedDialog('isOpen')) {
           $(idTwo).extendedDialog('close');
         }
         else {
           $(idTwo).extendedDialog('open');
         }
         return false;
      });
   }

   $('#topToolbar .togglePanel')
      .button({ label:'Toggle Panel', icons: { primary: 'ui-icon-triangle-1-n'}, 'text': false})
      .click(function() {
         if ($(this).parent().css('top') != "0px") {
            $(this).parent().animate({top:'0px'});
            console.log(this);
            $(this).button( "option", "icons", { primary: 'ui-icon-triangle-1-n'} );
         }
         else {
            $(this).parent().animate({top:'-50px'});
            $(this).button( "option", "icons", { primary: 'ui-icon-triangle-1-s'} );
         }
      });
};
