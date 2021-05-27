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
   console.log("gisportal.editLayersForm.produceServerList", gisportal.original_layers, gisportal.layers, gisportal.vLayersUserDefined);
   gisportal.editLayersForm.server_list = [];
   var layers_obj = {};
   gisportal.original_layers = [gisportal.original_layers];
   console.log("gisportal.original_layers", gisportal.original_layers, _.size(gisportal.original_layers));
   if(_.size(gisportal.original_layers) > 0){
      layers_obj = gisportal.original_layers;
   }else{
      layers_obj = gisportal.vLayersUserDefined;
      console.log("layers_obj", layers_obj, typeof(layers_obj));
   }
   $.extend(layers_obj, gisportal.not_included_layers);
   var data;
   console.log("_.size(gisportal.original_layers)", _.size(gisportal.vLayersUserDefined));
   layers_obj = gisportal.original_layers;
   console.log("layers_obj", layers_obj, typeof(layers_obj));
   console.log("looping through the layers in the layers_obj", Object.keys(gisportal.vLayersUserDefined)[0], Object.keys(gisportal.vLayersUserDefined).length);
   console.log(gisportal.vLayersUserDefined);
   //for each of the layers in the list.
   //for(var layer in gisportal.vLayersUserDefined){
   for(var layer in layers_obj){
      console.log("for layer in layers_obj", layer);
      //var this_layer = gisportal.vLayersUserDefined[layer];
      var this_layer = layers_obj[layer];
      console.log(this_layer);
      //if((gisportal.user.info.permission != "admin" && this_layer.owner != gisportal.user.info.email) || this_layer.serviceType =="WFS"){
      //   continue;
      //}
      var provider;
      var serverName;

      if(this_layer.serviceType == "WFS") {
         //serverName = this_layer.variableName.split(":")[0].toUpperCase();
         serverName = this_layer.serverName;
         //provider = this_layer.tags.data_provider || this_layer.providerTag;
         provider = this_layer.provider;
         timeStamp = undefined;
         //url = this_layer.endpoint;
         url = this_layer.wmsURL;
         //owner = this_layer.tags.data_provider;
         owner = this_layer.owner;
      }
      else{
         serverName = this_layer.serverName;
         provider = this_layer.provider;
         url = this_layer.wmsURL;
         timeStamp = this_layer.timeStamp;
         owner = this_layer.owner;
      }
      
      // Gets the server information from the layer
      var server_info = {
         "serverName":serverName,
         "timeStamp":timeStamp,
         "provider":provider,
         "wms_url":url,
         "owner":owner,
         "includedLayers":[],
         "excludedLayers":[]
      };
      // Gets the unique layer information.
      var layer_info = {
         "id":layer,
         //"include":this_layer.include,
         "include":this_layer.server.Layers,
         //"title":this_layer.name,
         "title":this_layer.serverName,
         "serviceType":this_layer.serviceType
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
         if(layer_info.serviceType == "WFS") {
            server_info.serviceType = "WFS";
         }
         gisportal.editLayersForm.server_list.push(server_info);
      }
      var admin = false;

      gisportal.editLayersForm.server_list_wms = [];
      gisportal.editLayersForm.server_list_wfs = [];

      console.log("gisportal.editLayersForm.server_list[index]", gisportal.editLayersForm.server_list);

      for(var index in gisportal.editLayersForm.server_list) {
         console.log(gisportal.editLayersForm.server_list[index], gisportal.editLayersForm.server_list[index].serviceType);
         var service_type = gisportal.editLayersForm.server_list[index].serviceType;

         if(service_type == "WFS") {
            gisportal.editLayersForm.server_list_wfs.push(gisportal.editLayersForm.server_list[index]);
         }
         else{
            gisportal.editLayersForm.server_list_wms.push(gisportal.editLayersForm.server_list[index]);
         }
      }

      if(gisportal.editLayersForm.server_list_wms.length === 0) gisportal.editLayersForm.server_list_wms = undefined;
      if(gisportal.editLayersForm.server_list_wfs === 0) gisportal.editLayersForm.server_list_wfs = undefined;

      if(gisportal.user.info.permission == "admin") admin = true;
      data = {
         "server_list_wms": gisportal.editLayersForm.server_list_wms,
         "server_list_wfs": gisportal.editLayersForm.server_list_wfs,
         "admin": admin
      };
   }
   // The server list is shown using the list previously created.
   $( '.js-edit-layers-popup' ).toggleClass('hidden', false);
   console.log("this is the data", data);
   var template = gisportal.templates['edit-layers-table'](data);
   $( '.js-edit-layers-html' ).html(template);

   gisportal.editLayersForm.addListeners();
   
};

