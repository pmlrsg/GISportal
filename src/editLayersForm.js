gisportal.editLayersForm = {};
gisportal.editLayersForm.server_list = [];

/**
* This function populates server_list with a unique list of servers from the layers (not user defined)
* it then adds the form to display the server list and buttons to edit, delete and refresh the data.
* 
* @method
*/
gisportal.editLayersForm.produceServerList = function(){
   gisportal.editLayersForm.server_list = [];
   var layers_obj = {}
   if(_.size(gisportal.original_layers) > 0){
      var layers_obj = gisportal.original_layers;
   }else{
      var layers_obj = gisportal.layers;
   }
   //for each of the layers in the list.
   for(layer in layers_obj){
      var contactInfo;
      var provider;
      var serverName
      serverName = layers_obj[layer].serverName;
      provider = layers_obj[layer].providerTag;
      timeStamp = layers_obj[layer].timeStamp;
      wms_url = layers_obj[layer].wmsURL;
      if(provider == "UserDefinedLayer"){
         continue; // Don't include any layers that are external.
      }
      // Gets the server information from the layer
      var server_info = {
         "serverName":serverName,
         "timeStamp":timeStamp,
         "provider":provider,
         "wms_url":wms_url,
         "layers":[]
      };
      // Getst the unique layer information.
      var layer_info = {
         "id":layer,
         "title":layers_obj[layer].name
      };
      var unique = true;
      // If the server has already been added the layer is added to it
      for(i in gisportal.editLayersForm.server_list){
         if(gisportal.editLayersForm.server_list[i].serverName == server_info.serverName){
            gisportal.editLayersForm.server_list[i]['layers'].push(layer_info);
            unique = false;
            break;
         }
      }
      // If the server has not yet been added, the layer and server are both added to the list.
      if(unique){
         server_info.layers.push(layer_info);
         gisportal.editLayersForm.server_list.push(server_info);
      }
   }
   // The server list is shown using the list previously created.
   $( '.js-edit-layers-popup' ).toggleClass('hidden', false);
   var template = gisportal.templates['edit-layers-table'](gisportal.editLayersForm.server_list);
   $( '.js-edit-layers-html' ).html(template);

   // Listener added to the close button.
   $('span.js-edit-layers-close').on('click', function() {
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
   });

   // This shows or hides the list of laers relating to the server.
   $('span.show-server-layers').on('click', function() {
      var server_layers_selector = 'tr.server-layers[data-server="' + $(this).data('server') + '"]'
      if($(server_layers_selector).hasClass('hidden')){
         $(server_layers_selector).toggleClass('hidden', false);
         // The icon is changed to represent hiding the layers.
         $(this).toggleClass('icon-arrow-move-up', true);
         $(this).toggleClass('icon-arrow-move-down', false);
         $(this).attr('title', "Hide Layers")
      }else{
         $(server_layers_selector).toggleClass('hidden', true);
         // The icon is changed to represent showing the layers.
         $(this).toggleClass('icon-arrow-move-up', false);
         $(this).toggleClass('icon-arrow-move-down', true);
         $(this).attr('title', "Show Layers")
      }

   });

   // Listener is added to the edit server buttons
   $('span.js-edit-server-layers').on('click', function() {
      var single_layer;
      gisportal.addLayersForm.layers_list = {};
      gisportal.addLayersForm.server_info = {};
      gisportal.addLayersForm.form_info = {};
      for(i in gisportal.editLayersForm.server_list){
         if(gisportal.editLayersForm.server_list[i].serverName == $(this).data("server")){
            for(layer in gisportal.editLayersForm.server_list[i]['layers']){
               var id = gisportal.editLayersForm.server_list[i]['layers'][layer].id
               this_layer = gisportal.layers[id] || gisportal.original_layers[id];
               single_layer = this_layer
               // Each of the server layers are added to the layers_list variable
               gisportal.addLayersForm.addlayerToList(this_layer)
            }
         }
      }
      gisportal.addLayersForm.validation_errors = {};
      // The form is then loaded (loading the first layer)
      gisportal.addLayersForm.addLayersForm(_.size(gisportal.addLayersForm.layers_list), single_layer, 1, 'div.js-layer-form-html', 'div.js-server-form-html')
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
   });

   // Deletes the server from the portal.
   $('span.js-delete-server').one('click', function(){
      var this_span = $(this);
      var server = $(this).data("server");
      $.ajax({
         url:  '/service/remove_server_cache?filename=' + server,
         success: function(server){
            gisportal.editLayersForm.deleteSuccess(server);
         },
         error: function(){
            this_span.notify("Deletion Fail", {position:"left", className:"error"});
         }
      });
   })

   // Refreshes the server information.
   $('span.js-update-server').on('click', function(){
      var this_span = $(this);
      $(this).toggleClass('green-spin', true);
      var url = $(this).data("wms");
      var clean_url = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], url);
      // The timeout is measured to see if the cache can be refreshed.
      $.ajax({
         url:  'cache/temporary_cache/'+clean_url+".json?_="+ new Date().getMilliseconds(),
         dataType: 'json',
         success: function(global_data){
            if(!global_data.timeStamp || (+new Date() - +new Date(global_data.timeStamp))/60000 > gisportal.config.cacheTimeout){
               // Add a notify so the user can choose to refresh the cache.
               this_span.notify({'title':"Would you like to refresh the cache?", "yes-text":"Yes", "no-text":"No"},{style:"option", autoHide:false, clickToHide: false});
                //listen for click events from this style
               $(document).one('click', '.notifyjs-option-base .no', function() {
                  gisportal.editLayersForm.refreshOldData(global_data);
                  //programmatically trigger propogating hide event
                  $(this).trigger('notify-hide');
               });
               $(document).one('click', '.notifyjs-option-base .yes', function() {
                  var url = global_data.wmsURL.replace("?", "");
                  refresh_url = '/service/load_new_wms_layer?url='+url+'&refresh=true';
                  $.ajax({
                     url:  refresh_url,
                     dataType: 'json',
                     success: function(new_global_data){
                        gisportal.editLayersForm.refreshOldData(new_global_data, this_span);
                     },
                     error: function(e){
                        this_span.toggleClass('green-spin', false);
                        this_span.notify("Refresh Failed", {position:"left", className:"error"});
                     }
                  });
                  //hide notification
                  $(this).trigger('notify-hide');
               });
               
            }else{
               gisportal.editLayersForm.refreshOldData(global_data);
            }
         },
         error: function(e){
            this_span.toggleClass('green-spin', false);
            this_span.notify("Could not find cache file", {position:"left", className:"error"});
         }
      });

      
   })
};

