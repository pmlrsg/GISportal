gisportal.walkthrough = {};

gisportal.walkthrough.init = function(){
   this.starting_recording = false;
   this.is_recording = false;
   this.walkthrough_playing = false;
   this.current_step = 0;
   this.paused = false;
   this.playback_speed = 1;
};

gisportal.walkthrough.init();
gisportal.walkthrough.tooltipster_elements = [];

gisportal.walkthrough.startRecording = function(title){
   var WT = gisportal.walkthrough;
   WT.recording_object = {
      'title': title,
      'step':{
         '0':{
            'delay': 0,
            'state': gisportal.saveState()
         }
      },
      'owner': gisportal.user.info.email
   };
   WT.is_recording = true;
   WT.starting_recording = false;
   WT.last_step_time = new Date();
   WT.renderControls();
};

$(document).on("click", function(ev) {
   if(gisportal.walkthrough.walkthrough_playing){
      $('.js-next-step-walkthrough-tooltip').each(function(){
         var rect = this.getBoundingClientRect();
         if(ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY <= rect.bottom && ev.clientY >= rect.top){
            $(this).trigger('click');
         }
      });
   }
});

gisportal.walkthrough.addStep = function(data){
   if(_.isMatch(gisportal.walkthrough.recording_object.step[_.size(gisportal.walkthrough.recording_object.step)-1].data, data)){
      return;
   }
   gisportal.walkthrough.recording_object.step[_.size(gisportal.walkthrough.recording_object.step)] = {
      'data': data,
      'delay': parseFloat(((new Date() - gisportal.walkthrough.last_step_time)/1000).toFixed(2)),
      'description': gisportal.api[data.event](data, {describeOnly: true})
   };
   gisportal.walkthrough.last_step_time = new Date();
};

gisportal.walkthrough.renderControls = function(){
   var rendered = gisportal.templates['walkthrough-controls'](gisportal.walkthrough);
   $('.controls-holder').html(rendered);
   $('.js-start-record').on('click', function(){
      gisportal.panels.userFeedback("Please enter a walkthrough title", gisportal.walkthrough.startRecording);
   });
   $('.js-stop-record').on('click', function(){
      gisportal.walkthrough.is_recording = false;
      gisportal.walkthrough.last_step_time = null;
      gisportal.walkthrough.renderControls();
      gisportal.walkthrough.loadEditForm();
      if(gisportal.user.info.permission == "admin"){
         $('.walkthrough-record').toggleClass("hidden", false);
         $('.walkthroughs-manage').toggleClass("hidden", false);
      }
   });
   $('.js-play-walkthrough').on('click', function(){
      gisportal.hideModalMessage();
      gisportal.walkthrough.paused = false;
      gisportal.walkthrough.nextStep();
      gisportal.walkthrough.renderControls();
   });
   $('.js-pause-walkthrough').on('click', function(){
      gisportal.walkthrough.paused = true;
      clearTimeout(gisportal.walkthrough.timeout);
      gisportal.walkthrough.renderControls();
   });
   $('.js-skip-step-walkthrough').on('click', function(){
      gisportal.walkthrough.nextStep(true);
   });
   $('.js-back-step-walkthrough').on('click', function(){
      gisportal.walkthrough.backStep(true);
   });
   $('.js-walkthrough-speed').val(this.playback_speed).on('change', function(){
      gisportal.walkthrough.playback_speed = parseInt($(this).val());
   });
   $('.js-walkthrough-playing-close').on('click', function(){
      gisportal.walkthrough.finished();
   });
   $('.js-walkthrough-recording-close').on('click', function(){
      gisportal.walkthrough.is_recording = false;
      gisportal.walkthrough.starting_recording = false;
      gisportal.walkthrough.last_step_time = null;
      gisportal.walkthrough.renderControls();
      gisportal.walkthrough.recording_object = {};
      if(gisportal.user.info.permission == "admin"){
         $('.walkthrough-record').toggleClass("hidden", false);
         $('.walkthroughs-manage').toggleClass("hidden", false);
      }
   });
};

