/**
 * Opens a jQuery UI dialog which display a scalebar image fetched from the 
 * server and adds a jQuery UI slider along with two input boxes.
 */
opec.window.createScalebar = function($trigger) {
   // Get the selected layer
   var layer = map.getLayersByName($trigger.attr('id'))[0];       
   var scalebarDetails = getScalebarDetails(layer);

   // If there is an open version, close it
   if($('#scalebar-' + layer.name).length)
      $('#scalebar-' + layer.name).extendedDialog('close');
      
   var data = {
      name: layer.name,
      displayTitle: layer.displayTitle,
      url: scalebarDetails.url
   };

   // Add the html to the document using a template
   $(document.body).append(opec.templates.scalebarWindow(data));
   
   if(typeof layer.minScaleVal !== 'undefined' && typeof layer.maxScaleVal !== 'undefined') {
      $('#' + layer.name + '-max').val(layer.maxScaleVal);
      $('#' + layer.name + '-min').val(layer.minScaleVal);
   }
   else {
      $('#' + layer.name + '-max').val = '';
      $('#' + layer.name + '-min').val = '';  
   }

   // Show the scalebar for a selected layer
   $('#scalebar-' + layer.name).extendedDialog({
      position: ['center', 'center'],
      width: 310,
      resizable: false,
      autoOpen: false,
      showHelp: true,
      showMinimise: true,
      dblclick: "collapse",
      close: function() {
         // Remove on close
         $('#scalebar-' + layer.name).remove(); 
      },
      restore: function(e, dlg) {
         // Used to resize content on the dialog.
         $(this).trigger("resize");
      },
      help : function(e, dlg) {
         opec.gritter.showNotification('scalebarTutorial', null);
      }
   });
   
   // Event to change the scale to and from log if the checkbox is changed
   $('#' + layer.name + '-log').on('click', ':checkbox', function(e) {          
      // Check to see if the value was changed
      if(layer.log && $(this).is(':checked'))
         return;
      else if(layer.log === false && !$(this).is(':checked'))
         return;
         
      validateScale(layer, null , null);
   });
   
   // Event to reset the scale if the "Reset Scale" button is pressed
   $('#' + layer.name + '-reset').on('click', '[type="button"]', function(e) {                              
      validateScale(layer, layer.origMinScaleVal , layer.origMaxScaleVal, true);
   });
   
   // Event to recalculate the scale if the "Recalculate Scale" button is pressed
   $('#' + layer.name + '-scale').on('click', '[type="button"]', function(e) {                              
      var scaleRange = getScaleRange(layer.minScaleVal, layer.maxScaleVal);
      $('#' + layer.name + '-range-slider').slider('option', 'min', scaleRange.min);
      $('#' + layer.name + '-range-slider').slider('option', 'max', scaleRange.max);
      validateScale(layer, layer.minScaleVal , layer.maxScaleVal);
   });
   
   // Event for unclicking the max box
   $('#' + layer.name + '-max').focusout(function(e) {          
      // Check to see if the value was changed
      var max = parseFloat($(this).val());
      
      if(max == layer.maxScaleVal)
         return;
         
      validateScale(layer, null , max);
   });
   
   // Event for unclicking the min box
   $('#' + layer.name + '-min').focusout(function(e) {          
      // Check to see if the value was changed
      var min = parseFloat($(this).val());
      
      if(min == layer.minScaleVal)
         return;
         
      validateScale(layer, min , null);
   });
   
   // Get the range for the scalebar
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
         if($(this).slider("values", 0) != layer.minScaleVal || $(this).slider("values", 1) != layer.maxScaleVal) {      
            validateScale(layer, $(this).slider("values", 0), $(this).slider("values", 1));
         }
      }
   });

   // Some css to keep everything in the right place.
   $('#' + layer.name + '-range-slider').css({
      'height': 256,
      'margin': '5px 0px 0px 10px'
   });
   //$('#' + layer.name + '-max').parent('div').addClass('scalebar-max');
   //$('#' + layer.name + '-scale').addClass('scalebar-scale');
   //$('#' + layer.name + '-log').addClass('scalebar-log');
   //$('#' + layer.name + '-reset').addClass('scalebar-reset');
   //$('#' + layer.name + '-min').parent('div').addClass('scalebar-min');
   
   // Open the dialog box
   $('#scalebar-' + layer.name).extendedDialog('open');
};

/**
 * Update the scale bar after changes have occurred.
 * 
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
         logscale: layer.log
      };
      
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
      if(value.Name == layer.params["STYLES"] && url === null) {
         url = value.LegendURL + createGetLegendURL(layer, true);
         width = parseInt(value.Width, 10);
         height = parseInt(value.Height, 10);
         return false; // Break loop
      }
   });
   
   // If the url is still null then there were no matches, so use a generic url
   if(url === null)
      url = createGetLegendURL(layer, false);
      
   return {
      url: url,
      width: width,
      height: height
   };
}

/**
 * Calculates a scale range based on the provided values.
 * @param {number} min - The lower end of the scale.
 * @param {number} max - The higher end of the scale.
 * @return {Object} Returns two values min and max in an object.
 */
function getScaleRange(min, max)
{
   return {
      max: max + Math.abs((max / 100) * 25),
      min: min - Math.abs((max / 100) * 25)
   };
}

/**
 * Validates the entries for the scale bar
 * @param {Object} layer - The layer who's scalebar you wish to validate
 * @param {number} newMin - The new minimum value to be used for the scale
 * @param {number} newMax - The new maximum value to be used for the scale
 * @param {boolean} reset - Resets the scale if true
 */ 
function validateScale(layer, newMin, newMax, reset)
{  
   if(newMin === null || typeof newMin === 'undefined')
      newMin = layer.minScaleVal;
      
   if(newMax === null || typeof newMax === 'undefined')
      newMax = layer.maxScaleVal;
      
   if(reset === null || typeof reset === 'undefined')
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
         reset === true)
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

function createGetLegendURL(layer, hasBase)
{
   if(hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
   else
      return layer.url + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
}