gisportal.editLayersForm.deleteSuccess = function(server){
   if(_.size(gisportal.original_layers) > 0){
      var layers_obj = gisportal.original_layers;
   }else{
      var layers_obj = gisportal.layers;
   }
   // A list is made of all of the ids to be removed from the portal.
   var ids_to_remove = [];
   for(i in layers_obj){
      if(layers_obj[i].serverName == server){
         ids_to_remove.push(i);
      }
   }
   // Each of those Ids is then removed from both layers and original layers.
   for(i in ids_to_remove){
      var id = ids_to_remove[i]
      if(gisportal.selectedLayers.indexOf(id) > -1){
         gisportal.indicatorsPanel.removeFromPanel(id);
      }
      try{
         delete gisportal.original_layers[id];
      }catch(e){};
      try{
         delete gisportal.layers[id];
      }catch(e){};     
   }
   gisportal.editLayersForm.server_list = [];
   gisportal.editLayersForm.produceServerList();
   gisportal.layers = {};
   // loadLayers() is run so that gisportal.layers is refreshed and will not include the deleted layers.
   gisportal.loadLayers();
}

/**
* This function takes the cached data and inputs the data from the current user cache file.
* it then alerts the user of any layer differences.
* 
* @method
* 
* @param Object new_data - The new data that is in the gloal cache.
* @param jQuery Object span - The selector of the refresh span button.
*/
gisportal.editLayersForm.refreshOldData = function(new_data, span){
   var url = new_data.wmsURL;

   var clean_url = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], url);
   $.ajax({
      url:  'cache/user_cache/'+clean_url+".json?_="+ new Date().getMilliseconds(), // The user cache is the retrieved to be compared with the new data.
      dataType: 'json',
      success: function(user_data){
         // Lists for storing diffences.
         var missing_layers = [];
         var new_layers = [];
         // The server name is retrieved from the list.
         for(server_name in user_data['server']){
            var server = server_name;
         }
         // For each of the layers in the user data. 
         for(user_layer in user_data['server'][server]){
            var found = false;
            // Loop through the new data and update the information of the matching layer.
            for(new_layer in new_data['server'][server]){
               if(user_data['server'][server][user_layer]['Name'] == new_data['server'][server][new_layer]['Name']){
                  new_data['server'][server][new_layer]['Abstract'] = user_data['server'][server][user_layer]['Abstract'];
                  new_data['server'][server][new_layer]['Title'] = user_data['server'][server][user_layer]['Title'];
                  new_data['server'][server][new_layer]['tags'] = user_data['server'][server][user_layer]['tags'];
                  new_data['server'][server][new_layer]['LegendSettings'] = user_data['server'][server][user_layer]['LegendSettings'];
                  found = true;
               }else if(new_layers.indexOf(new_data['server'][server][new_layer]['Name']) == -1){
                  // for layers that don't match, loop back through the user data to check that there are no layers that are new to the server.
                  var missing = true;
                  for(second_user_layer in user_data['server'][server]){
                     if(user_data['server'][server][second_user_layer]['Name'] == new_data['server'][server][new_layer]['Name']){
                        missing = false;
                     }
                  }
                  if(missing){
                     new_layers.push(new_data['server'][server][new_layer]['Name']);
                  }
               }
            }
            // If the layer was not found in the new data it is added to the missing layers list.
            if(!found){
               missing_layers.push(user_data['server'][server][user_layer]['Name']);
            }
         }
         // The new data options is updated so that it contains the correct provider (not 'UserDefinedLayer') and contact info.
         new_data['options'] = user_data['options'];
         new_data['contactInfo'] = user_data['contactInfo'];
         // The data is sent off to the middleware to relace the old user cahce file.
         $.ajax({
            method: 'post',
            url: '/service/update_layer',
            data:{'data': JSON.stringify(new_data)},
            success: function(){
               gisportal.original_layers = {};
               gisportal.layers = {};
               // loadLayers() is run so that gisportal.layers is refreshed and will include the changed layers.
               gisportal.refresh_server = true;
               gisportal.loadLayers();
               gisportal.editLayersForm.server_list = [];
               gisportal.loading.increment()
            }, error: function(){
               span.toggleClass('green-spin', false);
               span.notify("ERROR!", {position:"left", className:"error"});
            }
         });
         
      },
      error: function(e){
         span.toggleClass('green-spin', false);
         span.notify("Could not get internal info", {position:"left", className:"error"});
      }
   });
}
