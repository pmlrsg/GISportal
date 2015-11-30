gisportal.addLayersForm = {};
gisportal.addLayersForm.layers_list = {};
gisportal.addLayersForm.server_info = {};
gisportal.addLayersForm.form_info = {};
gisportal.addLayersForm.validation_errors = {};

// This is a variable that takes the names of fields and has validation functions to be applied to them. the return is the error message that shoudl be applied, if any.
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

/**
* This function adds a layer to the layers_list dictionary ready for inputting into the form.
* 
* @method
* 
* @param {Object} layer - Object containing data about the layer. 
*/
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
   for(value in gisportal.addLayersForm.layers_list){ // Ensures that the layer can only be added once. 
      if(gisportal.addLayersForm.layers_list[value]['id'] == layer.id){
         return;
      }
   }
   gisportal.addLayersForm.layers_list[list_id] = layer_info;
};

/**
* This function appends a paginator and submit button to the element given (apend_to).
* 
* @method
* 
* @param int total_pages - The total number of pages there are int the form.
* @param int current_page - The current page that is/ should be displayed.
* @param String append_to - The JQuery selector of the element that the paginator should be appended to.
* @param function function_to_call - the function to be called when a page is selected from the paginator 
*/
gisportal.addLayersForm.displayPaginator = function(total_pages, current_page, append_to, function_to_call){
   // This block works out the variables that need to be passed to the template in order for the correct paginator to be displayed.
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
   // The template is loaded from the information that has been calculated. it is then added to the element given.
   var paginator_info = {from:from_value,to:to_value,beggining:beggining_bool, end:end_bool, max:max_value, current:current_page, function_name:function_to_call, form_div:append_to}
   var paginator = gisportal.templates['add-layers-paginator'](paginator_info);
   $(append_to).append(paginator);
   // Input listeners are then added to the paginator and the buttons.
   gisportal.addLayersForm.addInputListeners();
};

