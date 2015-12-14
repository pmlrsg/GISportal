gisportal.panels = new EventManager();
gisportal.panels.defaultPanel = "choose-indicator";
gisportal.panels.activePanel = null;

gisportal.panels.initDOM = function() {

	$('.panel').on('click', '.js-show-panel', function() {
		gisportal.panels.showPanel($(this).data('panel-name'));
		

	});
	gisportal.panels.showPanel(gisportal.panels.defaultPanel);
};

gisportal.panels.showPanel = function(panelName) {
	gisportal.hideAllPopups();
	
	$('[data-panel-name="' + gisportal.panels.activePanel + '"]').removeClass('active');
	$('[data-panel-name="' + panelName + '"]').addClass('active');
	if (gisportal.panels.activePanel !== null) {
		gisportal.panels.trigger('close-panel', {
			"panel-name": gisportal.panels.activePanel
		});
	}
	
	gisportal.panels.activePanel = panelName;

};

gisportal.panels.bind('close-panel', function(ev, data) {

	if (data['panel-name'] === 'active-layers') {
		gisportal.events.trigger('metadata.close');
	}

});