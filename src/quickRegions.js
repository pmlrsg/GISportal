/**
 * Quick Region functions and setup
 * @namespace 
 */
opec.quickRegions = {};

opec.quickRegions.setup = function() {
   
   // Reset quick region selection if the screen is moved.
   // Check if event already exists, ie. if a state has been loaded over current
   if (!map.events.listeners.moveend)
      map.events.register('moveend', map, opec.quickRegionReset);
  
   $('.opec-quickRegion-select option').remove(); 
   // Populate Quick Regions from the quickRegions array 
   $('.opec-quickRegion-select').each(function( index ) {
      for(var i = 0; i < opec.quickRegion.length; i++) {
         $(this).append('<option value="' + i + '">' + opec.quickRegion[i][0] + '</option>');
      }
      $(this).prepend('<option value="-1">Choose a Region</option>');
   });
   
   // Change of quick region event handler - happens even if the selection isn't changed
   $('#quickRegion').change(function(e) {
       var qr_id = $('#quickRegion').val();
             
       var bbox = new OpenLayers.Bounds(
                   opec.quickRegion[qr_id][1],
                   opec.quickRegion[qr_id][2],
                   opec.quickRegion[qr_id][3],
                   opec.quickRegion[qr_id][4]
                ).transform(map.displayProjection, map.projection);
                
       // Prevent the quick region selection being reset after the zoomtToExtent event         
       map.events.unregister('moveend', map, opec.quickRegionReset);
       // Do the zoom to the quick region bounds
       map.zoomToExtent(bbox);
       // Re-enable quick region reset on map pan/zoom
       map.events.register('moveend', map, opec.quickRegionReset);
   });
   
   $('.lPanel .opec-quickRegion-select').change(function(e) {
      var id = $(this).val();
      
      $('.lPanel .opec-quickRegion-name').val(opec.quickRegion[id][0]);
      $('.lPanel .opec-quickRegion-left').val(opec.quickRegion[id][1]);
      $('.lPanel .opec-quickRegion-bottom').val(opec.quickRegion[id][2]);
      $('.lPanel .opec-quickRegion-right').val(opec.quickRegion[id][3]);
      $('.lPanel .opec-quickRegion-top').val(opec.quickRegion[id][4]);         
   });
};

/**
 * Handles re-set of the quick region selector after zooming in or out on the 
 * map or panning.
 */ 
opec.quickRegionReset = function(e) {
   $('#quickRegion').val(-1);   
};

opec.addQuickRegion = function(name, bounds) {
   var region = [name, bounds.left, bounds.bottom, bounds.right, bounds.top];         
   opec.quickRegion[opec.quickRegion.length] = region;
   var index = opec.quickRegion.length - 1;
   
   // Insert new quick region into any quick region list
   $(".opec-quickRegion-select").each(function() {
      $(this).append('<option value="' + index + '">' + opec.quickRegion[index][0] + '</option>');
   });
   
   return;
};

opec.addCurrentView = function()  {
    var extent = map.getExtent().transform(map.projection, map.displayProjection);
    opec.addQuickRegion("Custom Region", {left: extent.left, bottom: extent.bottom, right: extent.right, top: extent.top});
    return;
}


opec.removeQuickRegion = function(index) {
   if (index === "-1") return;
   opec.quickRegion.splice(index, 1);
   
   $(".opec-quickRegion-select").each(function() {
      // Remove region
      $(this).find('option[value="' + index + '"]').remove();
      // Fix indexes
      $(this).find('option').slice(parseInt(index) + 1).each(function() {
         $(this).val( $(this).val() - 1 );
      });
   });
};
