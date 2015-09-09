gisportal.add_vector_demo = function() {


   var sourceVector = new ol.source.Vector({
      loader: function(extent) {
         console.log('called');
         $.ajax('https://vortices.npm.ac.uk/geoserver/rsg/ows', {
            type: 'GET',
            data: {
               service: 'WFS',
               version: '1.1.0',
               request: 'GetFeature',
               typename: 'rsg:full_10m_borders',
               srsname: 'EPSG:4326',
               maxFeatures: 100,
               bbox: extent.join(',') + ',EPSG:4326'
            },
         }).done(function(response) {
            console.log(this);
            formatWFS = new ol.format.WFS();
            var features = formatWFS.readFeatures(response);
            for (var i = 0; i < features.length; i++) {
               features[i].getGeometry().applyTransform(function(coords, coords2, stride) {
                  for (var j = 0; j < coords.length; j += stride) {
                     var y = coords[j];
                     var x = coords[j + 1];
                     coords[j] = x;
                     coords[j + 1] = y;
                  }
               });
            }
            sourceVector.addFeatures(features);
         });
      },
      strategy: ol.loadingstrategy.bbox
   });

   

   layerVector = new ol.layer.Vector({
      source: sourceVector,
      style: new ol.style.Style({
         stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 1.0)',
            width: 2
         })
      })
   });

   map.addLayer(layerVector);

};