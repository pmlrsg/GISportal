gisportal.autoLayer = {};
gisportal.autoLayer.TriedToAddLayer = false;
gisportal.autoLayer.viewLoaded = false;

// This function decides either to load a single layer or to refine the panel to show a list of matching layers
gisportal.autoLayer.loadGivenLayer = function(){
   if(gisportal.utils.getURLParameter('walkthrough_tutorial') && !gisportal.walkthrough.loaded_from_url){
      gisportal.walkthrough.loadWalkthrough(walkthrough_data.name, walkthrough_data.owner);
      gisportal.walkthrough.loaded_from_url = true;
      return;
   }
   if(gisportal.utils.getURLParameter('walkthrough_test') && !gisportal.walkthrough.loaded_from_url){
      gisportal.walkthrough.loadWalkthroughData(walkthrough_data);
      gisportal.walkthrough.loaded_from_url = true;
      return;
   }
   if(gisportal.utils.getURLParameter('walkthrough_name') && gisportal.utils.getURLParameter('walkthrough_owner')){
      gisportal.walkthrough.loadWalkthrough(gisportal.utils.getURLParameter('walkthrough_name'), gisportal.utils.getURLParameter('walkthrough_owner'));
      gisportal.walkthrough.loaded_from_url = true;
      return;
   }
   if(gisportal.utils.getURLParameter('view') && !gisportal.autoLayer.viewLoaded){
      gisportal.autoLayer.viewLoaded = true;
      gisportal.view.loadView(gisportal.utils.getURLParameter('view'));
      return;
   }
   // If there is a view other layers will not be loaded
   if(gisportal.current_view){
      return;
   }
   gisportal.autoLayer.urlLoad = false; // If the wms information is being loaded from the URL (first time) or the text box.
   var given_wms_url = gisportal.autoLayer.given_wms_url || gisportal.utils.getURLParameter('wms_url');
   if(!gisportal.autoLayer.given_wms_url && gisportal.utils.getURLParameter('wms_url')){
      gisportal.autoLayer.urlLoad = true;
   }
   if(given_wms_url && given_wms_url.length > 0){
      given_wms_url = given_wms_url.split("?")[0];
   }
   var given_url_name = gisportal.utils.getURLParameter('url_name');
   gisportal.autoLayer.refresh_cache = gisportal.autoLayer.refresh_cache || gisportal.utils.getURLParameter('refresh_cache');
   var given_cache_refresh = gisportal.autoLayer.refresh_cache || "false";

   if((given_wms_url &&given_wms_url.length > 0) ||(given_url_name && given_url_name.length > 0)){
      // This passes the variables given in the URL to the getLayers function to get the matching layer(s)
      gisportal.given_layers = gisportal.autoLayer.getLayers(given_wms_url, given_url_name);

      // If there is a single layer, then it is loaded.
      if(_.size(gisportal.given_layers) >= 1){
         try{
            gisportal.configurePanel.resetPanel(gisportal.given_layers);
            gisportal.view.removeView(false);
         }
         catch(e){
            $.notify("Sorry:\nThere was an error loading " + given_layers[0].id + " : " + e, "error");
         }
         return;
      }else{
         if(given_wms_url && given_wms_url.length > 0){
            gisportal.autoLayer.findGivenLayer(given_wms_url, given_cache_refresh);
         }else{
            $.notify("Sorry:\nThere are no layers with the tag: " + given_url_name + ".", "error");
         }
      }
   }
};



gisportal.events.bind("available-layers-loaded", function() {
   if(gisportal.templatesLoaded){
      gisportal.autoLayer.loadGivenLayer();
      gisportal.autoLayer.loadPreviousLayers();
   }
   // This refreshes the server list table when the user refreshes a server
   if(gisportal.refresh_server){
      gisportal.refresh_server = false;
      gisportal.editLayersForm.produceServerList();
      gisportal.loading.decrement();
   }
 });

gisportal.events.bind("templates-loaded", function() {
   if(gisportal.layersLoaded){
      gisportal.autoLayer.loadGivenLayer();
      gisportal.autoLayer.loadPreviousLayers();
   }
 });

