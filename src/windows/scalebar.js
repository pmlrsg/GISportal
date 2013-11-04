/**
 * Opens a jQuery UI dialog which display a scalebar image fetched from the 
 * server and adds a jQuery UI slider along with two input boxes.
 */
opec.window.createScalebar = function($trigger) {
   // Get the selected layer
   var layer = opec.getLayerByID($trigger.attr('id'));       
   var scalebarDetails = getScalebarDetails(layer);

   // If there is an open version, close it
   if($('#scalebar-' + layer.id).length)
      $('#scalebar-' + layer.id).extendedDialog('close');
      
   var data = {
      name: layer.id,
      displayTitle: layer.displayTitle,
      url: scalebarDetails.url
   };

   // Add the html to the document using a template
   $(document.body).append(opec.templates.scalebarWindow(data));
   
   if(typeof layer.minScaleVal !== 'undefined' && typeof layer.maxScaleVal !== 'undefined') {
      $('#' + layer.id + '-max').val(layer.maxScaleVal);
      $('#' + layer.id + '-min').val(layer.minScaleVal);
   }
   else {
      $('#' + layer.id + '-max').val = '';
      $('#' + layer.id + '-min').val = '';  
   }

   // Show the scalebar for a selected layer
   $('#scalebar-' + layer.id).extendedDialog({
      position: ['center', 'center'],
      width: 310,
      resizable: false,
      autoOpen: false,
      showHelp: true,
      showMinimise: true,
      dblclick: "collapse",
      close: function() {
         // Remove on close
         $('#scalebar-' + layer.id).remove(); 
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
   $('#' + layer.id + '-log').on('click', ':checkbox', function(e) {          
      // Check to see if the value was changed
      if(layer.log && $(this).is(':checked'))
         return;
      else if(layer.log === false && !$(this).is(':checked'))
         return;
         
      validateScale(layer, null , null);
   });
   
   // Event to reset the scale if the "Reset Scale" button is pressed
   $('#' + layer.id + '-reset').on('click', '[type="button"]', function(e) {                              
      validateScale(layer, layer.origMinScaleVal , layer.origMaxScaleVal, true);
   });
   
   // Event to automatically set the scale if the "Auto Scale" button is pressed
   $('#' + layer.id + '-auto').on('click', '[type="button"]', function(e) {     
   	opec.genericAsync('GET', OpenLayers.ProxyHost + encodeURIComponent(opec.getTopLayer().wmsURL + 'item=minmax&layers=' + opec.getTopLayer().id + '&bbox=-180,-90,180,90&elevation=-1&time='+ new Date(opec.getTopLayer().selectedDateTime).toISOString() + '&crs=EPSG%3A4326&width=50&height=50&request=GetMetadata') , null, function(d) {
   		validateScale(layer, d.min, d.max, true);
   	}, null, 'json', {});                          
      
   });
   
   // Event to recalculate the scale if the "Recalculate Scale" button is pressed
   $('#' + layer.id + '-scale').on('click', '[type="button"]', function(e) {                              
      var scaleRange = getScaleRange(layer.minScaleVal, layer.maxScaleVal);
      $('#' + layer.id + '-range-slider').slider('option', 'min', scaleRange.min);
      $('#' + layer.id + '-range-slider').slider('option', 'max', scaleRange.max);
      validateScale(layer, layer.minScaleVal , layer.maxScaleVal);
   });
   
   // Event for unclicking the max box
   $('#' + layer.id + '-max').focusout(function(e) {          
      // Check to see if the value was changed
      var max = parseFloat($(this).val());
      
      if(max == layer.maxScaleVal)
         return;
         
      validateScale(layer, null , max);
   });
   
   // Event for unclicking the min box
   $('#' + layer.id + '-min').focusout(function(e) {          
      // Check to see if the value was changed
      var min = parseFloat($(this).val());
      
      if(min == layer.minScaleVal)
         return;
         
      validateScale(layer, min , null);
   });
   
   // Get the range for the scalebar
   var scaleRange = getScaleRange(layer.minScaleVal, layer.maxScaleVal);

   // Setup the jQuery UI slider
   $('#' + layer.id + '-range-slider').slider({
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
   $('#' + layer.id + '-range-slider').css({
      'height': 256,
      'margin': '5px 0px 0px 10px'
   });
   //$('#' + layer.id + '-max').parent('div').addClass('scalebar-max');
   //$('#' + layer.id + '-scale').addClass('scalebar-scale');
   //$('#' + layer.id + '-log').addClass('scalebar-log');
   //$('#' + layer.id + '-reset').addClass('scalebar-reset');
   //$('#' + layer.id + '-min').parent('div').addClass('scalebar-min');
   
   // Open the dialog box
   $('#scalebar-' + layer.id).extendedDialog('open');
};

/**
 * Update the scale bar after changes have occurred.
 * 
 * @param {Object} layer - The layer who's scalebar needs to be updated.
 */
function updateScalebar(layer) {
   // Check we have something to update
   if($('#scalebar-' + layer.id).length)
   {
      var scalebarDetails = getScalebarDetails(layer);
      $('#scalebar-' + layer.id + '> img').attr('src', scalebarDetails.url);
      
      var params = {
         colorscalerange: layer.minScaleVal + ',' + layer.maxScaleVal,
         logscale: layer.log
      };
      
      layer.mergeNewParams(params);
      
      // DEBUG
      console.info('url: ' + scalebarDetails.url);
   }
}

function getScalebarDetails(layer) {
   // Setup defaults
   var url = null;
   var width = 110;
   var height = 256;
   
   // Iter over styles
   $.each(layer.styles, function(index, value)
   {
      // If the style names match grab its info
      if(value.Name == layer.style && url === null) {
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
function getScaleRange(min, max) {
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
function validateScale(layer, newMin, newMax, reset) {  
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
      $('#' + layer.id + '-min').val(layer.minScaleVal);
      $('#' + layer.id + '-range-slider').slider("values", 0, layer.minScaleVal);
   } 
   else if (isNaN(max)) {
      alert('Scale limits must be set to valid numbers');
      // Reset to the old value
      $('#' + layer.id + '-max').val(layer.maxScaleVal);
      $('#' + layer.id + '-range-slider').slider("values", 1, layer.maxScaleVal);
   } 
   else if (min > max) {
      alert('Minimum scale value must be less than the maximum');
      // Reset to the old values
      $('#' + layer.id + '-min').val(layer.minScaleVal);
      $('#' + layer.id + '-max').val(layer.maxScaleVal);
   } 
   else if (min <= 0 && $('#' + layer.id + '-log').children('[type="checkbox"]').first().is(':checked')) {
      alert('Cannot use a logarithmic scale with negative or zero values');
      $('#' + layer.id + '-log').children('[type="checkbox"]').attr('checked', false);
      $('#' + layer.id + '-range-slider').slider("values", 0, layer.minScaleVal);
   } 
   else { 
      $('#' + layer.id + '-min').val(min);
      $('#' + layer.id + '-max').val(max);
      
      if(min < $('#' + layer.id + '-range-slider').slider('option', 'min') || 
         max > $('#' + layer.id + '-range-slider').slider('option', 'max') ||
         reset === true)
      {
         var scaleRange = getScaleRange(min, max);
         $('#' + layer.id + '-range-slider').slider('option', 'min', scaleRange.min);
         $('#' + layer.id + '-range-slider').slider('option', 'max', scaleRange.max);
         console.log("scale changed");
      }
      
      layer.minScaleVal = min;
      layer.maxScaleVal = max;     
      layer.log = $('#' + layer.id + '-log').children('[type="checkbox"]').first().is(':checked') ? true : false;
      
      $('#' + layer.id + '-range-slider').slider("values", 0, min);
      $('#' + layer.id + '-range-slider').slider("values", 1, max);
      updateScalebar(layer);
   }
}

function createGetLegendURL(layer, hasBase) {
   if(hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
}
