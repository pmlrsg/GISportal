gisportal.autoLayer = {};

// Gets the value of a url parameter
gisportal.autoLayer.url_get = function(param){
   
   var sPageURL=decodeURIComponent(window.location.search.substring(1)),
      sURLVariables=sPageURL.split('&'),
      sParameterName,
      i;

   for (i=0; i < sURLVariables.length; i++) {
      sParameterName=sURLVariables[i].split('=');

      if (sParameterName.length >= 0 &&sParameterName[0] === param){
         return sParameterName[1] === undefined ? true : sParameterName[1];
      }
   }
};

// This function decides either to load a single layer or to refine the panel to show a list of matching layers
gisportal.autoLayer.loadGivenLayer = function(){
   given_wms_url = gisportal.autoLayer.url_get('wms_url');
   if(given_wms_url){
      given_wms_url = given_wms_url.split("?")[0];
   }
   given_url_name = gisportal.autoLayer.url_get('url_name');

   // This passes the variables given in the URL to the getLayers function to get the matching layer(s)
   gisportal.given_layers = gisportal.autoLayer.getLayers(given_wms_url, given_url_name);

   // If there is a single layer, then it is loaded.
   if(_.size(gisportal.given_layers) == 1){
      try{
         gisportal.refinePanel.layerFound(_.values(gisportal.given_layers)[0].id);
      }
      catch(e){
         console.log("There was an error adding the layer with ID " + given_layers[0].id + " : " + e);
      }
   }else if(_.size(gisportal.given_layers) > 1){
      // If there are more than one layers then it adds them to the panel.
      gisportal.configurePanel.resetPanel(gisportal.given_layers);
   }else{
      // Otherwise, an informative message is logged.
      console.log("Unfortunately no matching layers were found, please check the parameters that you gave are correct.");
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