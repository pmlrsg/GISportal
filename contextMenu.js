/**
 * Creates the contextMenu and functions for the
 * creation of custom menu items.
 */
function createContextMenu()
{
   // Setup the context menu and any custom controls
   $(function() {

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
               var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
               layer.setOpacity($("#" + item.id).slider("value"));
               return true;
            }
         });

         root.$menu.on('contextmenu:focus', function() {
            var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
            $("#" + item.id).slider("value", layer.opacity);        
         });
      }
      
      /**
       * Create the context menu the Oplayers in the data layers accordion.
       */
      $.contextMenu({
         // The class to activate on when right clicked
         selector: '.selectedLayer',
         // Dynamically creates the menu each time
         build: function($trigger, e) {

            // Return the new menu
            return {
               // The items in the menu
               items: {
                  fold1: {
                     name: "Opacity",
                     items: {
                        opacitySlider: {type: "slider", customName: "Opacity Slider", id:"opacitySlider"}
                     }
                  }, 
                  fold2: {
                     name: "Layer Styles", 
                     items: getCurrentStyles($trigger),
                  },
                  showScalebar: showScalebar($trigger),
                  showMetadata: showMetadata($trigger),
               }
            };                           
         }
      })
      
      /**
       * Create the context menu for the layer selector elements
       */
      $.contextMenu({
         // The class to activate on when right clicked
         selector: '.preloaderContextMenu',
         // Dynamically creates the menu each time
         build: function($trigger, e) {

            // Return the new menu
            return {
               // The items in the menu
               items: {
                  showMetadata: showMetadata($trigger),
                  showGraphs: createGraphs()
               }
            };                           
         }
      })
   });
}

/**
 * Creates an Object to be used in an contextMenu.
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 * 
 * @return {Object} Returns an object containing the display name to show on 
 * the menu and a callback to be executed when selected.
 */
function showMetadata($trigger) {
   var layerName = "";
   var layer = null;
   
   if($trigger.attr('id')) {
      layerName = $trigger.attr('id');
      layer = map.getLayersByName(layerName)[0];
   }
   else {
      layerName = $trigger.text();
      layer = map.microLayers[layerName];
   }
      
   return { 
      name: "Show Metadata",
      callback: function() {
         
         if(layer == null)
            return;
           
         var dateRange = function() {
            return layer.temporal ? '<div><label>Date Range: ' + layer.firstDate + ' to ' + layer.lastDate + '</label></div>' : '';
         }

         // Check if already open
         if($('#metadata-' + layer.name).length)
            $('#metadata-' + layer.name).dialog('close');

         $(document.body).append(
            '<div id="metadata-' + layer.name + '" title="' + layer.displayTitle + '">' +
            '</div>'
         );

         // Show metadata for a selected layer
         $('#metadata-' + layer.name).dialog({
            position: ['center', 'center'],
            width: 400,
            height: 250,
            resizable: true,
            autoOpen: false,
            close: function() {
               $('#metadata-' + layer.name).remove();
            }
         });

         $('#metadata-' + layer.name).dialog();

         // Add new data
         $('<div><label>Source: ' + '</label></div>' +
            '<div><label>Name: ' + layer.displayTitle + '</label></div>' +
            '<div><label>BoundingBox: ' + 
               layer.exBoundingBox.NorthBoundLatitude + 'N, ' +
               layer.exBoundingBox.EastBoundLongitude + 'E, ' +
               layer.exBoundingBox.SouthBoundLatitude + 'S, ' + 
               layer.exBoundingBox.WestBoundLongitude + 'W ' + 
            '</label></div>' +
            dateRange() +
            '<div><label>Abstract: ' + layer.abstract + '</label></div>'
         ).appendTo('#metadata-' + layer.name);

         // Open dialog
         $('#metadata-' + layer.name).dialog('open');
      }
   };
}

/**
 * Creates an Object to be used in an contextMenu.
 * 
 * @param {Object} $trigger - The object the menu was triggered on.

 * @return {object} Returns an object containing the display name to show on 
 * the menu and a callback to be executed when selected.
 */
