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

gisportal.panels.userFeedback = function(message, given_function, string_error){
	var popup = $('div.js-user-feedback-popup');
	popup.toggleClass('hidden', false);
	var html = $('div.js-user-feedback-html');
	var popup_content = gisportal.templates['user-feedback-popup']({"message":message, "function": given_function, "string_error":string_error});
	html.html(popup_content);
	$('.js-user-feedback-close').on('click', function(e) {
		e.preventDefault();
      $('div.js-user-feedback-popup').toggleClass('hidden', true);
   });
	$('.js-user-feedback-submit').on('click', function(e) {
		e.preventDefault();
		var str = $('.user-feedback-input').val()
		if(/^[a-zA-Z0-9 _]+$/.test(str)){
			given_function(str);
	      $('div.js-user-feedback-popup').toggleClass('hidden', true);
	   }else{
	   	//error
	   	gisportal.panels.userFeedback(message, given_function, true);
	   }

   });

}