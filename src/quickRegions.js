/**
 * Quick Region functions and setup
 * @namespace 
 */
opec.quickRegions = {};

opec.quickRegions.setup = function() {
   
   // Reset quick region selection if the screen is moved.
   map.events.register('moveend', map, opec.quickRegionReset);
   
   // Populate Quick Regions from the quickRegions array 
   $('.opec-quickRegion-select').each(function( index ) {
      for(var i = 0; i < opec.quickRegion.length; i++) {
         $(this).append('<option value="' + i + '">' + opec.quickRegion[i][0] + '</option>');
      }
   });
   
   // Change of quick region event handler - happens even if the selection isn't changed
   $('#quickRegion').change(function(e) {
       var qr_id = $('#quickRegion').val();
       
       if(opec.quickRegion[qr_id][0] == '+ Add Current View +') {
          var extent = map.getExtent().transform(map.projection, map.displayProjection);
          opec.addQuickRegion("Custom Region", {left: extent.left, bottom: extent.bottom, right: extent.right, top: extent.top});
          return;
       }
       
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
   $('#quickRegion').val('Choose a Region');   
};

opec.addQuickRegion = function(name, bounds) {
   var region = [name, bounds.left, bounds.bottom, bounds.right, bounds.top];         
   opec.quickRegion.splice(opec.quickRegion.length - 1, 0, region);
   var index = opec.quickRegion.length > 1 ? opec.quickRegion.length - 2 : 0;
   
   // Insert new quick region into any quick region list
   $(".opec-quickRegion-select").each(function() {
      if(index > 0) {
         $(this).find('option').eq(index).val(index + 1).before($("<option></option>").val(index).html(opec.quickRegion[index][0]));
      } else {
         $(this).append('<option value="' + index + '">' + opec.quickRegion[index][0] + '</option>');
      }
      
   });
   
   return;
};

opec.removeQuickRegion = function(index) {
   
   // Don't allow special region to be removed.
   if(opec.quickRegion[index][0] == '+ Add Current View +') { return; }
   
   opec.quickRegion.splice(index, 1);
   
   $(".opec-quickRegion-select").each(function() {
      // Remove region
      $(this).find('option').eq(index).remove();
      // Fix indexes
      $(this).find('option').slice(index).each(function() {
         $(this).val( $(this).val() - 1 );
      });
   });
};
