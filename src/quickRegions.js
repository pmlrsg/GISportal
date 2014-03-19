/**
 * Quick Region functions and setup
 * @namespace 
 */
gisportal.quickRegions = {};

gisportal.quickRegions.setup = function() {
   
   // Reset quick region selection if the screen is moved.
   // Check if event already exists, ie. if a state has been loaded over current
   if (!map.events.listeners.moveend)
      map.events.register('moveend', map, gisportal.quickRegionReset);
  
   $('.gisportal-quickRegion-select option').remove(); 
   // Populate Quick Regions from the quickRegions array 
   $('.gisportal-quickRegion-select').each(function( index ) {
      for(var i = 0; i < gisportal.quickRegion.length; i++) {
         $(this).append('<option value="' + i + '">' + gisportal.quickRegion[i][0] + '</option>');
      }
      $(this).prepend('<option value="-1">Choose a Region</option>');
   });
   
   // Change of quick region event handler - happens even if the selection isn't changed
   $('#quickRegion').change(function(e) {
       var qr_id = $('#quickRegion').val();
             
       var bbox = new OpenLayers.Bounds(
                   gisportal.quickRegion[qr_id][1],
                   gisportal.quickRegion[qr_id][2],
                   gisportal.quickRegion[qr_id][3],
                   gisportal.quickRegion[qr_id][4]
                ).transform(map.displayProjection, map.projection);
                
       // Prevent the quick region selection being reset after the zoomtToExtent event         
       map.events.unregister('moveend', map, gisportal.quickRegionReset);
       // Do the zoom to the quick region bounds
       map.zoomToExtent(bbox);
       // Re-enable quick region reset on map pan/zoom
       map.events.register('moveend', map, gisportal.quickRegionReset);
   });
   
   $('.lPanel .gisportal-quickRegion-select').change(function(e) {
      var id = $(this).val();
      
      $('.lPanel .gisportal-quickRegion-name').val(gisportal.quickRegion[id][0]);
      $('.lPanel .gisportal-quickRegion-left').val(gisportal.quickRegion[id][1]);
      $('.lPanel .gisportal-quickRegion-bottom').val(gisportal.quickRegion[id][2]);
      $('.lPanel .gisportal-quickRegion-right').val(gisportal.quickRegion[id][3]);
      $('.lPanel .gisportal-quickRegion-top').val(gisportal.quickRegion[id][4]);         
   });
};

/**
 * Handles re-set of the quick region selector after zooming in or out on the 
 * map or panning.
 */ 
gisportal.quickRegionReset = function(e) {
   $('#quickRegion').val(-1);   
};

gisportal.addQuickRegion = function(name, bounds) {
   var region = [name, bounds.left, bounds.bottom, bounds.right, bounds.top];         
   gisportal.quickRegion[gisportal.quickRegion.length] = region;
   var index = gisportal.quickRegion.length - 1;
   
   // Insert new quick region into any quick region list
   $(".gisportal-quickRegion-select").each(function() {
      $(this).append('<option value="' + index + '">' + gisportal.quickRegion[index][0] + '</option>');
   });
   
   return;
};

gisportal.addCurrentView = function()  {
    var extent = map.getExtent().transform(map.projection, map.displayProjection);
    gisportal.addQuickRegion("Custom Region", {left: extent.left, bottom: extent.bottom, right: extent.right, top: extent.top});
    return;
}


gisportal.removeQuickRegion = function(index) {
   if (index === "-1") return;
   gisportal.quickRegion.splice(index, 1);
   
   $(".gisportal-quickRegion-select").each(function() {
      // Remove region
      $(this).find('option[value="' + index + '"]').remove();
      // Fix indexes
      $(this).find('option').slice(parseInt(index) + 1).each(function() {
         $(this).val( $(this).val() - 1 );
      });
   });
};
