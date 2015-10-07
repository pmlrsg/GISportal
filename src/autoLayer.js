gisportal.autoLayer = {};

// This function decides either to load a single layer or to refine the panel to show a list of matching layers
gisportal.autoLayer.loadGivenLayer = function(){
   given_wms_url = gisportal.utils.getURLParameter('wms_url');
   if(given_wms_url){
      given_wms_url = given_wms_url.split("?")[0];
   }
   given_url_name = gisportal.utils.getURLParameter('url_name');

   // This passes the variables given in the URL to the getLayers function to get the matching layer(s)
   gisportal.given_layers = gisportal.autoLayer.getLayers(given_wms_url, given_url_name);

   // If there is a single layer, then it is loaded.
   if(_.size(gisportal.given_layers) == 1){
      try{
         gisportal.refinePanel.layerFound(_.values(gisportal.given_layers)[0].id);
      }
      catch(e){
         gisportal.gritter.showNotification('layerLoadError', {'layer': given_layers[0].id, 'e' : e});
      }
   }else if(_.size(gisportal.given_layers) > 1){
      // If there are more than one layers then it adds them to the panel.
      gisportal.configurePanel.resetPanel(gisportal.given_layers);
   }else{
      // Otherwise, an informative message is logged.
      gisportal.gritter.showNotification('noMatchingLayersError', null);
   }
   

};



gisportal.events.bind("layers-loaded", function() {
   if(gisportal.templatesLoaded){
      gisportal.autoLayer.loadGivenLayer();
   }
 });

gisportal.events.bind("templates-loaded", function() {
   if(gisportal.layersLoaded){
      gisportal.autoLayer.loadGivenLayer();
   }
 });

// This returns the layer or layers that the user has selected in the url
gisportal.autoLayer.getLayers = function(given_wms_url, given_url_name){
   var matching_layers = {};
   var only_matching_layer; // Different object for the 'chosen one' as you cannot break a lodash loop.

   _.forIn(gisportal.layers, function( layer ){
      if(layer.wmsURL.split("?")[0] == given_wms_url && layer.urlName == given_url_name){
         only_matching_layer = {};
         only_matching_layer[layer.id] = layer;
      }else if(layer.wmsURL.split("?")[0] == given_wms_url || layer.urlName == given_url_name){
         matching_layers[layer.id] = layer;
      }
   });
   return only_matching_layer || matching_layers; // If there is a 'chosen one' it returns it, if not it returns the list of other matching ones.
}