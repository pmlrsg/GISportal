// multi-accordion jQuery custom plugin similar to jQuery UI's accordion
// except multiple sections can be concurrently expanded
// http://forum.jquery.com/topic/expand-all-zones-for-an-accordion#14737000002919405
// Modified by Martyn Atkins 22/05/2012
(function ($) {
	$.fn.multiAccordion = function(options) {
		// Create some defaults, extending them with any options that were provided
		var defaults = {
			'expanded' : true
		};
		$.extend(defaults, options);	
		
		// Chained selectors
		$(this).addClass("ui-accordion ui-accordion-icons ui-widget ui-helper-reset")
			.find("h3")
				.addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons")
				.hover(function() {
					$(this).toggleClass("ui-state-hover");
				})
				.prepend('<span class="ui-icon ui-icon-triangle-1-e"></span>')
				.click(function() {
					$(this)
						.toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
						.find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
						.next().toggleClass("ui-accordion-content-active").slideToggle();
					return false;
				})
				.next()
					.addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
					.css("display", "block")
					.hide();
		// End chaining
		
		// If the expanded option is set to true, this fires the click event to expand the <h3> accordions
		if (defaults.expanded) {
			$(this).find("h3").trigger("click");
		}
	};
})(jQuery);