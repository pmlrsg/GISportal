/*------------------------------------*\
    Scalebars
    This file is for the logic
    behind scalebars.
\*------------------------------------*/

gisportal.scalebars = {};

/**
 * This is the main function for getting the scalebar image.
 * @param {string} id - The id of the layer
 */
gisportal.scalebars.getScalebarDetails = function(id)  {
   var indicator = gisportal.layers[id];
   if (indicator)  {
      // Setup defaults
      var url = null;
      var width = 110;
      var height = 256;
     
      // Iter over styles
      $.each(indicator.styles, function(index, value)
      {
         // If the style names match grab its info
         if(value.Name == indicator.style && url === null) {
            url = value.LegendURL + gisportal.scalebars.createGetLegendURL(indicator, true);
            width = parseInt(value.Width, 10);
            height = parseInt(value.Height, 10);
            return false; // Break loop
         }
      });
   
      // If the url is still null then there were no matches, so use a generic url
      if(url === null)
         url = gisportal.scalebars.createGetLegendURL(indicator, false);
     
      
      // Set the scalebar inputs to be correct 
      $('.js-scale-min[data-id="' + id + '"]').val(indicator.minScaleVal);
      $('.js-scale-max[data-id="' + id + '"]').val(indicator.maxScaleVal);
   

      return {
         url: url,
         width: width,
         height: height
      }; 
   }
};

/**
 * This creates the scalebar image.
 * @param {object} layer - The gisportal.layer
 * @parama {boolean} hasBase - True if you have the base URL (wmsURL)
 */
gisportal.scalebars.createGetLegendURL = function(layer, hasBase)  {
   var height = $('.js-tab-scalebar').width();
   if (hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=25&HEIGHT=' + height;
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=25&HEIGHT=' + height;
};

/**
 * This gets an automatically generated scale.
 * @param {string} id - The id of the layer
 */
gisportal.scalebars.autoScale = function(id)  {
   var l = gisportal.layers[id];     
   gisportal.genericAsync('GET', OpenLayers.ProxyHost + encodeURIComponent(l.wmsURL + 'item=minmax&layers=' + l.urlName + '&bbox=-180,-90,180,90&elevation=' + (l.selectedElevation || -1) + '&time='+ new Date(l.selectedDateTime).toISOString() + '&crs=' + gisportal.lonlat.projCode + '&srs=' + gisportal.lonlat.projCode + '&width=50&height=50&request=GetMetadata') , null, function(d) {
      gisportal.scalebars.validateScale(id, d.min, d.max);
   }, null, 'json', {});    
}

/**
 * This resets the scale to the original values.
 *
 * @param {string} id - The id of the layer
 */
gisportal.scalebars.resetScale = function(id)  {
   min = gisportal.layers[id].origMinScaleVal;
   max = gisportal.layers[id].origMaxScaleVal;
   gisportal.scalebars.validateScale(id, min, max);
};

/**
 * This function makes sure the scale is valid by
 * checking it is within the correct bounds.
 *
 * @param {string} id - The id of the layer
 * @param {number} newMin - The min scale
 * @param {number} newMax - The max scale
 */
gisportal.scalebars.validateScale = function(id, newMin, newMax)  {
   var indicator = gisportal.layers[id];

   if(newMin === null || typeof newMin === 'undefined')
      newMin = indicator.minScaleVal;
      
   if(newMax === null || typeof newMax === 'undefined')
      newMax = indicator.maxScaleVal;
     
   var min = parseFloat(newMin);
   var max = parseFloat(newMax);

   var minEl = $('.js-scale-min[data-id="' + id +'"]');
   var maxEl = $('.js-scale-max[data-id="' + id +'"]');


   var logEl = $('#tab-' + id + '-log');
   var isLog = logEl.is(':checked');

   if (min > max)  {
      min = max;
      max = min;
   }   


   if ((max !== undefined && max !== null) && (min !== undefined && min !== null))  {
      if (isLog && min <= 0)  {
         alert('Cannot use a logarithmic scale with negative or zero values');
         logEl.attr('checked', false);
      }
      else  {

         minEl.val(min);
         maxEl.val(max);


         gisportal.layers[id].minScaleVal = min;
         gisportal.layers[id].maxScaleVal = max;
         gisportal.layers[id].log = isLog;

         this.updateScalebar(id);
      } 
   }
};

/**
 * This function updates the scale of the map by
 * merging the params.
 *
 * @param {string} id - The id of the layer
 */
gisportal.scalebars.updateScalebar = function(id)  {
   var scale = this.getScalebarDetails(id);
   var indicator = gisportal.layers[id];
   

   var params = {
      colorscalerange: indicator.minScaleVal + ',' + indicator.maxScaleVal,
      logscale: indicator.log
   };
   
   gisportal.layers[id].mergeNewParams(params);
   
};
