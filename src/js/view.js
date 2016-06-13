gisportal.view = {};

gisportal.view.loadView = function(view_name){
   $(".js-start").trigger('click');
   $.ajax({
      url: gisportal.middlewarePath + '/settings/view?view=' + view_name,
      dataType: 'json',
      success: function(data) {
         var title = view_name;
         if(data.title){
            title = data.title;
         }

         if(data.baseMap){
            // Just in case the value is wrong;
            try{
               $('#select-basemap').ddslick('select', { value: data.baseMap });
            }catch(err){}
         }

         if(data.projection){
            // Just in case the value is wrong;
            try{
               $('#select-projection').ddslick('select', { value: data.projection });
            }catch(err){}
         }
         
         $('.view-title p').html(title + " view").parent().toggleClass('hidden', false);

         // This listener is added the the remove view span (button)
         $('.view-title span.remove-view').off('click');
         $('.view-title span.remove-view').on('click', function(){
            gisportal.view.removeView();
            gisportal.events.trigger('view.removed');
         });
         data.view_name = view_name;
         gisportal.current_view = data;
         $('.hide-when-view').toggleClass('hidden', true);
         if(data.bounds){
            var extent = gisportal.reprojectBoundingBox(data.bounds, 'EPSG:4326', gisportal.projection);
            gisportal.mapFit(extent);
         }
         // Gets interactions to be potentially removed
         var dragPan = null;
         var wheelZoom = null;
         var doubleClickZoom = null;
         map.getInteractions().forEach(function(interaction) {
            if (interaction instanceof ol.interaction.DragPan) {
               dragPan = interaction;
            }else if (interaction instanceof ol.interaction.MouseWheelZoom) {
               wheelZoom = interaction;
            }else if(interaction instanceof ol.interaction.DoubleClickZoom){
               doubleClickZoom = interaction;
            }
         }, this);

         // Activates or deactivates the dragPan
         if(dragPan){
            if(data.noPan){
               dragPan.setActive(false);
            }else{
               dragPan.setActive(true);
            }
         }

         // Activates or deactivates the wheelZoom
         if(wheelZoom){
            if(data.noZoom){
               wheelZoom.setActive(false);
               doubleClickZoom.setActive(false);
               $('.ol-zoom').toggleClass('hidden', true);
            }else{
               wheelZoom.setActive(true);
               doubleClickZoom.setActive(true);
               $('.ol-zoom').toggleClass('hidden', false);
            }
         }

         if(data.graticules === true){
            $('#select-graticules').ddslick('select', { value: "On" });
         }

         if(data.graticules === false){
            $('#select-graticules').ddslick('select', { value: "Off" });
         }

         if(data.borders){
            // Just in case the value is wrong;
            try{
               $('#select-country-borders').ddslick('select', { value: data.borders });
            }catch(err){}
         }

         // Loads the list and displayed layers that are filtered
         if(data.layerListFilter){
            gisportal.configurePanel.filterLayersList(data.layerListFilter);
            $('.filtered-list-message').toggleClass('hidden', true);
         }
         if(data.layerLoadFilter){
            gisportal.configurePanel.filterLayersLoad(data.layerLoadFilter, data.layerListFilter);
         }
         $('.add-wms-form').toggleClass('hidden', true);
      },
      error: function(err, reason) {
         if(err.status === 404){
            $.notify(view_name + " could not be found in views", "error");
         }else if(reason == 'parsererror'){
            $.notify(view_name + " could not be parsed", "error");
         }else{
            $.notify("Unable to load that " + view_name + ", The server returned: " + err.statusText, "error");
         }
      }
   });
};

gisportal.view.removeView = function(resetBool){
   gisportal.current_view = null;
   // Activates all of the interactions again
   map.getInteractions().forEach(function(interaction) {
      interaction.setActive(true);
   }, this);
   $('.ol-zoom').toggleClass('hidden', false);

   $('.hide-when-view').toggleClass('hidden', false);
   $('.view-title p').html("").parent().toggleClass('hidden', true);
   $('.add-wms-form').toggleClass('hidden', false);
   if(resetBool !== false){
      gisportal.configurePanel.resetPanel(null, false);
   }
};