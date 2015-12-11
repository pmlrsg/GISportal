gisportal.editLayersForm = {};
gisportal.editLayersForm.server_list = [];

/**
* This function populates server_list with a unique list of servers from the layers (not user defined)
* it then add the form to display the server list and links to the form for editing data
* 
* @method
*/
gisportal.editLayersForm.produceServerList = function(){
   var layers_obj = {}
   if(_.size(gisportal.original_layers) > 0){
      var layers_obj = gisportal.original_layers;
   }else{
      var layers_obj = gisportal.layers;
   }
   for(layer in layers_obj){
      var contactInfo;
      var provider;
      var serverName
      serverName = layers_obj[layer].serverName;
      provider = layers_obj[layer].providerTag;
      contactInfo = layers_obj[layer].contactInfo;
      wms_url = layers_obj[layer].wmsURL;
      if(provider == "UserDefinedLayer"){
         continue;
      }
      var server_info = {
         "serverName":serverName,
         "contactInfo":contactInfo,
         "provider":provider,
         "wms_url":wms_url,
         "layers":[]
      };
      var layer_info = {
         "id":layer,
         "title":layers_obj[layer].name
      };
      var unique = true;
      for(i in gisportal.editLayersForm.server_list){
         if(gisportal.editLayersForm.server_list[i].serverName == server_info.serverName){
            gisportal.editLayersForm.server_list[i]['layers'].push(layer_info);
            unique = false;
            break;
         }
      }
      if(unique){
         server_info.layers.push(layer_info);
         gisportal.editLayersForm.server_list.push(server_info);
      }
   }
   $( '.js-edit-layers-popup' ).toggleClass('hidden', false);
   var template = gisportal.templates['edit-layers-table'](gisportal.editLayersForm.server_list);
   $( '.js-edit-layers-html' ).html(template);

   $('span.js-edit-layers-close').on('click', function() {
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
   });

   $('span.show-server-layers').on('click', function() {
      var server_layers_selector = 'tr.server-layers[data-server="' + $(this).data('server') + '"]'
      if($(server_layers_selector).hasClass('hidden')){
         $(server_layers_selector).toggleClass('hidden', false);
         $(this).toggleClass('icon-arrow-move-up', true);
         $(this).toggleClass('icon-arrow-move-down', false);
         $(this).attr('title', "Hide Layers")
      }else{
         $(server_layers_selector).toggleClass('hidden', true);
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
               // Each of the user defined layers are added to the layers_list variable
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

   $('span.js-delete-server').one('click', function(){
      var server = $(this).data("server");
      $.ajax({
         url:  '/service/remove_server_cache?filename=' + server,
         success: function(server){
            gisportal.editLayersForm.deleteSuccess(server);
         },
         error: function(){
            console.log("Failed to be deleted")
         }
      });
   })

   $('span.js-update-server').on('click', function(){
      var this_span = $(this);
      $(this).toggleClass('green-spin', true);
      var url = $(this).data("wms");
      var clean_url = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], url);
      // The timeout is measured to see if the cache can be refreshed.
      $.ajax({
         url:  'cache/global_cache/'+clean_url+".json?_="+ new Date().getMilliseconds(),
         dataType: 'json',
         success: function(global_data){
            if(!global_data.timeStamp || (+new Date() - +new Date(global_data.timeStamp))/60000 > gisportal.config.cacheTimeout){
               var url = global_data.wmsURL.replace("?", "");
               refresh_url = '/service/load_new_wms_layer?url='+url+'&refresh=true';
               $.ajax({
                  url:  refresh_url,
                  dataType: 'json',
                  success: function(new_global_data){
                     gisportal.editLayersForm.refreshOldData(new_global_data, this_span);
                  },
                  error: function(e){
                     console.log("Error refreshing cache.");
                     this_span.toggleClass('green-spin', false);
                  }
               });
            }else{
               gisportal.editLayersForm.refreshOldData(global_data);
            }
         },
         error: function(e){
            this_span.toggleClass('green-spin', false);
            console.log("Error getting timestamp");
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
      try{
         delete gisportal.original_layers[ids_to_remove[i]];
      }catch(e){};
      try{
         delete gisportal.layers[ids_to_remove[i]];
      }catch(e){};     
   }
   // loadLayers() is run so that gisportal.layers is refreshed and will not include the deleted layers.
   gisportal.loadLayers();
   gisportal.editLayersForm.server_list = [];
   gisportal.editLayersForm.produceServerList();
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
   console.lo

   var clean_url = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], url);
   $.ajax({
      url:  'cache/user_cache/'+clean_url+".json?_="+ new Date().getMilliseconds(),
      dataType: 'json',
      success: function(user_data){
         var missing_layers = [];
         var new_layers = [];
         for(server_name in user_data['server']){
            var server = server_name;
         }
         for(user_layer in user_data['server'][server]){
            var found = false;
            for(new_layer in new_data['server'][server]){
               if(user_data['server'][server][user_layer]['Name'] == new_data['server'][server][new_layer]['Name']){
                  new_data['server'][server][new_layer]['Abstract'] = user_data['server'][server][user_layer]['Abstract'];
                  new_data['server'][server][new_layer]['Title'] = user_data['server'][server][user_layer]['Title'];
                  new_data['server'][server][new_layer]['tags'] = user_data['server'][server][user_layer]['tags'];
                  new_data['server'][server][new_layer]['LegendSettings'] = user_data['server'][server][user_layer]['LegendSettings'];
                  found = true;
               }else if(new_layers.indexOf(new_data['server'][server][new_layer]['Name']) == -1){
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
            if(!found){
               missing_layers.push(user_data['server'][server][user_layer]['Name']);
            }
         }
         new_data['options'] = user_data['options'];
         console.log(new_data);
         $.ajax({
            method: 'post',
            url: '/service/update_layer',
            data:{'data': JSON.stringify(new_data)},
            success: function(){
               console.log("Sucess!!!!");
               console.log("Added Layers");
               console.log(new_layers);
               console.log("Missing Layers");
               console.log(missing_layers);
               gisportal.original_layers = {};
               gisportal.layers = {};
               // loadLayers() is run so that gisportal.layers is refreshed and will include the changed layers.
               gisportal.refresh_server = true;
               gisportal.loadLayers();
               gisportal.editLayersForm.server_list = [];
               gisportal.loading.increment()
            }, error: function(){
               span.toggleClass('green-spin', false);
               console.log("ERROR!");
            }
         });
         
      },
      error: function(e){
         span.toggleClass('green-spin', false);
         console.log("Error getting internal info");
      }
   });
}