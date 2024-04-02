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
      if(url === null){
         url = gisportal.scalebars.createGetLegendURL(indicator, "");
      }  
      
      // Set the scalebar inputs to be correct 
      $('.js-scale-min[data-id="' + id + '"]').val(indicator.minScaleVal);
      $('.js-scale-max[data-id="' + id + '"]').val(indicator.maxScaleVal);
      
      var scalePoints = [];
      
      var i, range, step, value;
      if( indicator.log ){
         range = Math.log(indicator.maxScaleVal) - Math.log(indicator.minScaleVal);
         var minScaleLog =  Math.log(indicator.minScaleVal);
         for(i = 0; i < 5; i++ ){
            step = (range / 4) * i;
            value = minScaleLog + step;
            value = Math.exp( value );
	         scalePoints.push( value );
         }
      }else{
         range = indicator.maxScaleVal - indicator.minScaleVal;
         for(i = 0; i < 5; i++ ){
            step = (range / 4) * i;
            value = indicator.minScaleVal + step;
	         scalePoints.push( value );
         }
      }
      
      scalePoints = scalePoints.map(function( point ){
	      return {
	         original: point.toString(),
	         nicePrint: gisportal.utils.makePointReadable(point)
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
gisportal.scalebars.createGetLegendURL = function(layer, base, preview)  {
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

   // If this is a preview (e.g. from the add layers form)
   if(preview){
      try{
         if(typeof layer.defaultMinScaleVal == "number" && typeof layer.defaultMaxScaleVal == "number" ){
            parameters += "&COLORSCALERANGE=" + layer.defaultMinScaleVal + ',' + layer.defaultMaxScaleVal;
         }
      }catch(e){}

      try{
         if(layer.defaultStyle){
            base = base.replace(/&PALETTE=.+/g, "");
            parameters += "&PALETTE=" + layer.defaultStyle.replace(/.+?(?=\/)\//g, "");
         }
      }catch(e){}

      try{
         if(layer.defaultColorbands){
            parameters += "&NUMCOLORBANDS=" + layer.defaultColorbands;
         }
      }catch(e){}

      try{
         if(layer.defaultAboveMaxColor){
            parameters += "&ABOVEMAXCOLOR=" + layer.defaultAboveMaxColor;
         }
      }catch(e){}

      try{
         if(layer.defaultBelowMinColor){
            parameters += "&BELOWMINCOLOR=" + layer.defaultBelowMinColor;
         }
      }catch(e){}
   }else{
      try{
         if(typeof layer.minScaleVal == "number" && typeof layer.maxScaleVal == "number" ){
            parameters += "&COLORSCALERANGE=" + layer.minScaleVal + ',' + layer.maxScaleVal;
         }
      }catch(e){}

      try{
         if(layer.defaultLog){
            parameters += "&logscale=" + layer.defaultLog;
         }
      }catch(e){}

      try{
         if(layer.colorbands){
            parameters += "&NUMCOLORBANDS=" + layer.colorbands;
         }
      }catch(e){}

      try{
         if(layer.aboveMaxColor){
            parameters += "&ABOVEMAXCOLOR=" + layer.aboveMaxColor;
         }
      }catch(e){}

      try{
         if(layer.belowMinColor){
            parameters += "&BELOWMINCOLOR=" + layer.belowMinColor;
         }
      }catch(e){}
   }
   if(parameters.length > 0 && base.length > 0 && base.indexOf("?") == -1){
      parameters = "?" + parameters;
   }


   if (base.length > 0){
      return base + parameters;
   }else {
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + parameters + '&format=image/png&service=WMS&version=1.3.0&sld_version=1.1.0';
   }
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
      }else if( gisportal.layers[id] && !gisportal.getAutoScaleFromString(gisportal.layers[id].autoScale) ){
         return;
      } else if (gisportal.loadingFromState) {
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

         gisportal.loading.increment();
         $.ajax({
            url: gisportal.ProxyHost + encodeURIComponent(l.wmsURL + 'item=minmax&layers=' + l.urlName + '&bbox=' + bbox + '&elevation=' + (l.selectedElevation || -1) + time + '&srs=EPSG:4326&width=50&height=50&request=GetMetadata'),
            dataType: 'json',
            success: function( data ) {
               if(typeof(data.min) == "number" && typeof(data.max) == "number"){
                  var layer = gisportal.layers[id] || gisportal.original_layers[id];
                  if(!layer){
                     return false;
                  }
                  layer.autoMinScaleVal = data.min;
                  layer.autoMaxScaleVal = data.max;
                  gisportal.scalebars.validateScale(id, data.min, data.max, force=true);
                  gisportal.loading.decrement();
               }
            },
            error: function(){
               gisportal.loading.decrement();
            }
         });
   }
   }catch(e){}

   var params = {
      "event" : "scalebar.autoscale",
      "id" : id,
      "force" : force
   };
   gisportal.events.trigger('scalebar.autoscale', params);
};

/**
 * This resets the scale to the original values.
 *
 * @param {string} id - The id of the layer
 */
gisportal.scalebars.resetScale = function(id)  {
   min = gisportal.layers[id].defaultMinScaleVal;
   max = gisportal.layers[id].defaultMaxScaleVal;
   gisportal.scalebars.validateScale(id, min, max);

   var params = {
      "event" : "scalebar.reset",
      "id" : id
   };
   gisportal.events.trigger('scalebar.reset', params);
};

/**
 * This function makes sure the scale is valid by
 * checking it is within the correct bounds.
 *
 * @param {string} id - The id of the layer
 * @param {number} newMin - The min scale
 * @param {number} newMax - The max scale
 */
gisportal.scalebars.validateScale = function(id, newMin, newMax, force)  {
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
         $('.js-indicator-is-log[data-id="' + indicator.id + '"]').parent().notify("Cannot use a logarithmic scale with negative or zero values", {position:"bottom middle"});
         logEl.attr('checked', false);
         isLog = false;
      }

         minEl.val(min);
         maxEl.val(max);


         gisportal.layers[id].minScaleVal = min;
         gisportal.layers[id].maxScaleVal = max;
         gisportal.layers[id].log = isLog;

         if(force){
            this.updateScalebar(id);
         }else{
            indicator.setScalebarTimeout();
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
   var indicator = gisportal.layers[id];
   var params = {
      colorscalerange: indicator.minScaleVal + ',' + indicator.maxScaleVal,
      logscale: indicator.log,
      numcolorbands: indicator.colorbands,
      STYLES: indicator.style,
      ABOVEMAXCOLOR: indicator.aboveMaxColor,
      BELOWMINCOLOR: indicator.belowMinColor,
      ELEVATION: indicator.selectedElevation
   };

   gisportal.layers[id].mergeNewParams(params);
   
   gisportal.indicatorsPanel.redrawScalebar( id );
};

gisportal.scalebars.scalebarImageError = function(layer_id){
   $("li[data-id=" + layer_id + "] div.scalebar-tab").addClass("alert-danger");
   $("li[data-id=" + layer_id + "] div.scalebar-linear").html("There was an error loading the scalebar from <a href='" + gisportal.layers[layer_id].legend + "' target='_blank'>this URL</a>");
};

gisportal.scalebars.scalebarImageSuccess = function(layer_id){
   $("li[data-id=" + layer_id + "] div.scalebar-tab").toggleClass("alert-danger", false);
};
