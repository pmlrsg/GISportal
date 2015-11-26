gisportal.addLayersForm = {};
gisportal.addLayersForm.layers_list = {};
gisportal.addLayersForm.server_info = {};
gisportal.addLayersForm.validation_errors = {};


gisportal.addLayersForm.validation_functions = {
   'all_tags':function(value){if(!/^[a-zA-Z0-9:\-\& \:\;\_\,\/\\]+$|^$/.test(value)){
                                 var invalid_chars = _.uniq(value.match(/[^a-zA-Z0-9:\-\& \:\;\_\,\/\\]+|^$/g));
                                 return "The following characters are invalid: '" + invalid_chars.join("") + "' . Please try agian.";
                              }
   },
   'email':function(value){if(!/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$|^$/i.test(value)){
                                 return "The email you provided is invalid, please try again.";
                              }
   },
};

gisportal.addLayersForm.addlayerToList = function(layer){
   gisportal.addLayersForm.layers_list = gisportal.addLayersForm.layers_list || {};
   var list_id = _.size(gisportal.addLayersForm.layers_list)+1
   var indicator_type = layer.tags.indicator_type || "";
   var region = layer.tags.region || "";
   var interval = layer.tags.interval || "";
   var model_name = layer.tags.model_name || "";
   var layer_info={
      "list_id":list_id,
      "nice_name":layer.tags.niceName,
      "original_name":layer.urlName, //used to input the data into the correct files int the end.
      "abstract":layer.abstract,
      "id":layer.id,
      "tags":{"indicator_type":indicator_type, "region":region, "interval":interval, "model_name":model_name},
      "include":true
   };
   for(value in gisportal.addLayersForm.layers_list){
      if(gisportal.addLayersForm.layers_list[value]['id'] == layer.id){
         return;
      }
   }
   gisportal.addLayersForm.layers_list[list_id] = layer_info;
};

gisportal.addLayersForm.displayPaginator = function(total_pages, current_page, append_to, function_to_call){
   var end_bool = true;
   var beggining_bool = true;
   var to_value = current_page + 5;
   var from_value = current_page - 5;
   var max_value = total_pages;
   if(max_value <= to_value){
      end_bool = false;
      to_value = max_value;
   }
   if(from_value<=1){
      beggining_bool = false;
      from_value = 1;
   }
   if(max_value <=10){
      to_value = max_value;
      from_value = 1;
      end_bool = false;
      beggining_bool = false;
   }

   var paginator_info = {from:from_value,to:to_value,beggining:beggining_bool, end:end_bool, max:max_value, current:current_page, function_name:function_to_call, form_div:append_to}
   var paginator = gisportal.templates['add-layers-paginator'](paginator_info);
   $(append_to).append(paginator);
   gisportal.addLayersForm.addInputListeners();
};

