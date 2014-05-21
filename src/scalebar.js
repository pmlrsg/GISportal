gisportal.scalebars = {};

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
         
      return {
         url: url,
         width: width,
         height: height
      }; 
   }
};

gisportal.scalebars.createGetLegendURL = function(layer, hasBase)  {
   if (hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=1&HEIGHT=25';
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log + '&colorbaronly=true&WIDTH=1&HEIGHT=25';
};