/**
* This function displays the layers form.
* 
* @method
* 
* @param int total_pages - The total number of pages there are int the form.
* @param int current_page - The current page that is/ should be displayed.
* @param String form_div - The JQuery selector of the element that the form should be applied to.
*/
gisportal.addLayersForm.displayForm = function(total_pages, current_page, form_div){
   for(value in gisportal.addLayersForm.layers_list){
      gisportal.addLayersForm.layers_list[value]['total_pages'] = total_pages; //This passes the total number of pages to each layer for later use.
   }
   // Takes the current page information and adds it to the element given
   var layer_form = gisportal.templates['add-layers-form'](gisportal.addLayersForm.layers_list[current_page]);
   $(form_div).html(layer_form);
   // The form then goes through validation to display corrections required to the user.
   gisportal.addLayersForm.validateForm('div.overlay-container-form');
   // The paginator is then added. The function called is this very function which is called when a paginator button is pressed.
   gisportal.addLayersForm.displayPaginator(total_pages, current_page, form_div, 'gisportal.addLayersForm.displayForm');
   
   // The keydown event listener is removed from the document so that there is only ever one on there.
   $(document).off( 'keydown' );

   // The keydown event listener that is added allows for the user to close the form by pressing the 'Esc' key, and to navigate through layers by pressing the arrow keys.
   $(document).on( 'keydown', function ( e ) {
      if(document.activeElement.nodeName == "BODY"){
         switch(e.keyCode){
            case 27:
               if(!$( '.js-user-feedback-popup' ).hasClass('hidden')){
                  $( '.js-user-feedback-popup' ).toggleClass('hidden', true);
               }else{
                  $( 'div.js-layer-form-popup' ).toggleClass('hidden', true);
                  gisportal.addLayersForm.form_info["display_form"] = false;
                  gisportal.addLayersForm.refreshStorageInfo();
               }
               break;
            case 37:
               if(current_page > 1){
                  gisportal.addLayersForm.displayForm(total_pages, current_page-1, form_div);
               }
               break;
            case 39:
               if(current_page < total_pages){
                  gisportal.addLayersForm.displayForm(total_pages, current_page+1, form_div);
               }
               break;
         }
      }
   });

   // This adds the click listener to the 'add to all layers' spans
   $('div.layers-form-right span.add-to-all-layers ').on( 'click', function () {
      // Gets the information from the related input
      var key = $(this).data("field").replace(/-/g,"_");
      var key_val = $(this).siblings("input[data-field="+key+"]","textarea[data-field="+key+"]").val();
      key = key.replace("-", "_");
      if(key == "indicator_type"){
         key_val = key_val.split(",");
         for (value in key_val){
            value = value.trim();
         }
      }
      // The information is then added to every layer in the list
      for(value in gisportal.addLayersForm.layers_list){
         gisportal.addLayersForm.layers_list[value]["tags"][key] = key_val;
      }
      // The information is then updated to the browser cache so that it is there next time.
      gisportal.addLayersForm.refreshStorageInfo();
   });

   // Adds a listener to the span for adding tags.
   $('div.layers-form-right span.add-tag-input ').on( 'click', function () {
      // This gets a responce from the user asking for the tag name.
      gisportal.panels.userFeedback("Please enter a tag name to add it", gisportal.addLayersForm.addTagInput);
   });

   // Adds a listener to the submit button on the form.
   $('.layers-form-buttons-div button.js-layers-form-submit').on('click', function(e){
      e.preventDefault();
      // If there are errors on the server information form then do nothing (the errors will already be on display).
      if(_.size(gisportal.addLayersForm.validation_errors['server']) > 0){
         return;
      }
      // Checks each layer in the list for errors with tags.
      for(layer in gisportal.addLayersForm.layers_list){
         var this_layer = gisportal.addLayersForm.layers_list[layer];
         // As long as it should be included.
         if(this_layer['include']){
            var invalid = gisportal.addLayersForm.checkValidity;
            for(tag in this_layer.tags){
               // If the tag is invalid
               if(invalid("all_tags", this_layer.tags[tag])['invalid']){
                  // Load up the layer in the forma and return so nothing is actually submitted
                  gisportal.addLayersForm.displayForm(_.size(gisportal.addLayersForm.layers_list), parseInt(layer), "div.js-layer-form-html")
                  return;
               }
            }
         }
      }
      // Adds each layer to the 
      for(layer in gisportal.addLayersForm.layers_list){
         // As long as it is to be included
         if(gisportal.addLayersForm.layers_list[layer]['include']){
            //Sends the layers to the middleware to be added to the json file
            $.ajax({
               url:  '/service/add_user_layer',
               method:'POST',
               data:{layers_list:gisportal.storage.get("layers_list"), server_info:gisportal.storage.get("server_info")},
               // If there is success
               success: function(layer){
                  // The temporary form information will be wiped
                  gisportal.addLayersForm.layers_list = {};
                  gisportal.addLayersForm.server_info = {};
                  gisportal.addLayersForm.form_info = {};
                  gisportal.addLayersForm.refreshStorageInfo();
                  // The old layers will be removed from the portal
                  for(key in gisportal.layers){
                     delete gisportal.original_layers[key];
                  }
                  // loadLayers() is run so that gisportal.layers is refreshed and will include the newly added layers.
                  gisportal.loadLayers();
                  // This variable is deleted so that the portal will not load the WMS again.
                  delete gisportal.autoLayer.given_wms_url;
                  // The form is hidden
                  $('div.js-layer-form-popup').toggleClass('hidden', true);
                  // The panel is reset to display the new list of layers.
                  gisportal.configurePanel.resetPanel();
                  // A message is diaplyed to the user so they know the layers were added.
                  gisportal.gritter.showNotification('addLayersSuccess', null);
               },
               error: function(e){
                  console.log("Error " + e.Message);
               }
            });
            // Returns so that they are only sent once.
            return;
         }
      }
      // If there is no layer found that is 'included' this will tell the user to include one.
      console.log("need to include at least one");
   });

   // The cancel button gets  a listener too.
   $('.layers-form-buttons-div button.js-layers-form-cancel').on('click', function(e){
      e.preventDefault();
      wms_url = gisportal.addLayersForm.form_info['wms_url']
      // All of the new information is removed from the portal.
      gisportal.addLayersForm.layers_list = {};
      gisportal.addLayersForm.server_info = {};
      gisportal.addLayersForm.form_info = {'wms_url':wms_url};
      gisportal.addLayersForm.refreshStorageInfo();
      // The form is then hidden.
      $('div.js-layer-form-popup').toggleClass('hidden', true);
   });
   gisportal.addLayersForm.form_info['current_page'] = current_page;// Saves the current_page for loading next time.
   gisportal.addLayersForm.refreshStorageInfo();
   // Input listeners are then added to the paginator and the buttons.
   gisportal.addLayersForm.addInputListeners();
};

