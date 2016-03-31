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
      }
   });
};