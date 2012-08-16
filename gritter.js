// Setup the options for the gritter and create opening 
// welcome message
function setupGritter()
{
   $.extend($.gritter.options, { 
      position: 'bottom-right',
      fade_in_speed: 'medium',
      fade_out_speed: 800,
      time: 6000
   });
}

function createWelcomeMessage()
{
   showMessage('welcomeTutorial', 'tutorial', null);
}

function gritterErrorHandler(layer, type, request, errorType, exception)
{
   if(layer)
   {
      $.gritter.add({
         title: errorType + ': ' + request.status + ' ' + exception,
         text: 'Could not get the ' + type + ' from the server for ' + layer.name + '. Try refreshing the page',
         //image: 'img/OpEc_small.png',
         class_name: 'gritter-light',
         sticky: true,
      });
   }
   else
   {
      $.gritter.add({
         title: errorType + ': ' + request.state + ' ' + exception,
         text: 'Could not get the ' + type + ' from the server. Try refreshing the page',
         //image: 'img/OpEc_small.png',
         class_name: 'gritter-light',
         sticky: true,
      });
   }
}

// Tries to diagnose any problems with layers
function gritterLayerHelper()
{      
   $(document).on('click', 'img[src="img/exclamation_small.png"]', function() 
   {
      var layerID = $(this).parent().parent().attr('id');
      var layer = map.getLayersByName(layerID)[0];
      var helpMessage = 'none';
      
      // Is the layer temporal?
      if(layer.temporal)
      {     
         var inst = $('#viewDate').datepicker('getDate'); // Get the selected date
        
         if(inst != null) // If the date is set...
         {
            var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
            var uidate = ISODateString(thedate);
            var mDate = layer.matchDate(uidate);

            // Can the layer display the selected date?
            if(mDate == null)
            {
               helpMessage = 'dateNotInRange';
            }
         }
         // If the date is not set...
         else if(inst == null)
         {
            helpMessage = 'noDate';
         }
      }

      var data = { layer: layer };
      showMessage(helpMessage, 'help', data);

      return false;
   });
}

function createHelpMessages()
{
   // Opening welcome message
   map.helperMessages['welcomeTutorial'] = {
      title: 'Welcome to the Opec Portal',
      text: function(layer) { 
         return 'You can use the ' +
         '<a id="wtOpenLeftPanel" href="#">layers button</a>' +
         ' on the left to open and close the layers panel ' +
         ' which allows you to select the layers you want to view. The ' +
         '<a id="wtOpenRightPanel" href="#">data button</a>' + 
         ' on the right does the same for the data panel ' +
         'which allows you to specify regions of interest (R.O.I) ' +
         'and then get graphs for the selected area. ' +
         '<a id="wtNext" href="#">Next</a>';
      },
      afterOpen: function(layer) {
         // Open the layer panel on click
         $('#wtOpenLeftPanel').click(function(e) {
            $('.triggerL').trigger('click');
            return false;
         })
         // Highlight the layer button with a red border on hover
         .hover(function() {
               $('.triggerL').css('border', '2px solid red');
            },
            function() {
               $('.triggerL').css('border', '');
         });

         // Open the data panel on click
         $('#wtOpenRightPanel').click(function(e) {
            $('.triggerR').trigger('click');
            return false;
         })
         // Highlight the data button with a red border on hover
         .hover(function() {
               $('.triggerR').css('border', '2px solid red');
            },
            function() {
               $('.triggerR').css('border', '');
         });

         // Open the data panel on click
         $('#wtNext').click(function(e) {

            removeMessage(map.tutUID);
            showMessage('dateTutorial', 'tutorial', null);

            return false;
         });
      },
   };
   
   // Date Tutorial
   map.helperMessages['dateTutorial'] = {
      title: 'Selecting Dates',
      text: function() {
         return 'To select a date to be used by temporal layers, click on the ' +
            '<a id="dtDatepickerBtn" href="#">datepicker</a>' +
            ' at the top of the screen. Then use the left and right arrows to ' +
            'change the month or use the dropdown boxes. You can also type a date into the textbox. ' +
            '<a id="dtNext" href="#">Next</a>';
      },
      afterOpen: function() {
         // Open the data panel on click
         $('#dtNext').click(function(e) {
            removeMessage(map.tutUID);
            showMessage('tbdTutorial', 'tutorial', null);

            return false;
         });

         $('#dtDatepickerBtn').click(function() {
            $('#viewDate').datepicker("show");
            return false;
         })
         .hover(function() { 
               $('#viewDate').css('border', '2px solid red'); 
            },
            function() {
               $('#viewDate').css('border', '');
            }
         );
      },
   };

   // To be Continued
   map.helperMessages['tbdTutorial'] = {
      title: 'To Be Continued',
      text: function() {
         return 'To be continued';
      },
   };

   // No date selected on date picker
   map.helperMessages['noDate'] = {
      title: 'Select a date',
      text: function(layer) { 
         return 'This layer is a temporal layer and requires a date to be selected. ' +
            'To select a date use the ' +
            '<a id="datepickerBtn" href="#">datepicker</a>' +
            ' at the top of the screen.';
      },
      afterOpen: function(layer) {
         $('#datepickerBtn').click(function() {
            var date = $.datepicker.parseDate('dd-mm-yy', layer.lastDate);
            $('#viewDate').datepicker("option", "defaultDate", date).datepicker("show");
            return false;
         })
         .hover(function() { 
               $('#viewDate').css('border', '2px solid red'); 
            },
            function() {
               $('#viewDate').css('border', '');
            }
         );
      },
   };

   // The selected date is not supported by this layer
   map.helperMessages['dateNotInRange'] = {
      title: 'Select another date',
      text: function(layer) {
         return 'The date you have selected is not avaliable for this layer. ' +
            'This layer supports dates between ' +
            layer.firstDate + ' and ' + layer.lastDate + '.' +
            ' Try selecting another date that all layers share.';
      },
   };
}

function showMessage(message, type, data)
{
   if(type == 'help' || type == 'tutorial')
   {
      var hm = map.helperMessages[message];
      if(typeof(hm.title) == 'undefined')
         hm.title = 'No' + type + 'Message Found';

      if(typeof(hm.text) == 'undefined')
         hm.text = function() {
            return 'Sorry, we could not find a' + type + 'message for your problem'; 
         };
      if(typeof(hm.afterOpen) == 'undefined')
         hm.afterOpen = function() {};

      var uid = $.gritter.add({
         title: hm.title,
         text: type == 'help' ? hm.text(data.layer): hm.text(),
         after_open: function() {
            type == 'help' ? hm.afterOpen(data.layer): hm.afterOpen();
         },
         //image: 'img/OpEc_small.png',
         class_name: 'gritter-light',
         sticky: true, 
      });
      
      if(type == 'tutorial')
         map.tutUID = uid;
   }
   else if(type == 'error')
   {
   }
}

function removeMessage(uid)
{
   $.gritter.remove(uid, {
      fade: false,
      speed: 'fast',
   });
}