gisportal.editLayersForm.addListeners = function(){
   // Listener added to the close button.
   $('span.js-edit-layers-close').on('click', function() {
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
      //if(true) {
      if(gisportal.addLayersForm.form_info.wms_url){
         gisportal.autoLayer.TriedToAddLayer = false;
         gisportal.autoLayer.loadGivenLayer();
         gisportal.panels.showPanel('choose-indicator');
      }
      var params = {
         "event" : "configureInternalLayers.closed"
      };
      gisportal.events.trigger('configureInternalLayers.closed', params);
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
   
   $('span.js-edit-server-layers-wfs').on('click', function() {
      console.log("the edit button for wfs has been clicked");
      var single_layer;
      //gisportal.addLayersForm.layers_list = {};
      gisportal.addLayersForm.server_info = {};
      gisportal.addLayersForm.form_info = {};
      console.log(gisportal.editLayersForm.server_list);
      for(var i in gisportal.editLayersForm.server_list){
         console.log("Here another server:");
         console.log(i);
         var this_form_layer = gisportal.editLayersForm.server_list[i];
         if(this_form_layer.serverName == $(this).data("server") && this_form_layer.owner == $(this).data("user")){
            var layer, id;
            console.log("this_form_layer.includedLayers", this_form_layer.includedLayers);
            for(layer in this_form_layer.includedLayers){
               id = this_form_layer.includedLayers[layer].id;
               this_layer = gisportal.layers[id] || gisportal.original_layers[id];
               single_layer = this_layer;
               // Each of the server layers are added to the layers_list variable
               gisportal.addLayersForm.addlayerToList(this_layer);
            }
            console.log("this_form_layer.excludedLayers", this_form_layer.excludedLayers);
            for(layer in this_form_layer.excludedLayers){
               id = this_form_layer.excludedLayers[layer].id;
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
      console.log("test", gisportal.addLayersForm);
      gisportal.addLayersForm.loadedFromTheManagementPanel = true;
      //$('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
   });

   // Listener is added to the edit server buttons
   $('span.js-edit-server-layers').on('click', function() {
      console.log("the edit button has been clicked");
      var single_layer;
      gisportal.addLayersForm.layers_list = {};
      gisportal.addLayersForm.server_info = {};
      gisportal.addLayersForm.form_info = {};
      for(var i in gisportal.editLayersForm.server_list){
         var this_form_layer = gisportal.editLayersForm.server_list[i];
         console.log("this_form_layer", this_form_layer);
         if(this_form_layer.serverName == $(this).data("server") && this_form_layer.owner == $(this).data("user")){
            var layer, id;
            for(layer in this_form_layer.includedLayers){
               id = this_form_layer.includedLayers[layer].id;
               this_layer = gisportal.layers[id] || gisportal.original_layers[id];
               single_layer = this_layer;
               console.log("this_layer", this_layer);
               if(this_layer.serviceType == "WFS") {
                  for(var VlayerID in this_layer.server.Layers) {
                     var Vlayer = this_layer.server.Layers[VlayerID];
                     Vlayer.serviceType = "WFS";
                     Vlayer.serverName = this_layer.serverName;
                     Vlayer.provider = this_layer.provider;
                     Vlayer.owner = this_layer.owner;
                     gisportal.addLayersForm.addlayerToList(Vlayer);
                  }
               } else {
                  // Each of the server layers are added to the layers_list variable
                  gisportal.addLayersForm.addlayerToList(this_layer);
               }
            }
            for(layer in this_form_layer.excludedLayers){
               console.log("this_form_layer.excludedLayers[layer]", this_form_layer.excludedLayers[layer]);
               id = this_form_layer.excludedLayers[layer].id;
               //this_layer = gisportal.not_included_layers[id];
               this_layer = gisportal.vLayersUserDefined[id];
               console.log("gisportal.not_included_layers", gisportal.not_included_layers);
               if(!single_layer){
                  single_layer = this_layer;
               }
               console.log("this_layer excluded", this_layer);
               // Each of the excluded server layers are added to the layers_list variable
               gisportal.addLayersForm.addlayerToList(this_layer);
            }
         }
      }
      gisportal.addLayersForm.validation_errors = {};
      // The form is then loaded (loading the first layer)

      gisportal.addLayersForm.addLayersForm(_.size(gisportal.addLayersForm.layers_list), single_layer, 1, 'div.js-layer-form-html', 'div.js-server-form-html', $(this).data('user'));
      gisportal.addLayersForm.loadedFromTheManagementPanel = true;
      $('div.js-edit-layers-html').html('');
      $('div.js-edit-layers-popup').toggleClass('hidden', true);
   });
   // Deletes the server from the portal.
   $('span.js-delete-server').on('click', function(){
      console.log("the delete button has been clicked.");
      var this_span = $(this);
      if(!this_span.is(".working")){
         this_span.notify({'title':"Are you sure you want to delete this server?", "yes-text":"Yes", "no-text":"No"},{style:"gisportal-delete-option", autoHide:false, clickToHide: false});
          //listen for click events from this style
         $(document).one('click', '.notifyjs-gisportal-delete-option-base .no', function() {
            this_span.toggleClass("working", false);
            $(this).trigger('notify-hide'); //hide notification
            $(document).off('click', '.notifyjs-gisportal-delete-option-base .yes'); // Disable yes listener
         });
         $(document).one('click', '.notifyjs-gisportal-delete-option-base .yes', function() {
            this_span.toggleClass("working", true);
            $(this).trigger('notify-hide'); //hide notification
            $(document).off('click', '.notifyjs-gisportal-delete-option-base .no'); // Disable no listener

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
                  gisportal.loadLayers();
                  this_span.closest("tr").next().toggleClass("hidden", true);
                  this_span.closest("tr").toggleClass("hidden", true);
                  $(document).off('click', '.notifyjs-gisportal-restore-option-base .no');
                  $(document).off('click', '.notifyjs-gisportal-restore-option-base .yes');
                  $('.notifyjs-gisportal-restore-option-base').closest("div.notifyjs-wrapper").remove();
                  $.notify("Success\nThe server was successfuly removed", "success");
               },
               error: function(){
                  this_span.toggleClass("working", false);
                  this_span.notify("Deletion Fail", {position:"left", className:"error"});
               }
            });
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
      var wms_url = $(this).data("wms");
      var user = $(this).data("user");
      var domain = gisportal.niceDomainName;
      // The timeout is measured to see if the cache can be refreshed.
      if(user == domain){
         refreshWMS(wms_url);
         return;
      }
      var cache_url = gisportal.middlewarePath + '/cache/' + gisportal.niceDomainName + '/temporary_cache/';
      cache_url += url+".json?_="+ new Date().getTime();
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
                  refreshWMS(wms_url);
                  //hide notification
                  $(this).trigger('notify-hide');
               });
            }else{
               gisportal.editLayersForm.refreshOldData(global_data, this_span, user, domain);
            }
         },
         error: function(e) {
            refreshWMS(wms_url);
            return;
         }
      });
      function refreshWMS(wmsURL) {
         var refresh_url = gisportal.middlewarePath + '/settings/load_new_wms_layer?url=' + wmsURL + '&refresh=true';
         $.ajax({
            url: refresh_url,
            dataType: 'json',
            success: function(new_global_data) {
               gisportal.editLayersForm.refreshOldData(new_global_data, this_span, user, domain);
            },
            error: function(e) {
               this_span.toggleClass('warn-spin', false);
               this_span.parent("td").parent("tr").toggleClass('alert-warning', false);
               this_span.parent("td").parent("tr").toggleClass('alert-danger', true);
               setTimeout(function() {
                  this_span.parent("td").parent("tr").toggleClass('alert-danger', false);
               }, 2000);
               this_span.notify("Refresh Failed", {
                  position: "left",
                  className: "error"
               });
            }
         });
      }
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

   var ajax_url = gisportal.middlewarePath + '/cache/' + gisportal.niceDomainName + "/";
   if(user != domain){
      ajax_url += "user_" + user + "/";
   }
   ajax_url += clean_wms_url+".json?_="+ new Date().getTime();
   $.ajax({
      url:  ajax_url, // The user cache (old_data) is retrieved to be compared with new_data
      dataType: 'json',
      success: function(old_data){
         // new_data layers that have been matched and updated
         var matched_layers = [];
         // CURRENTLY NOT USED
         // // new_data layers that are new to the server
         // var new_layers = [];
         // // new_data layers that have matching old_data layers
         // var existing_layers = [];
         // // old_data layers that are missing from new_data
         // var missing_layers = [];

         var provider;
         var new_server = _.keys(new_data.server)[0];

         // Iterate through old_data layers
         for (var i_old = 0; i_old < old_data.server.Layers.length; i_old++) {
            var matched = false;

            // Iterate through new_data layers
            var i_new = 0;
            if (old_data.server.Layers[i_old].Name == new_data.server[new_server][i_old].Name) {
               // If the new_data and old_data layers match with i_old, set i_new to i_old to avoid unnecessary iteration
               i_new = i_old;
            }
            for (; i_new < new_data.server[new_server].length; i_new++) {
               if (old_data.server.Layers[i_old].Name == new_data.server[new_server][i_new].Name) {
                  // If the new_data layer matches the old_data layer, update it's information from the old_data layer
                  new_data.server[new_server][i_new].Abstract = old_data.server.Layers[i_old].Abstract;
                  new_data.server[new_server][i_new].Title = old_data.server.Layers[i_old].Title;
                  new_data.server[new_server][i_new].include = old_data.server.Layers[i_old].include || false;
                  new_data.server[new_server][i_new].autoScale = old_data.server.Layers[i_old].autoScale;
                  new_data.server[new_server][i_new].log = old_data.server.Layers[i_old].log;
                  new_data.server[new_server][i_new].defaultMinScaleVal = old_data.server.Layers[i_old].defaultMinScaleVal;
                  new_data.server[new_server][i_new].defaultMaxScaleVal = old_data.server.Layers[i_old].defaultMaxScaleVal;
                  new_data.server[new_server][i_new].defaultStyle = old_data.server.Layers[i_old].defaultStyle;
                  new_data.server[new_server][i_new].colorbands = old_data.server.Layers[i_old].colorbands;
                  new_data.server[new_server][i_new].aboveMaxColor = old_data.server.Layers[i_old].aboveMaxColor;
                  new_data.server[new_server][i_new].belowMinColor = old_data.server.Layers[i_old].belowMinColor;
                  new_data.server[new_server][i_new].tags = old_data.server.Layers[i_old].tags;
                  new_data.server[new_server][i_new].LegendSettings = old_data.server.Layers[i_old].LegendSettings;
                  new_data.server[new_server][i_new].ProviderDetails = old_data.server.Layers[i_old].ProviderDetails || undefined;
                  provider = old_data.server.Layers[i_old].tags.data_provider; // The provider is saved so that it can be out into the provider variable
                  matched_layers.push(new_data.server[new_server][i_new].Name); // Add the new_data layer to matched_layers
                  matched = true;
                  break;
               } 
               // CURRENTLY NOT USED
               // else if (!matched_layers.includes(new_data.server[new_server][i_new].Name) &&
               //    !new_layers.includes(new_data.server[new_server][i_new].Name) &&
               //    !existing_layers.includes(new_data.server[new_server][i_new].Name)) {
               //    // If the layers don't match and the new_data layer isn't already recorded as matched, new, or existing
               //    // then iterate through old_data layers to check if this layer is new to the server.
               //    var new_layer = true;
               //    for (var i_old2 = 0; i_old2 < old_data.server.Layers.length; i_old2++) {
               //       if (old_data.server.Layers[i_old2].Name == new_data.server[new_server][i_new].Name) {
               //          // If the new_data layer matches an old_data layer, add it to existing_layers
               //          new_layer = false;
               //          existing_layers.push(new_data.server[new_server][i_new].Name);
               //          break;
               //       }
               //    }
               //    if (new_layer) {
               //       // If the new_data layer doesn't match an old_data layer, add it to new_layers
               //       new_layers.push(new_data.server[new_server][i_new].Name);
               //    }
               // }
            }

            // CURRENTLY NOT USED
            // if (!matched) {
            //    // If the old_data layer was not matched with a new_data layer, add it to missing_layers
            //    missing_layers.push(old_data.server.Layers[i_old].Name);
            // }
         }

         // The new_data options is updated so that it contains the correct provider (not 'UserDefinedLayer') and contact info
         // If present the wcsURL is also added
         new_data.options = old_data.options;
         new_data.contactInfo = old_data.contactInfo;
         new_data.wcsURL = old_data.wcsURL || undefined;
         new_data.provider = provider || old_data.options.providerShortTag;

         // The data is sent off to the middleware to replace the old user cache file
         $.ajax({
            method: 'post',
            url: gisportal.middlewarePath + '/settings/update_layer?username=' + user,
            data:{'data': JSON.stringify(new_data)},
            success: function(){
               span.toggleClass('warn-spin', false);
               span.parent("td").parent("tr").toggleClass('alert-warning', false);
               span.parent("td").parent("tr").toggleClass('alert-success', true);
               setTimeout(function(){span.parent("td").parent("tr").toggleClass('alert-success', false);},2000);
               // Refreshes the timestamp
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
