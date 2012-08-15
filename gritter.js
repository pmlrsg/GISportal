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
   // Add the opening message
   var uid = $.gritter.add({
      title: 'Welcome to the Opec Portal',
      text: 'You can use the ' +
         '<a id="openLeftPanel" href="#">layers button</a>' +
         ' on the left to open and close the layers panel ' +
         ' which allows you to select the layers you want to view. The ' +
         '<a id="openRightPanel" href="#">data button</a>' + 
         ' on the right does the same for the data panel ' +
         'which allows you to specify regions of interest (R.O.I) ' +
         'and then get graphs for the selected area. ' + 
         '<a id="next" href="#">Next</a>',
      //image: 'img/OpEc_small.png',
      class_name: 'gritter-light',
      sticky: true, 
   });

   // Open the layer panel on click
   $('#openLeftPanel').click(function(e) {
      $('.triggerL').trigger('click');
      return false;
   })
   // Highlight the layer button with a red border on hover
   .hover(function() {
         $('.triggerL').css('border', '2px solid red');
      },
      function() {
         $('.triggerL').css('border', '');
      return false;
   });

   // Open the data panel on click
   $('#openRightPanel').click(function(e) {
      $('.triggerR').trigger('click');
      return false;
   })
   // Highlight the data button with a red border on hover
   .hover(function() {
         $('.triggerR').css('border', '2px solid red');
      },
      function() {
         $('.triggerR').css('border', '');
      return false;
   });

   // Open the data panel on click
   $('#next').click(function(e) {
   
      $.gritter.remove(uid, {
         fade: true,
         speed: 'fast',
      });
         
      $.gritter.add({
         title: 'To Be Continued',
         text: 'To be continued',
         //image: 'img/OpEc_small.png',
         class_name: 'gritter-light',
         sticky: true, 
      });

      return false;
   });
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
   $('img[src="img/exclamation_small.png"]').click(function() 
   {
      var layerID = $(this).parent().parent().attr('id');
      var layer = map.getLayersByName(layerID)[0];
      
      // Is the layer temporal?
      if(layer.temporal)
      {
         // Get the selected date
         var inst = $('#viewDate').datepicker('getDate');

         // If the date is set...
         if(inst != null)
         {
            var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
            var uidate = ISODateString(thedate);
            var mDate = layer.matchDate(uidate);

            // Can the layer display the selected date?
            if(mDate == null)
            {
               $.gritter.add({
                  title: 'Select another date',
                  text: 'The date you have selected is not avaliable for this layer. ' +
                        'This layer supports dates between ' +
                        layer.firstDate + ' and ' + layer.lastDate + '.' +
                        ' Try selecting another date that all layers share.',
                  //image: 'img/OpEc_small.png',
                  class_name: 'gritter-light',
                  sticky: true, 
               });
            }
         }
         // If the date is not set...
         else if(inst == null)
         {
            $.gritter.add({
               title: 'Select a date',
               text: 'This layer is a temporal layer and requires a date to be selected. ' +
               'To select a date use the ' +
               '<a id="datepickerBtn" href="#">datepicker</a>' +
               ' at the top of the screen.',
               //image: 'img/OpEc_small.png',
               class_name: 'gritter-light',
               sticky: true, 
            });

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

               return false
            });
         }
      }
      else
      {
         $.gritter.add({
            title: 'Test Error Message',
            text: 'In future this message will tell you why the layer is not showing.',
            //image: 'img/OpEc_small.png',
            class_name: 'gritter-light',
            sticky: true, 
         });
      }

      return false;
   });
}
