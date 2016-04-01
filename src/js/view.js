gisportal.view = {};

gisportal.view.loadView = function(view_name){
   $.ajax({
      url: gisportal.middlewarePath + '/settings/view?view=' + view_name,
      dataType: 'json',
      success: function(data) {
         var title = view_name;
         if(data.title){
            title = data.title;
         }
         $('.view-title p').html(title + " view").parent().toggleClass('hidden', false);

         // This listener is added the the remove view span (button)
         $('.view-title span.remove-view').off('click');
         $('.view-title span.remove-view').on('click', function(){
            gisportal.view.removeView();
         });
         data.view_name = view_name;
         gisportal.current_view = data;
         $('.hide-when-view').toggleClass('hidden', true);
         if(data.bounds){
            var extent = gisportal.reprojectBoundingBox(data.bounds, 'EPSG:4326', gisportal.projection);
            map.getView().fit(extent, map.getSize());
         }
         // Gets interactions to be potentially removed
         var dragPan = null;
         var wheelZoom = null;
         map.getInteractions().forEach(function(interaction) {
            if (interaction instanceof ol.interaction.DragPan) {
               dragPan = interaction;
            }else if (interaction instanceof ol.interaction.MouseWheelZoom) {
               wheelZoom = interaction;
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
            }else{
               wheelZoom.setActive(true);
            }
         }

         // Loads the list and displayed layers that are filtered
         if(data.layerListFilter){
            gisportal.configurePanel.filterLayersList(data.layerListFilter);
            $('.filtered-list-message').toggleClass('hidden', true);
         }
         if(data.layerLoadFilter){
            gisportal.configurePanel.filterLayersLoad(data.layerLoadFilter, data.layerListFilter);
         }
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

   $('.hide-when-view').toggleClass('hidden', false);
   $('.view-title p').html("").parent().toggleClass('hidden', true);
   if(resetBool !== false){
      gisportal.configurePanel.resetPanel(null, false);
   }
};