/**
* This function adds a user defined tag to the list of layers
* 
* @method
* 
* @param String tag - The tag that the user specified.
*/
gisportal.addLayersForm.addTagInput = function(tag){
   // The tag the user input is normalised.
   tag = tag.toLowerCase().replace(/ /g, "_");
   // The total and current pages are then retrieved so that the template can be reloaded.
   var total_pages = $('span.add-tag-input').data("total-pages");
   var current_page = $('span.add-tag-input').data("current-page");
   // The given tag is added as an empty field to each layer in the list
   for(index in gisportal.addLayersForm.layers_list){
      gisportal.addLayersForm.layers_list[index]["tags"][tag]="";
   }
   // The form is then refreshed (to include the new tag.)
   gisportal.addLayersForm.displayForm(total_pages, current_page, 'div.js-layer-form-html');
   // The browser cache is updaed with the changes.
   gisportal.addLayersForm.refreshStorageInfo();
}

/**
* This function displays the server information side of the from
* 
* @method
* 
* @param {Object} layer - A Layer (containing the server info)
* @param String form_div - The JQuery element selctor for the form to go into
*/
gisportal.addLayersForm.displayServerform = function(layer, form_div){
   wms_url = layer['wmsURL'] || gisportal.addLayersForm.form_info['wms_url'];
   wms_url = wms_url.split('?')[0];
   // If the data has not yet been added to the server_info object.
   if(_.size(gisportal.addLayersForm.server_info) <= 0){
      // The server inforation is extracted from the layer and put into the object.
      var provider = layer.tags.data_provider || layer.tags.providerTag;
      if(layer.contactInfo){
         if(layer.contactInfo.address){
            var address = layer.contactInfo.address.replace(/<br\/>/g, "\n")
         }else{
            var address = "";
         }
         var person = layer.contactInfo.person || "";
         var position = layer.contactInfo.position || "";
         var email = layer.contactInfo.email || "";
         var phone = layer.contactInfo.phone || "";
      }else{
         var address = "";
         var person = "";
         var position = "";
         var email = "";
         var phone = "";

      }
      gisportal.addLayersForm.server_info={
         "provider":provider,
         "unique_name":layer.sensor,
         "address":address,
         "person":person,
         "position":position,
         "email":email,
         "phone":phone,
         "wms_url":wms_url
      };
   }
   // The display form variable is set to true so that the portal knows if the form was displayed last time the user was viewing it.
   gisportal.addLayersForm.form_info["display_form"] = true;
   // The server form template is then loaded and displayed in the element given.
   var server_form = gisportal.templates['server-form'](gisportal.addLayersForm.server_info);
   $(form_div).html(server_form);
   // The form is then validated.
   gisportal.addLayersForm.validateForm('div.overlay-container-form');
   // Input listeners are then added
   gisportal.addLayersForm.addInputListeners();
   // The browser cache is updaed with the changes.
   gisportal.addLayersForm.refreshStorageInfo();
}

/**
* This function displays both parts of the form
* 
* @method
* 
* @param {Object} layer - A Layer (containing the server info)
* @param int list_size - The size of list (number of layers.)
* @param int current_page - The current page to be loaded.
* @param String form_div- The JQuery element selctor for the layers form to go into
* @param String server_div- The JQuery element selctor for the server form to go into
*/
gisportal.addLayersForm.addLayersForm = function(list_size, single_layer, current_page, form_div, server_div){
   // The two forms are displayed
   gisportal.addLayersForm.displayForm(list_size, current_page, form_div)
   gisportal.addLayersForm.displayServerform(single_layer, server_div);
   // The form is then shown
   $('div.js-layer-form-popup').toggleClass('hidden', false);
}

/**
* This takes the information from the layers_list, server_info and form_info parameters and adds them to the browser cache.
* 
* @method
* 
*/
gisportal.addLayersForm.refreshStorageInfo = function(){
   gisportal.storage.set( 'layers_list', JSON.stringify(gisportal.addLayersForm.layers_list) )
   gisportal.storage.set( 'server_info', JSON.stringify(gisportal.addLayersForm.server_info ) )
   gisportal.storage.set( 'form_info', JSON.stringify(gisportal.addLayersForm.form_info ) )
};

