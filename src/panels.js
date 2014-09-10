gisportal.panels = {};
gisportal.panels.defaultPanel = "choose-indicator";
gisportal.panels.activePanel = null;

gisportal.panels.initDOM = function(){
	
	$('.panel').on('click', '.js-show-panel', function(){
		gisportal.panels.showPanel( $(this).data('panel-name') );
	})
	
	gisportal.panels.showPanel( gisportal.panels.defaultPanel );
}

gisportal.panels.showPanel = function( panelName ){
	
	$('[data-panel-name="' + gisportal.panels.activePanel + '"]').removeClass('active');
	$('[data-panel-name="' + panelName + '"]').addClass('active');
	gisportal.panels.activePanel = panelName;
}