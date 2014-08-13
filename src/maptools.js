
gisportal.maptools = {};

gisportal.maptools.init = function() {
	$('.js-map-tools').on('click', function() {
      $('#mapToolsPanel').toggleClass('hidden', false).toggleClass('active', true);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#graphPanel').toggleClass('hidden', true).toggleClass('active', false);      
      $('#sessionSharingPanel').toggleClass('hidden', true).toggleClass('active', false);      
   });

   $('.js-hide-map-tools').on('click', function() {
      $('#mapToolsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#indicatorsPanel').toggleClass('hidden', true).toggleClass('active', false);
      $('#graphPanel').toggleClass('hidden', true).toggleClass('active', false);      
      $('#sessionSharingPanel').toggleClass('hidden', true).toggleClass('active', false);      
   });

   // load the template and set values for base map options and country border options
   $.get('templates/maptools.mst', function(template) {
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

      var rendered = Mustache.render(template, {
         baseLayers: layers,
         countryBorders: borders
      });
      $('.js-map-options').html(rendered);    

      // set an action for the base map select changing
      $('#select-basemap').change(function() {
      	map.setBaseLayer(gisportal.baseLayers[$('#select-basemap').val()]);
      });

      // set an action for the country borders select changing
	   $('#select-country-borders').change(function() {
			gisportal.createCountryBorderLayer($('#select-country-borders').val());
		});

	   // set the default value if one exists in config.js
		if (typeof gisportal.config.countryBorder != 'undefined' && typeof gisportal.config.countryBorder.defaultLayer != 'undefined' && gisportal.config.countryBorder.alwaysVisible == true) {
			$('#select-country-borders').val(gisportal.config.countryBorder.defaultLayer);
			gisportal.createCountryBorderLayer($('#select-country-borders').val());
		}
   });

   

};




