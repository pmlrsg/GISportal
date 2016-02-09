gisportal.editLayersForm = {};
gisportal.editLayersForm.server_list = [];


gisportal.editLayersForm.addSeverTable = function(){
   // loadLayers() is run so that gisportal.layers is refreshed and will include any changed layers.
   gisportal.refresh_server = true;
   gisportal.loadLayers();
   gisportal.editLayersForm.server_list = [];
   gisportal.loading.increment();
};

/**
* This function populates server_list with a unique list of servers from the layers (not user defined)
* it then adds the form to display the server list and buttons to edit, delete and refresh the data.
* 
* @method
*/
gisportal.editLayersForm.produceServerList = function(){
   gisportal.editLayersForm.server_list = [];
   var layers_obj = {};
   if(_.size(gisportal.original_layers) > 0){
      layers_obj = gisportal.original_layers;
   }else{
      layers_obj = gisportal.layers;
   }
   $.extend(layers_obj, gisportal.not_included_layers);
   var data;
   //for each of the layers in the list.
   for(var layer in layers_obj){
      var this_layer = layers_obj[layer];
      if((gisportal.user.info.permission != "admin" && this_layer.owner != gisportal.user.info.email) || this_layer.serviceType =="WFS"){
         continue;
      }
      var contactInfo;
      var provider;
      var serverName;
      serverName = this_layer.serverName;
      provider = this_layer.tags.data_provider || this_layer.providerTag;
      timeStamp = this_layer.timeStamp;
      wms_url = this_layer.wmsURL;
      owner = this_layer.owner;
      // Gets the server information from the layer
      var server_info = {
         "serverName":serverName,
         "timeStamp":timeStamp,
         "provider":provider,
         "wms_url":wms_url,
         "owner":owner,
         "includedLayers":[],
         "excludedLayers":[]
      };
      // Gets the unique layer information.
      var layer_info = {
         "id":layer,
         "include":this_layer.include,
         "title":this_layer.name
      };
      var unique = true;
      // If the server has already been added the layer is added to it
      for(var i in gisportal.editLayersForm.server_list){
         if(gisportal.editLayersForm.server_list[i].serverName == server_info.serverName && gisportal.editLayersForm.server_list[i].owner == server_info.owner){
            if(layer_info.include){
               gisportal.editLayersForm.server_list[i].includedLayers.push(layer_info);
            }else{
               gisportal.editLayersForm.server_list[i].excludedLayers.push(layer_info);
            }
            unique = false;
            break;
         }
      }
      // If the server has not yet been added, the layer and server are both added to the list.
      if(unique){
         if(layer_info.include){
            server_info.includedLayers.push(layer_info);
         }else{
            server_info.excludedLayers.push(layer_info);
         }
         gisportal.editLayersForm.server_list.push(server_info);
      }
      var admin = false;
      if(gisportal.user.info.permission == "admin") admin = true;
      data = {
         "server_list": gisportal.editLayersForm.server_list,
         "admin": admin
      };
   }
   // The server list is shown using the list previously created.
   $( '.js-edit-layers-popup' ).toggleClass('hidden', false);
   var template = gisportal.templates['edit-layers-table'](data);
   $( '.js-edit-layers-html' ).html(template);

   gisportal.editLayersForm.addListeners();
   
};

