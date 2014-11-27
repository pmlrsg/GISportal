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
      var width = 1;
      var height = 500;
      var scaleSteps = 5;
     
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
      
      var scalePoints = [];
      
      
      if( indicator.log ){
         var range = Math.log(indicator.maxScaleVal) - Math.log(indicator.minScaleVal);
         var minScaleLog =  Math.log(indicator.minScaleVal);
         for( var i = 0; i < scaleSteps; i++ ){
            var step = (range / (scaleSteps-1)) * i;
            var value = minScaleLog + step;
            value = Math.exp( value );
	        scalePoints.push( value );
         }
      }else{
         var range = indicator.maxScaleVal - indicator.minScaleVal;
         for( var i = 0; i < scaleSteps; i++ ){
            var step = (range / (scaleSteps-1)) * i;
            var value = indicator.minScaleVal + step;
	        scalePoints.push( value );
         }
      }
      
      var isExponentOver4 = scalePoints.some(function( point ){
         //return point.toExponential().match(/\.(.+)e/)[1].length > 4
         return ( Math.abs(Number(point.toExponential().split('e')[1])) > 4 )
      })
      
      if( isExponentOver4 ){
	      var makePointReadable = function( point ){
	         point = point.toExponential();
	         if( point.indexOf('.') == -1 )
	            return point;
	         var original = point.match(/\.(.+)e/)[1];
	         return point.replace( original, original.substr(0,2) );
	      }
      }else{
	      var makePointReadable = function( point ){ return Math.round(point * 10) / 10; }
      }
      
      scalePoints = scalePoints.map(function( point ){
	      return {
	         original: isExponentOver4 ? point.toExponential() : point,
	         nicePrint: makePointReadable(point)
	      }
      })

      return {
         url: url,
         width: width,
         height: height,
         scalePoints: scalePoints
      }; 
   }
};

/**
 * This creates the scalebar image.
 * @param {object} layer - The gisportal.layer
 * @parama {boolean} hasBase - True if you have the base URL (wmsURL)
 */
gisportal.scalebars.createGetLegendURL = function(layer, hasBase)  {
   var height = 500;
   var width = 3;
   if (hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=' + width + '&HEIGHT=' + height;
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=' + width + '&HEIGHT=' + height;
};

/**
 * This gets an automatically generated scale.
 * When called it will check to see if the user 
 * has the "Auto Scale" checkbox ticked.
 * 
 * @param {string} id - The id of the layer
 * @param {bool} force - Should the autoScale be forced, ignoring the checkbox
 */
gisportal.scalebars.autoScale = function(id, force)  {
   var autoScaleCheck = $('#tab-' + id + '-autoScale');
   if( force != true){
      if( autoScaleCheck.length == 1 ){
         if( ! autoScaleCheck.prop('checked') ){
            return;
         };
      }else if( ! gisportal.config.autoScale ){
         return;
      };
   };

   try{
      var l = gisportal.layers[id];
      var bbox = l.exBoundingBox.WestBoundLongitude + ","
         + l.exBoundingBox.SouthBoundLatitude + ","
         + l.exBoundingBox.EastBoundLongitude + ","
         + l.exBoundingBox.NorthBoundLatitude;

      $.ajax({
         url: OpenLayers.ProxyHost + encodeURIComponent(l.wmsURL + 'item=minmax&layers=' + l.urlName + '&bbox=' + bbox + '&elevation=' + (l.selectedElevation || -1) + '&time='+ new Date(l.selectedDateTime).toISOString() + '&crs=' + gisportal.lonlat.projCode + '&srs=' + gisportal.lonlat.projCode + '&width=50&height=50&request=GetMetadata'),
         dataType: 'json',
         success: function( data ) {
            gisportal.scalebars.validateScale(id, data.min, data.max);
         }
      });
   }catch(e){};
};

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

   
   // This stops it from looping 
   if( gisportal.layers[id].minScaleVal == min && gisportal.layers[id].maxScaleVal == max && gisportal.layers[id].log == isLog )
      return;


   if ((max !== undefined && max !== null) && (min !== undefined && min !== null))  {
      if (isLog && min <= 0)  {
         alert('Cannot use a logarithmic scale with negative or zero values');
         logEl.attr('checked', false);
         isLog = false;
      }

         minEl.val(min);
         maxEl.val(max);


         gisportal.layers[id].minScaleVal = min;
         gisportal.layers[id].maxScaleVal = max;
         gisportal.layers[id].log = isLog;

         this.updateScalebar(id);

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
   
   gisportal.indicatorsPanel.redrawScalebar( id );
};