gisportal.walkthrough.loadEditForm = function(){
   $( '.js-edit-walkthrough-popup' ).toggleClass('hidden', false);
   // Makes sure that the pause and logged_in_user variables are set to booleans (JSON sometimes stores it as strings)
   for(var step in gisportal.walkthrough.recording_object.step){
      var this_step = gisportal.walkthrough.recording_object.step[step];
      this_step.pause_here = this_step.pause_here && this_step.pause_here.toString() == "true";
      this_step.click_element_to_continue = this_step.click_element_to_continue && this_step.click_element_to_continue.toString() == "true";
      this_step.requires_logged_in_user = this_step.requires_logged_in_user && this_step.requires_logged_in_user.toString() == "true";
   }
   var template = gisportal.templates['walkthrough-form'](gisportal.walkthrough.recording_object);
   $( '.js-edit-walkthrough-html' ).html(template);

   // Adds the spinners to all of the timeouts
   $('.js-edit-walkthrough-html input.spinner').spinner({
      min: 0,
      max: 999.99,
      step: 0.05,
      change: function( event, ui ) {
         gisportal.walkthrough.recording_object.step[$(this).data('step')].delay = $(this).val();
      }
   });
   // Closes the form and deletes the recording object
   $('.js-walkthrough-form-close').on('click', function(){
      $( '.js-edit-walkthrough-popup' ).toggleClass('hidden', true);
      $( '.js-edit-walkthrough-html' ).html("");
      gisportal.walkthrough.recording_object = {};
   });

   // Submits the form. The data object is sent to the middleware to be saved
   $('button.walkthrough-form-submit').on('click', function(e){
      $.ajax({
         url: gisportal.middlewarePath + '/settings/save_walkthrough',
         method:'POST',
         dataType: 'json',
         data: gisportal.walkthrough.recording_object,
         // If there is success
         success: function(data){
            $('.js-walkthrough-form-close').trigger('click');
            gisportal.walkthrough.loadWalkthroughList();
         },
         error: function(e){
            function retry(new_title){
               $('.title-input').val(new_title).trigger('change');
               $('button.walkthrough-form-submit').trigger('click');
            }
            if(e.responseText == "Filename Taken"){
               gisportal.panels.userFeedback("This walkthrough name is already taken, please try again", retry);
            }else{
               $.notify("Error submitting this walkthrough, please try again", "error");
            }
         }
      });
   });

   // Closes the form and deletes the recording object
   $('button.walkthrough-form-cancel').on('click', function(e){
      $('.js-walkthrough-form-close').trigger('click');
   });

   // Changes the title of the walkthrough
   $('.title-input').on('change', function(){
      var title = $(this).val();
      $('.walkthrough-temp-title').html(title);
      gisportal.walkthrough.recording_object.title = title;
   });

   // Changes the start text of the walkthrough
   $('.start-text-input').on('change', function(){
      gisportal.walkthrough.recording_object.start_text = $(this).val();
   });

   // Changes the requires_logged_in_user of the walkthrough
   $('.requires-logged-in-user-toggle').on('change', function(){
      gisportal.walkthrough.recording_object.requires_logged_in_user = $(this).is(':checked');
   });

   // Deletes a step in the walkthrough.
   $('.js-delete-step').on('click', function(){
      var _this = this;
      var step = parseInt($(this).data('step'));
      $(this).notify({'title':"Are you sure you want to delete this step?\nDeleting this step may cause others to not work if they are dependant on this step. Remove any dependant steps and test the walkthrough.", "yes-text":"Yes", "no-text":"No"},{style:"gisportal-delete-step", autoHide:false});
      
      //listen for click events from this style
      $(document).off('click', '.notifyjs-gisportal-delete-step-base .no');
      $(document).one('click', '.notifyjs-gisportal-delete-step-base .no', function() {
         //hide notification
         $(this).trigger('notify-hide');
         $(document).off('click', '.notifyjs-gisportal-delete-step-base .no, .notifyjs-gisportal-delete-step-base .yes');
      });
      $(document).off('click', '.notifyjs-gisportal-delete-step-base .yes');
      $(document).one('click', '.notifyjs-gisportal-delete-step-base .yes', function() {
         //hide notification
         $(this).trigger('notify-hide');
         $(document).off('click', '.notifyjs-gisportal-delete-step-base .no, .notifyjs-gisportal-delete-step-base .yes');
         var i;
         for(i = step; i < _.size(gisportal.walkthrough.recording_object.step)-1; i++){
            gisportal.walkthrough.recording_object.step[i] = gisportal.walkthrough.recording_object.step[(i+1)];
         }
         delete gisportal.walkthrough.recording_object.step[i];
         $( '.js-edit-walkthrough-html' ).html("");
         gisportal.walkthrough.loadEditForm();
      });
   });

   // Adds a step in the walkthrough.
   $('.js-add-step').on('click', function(){
      var _this = this;
      var step = parseInt($(this).data('step')) + 1;
      
      //hide notification
      var i;
      for(i = _.size(gisportal.walkthrough.recording_object.step); i > step; i--){
         gisportal.walkthrough.recording_object.step[i] = gisportal.walkthrough.recording_object.step[(i-1)];
      }
      gisportal.walkthrough.recording_object.step[i] = {
         'delay': 1,
         'description': "Message",
         'message': "Please enter a message"
      };
      $( '.js-edit-walkthrough-html' ).html("");
      gisportal.walkthrough.loadEditForm();
   });
   // Populates the owner select box
   gisportal.addLayersForm.showOwnerOptions(gisportal.walkthrough.recording_object.owner, $("select.owner-input"));
   // Changes the owner of the walkthrough
   $('select.owner-input').on('change', function(){
      gisportal.walkthrough.recording_object.owner = $(this).val();
   });

   // Changes the message of the step
   $('.message-input').on('change', function(){
      gisportal.walkthrough.recording_object.step[$(this).data('step')].message = $(this).val();
   });

   // Changes the pause_here of the step
   $('.pause-here-toggle').on('change', function(){
      gisportal.walkthrough.recording_object.step[$(this).data('step')].pause_here = $(this).is(':checked');
   });

   // Changes the click_element_to_continue of the step
   $('.click-element-to-continue-toggle').on('change', function(){
      gisportal.walkthrough.recording_object.step[$(this).data('step')].click_element_to_continue = $(this).is(':checked');
   });

   // Changes the selector of the step
   $('.selector-input').on('change', function(){
      gisportal.walkthrough.recording_object.step[$(this).data('step')].selector = $(this).val();
   });

   // Changes the selector of the step
   $('.default-selector').on('click', function(){
      var selector;
      var this_step = $(this).data('step');
      var data = gisportal.walkthrough.recording_object.step[this_step].data;
      if(data){
         selector = gisportal.api[data.event](data, {selectorOnly: true});
      }
      var input = $('.selector-input[data-step="' + this_step + '"]');
      if(selector){
         input.val(selector).trigger('change');
      }else{
         input.notify("This step uses no specific element");
      }
   });
};

