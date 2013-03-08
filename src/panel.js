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
      $('#opec-lPanel-content .opec-tab-content').filter(function(i) { return $(this).attr('id') != tabToShow.slice(1) }).hide('fast');
      $(tabToShow).show('fast');
   });
}

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
}

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

      })
          
      // Remove the accordion we were asked to remove   
      $id.parent('div').multiOpenAccordion('destroy');
      $id.parent('div').remove();
   }
   
   // Do a search for any others that need to be removed
   //$.each($('.sensor-accordion'), function(index, value) {
      //if($(this).children('li').length == 0)
         //$(this).parent('div').remove();
   //});
}

opec.leftPanel.getFirstGroupFromPanel = function($panelName) {
   return $panelName.find('.sensor-accordion')
      .filter(function(i) {
         return !$(this).hasClass('opec-help');
      })
      .first();
}

opec.leftPanel.addNextGroupToPanel = function($panelName) {
   var number = ($panelName.find('.sensor-accordion')
      .filter(function(i) {
         return !$(this).hasClass('opec-help');
      })
      .length + 1);
      
   while($('#group' + number).length != 0) {
      number++;
   }
      
   opec.leftPanel.addGroupToPanel('group' + number, 'Group ' + number, $panelName);
}

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
}

/**
 * Remove a layer from its group on the layers panel. 
 */
opec.leftPanel.removeLayerFromGroup = function(layer) {
   if($('#' + layer.name).length)
      $('#' + layer.name).remove();
}

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
}

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
}

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
      if($('#layerSelection').dialog('isOpen')) {
         $('#layerSelection').parent('div').fadeTo('slow', 0.3, function() { $(this).fadeTo('slow', 1); })
      }
      else {
         $('#layerPreloader').fadeTo('slow', 0.3, function() { $(this).fadeTo('slow', 1); });
      }
      
      return false;
   });
}

///**
// * Removes dummy layer 
// */
//opec.leftPanel.removeDummyHelpLayer = function() {
   //opec.leftPanel.removeGroupFromPanel("Need-Help");
//}