gisportal.addLayersForm.displayform = function(total_pages, current_page, form_div){
   for(value in gisportal.addLayersForm.layers_list){
      gisportal.addLayersForm.layers_list[value]['total_pages'] = total_pages;
   }
   var layer_form = gisportal.templates['add-layers-form'](gisportal.addLayersForm.layers_list[current_page]);
   $(form_div).html(layer_form);
   gisportal.addLayersForm.validateForm('div.overlay-container-form');
   gisportal.addLayersForm.displayPaginator(total_pages, current_page, form_div, 'gisportal.addLayersForm.displayform');
   
   $(document).off( 'keydown' );

   $(document).on( 'keydown', function ( e ) {
      if(document.activeElement.nodeName == "BODY"){
         switch(e.keyCode){
            case 27:
               if(!$( '.js-user-feedback-popup' ).hasClass('hidden')){
                  $( '.js-user-feedback-popup' ).toggleClass('hidden', true);
               }else{
                  $( 'div.js-layer-form-popup' ).toggleClass('hidden', true);
                  gisportal.addLayersForm.server_info["display_form"] = false;
                  gisportal.addLayersForm.refreshStorageInfo();
               }
               break;
            case 37:
               if(current_page > 1){
                  gisportal.addLayersForm.displayform(total_pages, current_page-1, form_div);
               }
               break;
            case 39:
               if(current_page < total_pages){
                  gisportal.addLayersForm.displayform(total_pages, current_page+1, form_div);
               }
               break;
         }
      }
   });

   $('div.layers-form-right span.add-to-all-layers ').on( 'click', function () {
      var key = $(this).data("field").replace(/-/g,"_");
      var key_val = $(this).siblings("input[data-field="+key+"]","textarea[data-field="+key+"]").val();
      key = key.replace("-", "_");
      if(key == "indicator_type"){
         key_val = key_val.split(",");
         for (value in key_val){
            value = value.trim();
         }
      }
      for(value in gisportal.addLayersForm.layers_list){
         gisportal.addLayersForm.layers_list[value]["tags"][key] = key_val;
      }
      gisportal.addLayersForm.refreshStorageInfo();
   });

   $('div.layers-form-right span.add-tag-input ').on( 'click', function () {
      gisportal.panels.userFeedback("Please enter a tag name to add it", gisportal.addLayersForm.addTagInput);
   });

   $('.layers-form-buttons-div button.js-layers-form-submit').on('click', function(e){
      e.preventDefault();
      if(_.size(gisportal.addLayersForm.validation_errors['server']) > 0){
         return;
      }
      for(layer in gisportal.addLayersForm.layers_list){
         var this_layer = gisportal.addLayersForm.layers_list[layer];
         if(this_layer['include']){
            var invalid = gisportal.addLayersForm.checkValidity;
            for(tag in this_layer.tags){
               if(invalid("all_tags", this_layer.tags[tag])['invalid']){
                  gisportal.addLayersForm.displayform(_.size(gisportal.addLayersForm.layers_list), parseInt(layer), "div.js-layer-form-html")
                  console.log("Error on page: " + layer);
                  return;
               }
            }
         }
      }
      for(layer in gisportal.addLayersForm.layers_list){
         if(gisportal.addLayersForm.layers_list[layer]['include']){
            $.ajax({
               url:  '/service/add_user_layer',
               method:'POST',
               data:{layers_list:gisportal.storage.get("layers_list"), server_info:gisportal.storage.get("server_info")},
               success: function(layer){
                  gisportal.addLayersForm.layers_list = {};
                  gisportal.addLayersForm.server_info = {};
                  gisportal.addLayersForm.refreshStorageInfo();
                  for(key in gisportal.layers){
                     delete gisportal.original_layers[key];
                  }
                  gisportal.loadLayers();
                  delete gisportal.autoLayer.given_wms_url;
                  $('div.js-layer-form-popup').toggleClass('hidden', true);
                  gisportal.configurePanel.resetPanel();
               },
               error: function(e){
                  console.log("Error" + e.Message);
               }
            });
            return;
         }
      }
      console.log("need to include at least one");
   });

   $('.layers-form-buttons-div button.js-layers-form-cancel').on('click', function(e){
      e.preventDefault();
      gisportal.addLayersForm.layers_list = {};
      gisportal.addLayersForm.server_info = {};
      gisportal.addLayersForm.refreshStorageInfo();
      $('div.js-layer-form-popup').toggleClass('hidden', true);
   });
   gisportal.addLayersForm.addInputListeners();
};

gisportal.addLayersForm.addTagInput = function(tag){
   tag = tag.toLowerCase().replace(/ /g, "_");
   var total_pages = $('span.add-tag-input').data("total-pages");
   var current_page = $('span.add-tag-input').data("current-page");
   for(index in gisportal.addLayersForm.layers_list){
      gisportal.addLayersForm.layers_list[index]["tags"][tag]="";
   }
   gisportal.addLayersForm.displayform(total_pages, current_page, 'div.js-layer-form-html');
   gisportal.addLayersForm.refreshStorageInfo();
}

gisportal.addLayersForm.displayServerform = function(layer, form_div){
   if(_.size(gisportal.addLayersForm.server_info) <= 2){
      var provider = layer.tags.data_provider || layer.tags.providerTag;
      if(layer.contactInfo.address){
         var address = layer.contactInfo.address.replace(/<br\/>/g, "\n")
      }else{
         var address = "";
      }
      var person = layer.contactInfo.person || "";
      var position = layer.contactInfo.position || "";
      var email = layer.contactInfo.email || "";
      var phone = layer.contactInfo.phone || "";
      gisportal.addLayersForm.server_info={
         "provider":provider,
         "unique_name":layer.sensor,
         "address":address,
         "person":person,
         "position":position,
         "email":email,
         "phone":phone,
         "wms_url":layer.wmsURL
      };
   }
   gisportal.addLayersForm.server_info["display_form"] = true;
   var server_form = gisportal.templates['server-form'](gisportal.addLayersForm.server_info);
   $(form_div).html(server_form);
   gisportal.addLayersForm.validateForm('div.overlay-container-form');
   gisportal.addLayersForm.addInputListeners();
}