gisportal.walkthrough.loadWalkthrough = function(walkthrough, owner){
   $.ajax({
      url: gisportal.middlewarePath + '/settings/walkthrough?walkthrough=' + encodeURI(walkthrough) + '&owner=' + encodeURI(owner),
      dataType: 'json',
      success: function(data) {
         // Removes any notifies from the other walkthroughs so that users cannot revert to a previous state and mess everything up
         $('.notifyjs-gisportal-walkthrough-option-base div:contains("Would you like to")').closest('.notifyjs-wrapper').remove();
         gisportal.walkthrough.walkthrough = data;
         gisportal.walkthrough.walkthrough_playing = true;
         gisportal.walkthrough.paused = true;
         gisportal.walkthrough.renderControls();
         gisportal.walkthrough.current_step = 0;
         gisportal.walkthrough.state_before_walkthrough = gisportal.saveState();
         $('.collab-overlay').toggleClass('hidden', false);
         var state = data.step[0].state;
         if(state){
            gisportal.stopLoadState = false;
            gisportal.loadState(state);
         }
         if(data.requires_logged_in_user){
            $('.js-google-auth-button').trigger('click');
         }
         var start_text = data.start_text;
         if(!start_text){
            start_text = "You have loaded a walkthrough, You can use the panel at the top to control the walkthrough. When you have finished, you will have the option to carry on, or go back to where you started from.";
         }
         var holder = $('.js-modal-message-popup');
         var target = $('.js-modal-message-html');
         target.html(start_text + '</br><button class="brand secondary js-start-walkthrough">Start</button>');
         holder.toggleClass('hidden', false);
         if(gisportal.modalTimeout){
            clearTimeout(gisportal.modalTimeout);
         }
         $('.js-start-walkthrough').on('click', function(){
            $('.js-play-walkthrough').trigger('click');
         });

         // The keydown event listener is removed from the document so that there is only ever one on there.
         $(document).off('keydown', gisportal.walkthrough.keydownListener);

         // The keydown event listener that is added allows for the user to control the walkthrough.
         $(document).on( 'keydown', gisportal.walkthrough.keydownListener);
         var params = {
            "event": "room.presenter-state-update",
            "state": gisportal.saveState(),
            "force": true
         };
         gisportal.events.trigger('room.presenter-state-update', params);
      }
   });
};

