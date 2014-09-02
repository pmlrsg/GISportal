gisportal.scalebars = {};

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
     
      
  
      $('.js-scale-min[data-id="' + id + '"]').val(indicator.minScaleVal);
      $('.js-scale-max[data-id="' + id + '"]').val(indicator.maxScaleVal);
      
      var scalePoints = [];
      for( var i = 0; i < scaleSteps; i++ ){
         var range = indicator.maxScaleVal - indicator.minScaleVal;
         var step = (range / (scaleSteps-1)) * i;
	     scalePoints.push( indicator.minScaleVal + step );
      }
     

      return {
         url: url,
         width: width,
         height: height,
         scalePoints: scalePoints
      }; 
   }
};

gisportal.scalebars.createGetLegendURL = function(layer, hasBase)  {
   var height = 500;
   var width = 3;
   if (hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=' + width + '&HEIGHT=' + height;
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=' + width + '&HEIGHT=' + height;
};

gisportal.scalebars.autoScale = function(id)  {
   var l = gisportal.layers[id];     
   gisportal.genericAsync('GET', OpenLayers.ProxyHost + encodeURIComponent(l.wmsURL + 'item=minmax&layers=' + l.urlName + '&bbox=-180,-90,180,90&elevation=' + (l.selectedElevation || -1) + '&time='+ new Date(l.selectedDateTime).toISOString() + '&crs=' + gisportal.lonlat.projCode + '&srs=' + gisportal.lonlat.projCode + '&width=50&height=50&request=GetMetadata') , null, function(d) {
      gisportal.scalebars.validateScale(id, d.min, d.max);
   }, null, 'json', {});    
}

gisportal.scalebars.resetScale = function(id)  {
   min = gisportal.layers[id].origMinScaleVal;
   max = gisportal.layers[id].origMaxScaleVal;
   gisportal.scalebars.validateScale(id, min, max);
};

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
