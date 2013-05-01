/**
 * Context Menu
 * @namespace 
 */
opec.contextMenu = {};

/**
 * Setup the context menu and any custom controls needed in menu items
 */
opec.contextMenu.setup = function() {
   /**
    * Create the custom control for the slider
    */
   $.contextMenu.types.slider = function(item, opt, root) {
      $('<div id="' + item.id + '" class="context-menu slider"></div>').appendTo(this)
      .on('click', '> li', function() {
         console.log('Clicked on ' + $(this).text());
         root.$menu.trigger('contextmenu:hide');
      })
      // Setup the slider
      .slider({
         max: 1,
         min: 0,
         value: 1,
         step: 0.05,
         change: function(e, ui) {
            var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
            layer.setOpacity($("#" + item.id).slider("value"));
            return true;
         }
      });
   
      /*
       * When the 'contextmenu' gets focus grab the opacity value from the 
       * selected layer and set the slider's position to be that value.
       */ 
      root.$menu.on('contextmenu:focus', function() {
         var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
         if(typeof layer.opacity === 'undefined' || layer.opacity === null)
            layer.setOpacity(1);
            
         $("#" + item.id).slider("value", layer.opacity);        
      });
   };
   
   /**
    * Create the context menu for the oplayers in the data layers accordion.
    */
   $.contextMenu({
      // The class to activate on when right clicked
      selector: '.selectedLayer',
      // Dynamically creates the menu each time
      build: function($trigger, e) {    
              
         function buildMenu() {
            /*
             * Get the visible selected layer by id so as to avoid selecting one
             * of the other selected layers on other tabs. 
             */
            var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
            //return layer.elevation ? 'fold3: { name: "Layer Elevation", items: getCurrentElevation($trigger), },' : '';  
            
            // Opacity           
            var fold1 = {                  
               fold1: {
                  name: "Opacity",
                  items: {
                     opacitySlider: {type: "slider", customName: "Opacity Slider", id:"opacitySlider"}
                  }
               }
            };  
            // Styles  
            var fold2 = {
              fold3: {
                  name: "Layer Styles", 
                  items: opec.contextMenu.getCurrentStyles($trigger)
               }
            }; 
            // Elevation
            var fold3 = {
               fold2: {
                  name: "Layer Elevation",
                  items: opec.contextMenu.getCurrentElevation($trigger)
               }
            };
            var rest = {
               showScalebar: opec.contextMenu.showScalebar($trigger),
               showMetadata: opec.contextMenu.showMetadata($trigger),
               showGraphCreator: opec.contextMenu.showGraphCreator(),
               viewData: opec.contextMenu.viewData($trigger),
               heatmap: opec.contextMenu.heatmapTest()
            };
            
            if(layer.controlID == 'opLayers') {
               return layer.elevation ? $.extend(true, fold1, fold2, fold3, rest) : $.extend(true, fold1, fold2, rest);
            }
            else if (layer.controlID == 'refLayers') {
               return $.extend(true, fold1, rest);
            }
            else {
               return $.extend(true, fold1, rest);
            } 
         }
         // Return the new menu
         return {
            // The items in the menu
            items: buildMenu()
         };                           
      }
   });
   
   /**
    * Create the context menu for the layer selector elements
    */
   $.contextMenu({
      // The class to activate on when right clicked
      selector: '.preloaderContextMenu',
      // Dynamically creates the menu each time
      build: function($trigger, e) {
         e.preventDefault();
         return {
            items: {
               showMetadata: opec.contextMenu.showMetadata($trigger)
            }
         };                           
      }
   });
   
   /**
    * Create the context menu for the groups
    */
   $.contextMenu({
      // The class to activate on when right clicked
      selector: '.ui-accordion-header-dropdown',
      // Dynamically creates the menu each time
      build: function($trigger, e) {
         return {
            items: {
               selectAll: opec.contextMenu.selectAll($trigger),
               deselectAll: opec.contextMenu.deselectAll($trigger),
               saveToProfile: opec.contextMenu.saveToProfile(),
               renameGroup: opec.contextMenu.renameGroup($trigger)
            }
         };
      }
   });
};

opec.contextMenu.heatmapTest = function() {
   return {
      name: "Test Heatmap",
      callback: function() {
         var testData = {
            max: 46,
            data: [{lat: 33.5363, lng: -117.044, count: 1}, 
               {lat: 33.5608, lng: -117.24, count: 1},
               {lat: 38, lng: -97, count: 1}, 
               {lat: 38.9358, lng: -77.1621, count: 1}]
         };
         
         var transformedTestData = { max: testData.max, data: []},
            data = testData.data,
            datalen = data.length,
            nudata = {};
            nudata.data = [];
            
         while(datalen--) {
            nudata.data.push({
               lonlat: new OpenLayers.LonLat(data[datalen].lng, data[datalen].lat),
               count: data[datalen].count
            });
         }
         
         transformedTestData = nudata;
         
         var layer = new OpenLayers.Layer.Vector();
         var heatmap = new OpenLayers.Layer.Heatmap("Heatmap Layer", map, layer, 
            {visible: true, radius: 10}, 
            {isBaseLayer: false, opacity: 0.3, projection: new OpenLayers.Projection("EPSG:4326")}
         );
            
         map.addLayers([layer, heatmap]);
         heatmap.setDataSet(transformedTestData);       
      }
   };
};