gisportal.walkthrough.loadWalkthroughList = function(){
   $('.walkthrough-user-panel').toggleClass('hidden', false);
   $.ajax({
      url: gisportal.middlewarePath + '/settings/get_walkthroughs',
      dataType: 'json',
      success: function(data) {
         if(data.length > 0){
            $('.walkthrough-select').toggleClass('hidden', false);
            $('select.js-walkthrough-list').html("<option value='default' selected disabled>Please select a walkthrough...</option>");
            for(var walkthrough in data){
               $('select.js-walkthrough-list').append("<option data-owner='" + data[walkthrough].owner + "' value='" + data[walkthrough].title + "'>" + data[walkthrough].title + "</option>");
            }
            $('select.js-walkthrough-list').off('change');
            $('select.js-walkthrough-list').on('change', function(){
               gisportal.walkthrough.loadWalkthrough($(this).val(), $(this).find('option[value="' + $(this).val() + '"]').data('owner'));
            });
         }else{
            $('.walkthrough-select').toggleClass('hidden', true);
            if(gisportal.user.info.permission != "admin" || gisportal.walkthrough.is_recording){
               $('.walkthrough-user-panel').toggleClass('hidden', true);
            }
         }
      },
      error: function(error) {
         $('.walkthrough-select').toggleClass('hidden', true);
      }
   });
};

gisportal.walkthrough.nextStep = function(force){
   var WT = this;
   clearTimeout(WT.timeout);
   if(!WT.walkthrough.step[WT.current_step + 1]){
      return WT.finished();
   }
   var timeout = WT.walkthrough.step[WT.current_step + 1].delay * 1000;

   if(force){
      timeout = 250;
   }
   if(WT.playback_speed == 2 || timeout < 250){
      timeout = 250;
   }
   WT.timeout = setTimeout(function(){
      // While still loading
      if(gisportal.loading.counter !== 0){
         return setTimeout(function(){
            WT.nextStep(true);
         },100);
      }
      WT.walkthrough.step[WT.current_step].state = gisportal.saveState();
      WT.current_step++;
      var this_step = WT.walkthrough.step[WT.current_step];
      if(this_step.data){
         gisportal.api[this_step.data.event](this_step.data, {highlight: true});
      }
      this_step.pause_here = this_step.pause_here && this_step.pause_here.toString() == "true";
      if(this_step.pause_here){
         $('.js-pause-walkthrough').trigger('click');
      }
      gisportal.walkthrough.removeTooltips();
      var popup_string = this_step.message;
      if(!popup_string && this_step.pause_here){
         popup_string = "The walkthrough has been paused";
      }
      if(popup_string){
         if(this_step.pause_here){
            var text = "Continue";
            if(WT.current_step >= _.size(WT.walkthrough.step)-1){
               text = "Finish";
            }
            popup_string += '</br><button class="brand secondary js-next-step-walkthrough-tooltip">' + text + '</button>';
         }
         if(this_step.selector){
            if(this_step.click_element_to_continue){
               $(this_step.selector).toggleClass('js-next-step-walkthrough-tooltip', true);
            }
            gisportal.walkthrough.highlightElementOverlay(this_step.selector);
            WT.elemTooltip(popup_string, this_step.selector);
         }else{
            WT.elemTooltip(popup_string, ".controls-holder", hideArrow = true);
         }
      }else if(WT.playback_speed === 0 || (this_step.pause_here)){
         WT.elemTooltip("Click 'Forward' to run the next step", ".controls-holder", hideArrow = true);
      }
      if(WT.current_step >= _.size(WT.walkthrough.step)-1 && !(this_step.pause_here)){
         return WT.finished();
      }
      if(!WT.paused && WT.playback_speed !== 0 && !(this_step.pause_here)){
         WT.nextStep();
      }
      $('.js-next-step-walkthrough-tooltip').on('click', function(e){
         e.preventDefault();
         $(this).toggleClass('js-next-step-walkthrough-tooltip', false);
         gisportal.walkthrough.paused = false;
         gisportal.walkthrough.renderControls();
         $('.js-skip-step-walkthrough').trigger('click');
      });
   }, timeout);
};

