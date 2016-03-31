gisportal.view = {};

gisportal.view.loadView = function(view_name){
   $.ajax({
      url: gisportal.middlewarePath + '/settings/view?view=' + view_name,
      success: function(data) {
         data = JSON.parse(data);
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
         }
         if(data.layerLoadFilter){
            gisportal.configurePanel.filterLayersLoad(data.layerLoadFilter);
         }
      }
   });
};

gisportal.view.removeView = function(view_name){
   gisportal.current_view = null;
   // Activates all of the interactions again
   map.getInteractions().forEach(function(interaction) {
      interaction.setActive(true);
   }, this);

   $('.hide-when-view').toggleClass('hidden', false);

};