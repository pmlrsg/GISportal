opec.window.createMetadata = function(layer) {
   if(layer === null)
      return;
   
   // Check if already open
   if($('#metadata-' + layer.id).length)
      $('#metadata-' + layer.id).extendedDialog('close');
      
   var data = {
      id: layer.id,
      displayTitle: layer.displayTitle,
      northBoundLat: layer.exBoundingBox.NorthBoundLatitude,
      eastBoundLon: layer.exBoundingBox.EastBoundLongitude,
      southBoundLat: layer.exBoundingBox.SouthBoundLatitude,
      westBoundLon: layer.exBoundingBox.WestBoundLongitude,
      addDateRange: layer.temporal,
      productAbstract: layer.productAbstract,
      firstDate: layer.firstDate,
      lastDate: layer.lastDate  
   };
     
   // Add the html to the document using a template
   $(document.body).append(opec.templates.metadataWindow(data));
   
   // Show metadata for a selected layer
   $('#metadata-' + layer.id).extendedDialog({
      position: ['center', 'center'],
      width: 400,
      height: 250,
      resizable: true,
      autoOpen: false,
      close: function() {
         $('#metadata-' + layer.id).remove();
      },
      showHelp: false,
      showMinimise: true,
      dblclick: "collapse"
   });   
   
   //Open dialog
   $('#metadata-' + layer.id).extendedDialog('open'); 
};