/**
 * Select all layers in the group
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 */
opec.contextMenu.selectAll = function($trigger) {
   return {
      name: "Select All",
      callback: function() {
         $trigger.parent().parent().next('div').find('[type="checkbox"]').each(function() {
            var $this = $(this);
            if(!$this.is(':checked')) {
               $this.trigger('click');
               $this.attr('checked', 'checked');
            }
         });
      }
   };
};

/**
 * Deselects all layers in the group
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 */
opec.contextMenu.deselectAll = function($trigger) {
   return {
      name: "Deselect All",
      callback: function() {
         $trigger.parent().parent().next('div').find('[type="checkbox"]').each(function() {
            var $this = $(this);
            if($this.is(':checked')) {
               $this.trigger('click');
               $this.removeAttr('checked');
            }
         });
      }
   };   
};

/**
 * Saves group in the current condition to the users profile (PlaceHolder)
 */
opec.contextMenu.saveToProfile = function() {
   return {
      name: "Save To Profile",
      callback: function() {        
      }
   };
};

/**
 * Allow the group to be renamed
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 */
opec.contextMenu.renameGroup = function($trigger) {
   return {
      name: "Rename Group",
      callback: function() {
         $trigger.parent().parent().parent().multiOpenAccordion('renameGroup');
      }
   };
};

/**
 * Zooms the view extent to match the bbox of the layer
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 */
opec.contextMenu.viewData = function($trigger) {
   var layerName = "";
   var layer = null;
   
   if($trigger.attr('id')) {
      layerName = $trigger.attr('id');
      layer = opec.getLayerByID(layerName);
   }
   else {
      layerName = $trigger.text();
      layer = opec.microLayers[layerName];
   }
   
   return {
      name: "Zoom To Data",
      callback: function() {
         if(layer === null)
            return;
            
          var bbox = new OpenLayers.Bounds(
             layer.exBoundingBox.WestBoundLongitude,
             layer.exBoundingBox.SouthBoundLatitude,
             layer.exBoundingBox.EastBoundLongitude,
             layer.exBoundingBox.NorthBoundLatitude
          ).transform(map.displayProjection, map.projection);
          
         map.zoomToExtent(bbox);
      }
   };
};

/**
 * Creates an Object to be used in an contextMenu.
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 * 
 * @return {Object} Returns an object containing the display name to show on 
 * the menu and a callback to be executed when selected.
 */
opec.contextMenu.showMetadata = function($trigger) {
   var layerID = "";
   var layer = null;
   
   if($trigger.attr('id')) {
      layerID = $trigger.attr('id');
      layer = opec.getLayerByID(layerID);
   }
   else {
      layerID = $trigger.text();
      layer = opec.microLayers[layerID];
   }
      
   return { 
      name: "Show Metadata",
      callback: function() {
         // Opens Metadata Dialog
         opec.window.createMetadata(layer);
      }
   };
};

/**
 * Creates an Object to be used in an contextMenu.
 * 
 * @param {Object} $trigger - The object the menu was triggered on.

 * @return {Object} Returns an object containing the display name to show on 
 * the menu and a callback to be executed when selected.
 */
opec.contextMenu.showScalebar = function($trigger) {
   return { 
      name: "Show Scalebar",
      
      callback: function() { 
         // Opens Scalebar Dialog
         opec.window.createScalebar($trigger);
      }
   };
};

/**
 * Creates and returns an array of available styles for a layer. The html id
 * of the passed in object is used to get the layer from the map.
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 * 
 * @return {Array} Returns an array of available styles for a layer.
 */
opec.contextMenu.getCurrentStyles = function($trigger)
{
   var layer = opec.getLayerByID($trigger.attr('id'));
   if(layer.controlID != 'opLayers')
      return [];
      
   var menuOutput = [];
   var styles = layer.styles.slice();
   // Add a new style that will remove styles from the layer
   styles.push({
      Name: 'Remove Style',
      Abstract: '',
      LegendURL: '',
      Width: 0,
      Height: 0
   });

   // Iter through each of the styles and create an array
   $.each(styles, function(index, value) {
      menuOutput['Layer Styles' + index] = {
         name: value.Name,
         className: value.Name == layer.params["STYLES"] ? "styleSelected" : "",
         callbackName: 'Layer Styles ' + value.Name,
         // Create the callback for what happens when someone clicks on the menu button
         callback: function() {
            var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
            layer.mergeNewParams({styles: value.Name == 'Remove Style' ? '' : value.Name});
            console.log(value.Name);
            updateScalebar(layer);
         }
      };                      
   });
   
   return menuOutput;
};

opec.contextMenu.getCurrentElevation = function($trigger) {
   var layer = opec.getLayerByID($trigger.attr('id'));
   var menuOutput = [];
   
   $.each(layer.elevationCache, function(index, value) {
      menuOutput['Layer Elevation ' + index] = {
         name: parseFloat(value).toFixed(3) + " " + layer.elevationUnits,
         className: value == layer.params['ELEVATION'] ? 'elevationSelected' : "",
         callbackName: 'Layer Elevation ' + value,
         callback: function() {
            var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
            layer.mergeNewParams({elevation: value});
         }
      };
   });
   
   return menuOutput;
};

/**
 * Creates and shows the graph creator dialog box
 */
opec.contextMenu.showGraphCreator = function() {
   return {
      name: 'Show Graph Creator',
      callback: function() {
         //opec.window.createGraphCreator();
      }
   };
};