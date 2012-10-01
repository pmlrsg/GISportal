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
                  showGraphs: createGraphs(),
                  showGraphCreator: showGraphCreator()
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
            '<div id="metadata-' + layer.name + '" class="unselectable" title="' + layer.displayTitle + '">' +
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
         }).dialogExtend({
            "help": true,
            "minimize": true,
            "dblclick": "collapse",
         });

         //$('#metadata-' + layer.name).dialog();

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

 * @return {Object} Returns an object containing the display name to show on 
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
            '<div id="scalebar-' + layer.name +'" class="scalebar unselectable" title="Scalebar Info">' +
               '<img src="' + scalebarDetails.url + '" alt="Scalebar"/>' +
               '<div id="' + layer.name + '-range-slider"></div>' +
               '<div>' +
                  '<label for="' + layer.name + '-max" title="The maximum value to be used">Maximum Value: </label>' +
               '</div>' +
               '<div>' +
                  '<input id="' + layer.name + '-max" type="text" name="' + layer.name + '-max" />' +
               '</div>' +
               '<div id="' + layer.name + '-scale">' +
                  '<input type="button" name="' + layer.name + '-scale-button" value="Recalculate Scale" />' +
               '</div>' +
               '<div id="' + layer.name + '-log">' +
                  '<input type="checkbox" name="' + layer.name + '-log-checkbox"/>' +
                  '<label for="' + layer.name + '-logarithmic" title="Logarithmic Scale">Logarithmic Scale </label>' +
               '</div>' +
               '<div id="' + layer.name + '-reset">' +
                  '<input type="button" name="' + layer.name + '-reset-button" value="Reset Scale" />' +
               '</div>' +
               '<div>' +
                  '<label for="' + layer.name + '-min" title="The minimum value to be used">Minimum Value: </label>' +
               '</div>' +
               '<div>' +
                  '<input id="' + layer.name + '-min" type="text" name="min"/>' +
               '</div>' +
            '</div>'
         );
         
         if(layer.minScaleVal != undefined && layer.maxScaleVal != undefined) {
            $('#' + layer.name + '-max').val(layer.maxScaleVal);
            $('#' + layer.name + '-min').val(layer.minScaleVal);
         }
         else {
            $('#' + layer.name + '-max').val = '';
            $('#' + layer.name + '-min').val = '';  
         }

         // Show the scalebar for a selected layer
         $('#scalebar-' + layer.name).dialog({
            position: ['center', 'center'],
            width: 310,
            resizable: false,
            autoOpen: false,
            close: function() {
               // Remove on close
               $('#scalebar-' + layer.name).remove(); 
            }
         }).dialogExtend({
            "help": true,
            "minimize": true,
            "dblclick": "collapse",
            "events": {
               "restore": function(e, dlg) {
                  // Used to resize content on the dialog.
                  $(this).trigger("resize");
               },
               "help" : function(e, dlg) {
                  showMessage('scalebar', null);
               },
            },

         });
         
         $('#' + layer.name + '-log').on('click', ':checkbox', function(e) {          
            // Check to see if the value was changed
            if(layer.log && $(this).is(':checked'))
               return;
            else if(layer.log == false && !$(this).is(':checked'))
               return;
               
            validateScale(layer, null , null);
         });
         
         $('#' + layer.name + '-reset').on('click', '[type="button"]', function(e) {                              
            validateScale(layer, layer.origMinScaleVal , layer.origMaxScaleVal, true);
         });
         
         $('#' + layer.name + '-scale').on('click', '[type="button"]', function(e) {                              
            var scaleRange = getScaleRange(layer.minScaleVal, layer.maxScaleVal);
            $('#' + layer.name + '-range-slider').slider('option', 'min', scaleRange.min);
            $('#' + layer.name + '-range-slider').slider('option', 'max', scaleRange.max);
            validateScale(layer, layer.minScaleVal , layer.maxScaleVal);
         });
         
         $('#' + layer.name + '-max').focusout(function(e) {          
            // Check to see if the value was changed
            var max = parseFloat($(this).val());
            
            if(max == layer.maxScaleVal)
               return;
               
            validateScale(layer, null , max);
         });
         
         $('#' + layer.name + '-min').focusout(function(e) {          
            // Check to see if the value was changed
            var min = parseFloat($(this).val());
            
            if(min == layer.minScaleVal)
               return;
               
            validateScale(layer, min , null);
         });
         
         var scaleRange = getScaleRange(layer.minScaleVal, layer.maxScaleVal);

         // Setup the jQuery UI slider
         $('#' + layer.name + '-range-slider').slider({
            orientation: "vertical",
            range: true,
            values: [ layer.minScaleVal, layer.maxScaleVal ],
            max: scaleRange.max,
            min: scaleRange.min,
            step: 0.00000001,
            change: function(e, ui) {
               //if(e.originalEvent) {
                  if($(this).slider("values", 0) != layer.minScaleVal || $(this).slider("values", 1) != layer.maxScaleVal) {      
                     validateScale(layer, $(this).slider("values", 0), $(this).slider("values", 1));
                  }
               //}
            }
         });

         // Some css to keep everything in the right place.
         $('#' + layer.name + '-range-slider').css({
            'height': 256,
            'margin': '5px 0px 0px 10px', 
         });
         $('#' + layer.name + '-max').parent('div').addClass('scalebar-max');
         $('#' + layer.name + '-scale').addClass('scalebar-scale');
         $('#' + layer.name + '-log').addClass('scalebar-log');
         $('#' + layer.name + '-reset').addClass('scalebar-reset');
         $('#' + layer.name + '-min').parent('div').addClass('scalebar-min');
         
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