gisportal.editLayersForm.addListeners = function(){
   // Listener added to the close button.
   $('span.js-edit-layers-close').on('click', function() {
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
      if(gisportal.addLayersForm.form_info.wms_url){
         gisportal.autoLayer.TriedToAddLayer = false;
         gisportal.autoLayer.loadGivenLayer();
         gisportal.panels.showPanel('choose-indicator');
      }
   });

   // This shows or hides the list of laers relating to the server.
   $('span.show-server-layers').on('click', function() {
      var server_layers_selector = 'tr.server-layers[data-server="' + $(this).data('server') + '"]';
      if($(server_layers_selector).hasClass('hidden')){
         $(server_layers_selector).toggleClass('hidden', false);
         // The icon is changed to represent hiding the layers.
         $(this).toggleClass('icon-arrow-move-up', true);
         $(this).toggleClass('icon-arrow-move-down', false);
         $(this).attr('title', "Hide Layers");
      }else{
         $(server_layers_selector).toggleClass('hidden', true);
         // The icon is changed to represent showing the layers.
         $(this).toggleClass('icon-arrow-move-up', false);
         $(this).toggleClass('icon-arrow-move-down', true);
         $(this).attr('title', "Show Layers");
      }

   });

   // Listener is added to the edit server buttons
   $('span.js-edit-server-layers').on('click', function() {
      var single_layer;
      gisportal.addLayersForm.layers_list = {};
      gisportal.addLayersForm.server_info = {};
      gisportal.addLayersForm.form_info = {};
      for(var i in gisportal.editLayersForm.server_list){
         if(gisportal.editLayersForm.server_list[i].serverName == $(this).data("server")){
            var layer, id;
            for(layer in gisportal.editLayersForm.server_list[i].includedLayers){
               id = gisportal.editLayersForm.server_list[i].includedLayers[layer].id;
               this_layer = gisportal.layers[id] || gisportal.original_layers[id];
               single_layer = this_layer;
               // Each of the server layers are added to the layers_list variable
               gisportal.addLayersForm.addlayerToList(this_layer);
            }
            for(layer in gisportal.editLayersForm.server_list[i].excludedLayers){
               id = gisportal.editLayersForm.server_list[i].excludedLayers[layer].id;
               this_layer = gisportal.not_included_layers[id];
               if(!single_layer){
                  single_layer = this_layer;
               }
               // Each of the excluded server layers are added to the layers_list variable
               gisportal.addLayersForm.addlayerToList(this_layer);
            }
         }
      }
      gisportal.addLayersForm.validation_errors = {};
      // The form is then loaded (loading the first layer)

      gisportal.addLayersForm.addLayersForm(_.size(gisportal.addLayersForm.layers_list), single_layer, 1, 'div.js-layer-form-html', 'div.js-server-form-html', $(this).data('user'));
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
   });
   // Deletes the server from the portal.
   $('span.js-delete-server').on('click', function(){
      var this_span = $(this);
      if(!this_span.is(".working")){
         this_span.notify({'title':"Are you sure you want to delete this server?", "yes-text":"Yes", "no-text":"No"},{style:"gisportal-delete-option", autoHide:false, clickToHide: false});
          //listen for click events from this style
         $(document).one('click', '.notifyjs-gisportal-delete-option-base .no', function() {
            this_span.toggleClass("working", false);
            //hide notification
            $(this).trigger('notify-hide');
         });
         $(document).one('click', '.notifyjs-gisportal-delete-option-base .yes', function() {
            this_span.toggleClass("working", true);
            var server = this_span.data("server");
            var user = this_span.data("user");
            $.ajax({
               url:  gisportal.middlewarePath + '/settings/remove_server_cache?filename=' + server + '&owner=' + user,
               success: function(removed_data){
                  this_span.toggleClass("working", false);
                  var to_be_deleted = [];
                  for(var index in gisportal.selectedLayers){
                     var layer = gisportal.layers[gisportal.selectedLayers[index]];
                     if(this_span.data('server') == layer.serverName && this_span.data('user') == layer.owner){
                        to_be_deleted.push(gisportal.selectedLayers[index]);
                     }
                  }
                  for(var id in to_be_deleted){
                     gisportal.indicatorsPanel.removeFromPanel(to_be_deleted[id]);
                  }
                  // Think it is safe to take this out but it is there just in case.
                  // If layers misbehave after being deleted then this might be a place to look first:
                  // gisportal.loadLayers();
                  this_span.closest("tr").next().toggleClass("hidden", true);
                  this_span.closest("tr").toggleClass("hidden", true);
                  $(document).off('click', '.notifyjs-gisportal-restore-option-base .no');
                  $(document).off('click', '.notifyjs-gisportal-restore-option-base .yes');
                  $('.notifyjs-gisportal-restore-option-base').closest("div.notifyjs-wrapper").remove();
                  $.notify({'title':"Would you like to undo this delete ?", "yes-text":"Yes", "no-text":"No"},{style:"gisportal-restore-option",  autoHide:false, clickToHide: false});
                  $(document).one('click', '.notifyjs-gisportal-restore-option-base .no', function() {
                     $(this).trigger('notify-hide');
                  });
                  $(document).one('click', '.notifyjs-gisportal-restore-option-base .yes', function() {
                     $.ajax({
                        method: 'post',
                        url:  gisportal.middlewarePath + '/settings/restore_server_cache',
                        data: JSON.parse(removed_data),
                        success: function(){
                           this_span.closest("tr").toggleClass("hidden", false);
                        }
                     });
                     //hide notification
                     $(this).trigger('notify-hide');
                  });
                  $.notify("Success\nThe server was successfuly removed", "success");
               },
               error: function(){
                  this_span.toggleClass("working", false);
                  this_span.notify("Deletion Fail", {position:"left", className:"error"});
               }
            });
            //hide notification
            $(this).trigger('notify-hide');
         });
      }
   });

   // Refreshes the server information.
   $('span.js-update-server').on('click', function(){
      // This removes any other notify.js notifications and triggers so that there is no overlap.
      $('.notifyjs-gisportal-refresh-option-base').closest("td").find("span").toggleClass("warn-spin", false);
      $('.notifyjs-gisportal-refresh-option-base').closest("tr").toggleClass("alert-warning", false);
      $(document).off('click', '.notifyjs-gisportal-refresh-option-base .no');
      $(document).off('click', '.notifyjs-gisportal-refresh-option-base .yes');
      $('.notifyjs-gisportal-refresh-option-base').closest("div.notifyjs-wrapper").remove();
      var this_span = $(this);
      $(this).toggleClass('warn-spin', true);
      $(this).parent("td").parent("tr").toggleClass('alert-warning', true);
      var url = $(this).data("server");
      var user = $(this).data("user");
      var domain = gisportal.niceDomainName;
      // The timeout is measured to see if the cache can be refreshed.
      if(user == domain){
         var wms_url = $(this).data("wms");
         refresh_url = gisportal.middlewarePath + '/settings/load_new_wms_layer?url='+wms_url+'&refresh=true';
         $.ajax({
            url:  refresh_url,
            dataType: 'json',
            success: function(new_global_data){
               gisportal.editLayersForm.refreshOldData(new_global_data, this_span, user, domain, url);
            },
            error: function(e){
               this_span.toggleClass('warn-spin', false);
               this_span.parent("td").parent("tr").toggleClass('alert-warning', false);
               this_span.parent("td").parent("tr").toggleClass('alert-danger', true);
               setTimeout(function(){this_span.parent("td").parent("tr").toggleClass('alert-danger', false);},2000);
               this_span.notify("Refresh Failed", {position:"left", className:"error"});
            }
         });
         return;
      }
      var cache_url = 'app/cache/' + gisportal.niceDomainName + '/temporary_cache/';
      cache_url += url+".json?_="+ new Date().getMilliseconds();
      $.ajax({
         url:  cache_url,
         dataType: 'json',
         success: function(global_data){
            if(!global_data.timeStamp || (+new Date() - +new Date(global_data.timeStamp))/60000 > gisportal.config.cacheTimeout){
               // Add a notify so the user can choose to refresh the cache.
               this_span.notify({'title':"Would you like to refresh the cached data?", "yes-text":"Yes", "no-text":"No"},{style:"gisportal-refresh-option", autoHide:false, clickToHide: false});
                //listen for click events from this style
               $(document).one('click', '.notifyjs-gisportal-refresh-option-base .no', function() {
                  gisportal.editLayersForm.refreshOldData(global_data, this_span, user, domain);
                  //hide notification
                  $(this).trigger('notify-hide');
               });
               $(document).one('click', '.notifyjs-gisportal-refresh-option-base .yes', function() {
                  var wms_url = global_data.wmsURL.replace("?", "");
                  refresh_url = gisportal.middlewarePath + '/settings/load_new_wms_layer?url='+wms_url+'&refresh=true';
                  $.ajax({
                     url:  refresh_url,
                     dataType: 'json',
                     success: function(new_global_data){
                        gisportal.editLayersForm.refreshOldData(new_global_data, this_span, user, domain);
                     },
                     error: function(e){
                        this_span.toggleClass('warn-spin', false);
                        this_span.parent("td").parent("tr").toggleClass('alert-warning', false);
                        this_span.parent("td").parent("tr").toggleClass('alert-danger', true);
                        setTimeout(function(){this_span.parent("td").parent("tr").toggleClass('alert-danger', false);},2000);
                        this_span.notify("Refresh Failed", {position:"left", className:"error"});
                     }
                  });
                  //hide notification
                  $(this).trigger('notify-hide');
               });
               
            }else{
               gisportal.editLayersForm.refreshOldData(global_data, this_span, user, domain);
            }
         },
         error: function(e){
            this_span.toggleClass('warn-spin', false);
            this_span.parent("td").parent("tr").toggleClass('alert-warning', false);
            this_span.parent("td").parent("tr").toggleClass('alert-danger', true);
            setTimeout(function(){this_span.parent("td").parent("tr").toggleClass('alert-danger', false);},2000);
            this_span.notify("Could not find cache file", {position:"left", className:"error"});
         }
      });
   });
};