function showScalebar($trigger) {
   return { 
      name: "Show Scalebar",
      
      /**
       * Opens a jQuery UI dialog which display a scalebar image fetched from the 
       * server and adds a jQuery UI slider along with two input boxes.
       */
      callback: function() { 
         // Get the selected layer
         var layer = map.getLayersByName($trigger.attr('id'))[0];       
         var scalebarDetails = getScalebarDetails(layer);

         // If there is an open version, close it
         if($('#scalebar-' + layer.name).length)
            $('#scalebar-' + layer.name).dialog('close');

         // Add the html to the document
         $(document.body).append(
            '<div id="scalebar-' + layer.name +'" class="scalebar" title="Scalebar Info">' +
               '<img src="' + scalebarDetails.url + '" alt="Scalebar"/>' +
               '<div id="' + layer.name + '-range-slider"></div>' +
               '<div>' +
                  '<label for="' + layer.name + '-maxvalue" title="The maximum value to be used">Maximum Value: </label>' +
               '</div>' +
               '<div>' +
                  '<input id="' + layer.name + '-maxvalue" type="text" name="' + layer.name + '-maxvalue"/>' +
               '</div>' +
               '<div id="' + layer.name + '-log">' +
                  '<input type="checkbox" name="' + layer.name + '-log-checkbox"/>' +
                  '<label for="' + layer.name + '-logarithmic" title="Logarithmic Scale">Logarithmic Scale </label>' +
               '</div>' +
               '<div>' +
                  '<label for="' + layer.name + '-minvalue" title="The minimum value to be used">Minimum Value: </label>' +
               '</div>' +
               '<div>' +
                  '<input id="' + layer.name + '-minvalue" type="text" name="min"/>' +
               '</div>' +
            '</div>'
         );
         
         if(layer.minScaleVal != undefined && layer.maxScaleVal != undefined) {
            $('#' + layer.name + '-maxvalue').val(layer.maxScaleVal);
            $('#' + layer.name + '-minvalue').val(layer.minScaleVal);
         }
         else {
            $('#' + layer.name + '-maxvalue').val = '';
            $('#' + layer.name + '-minvalue').val = '';  
         }

         // Show the scalebar for a selected layer
         $('#scalebar-' + layer.name).dialog({
            position: ['center', 'center'],
            //width: width,
            //height: height,
            resizable: false,
            autoOpen: false,
            close: function() {
               // Remove on close
               $('#scalebar-' + layer.name).remove(); 
            }
         });
         
         $('#' + layer.name + '-log').on('click', ':checkbox', function(e) {          
            // Check to see if the value was changed
            if(layer.log && $(this).is(':checked'))
               return;
            else if(layer.log == false && !$(this).is(':checked'))
               return;
               
            validateScale(layer, null , null);
         });
         
         var scaleMax = Math.round(layer.maxScaleVal + ((layer.maxScaleVal / 100) * 25));
         var scaleMin = Math.round(layer.minScaleVal - ((layer.maxScaleVal / 100) * 25));

         // Setup the jQuery UI slider
         $('#' + layer.name + '-range-slider').slider({
            orientation: "vertical",
            range: true,
            values: [ layer.minScaleVal, layer.maxScaleVal ],
            max: scaleMax,
            min: scaleMin,
            step: 0.5,
            change: function(e, ui) {           
               validateScale(layer, $(this).slider("values", 0), $(this).slider("values", 1));
            }
         });

         // Some css to keep everything in the right place.
         $('#' + layer.name + '-range-slider').css({
            'height': 256,
            'margin': '5px 0px 0px 10px', 
         });
         $('#' + layer.name + '-maxvalue').parent('div').addClass('scalebar-max');
         $('#' + layer.name + '-log').addClass('scalebar-log');
         $('#' + layer.name + '-minvalue').parent('div').addClass('scalebar-min');
         
         // Open the dialog box
         $('#scalebar-' + layer.name).dialog('open');
      }
   };
}

/**
 * Creates and returns an array of available styles for a layer. The html id
 * of the passed in object is used to get the layer from the map.
 * 
 * @param {Object} $trigger - The object the menu was triggered on.
 * 
 * @return {Array} Returns an array of available styles for a layer.
 */
function getCurrentStyles($trigger)
{
   var layer = map.getLayersByName($trigger.attr('id'))[0];
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
   $.each(styles, function(index, value) 
   {
      var styleIndex = 'style' + index;
      menuOutput[index] = [];
      menuOutput[index][styleIndex] = 
      {
         index: styleIndex,
         name: value.Name,
         className: value.Name == layer.params["STYLES"] ? "styleSelected" : "",
         callbackName: value.Name,
         // Create the callback for what happens when someone clicks on the menu button
         callback: function() 
         {
            var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
            layer.mergeNewParams({styles: value.Name == 'Remove Style' ? '' : value.Name});
            updateScalebar(layer);
         }
      }                       
   });
   
   return menuOutput;
}

