gisportal.view = {};

gisportal.view.loadView = function(view_name){
   $.ajax({
      url: gisportal.middlewarePath + '/settings/view?view=' + view_name,
      success: function(data) {
         data = JSON.parse(data);
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

         // Adds or removes the dragPan
         if(dragPan){
            if(data.noPan){
               dragPan.setActive(false);
            }else{
               dragPan.setActive(true);
            }
         }

         // Adds or removes the wheelZoom
         if(wheelZoom){
            if(data.noZoom){
               wheelZoom.setActive(false);
            }else{
               wheelZoom.setActive(true);
            }
         }
      }
   });
};