gisportal.addLayersForm.addLayersForm = function(list_size, single_layer, current_page, form_div, server_div){
   gisportal.addLayersForm.displayform(list_size, current_page, form_div)
   gisportal.addLayersForm.displayServerform(single_layer, server_div);
   gisportal.addLayersForm.refreshStorageInfo();
   $('span.js-layer-form-close').on('click', function() {
      $('div.js-layer-form-popup').toggleClass('hidden', true);
      gisportal.addLayersForm.server_info["display_form"] = false;
      gisportal.addLayersForm.refreshStorageInfo();
   });
   $('div.js-layer-form-popup').toggleClass('hidden', false);
}

gisportal.addLayersForm.refreshStorageInfo = function(){
   gisportal.storage.set( 'layers_list', JSON.stringify(gisportal.addLayersForm.layers_list) )
   gisportal.storage.set( 'server_info', JSON.stringify(gisportal.addLayersForm.server_info ) )
};

gisportal.addLayersForm.addInputListeners = function(){
   $('.overlay-container-form input, .overlay-container-form textarea').off('change keyup paste');
   $('.js-layer-form-html input, .js-layer-form-html textarea').off('focusout');
   $('.js-server-form-html input, .js-server-form-html textarea').off('focusout');
   $('.overlay-container-form input, .overlay-container-form textarea').on('change keyup paste', function(){
      var tag = $(this).data("tag");
      var index = $(this).data("id");
      var key = $(this).data("field").replace(/-/g,"_");
      if($(this).is(':checkbox')){
         var key_val = !$(this).is(':checked');
      }else{
         var key_val = $(this).val();
      }
      if(index){
         if(tag){
            if(key == "indicator_type"){
               key_val = key_val.split(",");
               for (value in key_val){
                  value = key.trim();
               }
            }
            gisportal.addLayersForm.layers_list[index]["tags"][key] = key_val;
         }else{
            gisportal.addLayersForm.layers_list[index][key] = key_val;
         }
      }else{
         gisportal.addLayersForm.server_info[key] = key_val;
      }
      gisportal.addLayersForm.refreshStorageInfo();
      gisportal.addLayersForm.addInputListeners();
   });
   $('div.overlay-container-form input, div.overlay-container-form textarea').on('focusout', function(){
      gisportal.addLayersForm.validateForm('div.overlay-container-form')
   });
   gisportal.addLayersForm.server_info["display_form"] = true;
   gisportal.addLayersForm.refreshStorageInfo();
};

gisportal.addLayersForm.validateForm = function(form_div){
   $(form_div).find('input, textarea').each(function(){
      var value = $(this).val();
      var field = $(this).data('field');
      var tag = $(this).data('tag');
      var form = ""
      if(field in gisportal.addLayersForm.layers_list['1'] || field in gisportal.addLayersForm.layers_list['1']['tags']){
         form = "layers"
      }else if(field in gisportal.addLayersForm.server_info){
         form = "server"
      }
      var label = $('label[data-field='+field+']')
      if(tag || field == "provider"){
         field = "all_tags";
      }

      if(form.length > 0){
         gisportal.addLayersForm.validation_errors[form] = gisportal.addLayersForm.validation_errors[form] || {}
         var check_valid = gisportal.addLayersForm.checkValidity(field, value);
         if(check_valid['invalid']){
            gisportal.addLayersForm.validation_errors[form][String(label.html())] = check_valid['message'];
            $(this).toggleClass('invalid', true);
            label.toggleClass('invalid', true);
         }else{
            if(gisportal.addLayersForm.validation_errors[form][String(label.html())]){
               delete gisportal.addLayersForm.validation_errors[form][String(label.html())];
            }
            $(this).toggleClass('invalid', false);
            label.toggleClass('invalid', false);
         }
         if(_.size(gisportal.addLayersForm.validation_errors[form]) > 0){
            var validation = gisportal.templates['add-layers-validation'](gisportal.addLayersForm.validation_errors[form]);
            $('div.js-'+ form + '-form-validation').html(validation);
            $('div.js-'+ form + '-form-validation').toggleClass('hidden', false);
         }else{
            $('div.js-'+ form + '-form-validation').toggleClass('hidden', true);
         }
      }
   });
};

gisportal.addLayersForm.checkValidity = function(field, value){
   if(field in gisportal.addLayersForm.validation_functions){
      message = gisportal.addLayersForm.validation_functions[field](value);
      if(message){
         return {'invalid': true, 'message': message};
      }
   }
   return {'invalid': false};
};