/**
* This function takes the cached data and inputs the data from the current user cache file.
* it then alerts the user of any layer differences.
* 
* @method
* 
* @param Object new_data - The new data that is in the gloal cache.
* @param jQuery Object span - The selector of the refresh span button.
* @param jQuery String user - The owner of the cache.
*/
gisportal.editLayersForm.refreshOldData = function(new_data, span, user, domain, wms_url){
   wms_url = wms_url || new_data.wmsURL;
   var clean_wms_url = gisportal.utils.replace(['http://','https://','/','?'], ['','','-',''], wms_url);

   var ajax_url = 'app/cache/' + gisportal.niceDomainName + "/";
   if(user != domain){
      ajax_url += "user_" + user + "/";
   }
   ajax_url += clean_wms_url+".json?_="+ new Date().getMilliseconds();
   $.ajax({
      url:  ajax_url, // The user cache is the retrieved to be compared with the new data.
      dataType: 'json',
      success: function(user_data){
         // Lists for storing diffences.
         var missing_layers = [];
         var new_layers = [];
         var provider;
         // For each of the layers in the user data. 
         for(var user_layer in user_data.server.Layers){
            var found = false;
            // Loop through the new data and update the information of the matching layer.
            var new_server = _.keys(new_data.server)[0];
            for(var new_layer in new_data.server[new_server]){
               if(user_data.server.Layers[user_layer].Name == new_data.server[new_server][new_layer].Name){
                  new_data.server[new_server][new_layer].Abstract = user_data.server.Layers[user_layer].Abstract;
                  new_data.server[new_server][new_layer].Title = user_data.server.Layers[user_layer].Title;
                  new_data.server[new_server][new_layer].include = user_data.server.Layers[user_layer].include || false;
                  new_data.server[new_server][new_layer].tags = user_data.server.Layers[user_layer].tags;
                  new_data.server[new_server][new_layer].LegendSettings = user_data.server.Layers[user_layer].LegendSettings;
                  new_data.server[new_server][new_layer].ProviderDetails = user_data.server.Layers[user_layer].ProviderDetails || undefined;
                  // The provider is saved so that it can be out into the provider variable.
                  provider = user_data.server.Layers[user_layer].tags.data_provider;
                  found = true;
               }else if(new_layers.indexOf(new_data.server[new_server][new_layer].Name) == -1){
                  // for layers that don't match, loop back through the user data to check that there are no layers that are new to the server.
                  var missing = true;
                  for(var second_user_layer in user_data.server.Layers){
                     if(user_data.server.Layers[second_user_layer].Name == new_data.server[new_server][new_layer].Name){
                        missing = false;
                     }
                  }
                  if(missing){
                     new_layers.push(new_data.server[new_server][new_layer].Name);
                  }
               }
            }
            // If the layer was not found in the new data it is added to the missing layers list.
            if(!found){
               missing_layers.push(user_data.server.Layers[user_layer].Name);
            }
         }
         // The new data options is updated so that it contains the correct provider (not 'UserDefinedLayer') and contact info.
         // If present the wcsURL is also added.
         new_data.options = user_data.options;
         new_data.contactInfo = user_data.contactInfo;
         new_data.wcsURL = user_data.wcsURL || undefined;
         new_data.provider= provider || user_data.options.providerShortTag;
         // The data is sent off to the middleware to relace the old user cahce file.
         $.ajax({
            method: 'post',
            url: gisportal.middlewarePath + '/settings/update_layer?username=' + user,
            data:{'data': JSON.stringify(new_data)},
            success: function(){
               span.toggleClass('warn-spin', false);
               span.parent("td").parent("tr").toggleClass('alert-warning', false);
               span.parent("td").parent("tr").toggleClass('alert-success', true);
               setTimeout(function(){span.parent("td").parent("tr").toggleClass('alert-success', false);},2000);
               // Refreshes the timestamp.
               span.parent("td").siblings(".time-stamp").html(new_data.timeStamp);
               // The layers are then refreshed
               gisportal.loadLayers();
            }, error: function(){
               span.toggleClass('warn-spin', false);
               span.parent("td").parent("tr").toggleClass('alert-warning', false);
               span.parent("td").parent("tr").toggleClass('alert-danger', true);
               setTimeout(function(){span.parent("td").parent("tr").toggleClass('alert-danger', false);},2000);
               span.notify("ERROR!", {position:"left", className:"error"});
            }
         });
         
      },
      error: function(e){
         span.toggleClass('warn-spin', false);
         span.parent("td").parent("tr").toggleClass('alert-warning', false);
         span.parent("td").parent("tr").toggleClass('alert-danger', true);
         setTimeout(function(){span.parent("td").parent("tr").toggleClass('alert-danger', false);},2000);
         span.notify("Could not get internal info", {position:"left", className:"error"});
      }
   });
};