gisportal.walkthrough.backStep = function(force){
   var WT = this;
   clearTimeout(WT.timeout);
   if(!WT.walkthrough.step[WT.current_step - 1]){
      return;
   }
   gisportal.walkthrough.removeTooltips();
   var state = WT.walkthrough.step[WT.current_step - 1].state;
   gisportal.stopLoadState = false;
   gisportal.loadState(state);
   WT.current_step--;
   $('.js-pause-walkthrough').trigger('click');
   if(collaboration.role == "presenter"){
      var params = {
         "event": "room.presenter-state-update",
         "state": state,
         "force": true
      };
      gisportal.events.trigger('room.presenter-state-update', params);
   }
};

gisportal.walkthrough.finished = function(){
   if(gisportal.utils.getURLParameter('walkthrough_popup')){
      self.close();
   }
   var state = this.state_before_walkthrough;
   this.destroyWalkthrough();
   if(!state){
      return $.notify("The walkhrough has now finished");
   }
   $.notify({'title':"Would you like to continue from here or go back to how things were before?", "yes-text":"Revert", "no-text":"Continue"},{style:"gisportal-walkthrough-option", autoHide:false});
   $(document).off('click', '.notifyjs-gisportal-walkthrough-option-base .no, .notifyjs-gisportal-walkthrough-option-base .yes');
   $(document).one('click', '.notifyjs-gisportal-walkthrough-option-base .no', function() {
      //hide notification
      $(this).trigger('notify-hide');
      gisportal.walkthrough.state_before_walkthrough = null;
   });
   $(document).one('click', '.notifyjs-gisportal-walkthrough-option-base .yes', function() {
      if(state){
         gisportal.stopLoadState = false;
         gisportal.loadState(state);
      }
      gisportal.walkthrough.state_before_walkthrough = null;
      $(this).trigger('notify-hide');
   });
};

gisportal.walkthrough.elemTooltip = function(text, elem, hideArrow){
   this.tooltipster_elements.push(elem);
   $(elem).tooltipster({
      contentCloning: true,
      maxWidth: 300,
      content: $.parseHTML(text),
      arrow: !hideArrow,
      trigger:"custom",
      updateAnimation: null
   });
   $(elem).tooltipster('enable');
   $(elem).tooltipster('content', $.parseHTML(text));
   $(elem).tooltipster('open');
};

gisportal.walkthrough.removeTooltips = function(){
   gisportal.walkthrough.hideHighlightOverlay();
   for(var elem in this.tooltipster_elements){
      var _this = $(this.tooltipster_elements[elem]);
      _this.tooltipster('disable');
   }
   this.tooltipster_elements = [];
};