// This returns the layer or layers that match the URL
gisportal.autoLayer.getLayers = function(given_wms_url, given_url_name){
   var matching_layers = {};
   var only_matching_layer; // Different object for the 'chosen one' as you cannot break a lodash loop.

   _.forIn(gisportal.layers, function( layer ){ // Goes through each of the layers
      if(layer.serviceType!=="WFS"){ // Not vector layers
         var username = gisportal.user.info.email; // The logged in user
         var permission = gisportal.user.info.permission; // The permission of the user
         if(layer.owner == username || permission == 'guest' || gisportal.autoLayer.urlLoad){ // This makes sure that the layers currently in the portal are only loaded when they should be
            if((layer.wmsURL.split("?")[0] == given_wms_url && layer.urlName == given_url_name)){
               only_matching_layer = {};
               only_matching_layer[layer.id] = layer;
            }else if((layer.wmsURL.split("?")[0] == given_wms_url || layer.urlName == given_url_name)){
               matching_layers[layer.id] = layer;
            }
         }
      }
      
   });
   return only_matching_layer || matching_layers; // If there is a 'chosen one' it returns it, if not it returns the list of other matching ones.
};

// This returns the layer or layers that the user has selected with the WMS url
gisportal.autoLayer.findGivenLayer = function(wms_url, given_cache_refresh){
   if(!gisportal.autoLayer.TriedToAddLayer){
      $.notify("Finding Layers\nWe are trying to load layers from the URL you have provided.");
      gisportal.autoLayer.TriedToAddLayer = true;

      clean_file = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], wms_url);
      clean_url = gisportal.middlewarePath + '/settings/load_new_wms_layer?url='+wms_url+'&refresh='+given_cache_refresh;
      if(given_cache_refresh == "false"){
         request_url = gisportal.middlewarePath + "/cache/" + gisportal.niceDomainName + "/temporary_cache/"+clean_file+".json";
      }else{
         request_url = clean_url;
      }
      // If the information is already available then it will be loaded from the file instead of the middleware doing so.
      gisportal.loading.increment();
      $.ajax({
         url:  request_url,
         dataType: 'text',
         success: function(layer){
            gisportal.loading.decrement();
            $('.notifyjs-gisportal-info span:contains("Finding Layers")').closest('.notifyjs-wrapper').remove();
            gisportal.autoLayer.addGivenLayer(layer);
         },
         error: function(e){
            if(given_cache_refresh == "false" && e.status == 404){
               $.ajax({
                  url:  clean_url,
                  dataType: 'text',
                  success: function(layer){
                     gisportal.loading.decrement();
                     gisportal.autoLayer.addGivenLayer(layer);
                  },
                  error: function(e){
                     gisportal.loading.decrement();
                     $.notify("Sorry\nThere was an unexpected error thrown by the server: " + e.statusText, "error");
                     gisportal.addLayersForm.form_info = {};
                     gisportal.addLayersForm.refreshStorageInfo();
                  }
               });
            }
            else{
               gisportal.loading.decrement();
               $.notify("Sorry\nThere was an unexpected error thrown by the server: " + e.statusText, "error");
               gisportal.addLayersForm.form_info = {};
               gisportal.addLayersForm.refreshStorageInfo();
            }
         }
      });
   }
};

// This adds the layer(s) that has/have been retrieved by the middleware. It then runs the loadGivenLayer function once again to either load that layer or list the layers found
gisportal.autoLayer.addGivenLayer = function(layer){
   json_layer = JSON.parse(layer);
   if (json_layer.Error !== undefined){
      $.notify("Sorry\nThere was an unexpected error thrown by the server: " + json_layer.Error, "error");
   }else{
      json_layer.owner = gisportal.user.info.email;
      gisportal.initWMSlayers([json_layer]);
   }
};

// This function loads the WMS url that was previously selected, along with any information that the user added or changed in the form.
gisportal.autoLayer.loadPreviousLayers = function(){
   gisportal.addLayersForm.layers_list = JSON.parse(gisportal.storage.get("layers_list")) || {};
   gisportal.addLayersForm.server_info = JSON.parse(gisportal.storage.get("server_info")) || {};
   gisportal.addLayersForm.form_info = JSON.parse(gisportal.storage.get("form_info")) || {};
   if(gisportal.addLayersForm.form_info.wms_url){

      gisportal.autoLayer.given_wms_url = gisportal.addLayersForm.form_info.wms_url;
      gisportal.autoLayer.loadGivenLayer();
   }
   if(gisportal.addLayersForm.form_info.display_form && gisportal.user.info.permission != "guest"){
      gisportal.addLayersForm.addLayersForm(_.size(gisportal.addLayersForm.layers_list), gisportal.addLayersForm.layers_list["1"] , gisportal.addLayersForm.form_info.current_page, 'div.js-layer-form-html', 'div.js-server-form-html', gisportal.addLayersForm.server_info.owner);
   }
};