/**
 * Calculates a scale range based on the provided values.
 * @param {Float} min - The lower end of the scale.
 * @param {Float} max - The higher end of the scale.
 * @return {Object} Returns two values min and max in an object.
 */
function getScaleRange(min, max)
{
   return {
      max: max + ((max / 100) * 25),
      min: min - ((max / 100) * 25),
   };
}

/**
 * Validates the entries for the scale bar
 * @param {Object} layer - The layer who's scalebar you wish to validate
 * @param {Float} newMin - The new minimum value to be used for the scale
 * @param {Float} newMax - The new maximum value to be used for the scale
 * @param {Boolean} reset - Resets the scale if true
 */ 
function validateScale(layer, newMin, newMax, reset)
{  
   if(newMin == null || typeof newMin === undefined)
      newMin = layer.minScaleVal;
      
   if(newMax == null || typeof newMax === undefined)
      newMax = layer.maxScaleVal;
      
   if(reset == null || typeof reset === undefined)
      reset = false;
   
   var min = parseFloat(newMin);
   var max = parseFloat(newMax);
   
   if (isNaN(min)) {
      alert('Scale limits must be set to valid numbers');
      // Reset to the old value
      $('#' + layer.name + '-min').val(layer.minScaleVal);
      $('#' + layer.name + '-range-slider').slider("values", 0, layer.minScaleVal);
   } 
   else if (isNaN(max)) {
      alert('Scale limits must be set to valid numbers');
      // Reset to the old value
      $('#' + layer.name + '-max').val(layer.maxScaleVal);
      $('#' + layer.name + '-range-slider').slider("values", 1, layer.maxScaleVal);
   } 
   else if (min > max) {
      alert('Minimum scale value must be less than the maximum');
      // Reset to the old values
      $('#' + layer.name + '-min').val(layer.minScaleVal);
      $('#' + layer.name + '-max').val(layer.maxScaleVal);
   } 
   else if (min <= 0 && $('#' + layer.name + '-log').children('[type="checkbox"]').first().is(':checked')) {
      alert('Cannot use a logarithmic scale with negative or zero values');
      $('#' + layer.name + '-log').children('[type="checkbox"]').attr('checked', false);
      $('#' + layer.name + '-range-slider').slider("values", 0, layer.minScaleVal);
   } 
   else { 
      $('#' + layer.name + '-min').val(min);
      $('#' + layer.name + '-max').val(max);
      
      if(min < $('#' + layer.name + '-range-slider').slider('option', 'min') || 
         max > $('#' + layer.name + '-range-slider').slider('option', 'max') ||
         reset == true)
      {
         var scaleRange = getScaleRange(min, max);
         $('#' + layer.name + '-range-slider').slider('option', 'min', scaleRange.min);
         $('#' + layer.name + '-range-slider').slider('option', 'max', scaleRange.max);
         console.log("scale changed");
      }
      
      layer.minScaleVal = min;
      layer.maxScaleVal = max;     
      layer.log = $('#' + layer.name + '-log').children('[type="checkbox"]').first().is(':checked') ? true : false;
      
      $('#' + layer.name + '-range-slider').slider("values", 0, min);
      $('#' + layer.name + '-range-slider').slider("values", 1, max);
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
         
         $.ajax({
            type: 'GET',
            url: OpenLayers.ProxyHost + 'http://127.0.0.1:5000/wcs/wcs2json?baseurl=http://motherlode.ucar.edu:8080/thredds/wcs/fmrc/NCEP/GFS/Alaska_191km/NCEP-GFS-Alaska_191km_best.ncd?%26version%3D1.0.0%26coverage%3DPressure_reduced_to_MSL%26type%3Dhistogram%26bins%3D500,10500,20500,30500,40500,50500,60500,70500,80500,90500,100500,105500',
            dataType: 'json',
            asyc: true,
            success: function(data) {
               var num = data.output.histogram.Numbers
               
               var graphData = {
                  id: 'wcsgraphPressure_reduced_to_MSL',
                  title: 'WCS Test Graph - Pressure_reduced_to_MSL',
                  data: [num],
                  options: barOptions(),
                  selectable: true
               };
               
               createGraph(graphData);
            },
            error: function(request, errorType, exception) {            
               gritterErrorHandler(null, 'wcs data', request, errorType, exception);
            }
         });
         
         $.ajax({
            type: 'GET',
            url: OpenLayers.ProxyHost + 'http://127.0.0.1:5000/wcs/wcs2json?baseurl=http://motherlode.ucar.edu:8080/thredds/wcs/fmrc/NCEP/GFS/Alaska_191km/NCEP-GFS-Alaska_191km_best.ncd?%26version%3D1.0.0%26coverage%3Dv_wind_tropopause%26type%3Dhistogram%26bins%3D-100,-80,-60,-40,-20,0,20,40,60,80,100',
            dataType: 'json',
            asyc: true,
            success: function(data) {
               var num = data.output.histogram.Numbers
               
               var graphData = {
                  id: 'wcsgraphv_wind_tropopause',
                  title: 'WCS Test Graph - v_wind_tropopause',
                  data: [num],
                  options: barOptions(),
                  selectable: true
               };
               
               createGraph(graphData);
            },
            error: function(request, errorType, exception) {            
               gritterErrorHandler(null, 'wcs data', request, errorType, exception);
            }
         });
      }
   };
}