gisportal.walkthrough.highlightElementOverlay = function(elem){
   elem = $(elem);
   if(!elem[0]){
      return gisportal.walkthrough.hideHighlightOverlay();
   }
   $('.walkthrough-highlight-overlay').toggleClass('hidden', false).css({
      width: ((elem[0].clientWidth || elem.innerWidth()) + 20) + "px",
      height: ((elem[0].clientHeight || elem.innerHeight()) + 20) + "px",
      left: (elem.offset().left - 10) + "px",
      top: (elem.offset().top - 10) + "px"
   });
};

gisportal.walkthrough.hideHighlightOverlay = function(){
   $('.walkthrough-highlight-overlay').toggleClass('hidden', true);
};

gisportal.walkthrough.keydownListener = function(e){
   if(gisportal.walkthrough.walkthrough_playing){
      switch(e.keyCode){
         case 13:
         case 32:
            if($('.js-next-step-walkthrough-tooltip').length > 0){
               $('.js-next-step-walkthrough-tooltip').trigger('click');
            }else if(gisportal.walkthrough.paused){
               $('.js-play-walkthrough').trigger('click');
            }else{
               $('.js-pause-walkthrough').trigger('click');
            }
            break;
         case 37:
         case 38:
            $('.js-back-step-walkthrough').trigger('click');
            break;
         case 39:
         case 40:
            $('.js-skip-step-walkthrough').trigger('click');
            break;
      }
   }
};

gisportal.walkthrough.destroyWalkthrough = function(){
   this.removeTooltips();
   if(this.timeout){
      clearTimeout(this.timeout);
   }
   if(collaboration.role != "member"){
      $('.collab-overlay').toggleClass('hidden', true);
   }
   this.init();
   this.renderControls();
   $('select.js-walkthrough-list').val('default');
};

gisportal.walkthrough.loadManagementPanel = function(){
   $.ajax({
      url: gisportal.middlewarePath + '/settings/get_walkthroughs',
      dataType: 'json',
      success: function(data) {
         $( '.js-walkthrough-management-popup' ).toggleClass('hidden', false);
         var template = gisportal.templates['walkthrough-management-table'](data);
         $( '.js-walkthrough-management-html' ).html(template);

         $('.js-walkthrough-management-close').on('click', function(){
            $( '.js-walkthrough-management-popup' ).toggleClass('hidden', true);
            $( '.js-walkthrough-management-html' ).html("");
         });

         $('.js-edit-walkthrough').on('click', function(){
            var walkthrough = $(this).data('walkthrough');
            var owner = $(this).data('owner');
            $.ajax({
               url: gisportal.middlewarePath + '/settings/walkthrough?walkthrough=' + encodeURI(walkthrough) + '&owner=' + encodeURI(owner),
               dataType: 'json',
               success: function(data) {
                  gisportal.walkthrough.recording_object = data;
                  gisportal.walkthrough.recording_object.overwrite = true;
                  gisportal.walkthrough.loadEditForm();
                  $( '.js-walkthrough-management-popup' ).toggleClass('hidden', true);
                  $( '.js-walkthrough-management-html' ).html("");
               }
            });
         });

         $('.js-delete-walkthrough').on('click', function(){
            var walkthrough = $(this).data('walkthrough');
            var owner = $(this).data('owner');
            $.ajax({
               url: gisportal.middlewarePath + '/settings/delete_walkthrough?walkthrough=' + encodeURI(walkthrough) + '&owner=' + encodeURI(owner),
               dataType: 'json',
               success: function() {
                  gisportal.walkthrough.loadWalkthroughList();
                  gisportal.walkthrough.loadManagementPanel();
               }
            });
         });
      },
      error: function(error) {
         $.notify("There was a problem loading walkthroughs, plase try again.");
      }
   });
};

gisportal.walkthrough.openVisualPortalWalkthrough = function(walkthrough_name){
   var walkthrough_popup = window.open('https://visual.pml.ac.uk?walkthrough_name=' + walkthrough_name + '&walkthrough_owner=visual.pml.ac.uk&walkthrough_popup=true','Walkthrough','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no, fullscreen=yes');
};