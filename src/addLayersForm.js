gisportal.addLayersForm = {};
gisportal.addLayersForm.layers_list = {};

gisportal.addLayersForm.addlayerToList = function(layer){
   var layer_info={
      "layer":layer.displayTitle,
      "displayTitle":layer.displayTitle,
      "indicator_type":layer.tags.indicator_type,
      "abstract":layer.abstract
   };
   gisportal.addLayersForm.layers_list[_.size(gisportal.addLayersForm.layers_list)+1] = layer_info;
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
};

gisportal.addLayersForm.displayform = function(total_pages, current_page, form_div){
   var layer_form = gisportal.templates['add-layers-form'](gisportal.addLayersForm.layers_list[current_page]);
   $(form_div).html(layer_form);
   if(total_pages>1){
      gisportal.addLayersForm.displayPaginator(total_pages, current_page, form_div, 'gisportal.addLayersForm.displayform');
   }
   $('span.js-layer-form-close').on('click', function() {
         $(form_div).html();
         $('div.js-layer-form-popup').toggleClass('hidden', true);
      });
   $('div.js-layer-form-popup').toggleClass('hidden', false);
};