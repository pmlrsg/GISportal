gisportal.panels = new EventManager();
gisportal.panels.defaultPanel = "choose-indicator";
gisportal.panels.activePanel = null;

gisportal.panels.initDOM = function() {

	$('.js-show-panel').on('click', function() {
		var panelName = $(this).data('panel-name');
		gisportal.panels.showPanel(panelName);
		if(!panelName.startsWith("collab-")){
			var params = {
		      "event" : "panels.showpanel",
		      "panelName" : panelName
		   };
			gisportal.events.trigger('panels.showpanel', params);
		}
	});
	gisportal.panels.showPanel(gisportal.panels.defaultPanel);
	gisportal.panels.showPanel("collab-home");
};

gisportal.panels.showPanel = function(panelName) {
	var collab = panelName.startsWith('collab-');
	if(!collab){
		gisportal.hideAllPopups();
		if(panelName != "refine-indicator"){
			if(gisportal.config.browseMode != "simplelist"){
				$('.dd-container').ddslick('close');
			}
			gisportal.configurePanel.reset();
		}
		
		$('.panel [data-panel-name="' + gisportal.panels.activePanel + '"]').removeClass('active');
		$('.panel [data-panel-name="' + panelName + '"]').addClass('active');
		if (gisportal.panels.activePanel !== null) {
			gisportal.panels.trigger('close-panel', {
				"panel-name": gisportal.panels.activePanel
			});
		}
		if(gisportal.panels.activePanel == "choose-indicator" && $('#refine-layers')[0]){
			// Makes sure the ddslick is always open;
			$('#refine-layers').ddslick('close');
			$('#refine-layers').ddslick('open');
		}
		gisportal.panels.activePanel = panelName;
	}else{
		$('.collaboration-panel [data-panel-name="' + collaboration.activePanel + '"]').removeClass('active');
		$('.collaboration-panel [data-panel-name="' + panelName + '"]').addClass('active');
		if(panelName == "collab-chat"){
			$('.message-input').select();
         if($('.messages').scrollTop() + $('.messages').innerHeight() >= $('.messages')[0].scrollHeight){
            gisportal.pageTitleNotification.Off();
         }
		}
		collaboration.activePanel = panelName;
	}

};

gisportal.panels.bind('close-panel', function(ev, data) {

	if (data['panel-name'] === 'active-layers') {
		gisportal.events.trigger('metadata.close');
	}

});

// This produces a popup that takes a user input and runs it through a given function. recalls itself with a string_error boolean of true to display an error.
gisportal.panels.userFeedback = function(message, given_function, string_error){
	var popup = $('div.js-user-feedback-popup');
	popup.toggleClass('hidden', false);
	var html = $('div.js-user-feedback-html');
	var popup_content = gisportal.templates['user-feedback-popup']({"message":message, "function": given_function, "string_error":string_error});
	html.html(popup_content);
	$('.js-user-feedback-close').on('click', function(e) {
		e.preventDefault();
      $('div.js-user-feedback-popup').toggleClass('hidden', true);
      var params = {
	      "event": "userFeedback.close"
	   };
      gisportal.events.trigger('userFeedback.close', params);
   });
	$('.js-user-feedback-submit').on('click', function(e) {
		e.preventDefault();
		var str = $('.user-feedback-input').val();
	   var params = {
	      "event": "userFeedback.submit"
	   };
      gisportal.events.trigger('userFeedback.submit', params);
		if(/^[a-zA-Z _][a-zA-Z0-9 _]+$/.test(str) && str.length < 50){
			given_function(str);
	      $('div.js-user-feedback-popup').toggleClass('hidden', true);
	   }else{
	   	//error
	   	gisportal.panels.userFeedback(message, given_function, true);
	   }

   });
   $('.user-feedback-input').select().on('change keyup paste', function(e){
   	var value = $(this).val();
   	if(e.type == "paste"){
   		try{
         	value = e.originalEvent.clipboardData.getData('text/plain');
         }catch(err){}
      }
      var params = {
	      "event": "userFeedback.input",
	      "inputValue": value
	   };
      gisportal.events.trigger('userFeedback.input', params);
   });

};