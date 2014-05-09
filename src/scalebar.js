gisportal.scalebars = {};

gisportal.scalebars.createGetLegendURL = function(layer, hasBase)  {
   if (hasBase)
      return '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
   else
      return layer.wmsURL + 'REQUEST=GetLegendGraphic&LAYER=' + layer.urlName + '&COLORSCALERANGE=' + layer.minScaleVal + ',' + layer.maxScaleVal + '&logscale=' + layer.log;
};
