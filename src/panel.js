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
   $('#opLayers').sortable({
      axis: 'y',
      distance: 10,
      handle: 'h3',
      update: function() {
         opec.leftPanel.updateGroupOrder();
      }
   })
   .disableSelection();
   //.bind('sortstart', function(e, ui) {
   //   $(this).addClass('sort-start');
   //});
   
   // Makes each of the reference layers sortable
   $("#refLayers").sortable({
      axis: 'y',
      distance: 10,
      update: function() {
         var order = $("#refLayers").sortable('toArray');                 
         $.each(order, function(index, value) {
            var layer = map.getLayersByName(value);
            map.setLayerIndex(layer[0], map.numBaseLayers + order.length - index - 1);
         });
      }
   });
}

/**
 * Add a group to the layers panel.
 */
opec.leftPanel.addGroupToPanel = function(id, displayName, $panelName) {
   // Add the accordion
   $panelName.prepend(
      '<div>' +
         '<h3>' + displayName + '</h3>' +
         '<div id="' + id + '" class="sensor-accordion"></div>' +
      '</div>'
   );

   // Creates the accordion
   $('#' + id).parent('div').multiOpenAccordion({
      active: 0
   });
   
   if ($panelName.attr('id') == 'opLayers') {
      // Makes each of the operational layers sortable
      $('#' + id).sortable({
         connectWith: ".sensor-accordion",
         appendTo:".sensor-accordion",
         helper:"clone",
         update: function() {
            updateLayerOrder($(this));
         }
      }).disableSelection();
   }
}

/**
 * Remove a group from the layers panel. 
 */
opec.leftPanel.removeGroupFromPanel = function(id) {
   if($('#' + id).length) {        
      // Remove the accordion we were asked to remove
      $('#' + id).parent('div').remove();
   }
   
   // Do a search for any others that need to be removed
   //$.each($('.sensor-accordion'), function(index, value) {
      //if($(this).children('li').length == 0)
         //$(this).parent('div').remove();
   //});
}

/**
 * Add a layer to a group on the layers panel.
 */ 
opec.leftPanel.addLayerToGroup = function(layer, group) {
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
      $('#' + group).prepend(
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
            checkLayerState(layer);
         });
      }
      
      // Remove the dummy layer
      //removeDummyHelpLayer()
   }
}

/**
 * Remove a layer from its group on the layers panel. 
 */
opec.leftPanel.removeLayerFromGroup = function() {
   if($('#' + layer.name).length)
      $('#' + layer.name).remove();
}

/**
 * Updates all the layer indexes in all the layer accordions.
 */ 
opec.updateGroupOrder = function() {
   $.each($('.sensor-accordion'), function(index, value) {
      //if($(this).children('li').length == 0)
         //opec.leftPanel.removeGroupFromPanel($(this).attr('id'));
      //else    
         updateLayerOrder($(this));
   });
}

/**
 * Updates the position of layers based on their new 
 * position on the stack.
 */ 
opec.updateLayerOrder = function(accordion) {
   var layerOffset = 0;
   $.each(accordion.parent('div').nextAll('div').children('.sensor-accordion'), function(index, value) {
      layerOffset += $(this).children('li').length;
   });

   var order = accordion.sortable('toArray');   
   if(order.length > 0) {         
      $.each(order, function(index, value) {
         var layer = map.getLayersByName(value)[0];
         map.setLayerIndex(layer, map.numBaseLayers + layerOffset + order.length - index - 1);
      });
   }
   else
      ;//opec.leftPanel.removeGroupFromPanel(accordion.attr('id'));
}