/**
* This function adds all of the action listeners to the inputs of the form
* 
* @method
*/
gisportal.addLayersForm.addInputListeners = function(){
   // any existing listeners are turned off to avoid multiples being attached.
   $('.overlay-container-form input, .overlay-container-form textarea').off('change keyup paste');
   $('.js-layer-form-html input, .js-layer-form-html textarea').off('focusout');
   $('.js-server-form-html input, .js-server-form-html textarea').off('focusout');
   // All of the inputs and textareas have listeners added.
   $('.overlay-container-form input, .overlay-container-form textarea').on('change keyup paste', function(){
      var tag = $(this).data("tag"); // Is this inut for a tag?
      var index = $(this).data("id"); // What is the index of this layer?
      var wms_url = $(this).data("wms-url"); // What is the wms_url of this layer?
      var key = $(this).data("field").replace(/-/g,"_"); // What field does this input relate to?
      if($(this).is(':checkbox')){
         var key_val = !$(this).is(':checked'); // Extracts the checkbox value (include)
      }else{
         var key_val = $(this).val(); // key_val set to value of field
      }
      //The data is then added in a certain way.
      if(index){ // Only layer data fields have indexes.
         if(tag){ // If it is a tag it needs to be added to the tags list.
            if(key == "indicator_type"){ // As the indacator type is a list, it must be split first.
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
      // The storage data is then updated.
      gisportal.addLayersForm.refreshStorageInfo();
      gisportal.addLayersForm.addInputListeners();
   });
   // When you focus out of a field, the form is then validated again.
   $('div.overlay-container-form input, div.overlay-container-form textarea').on('focusout', function(){
      gisportal.addLayersForm.validateForm('div.overlay-container-form')
   });
   // The listener is added to the close span to close the form
   $('span.js-layer-form-close').on('click', function() {
      $('div.js-layer-form-popup').toggleClass('hidden', true);
      gisportal.addLayersForm.form_info["display_form"] = false; // display_form set to false so that the portal knows that the form was not displayed last time the user was viewing it.
      // The browser cache is updaed witht the changes.
      gisportal.addLayersForm.refreshStorageInfo();
   });
};

/**
* This function validates the form
* 
* @method
* 
* @param String form_div - The JQuery selector of the form to be validated.
*/
gisportal.addLayersForm.validateForm = function(form_div){
   // For each of the fields in the form
   $(form_div).find('input, textarea').each(function(){
      // The information is extracted from the field
      var value = $(this).val();
      var field = $(this).data('field');
      var tag = $(this).data('tag');
      var wms_url = $(this).data("wms-url");
      var form = ""
      // The form is extracted depending on the list that the field is in.
      if(field in gisportal.addLayersForm.layers_list['1'] || field in gisportal.addLayersForm.layers_list['1']['tags']){
         form = "layers"
      }else if(field in gisportal.addLayersForm.server_info){
         form = "server"
      }
      // The label is retrieved to give a neat and relatable reference to the user.
      var label = $('label[data-field='+field+']')
      // The field is set to 'all_tags' if the field is a tag because they are all validated in the same way.
      if(tag || field == "provider"){
         field = "all_tags";
      }

      // If there is actually a form that the input relates to. 
      if(form.length > 0){
         // The validation errors object for that form is set to itself or {} so that it exists
         gisportal.addLayersForm.validation_errors[form] = gisportal.addLayersForm.validation_errors[form] || {}
         // The validity is then checked
         var check_valid = gisportal.addLayersForm.checkValidity(field, value);
         // If it is invalid it is added to the dict. (The label is used as a key and is shown to the user by the template)
         if(check_valid['invalid']){
            gisportal.addLayersForm.validation_errors[form][String(label.html())] = check_valid['message'];
            // The inut and label are set to invalid so they can be highlighted
            $(this).toggleClass('invalid', true);
            label.toggleClass('invalid', true);
         }else{
            // If there is an error there is is removed.
            if(gisportal.addLayersForm.validation_errors[form][String(label.html())]){
               delete gisportal.addLayersForm.validation_errors[form][String(label.html())];
            }
            // The classes are then also reset
            $(this).toggleClass('invalid', false);
            label.toggleClass('invalid', false);
         }
         // If there are any errors they will be shown
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

/**
* This function checks the validity of a sinle input againts the validation object
* 
* @method
* 
* @param String field - The field to be validated.
* @param String value - The the value input by the user.
*/
gisportal.addLayersForm.checkValidity = function(field, value){
   // If the filed needs validation and fails that validation the message is returned
   if(field in gisportal.addLayersForm.validation_functions){
      message = gisportal.addLayersForm.validation_functions[field](value);
      if(message){
         return {'invalid': true, 'message': message};
      }
   }
   // Otherwise invalid is sent back as false.
   return {'invalid': false};
};