/**
 * Creates and shows the graph creator dialog box
 */
function showGraphCreator()
{
   return {
      name: 'Show Graph Creator',
      callback: function() {
         // If there is an open version, close it
         if($('#graphCreator').length)
            $('#graphCreator').dialog('close');
         
         // Add the html to the document
         $(document.body).append(
            '<div id="graphCreator" class="unselectable" title="Graph Creator">' +
               '<div class="ui-control">' +
                  '<h3 id="basic-inputs-header" class="ui-control-header ui-helper-reset">' +
                     '<span class="ui-icon ui-icon-triangle-1-s"></span>' +
                     '<a href="#">Basic Inputs</a>' + 
                  '</h3>' +
                  '<div id="basic-inputs">' +
                     '<div>' +
                        '<label for="graphcreator-baseurl-label" title="BaseUrl">BaseUrl:</label>' +
                     '</div>' +
                     '<div>' +
                        '<input id="graphcreator-baseurl" type="text" name="graphcreator-path"/>' +
                     '</div>' +
                     '<div>' +
                        '<label for="graphcreator-coverage-label" title="Coverage">Coverage:</label>' +
                     '</div>' +
                     '<div>' +
                        '<input id="graphcreator-coverage" type="text" name="graphcreator-coverage"/>' +
                        '<input id="graphcreator-coverage-button" type="button" name="graphcreator-coverage-button" value="Get Top Layer" />' +
                     '</div>' +
                     '<div>' +
                        '<label for="graphcreator-type-label" title="Type">Type:</label>' +
                     '</div>' +
                     '<div>' +
                        '<select id="graphcreator-type" name="graphcreator-type">' +
                           '<option value="basic">basic</option>' +
                           '<option value="histogram">histogram</option>' +
                           '<option value="raw">raw (Not Working)</option>' +
                           '<option value="test">test</option>' +
                        '</select>' +
                        //'<input id="graphcreator-type" type="text" name="graphcreator-type"/>' +
                     '</div>' +
                  '</div>' +
               '</div>' +
               '<div class="ui-control">' +
                  '<h3 id="histogram-inputs-header" class="ui-control-header ui-helper-reset">' +
                     '<span class="ui-icon ui-icon-triangle-1-s"></span>' +
                     '<a href="#">Histogram Inputs</a>' + 
                  '</h3>' +
                  '<div id="histogram-inputs">' +
                     '<div>' +
                        '<label for="graphcreator-bins-label" title="Bins">Bins:</label>' +
                     '</div>' +
                     '<div>' +
                        '<input id="graphcreator-bins" type="text" name="graphcreator-bins"/>' +
                     '</div>' +
                  '</div>' +
               '</div>' +
               '<div class="ui-control">' +
                  '<h3 id="advanced-inputs-header" class="ui-control-header ui-helper-reset">' +
                     '<span class="ui-icon ui-icon-triangle-1-s"></span>' +
                     '<a href="#">Advanced Inputs</a>' + 
                  '</h3>' +
                  '<div id="advanced-inputs">' +
                     '<div>' +
                        '<label for="graphcreator-time-label" title="Time">Time:</label>' +
                     '</div>' +
                     '<div>' +
                        '<input id="graphcreator-time" type="text" name="graphcreator-time"/>' +
                     '</div>' +
                     '<div>' +
                        '<label for="graphcreator-bbox-label" title="Bbox">Bbox:</label>' +
                     '</div>' +
                     '<div>' +
                        '<input id="graphcreator-bbox" type="text" name="graphcreator-bbox"/>' +
                     '</div>' +
                  '</div>' +
                  '<div id="graphcreator-generate">' +
                     '<input type="button" name="graphcreator-generate-button" value="Generate Graph" />' +
                  '</div>' +
               '</div>' +
            '</div>'
         );
         
         // Turn it into a dialog box
         $('#graphCreator').dialog({
            position: ['center', 'center'],
            width:340,
            resizable: false,
            autoOpen: false,
            close: function() {
               // Remove on close
               $('#graphCreator').remove(); 
            }
         }).dialogExtend({
            "help": true,
            "minimize": true,
            "dblclick": "collapse",
         });
         
         // Set default value
         $('#graphcreator-baseurl').val('http://motherlode.ucar.edu:8080/thredds/wcs/fmrc/NCEP/GFS/Alaska_191km/NCEP-GFS-Alaska_191km_best.ncd?')
         
         // When selecting the bounding box text field, request user to draw the box to populate values
         $('#graphcreator-bbox').click(function() {
            showMessage('bbox', null);
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
                  $('#graphcreator-coverage').val($(this).parent('li').attr('id'));
               }
            });
   
            return false;
         });
         
         // Close histogram and advanced panels
         $('#histogram-inputs-header').trigger('click');
         $('#advanced-inputs-header').trigger('click');
         
         // Create and display the graph
         $('#graphcreator-generate').click(function(e) {          
            $.ajax({
               type: 'GET',
               url: OpenLayers.ProxyHost + 'http://pmpc1313.npm.ac.uk:5000/wcs/wcs2json?' + encodeURIComponent('baseurl=' + $('#graphcreator-baseurl').val() + 
                  '&coverage=' + $('#graphcreator-coverage').val() + '&type=' + $('#graphcreator-type').val() + '&bins=' + $('#graphcreator-bins').val() +
                  '&time=' + $('#graphcreator-time').val() + '&bbox=' + $('#graphcreator-bbox').val()),
               dataType: 'json',
               asyc: true,
               success: function(data) {
                  console.log(data.output);
                  if(data.type == 'basic')
                  {                                    
                     var start = new Date(data.output.time).getTime(),
                        d1 = [],
                        d2 = [], 
                        d3 = [],
                        d4 = [], 
                        d5 = [];
                     
                     $.each(data.output, function(i, value) {
                        d1.push([new Date(i).getTime(), value.std]);
                        d2.push([new Date(i).getTime(), value.max]);
                        d3.push([new Date(i).getTime(), value.min]);
                        d4.push([new Date(i).getTime(), value.median]);
                        d5.push([new Date(i).getTime(), value.mean]);
                     });
                     
                     /*
                     var options = {
                        xaxis: { min: 0, max: d1.length + 1 },
                        yaxis: { min: data.output.min, max: data.output.max },
                        title: 'Example Graph',
                        mouse: {
                          track: true, // Enable mouse tracking
                          lineColor: 'purple',
                          relative: true,
                          position: 'ne',
                          sensibility: 1,
                          trackDecimals: 2,
                          trackFormatter: function (o) { return 'x = ' + o.x +', y = ' + o.y; }
                        },
                        legend: {
                           position: 'se', // Position the legend 'south-east'.
                           backgroundColor: '#D2E8FF', // A light blue background color.
                        },
                        HtmlText : false
                     };*/
                     
                     var graphData = {
                        id: 'wcsgraph' + Date.now(),
                        title: 'WCS Test Graph',
                        data: [{
                           data: d1.sort(),
                           lines: { show: true },
                           points: { show: true },
                           label: 'STD',
                        },
                        {
                           data: d2.sort(),
                           lines: { show: true },
                           points: { show: true },
                           label: 'max',
                        },
                        {
                           data: d3.sort(),
                           lines: { show: true },
                           points: { show: true },
                           label: 'min',
                        },
                        {
                           data: d4.sort(),
                           lines: { show: true },
                           points: { show: true },
                           label: 'median',
                        },
                        {
                           data: d5.sort(),
                           lines: { show: true },
                           points: { show: true },
                           label: 'mean',
                        }],
                        options: basicTimeOptions(),
                        selectable: true
                     };
                  }
                  else if(data.type == 'histogram')
                  {
                     var num = data.output.histogram.Numbers
                  
                     var graphData = {
                        id: 'wcsgraph' + Date.now(),
                        title: 'WCS Test Graph',
                        data: [num],
                        options: barOptions(),
                        selectable: true
                     };
                  }
                
                  createGraph(graphData);
               },
               error: function(request, errorType, exception) {            
                  gritterErrorHandler(null, 'wcs data', request, errorType, exception);
               }
            });
         });
         
                  
         // Open the dialog box
         $('#graphCreator').dialog('open');
      }
   };
}