/**
 * Update the scale bar after changes have occurred.
 * @param {Object} layer - The layer who's scalebar needs to be updated.
 */
function updateScalebar(layer)
{
   // Check we have something to update
   if($('#scalebar-' + layer.name).length)
   {
      var scalebarDetails = getScalebarDetails(layer);
      $('#scalebar-' + layer.name + '> img').attr('src', scalebarDetails.url);
      
      var params = {
         colorscalerange: layer.minScaleVal + ',' + layer.maxScaleVal,
         logscale: layer.log,
      }
      
      layer.mergeNewParams(params);
      
      // DEBUG
      console.info('url: ' + scalebarDetails.url);
   }
}

function getScalebarDetails(layer)
{
   // Setup defaults
   var url = null;
   var width = 110;
   var height = 256;
   
   // Iter over styles
   $.each(layer.styles, function(index, value)
   {
      // If the style names match grab its info
      if(value.Name == layer.params["STYLES"] && url == null)
      {
         url = value.LegendURL + createGetLegendURL(layer, true);
         width = parseInt(value.Width);
         height = parseInt(value.Height);
         return false; // Break loop
      }
   });
   
   // If the url is still null then there were no matches, so use a generic url
   if(url == null)
      url = createGetLegendURL(layer, false);
      
   return {
      url: url,
      width: width,
      height: height,
   };
}

function createGetLegendURL(layer, hasBase)
{
   if(hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
   else
      return layer.url + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
}

// Validates the entries for the scale bar
function validateScale(layer, newMin, newMax)
{  
   if(newMin == null)
      newMin = layer.minScaleVal;
      
   if(newMax == null)
      newMax = layer.maxScaleVal;
   
   var fMin = parseFloat(newMin);
   var fMax = parseFloat(newMax);
   
   if (isNaN(fMin)) {
      alert('Scale limits must be set to valid numbers');
      // Reset to the old value
      $('#' + layer.name + '-minvalue').val(layer.minScaleVal);
   } 
   else if (isNaN(fMax)) {
      alert('Scale limits must be set to valid numbers');
      // Reset to the old value
      $('#' + layer.name + '-maxvalue').val(layer.maxScaleVal);
   } 
   else if (fMin > fMax) {
      alert('Minimum scale value must be less than the maximum');
      // Reset to the old values
      $('#' + layer.name + '-minvalue').val(layer.minScaleVal);
      $('#' + layer.name + '-maxvalue').val(layer.maxScaleVal);
   } 
   else if (fMin <= 0 && $('#' + layer.name + '-log').children('[type="checkbox"]').first().is(':checked')) {
      alert('Cannot use a logarithmic scale with negative or zero values');
      $('#' + layer.name + '-log').children('[type="checkbox"]').attr('checked', false);
   } 
   else {
      var fMinP = fMin.toPrecision(4);
      var fMaxP = fMax.toPrecision(4);
      
      $('#' + layer.name + '-minvalue').val(fMinP);
      $('#' + layer.name + '-maxvalue').val(fMaxP);
      //$('#' + layer.name + '-range-slider').slider("values", 0, fMinP);
      //$('#' + layer.name + '-range-slider').slider("values", 1, fMaxP);
      
      layer.minScaleVal = fMinP;
      layer.maxScaleVal = fMaxP;     
      layer.log = $('#' + layer.name + '-log').children('[type="checkbox"]').first().is(':checked') ? true : false;
      updateScalebar(layer);
   }
}

/**
 * Temp - Used to create the demo graphs
 */
function createGraphs()
{
   return {
      name: 'Show Graphs',
      callback: function() {
         var graphData = {
            id: 'testgraph',
            title: 'Test Graph',
            data: generateLineData(),
            options: lineOptions(),
            draggable: true
         };
         
         createGraph(graphData);
         
         var graphData = {
            id: 'candlegraph',
            title: 'Candle Graph',
            data: generateCandleData(),
            options: candleOptions(),
            draggable: false
         };
         
         createGraph(graphData);
         
         var graphData = {
            id: 'timegraph',
            title: 'Basic Time Graph',
            data: generateBasicTimeData(),
            options: basicTimeOptions(),
            selectable: true
         };
         
         createGraph(graphData);
      }
   };
}
