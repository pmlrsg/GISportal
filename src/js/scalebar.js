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
      if(indicator.styles){
         // Iter over styles
         $.each(indicator.styles, function(index, value)
         {
            // If the style names match grab its info
            if(value.Name == indicator.style && url === null) {
               url = gisportal.scalebars.createGetLegendURL(indicator, value.LegendURL);
               width = parseInt(value.Width, 10);
               height = parseInt(value.Height, 10);
               return false; // Break loop
            }
         });
      }   
      // If the url is still null then there were no matches, so use a generic url
      if(url === null)
         url = gisportal.scalebars.createGetLegendURL(indicator, "");
     
      
      // Set the scalebar inputs to be correct 
      $('.js-scale-min[data-id="' + id + '"]').val(indicator.minScaleVal);
      $('.js-scale-max[data-id="' + id + '"]').val(indicator.maxScaleVal);
      
      var scalePoints = [];
      
      var i, range, step, value, makePointReadable;
      if( indicator.log ){
         range = Math.log(indicator.maxScaleVal) - Math.log(indicator.minScaleVal);
         var minScaleLog =  Math.log(indicator.minScaleVal);
         for(i = 0; i < scaleSteps; i++ ){
            step = (range / (scaleSteps-1)) * i;
            value = minScaleLog + step;
            value = Math.exp( value );
	        scalePoints.push( value );
         }
      }else{
         range = indicator.maxScaleVal - indicator.minScaleVal;
         for(i = 0; i < scaleSteps; i++ ){
            step = (range / (scaleSteps-1)) * i;
            value = indicator.minScaleVal + step;
	        scalePoints.push( value );
         }
      }
      
      var isExponentOver3 = scalePoints.some(function( point ){
         //return point.toExponential().match(/\.(.+)e/)[1].length > 4
         return ( Math.abs(Number(point.toExponential().split('e')[1])) > 3 );
      });
      
      if( isExponentOver3 ){
	      makePointReadable = function( point ){
	         point = point.toExponential();
	         if( point.indexOf('.') == -1 )
	            return point;
	         var original = point.match(/\.(.+)e/)[1];
	         return point.replace( original, original.substr(0,2) );
	      };
      }else{
	      makePointReadable = function( point ){ return Math.round(point * 10) / 10; };
      }
      
      scalePoints = scalePoints.map(function( point ){
	      return {
	         original: isExponentOver3 ? point.toExponential() : point,
	         nicePrint: makePointReadable(point)
	      };
      });

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
gisportal.scalebars.createGetLegendURL = function(layer,  base)  {
   var given_parameters;
   var parameters = "";

   try{
      given_parameters = layer.legendSettings.Parameters;
   }catch(e){}
   
   try{
      if(given_parameters.height){
         parameters += "&HEIGHT=" + given_parameters.height;
      }
   }catch(e){}

   try{
      if(given_parameters.width){
         parameters += "&WIDTH=" + given_parameters.width;
      }
   }catch(e){}

   try{
      if(given_parameters.colorbaronly){
         parameters += "&colorbaronly=" + given_parameters.colorbaronly;
      }
   }catch(e){}

   try{
      if(typeof layer.minScaleVal == "number" && typeof layer.maxScaleVal == "number" ){
         parameters += "&COLORSCALERANGE=" + layer.minScaleVal + ',' + layer.maxScaleVal;
      }
   }catch(e){}

   try{
      if(layer.log){
         parameters += "&logscale=" + layer.log;
      }
   }catch(e){}

   if(parameters.length > 0 && base.indexOf("?") ==-1){
      parameters = "?" + parameters;
   }

   if (base.length > 0)
      return base + parameters;
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + parameters + 'format=image/png';
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
   if( force !== true){
      if( autoScaleCheck.length == 1 ){
         if( ! autoScaleCheck.prop('checked') ){
            return;
         }
      }else if( ! gisportal.config.autoScale ){
         return;
      }
   }

   try{
      var l = gisportal.layers[id];
      if(l.serviceType!="WFS"){
      var bbox = l.exBoundingBox.WestBoundLongitude + "," +
         l.exBoundingBox.SouthBoundLatitude + "," +
         l.exBoundingBox.EastBoundLongitude + "," +
         l.exBoundingBox.NorthBoundLatitude;
      var time;
      try{
         time = '&time=' + new Date(l.selectedDateTime).toISOString();
      }
      catch(e){
         time = "";
      }

      $.ajax({
         url: gisportal.ProxyHost + encodeURIComponent(l.wmsURL + 'item=minmax&layers=' + l.urlName + '&bbox=' + bbox + '&elevation=' + (l.selectedElevation || -1) + time + '&srs=EPSG:4326&width=50&height=50&request=GetMetadata'),
         dataType: 'json',
         success: function( data ) {
            if(typeof(data.min) == "number" && typeof(data.max) == "number"){
               gisportal.scalebars.validateScale(id, data.min, data.max);
            }
         }
      });
   }
   }catch(e){}

   gisportal.events.trigger('scalebar.autoscale', id, force);
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

   gisportal.events.trigger('scalebar.reset', id);
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
         $('.js-indicator-is-log[data-id="' + indicator.id + '"]').notify("Cannot use a logarithmic scale with negative or zero values", {position:"right middle"});
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

gisportal.scalebars.scalebarImageError = function(layer_id){
   $("li[data-id=" + layer_id + "] div.scalebar-tab").addClass("alert-danger");
   $("li[data-id=" + layer_id + "] div.scalebar-linear").html("There was an error loading the scalebar from <a href='" + gisportal.layers[layer_id].legend + "'>this URL</a>");
};

gisportal.scalebars.scalebarImageSuccess = function(layer_id){
   $("li[data-id=" + layer_id + "] div.scalebar-tab").toggleClass("alert-danger", false);
};
