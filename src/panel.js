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
            //var layer = map.getLayersByName(value);
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
         var $panel = $('.opec-tab-content:visible');
         opec.leftPanel.addNextGroupToPanel($panel);
      });
   //$('#triggerL-remove-accordion').button({ icons: { primary: 'ui-icon-circle-minus'}, text: false });

   $('#triggerL-add-group').button();
   
   $('#lpanel-tabs').buttonset();
   $('#opec-lpanel-tab-operational').button();
   $('#opec-lpanel-tab-reference').button();
   $('#opec-lpanel-tab-options').button();
   
   $('#lpanel-tabs :button').click(function(e) { 
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
         var layer = map.getLayersByName($(this).attr('id'))[0];
         if(typeof layer !== 'undefined') {
            opec.removeOpLayer(layer);
            $('#layers').multiselect('deselect', layer.name);
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
   if(!$('#' + layer.name).length && layer.displayInLayerSwitcher) {
      // jQuery selector for the layer controlID
      //var selID = layer.controlID == 'opLayers' ? '#' + layer.displaySensorName : '#' + layer.controlID; 
      
      var data = {
         name: layer.name,
         visibility: layer.visibility,
         displayTitle: layer.displayTitle,
         type: layer.controlID
      };
      
      // Add the html to the document using a template
      $group.prepend(
         opec.templates.layer(data)
      );

      var $layer = $('#' + layer.name);

      // Show the img when we are loading data for the layer
      layer.events.register("loadstart", layer, function(e) {
         $('#' + this.name).find('img[src="img/ajax-loader.gif"]').show();
      });
      
      // Hide the img when we have finished loading data
      layer.events.register("loadend", layer, function(e) {
         $('#' + this.name).find('img[src="img/ajax-loader.gif"]').hide();
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
   if($('#' + layer.name).length)
      $('#' + layer.name).remove();
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
         var layer = map.getLayersByName(value)[0];
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
   $("#dataAccordion").multiOpenAccordion({
      active: [0, 1]
   });
   
   // Regions of interest drawing control buttons - with custom styling
   $('#ROIButtonSet').buttonset();
   $('#point').button({ icons: { primary: 'ui-icon-drawpoint'} });
   $('#box').button({ icons: { primary: 'ui-icon-drawbox'} });
   $('#circle').button({ icons: { primary: 'ui-icon-drawcircle'} });
   $('#polygon').button({ icons: { primary: 'ui-icon-drawpoly'} });
   
   // Data Analysis panel tabs and accordions
   $("#dataTabs").tabs();
   $("#analyses").accordion({ collapsible: true, heightStyle: 'content' });
   $("#spatial").accordion({ collapsible: true, heightStyle: 'content' });
   $("#temporal").accordion({ collapsible: true, heightStyle: 'content' }); 
   
   opec.rightPanel.setupDrawingControls();
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
      /**
       * @constructor 
       */
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

   // Function which can toggle OpenLayers controls based on the clicked control
   // The value of the value of the underlying radio button is used to match 
   // against the key value in the mapControls array so the right control is toggled
   function toggleControl(element) {
      for(var key in mapControls) {
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
   for (var key in mapControls) {
      var control = mapControls[key];
      map.addControl(control);
   }

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

   // Manually Handle jQuery UI icon button click event - each button has a class of "iconBtn"
   $('#panZoom input:radio').click(function(e) {
      toggleControl(this);
   });

   // Manually Handle drawing control radio buttons click event - each button has a class of "iconBtn"
   $('#ROIButtonSet input:radio').click(function(e) {
      toggleDrawingControl(this);
   });

};