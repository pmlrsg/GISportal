
gisportal.map_settings = {};

gisportal.map_settings.init = function() {

   // load the template and set values for base map options and country border options
   var layers = [];
   _.forEach(gisportal.baseLayers, function(d)  {
      var layer = {};
      layer.id = d.id;
      layer.name = d.name;
      layers.push(layer);
   });

   var borders = [];
   _.forEach(gisportal.countryBorderLayers, function(d) {
   	var border = {};
      border.id = d.id;
      border.name = d.name;
      borders.push(border);
   })

   var data = {
      baseLayers: layers,
      countryBorders: borders
   }
   var rendered = gisportal.templates['map-settings'](data)
   $('.js-map-options').html(rendered);    

   // set an action for the base map select changing
   $('#select-basemap').change(function() {
   	map.setBaseLayer(gisportal.baseLayers[$('#select-basemap').val()]);
   	gisportal.events.trigger('displayoptions.basemap', ['select-basemap', $(this).val(), 'Base map changed to '+ $('#select-basemap option:selected').text() ])
   });

   // set an action for the country borders select changing
   $('#select-country-borders').change(function() {
		gisportal.createCountryBorderLayer($('#select-country-borders').val());
		gisportal.events.trigger('displayoptions.basemap', ['select-country-borders', $(this).val(), 'Country borders set to \''+ $('#select-country-borders option:selected').text() +'\'' ])
	});

   // set the default value if one exists in config.js
	if (typeof gisportal.config.countryBorder != 'undefined' && typeof gisportal.config.countryBorder.defaultLayer != 'undefined' && gisportal.config.countryBorder.alwaysVisible == true) {
		$('#select-country-borders').val(gisportal.config.countryBorder.defaultLayer);
		gisportal.createCountryBorderLayer($('#select-country-borders').val());
	}

   if (typeof gisportal.config.defaultBaseMap != 'undefined' && typeof(gisportal.baseLayers[gisportal.config.defaultBaseMap]) != 'undefined') {
      $('#select-basemap').val(gisportal.config.defaultBaseMap);
      map.setBaseLayer(gisportal.baseLayers[gisportal.config.defaultBaseMap]);
   }

};

