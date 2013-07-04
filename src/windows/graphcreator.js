/* opec.window.createGraphCreator = function() {
   var graphCreator = $('#graphCreator');
   // If there is an open version, close it
   if(graphCreator.length)
      graphCreator.extendedDialog('close');
      
   var data = {
      advanced: true
   };
   
   // Add the html to the document using a template
   $('#opec-graphing').append(opec.templates.graphCreatorWindow(data));
   //$(document.body).append(opec.templates.graphCreatorWindow(data));
   
   graphCreator = $('#graphCreator');           
   var graphCreatorGenerate = graphCreator.find('#graphcreator-generate').first();
   

   // TODO: Add some logic to the way dates are selected.
   // Add the jQuery UI datepickers to the dialog
   $('#graphcreator-time, #graphcreator-time2').datepicker({
      showButtonPanel: true,
      dateFormat: 'yy-mm-dd',
      changeMonth: true,
      changeYear: true,
      beforeShowDay: function(date) { return opec.allowedDays(date); },
      // onSelect: function(dateText, inst) {
         // var thedate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
         // // Synchronise date with the timeline
         // opec.timeline.setDate(thedate);
         // // Filter the layer data to the selected date
         // opec.filterLayersByDate(thedate);
      // }
   });
   
   // Set the datepicker controls to the current view date if set
   var viewDate = $('#viewDate').datepicker('getDate');
   if (viewDate !== ""){
      $('#graphcreator-time').datepicker('setDate', viewDate);
      $('#graphcreator-time2').datepicker('setDate', viewDate);
   }
   
   // Get the currently selected layer
   var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
   $('#graphcreator-baseurl').val(layer.wcsURL);
   $('#graphcreator-coverage').val(layer.origName);
   
   $('.lPanel').bind('selectedLayer', function(e) {
      var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
      $('#graphcreator-baseurl').val(layer.wcsURL);
      $('#graphcreator-coverage').val(layer.origName);
   });
   
   graphCreatorGenerate.find('img[src="img/ajax-loader.gif"]').hide();
                     
   // When selecting the bounding box text field, request user to draw the box to populate values
   $('#graphcreator-bbox').click(function() {
      opec.gritter.showNotification('bbox', null);
   });
   
   // Event to open and close the panels when clicked
   $('.ui-control-header').click(function() {
      $(this)
         .toggleClass("ui-control-header-active")
         .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
         .next().toggleClass("ui-control-content-active").slideToggle();
      return false;
   });
   
   // Gets the top layer that's checkbox is checked and puts it's ID into the coverage box
   $('#graphcreator-coverage-button').click(function() {
      $.each($('.sensor-accordion').children('li').children(':checkbox').get().reverse(), function(index, value) {
         if($(this).is(':checked')) {
            var layerID = $(this).parent('li').attr('id');
            var layer = opec.getLayerByID(layerID);
            $('#graphcreator-coverage').val(layer.origName);          
            $('#graphcreator-baseurl').val(layer.wcsURL);   
         }
      });

      return false;
   });
   
   graphCreator.unbind('.loadGraph').bind('ajaxStart.loadGraph', function() {
      $(this).find('img[src="img/ajax-loader.gif"]').show();
   }).bind('ajaxStop.loadGraph', function() {
      $(this).find('img[src="img/ajax-loader.gif"]').hide();
   });
   
   $('#graphcreator-barwidth-button').click(function() {
      return false;
   });
   
   // Close histogram, advanced and format panels
   $('#histogram-inputs-header').trigger('click');
   $('#advanced-inputs-header').trigger('click');
   $('#graph-format-header').trigger('click');
   
   // Create and display the graph
   graphCreatorGenerate.on('click', ':button', function(e) {
      // Extract the date-time value from the datepickers either as single date-time or date-time range
      var dateRange = $('#graphcreator-time').val();         
      if ($('#graphcreator-time2').val() !== "") {
         dateRange += ("/" + $('#graphcreator-time2').val());
      }
      
      var graphXAxis = null,
      graphYAxis = null;
      
      if ( $('#graphcreator-gallery').val() == 'hovmollerLon' ) {
         graphXAxis = 'Lon';
         graphYAxis = 'Time';
      }
      else if ( $('#graphcreator-gallery').val() == 'hovmollerLat' ) {
         graphXAxis = 'Time';
         graphYAxis = 'Lat';
      }
      
      var params = {
         baseurl: $('#graphcreator-baseurl').val(),
         coverage: $('#graphcreator-coverage').val(),
         type: $('#graphcreator-gallery').val(),
         bins: $('#graphcreator-bins').val(),
         time: dateRange,
         bbox: $('#graphcreator-bbox').val(),
         graphXAxis: graphXAxis,
         graphYAxis: graphYAxis,
         graphZAxis: $('#graphcreator-coverage').val()
      };
      
      var request = $.param( params );
      
      $.ajax({
         type: 'GET',
         url: opec.wcsLocation + request,
         dataType: 'json',
         asyc: true,
         success: function(data) {
            opec.graphs.create(data);
         },
         error: function(request, errorType, exception) {
            var data = {
               type: 'wcs data',
               request: request,
               errorType: errorType,
               exception: exception,
               url: this.url
            };          
            gritterErrorHandler(data);
         }
      });
   }); 
            
   // Open the dialog box
   //graphCreator.extendedDialog('open');
};
*/

//----------------------------------------------------------------------------
var graphCreator = {
   name: 'graphCreator',
   create: function(windowType, uid, data) {
      
      var window = {
         uid: uid,
         windowType: windowType,
         $instance: null,
         template: data.template,
         templateData: data.templateData,
         show: function() {
            // If there is an open version, close it
            if( this.$instance.length )
               this.$instance.extendedDialog('open'); 
         },
         hide: function() {
            // If there is an open version, close it
            if( this.$instance.length )
               this.$instance.extendedDialog('close'); 
         },
         destroy: this.destroy()
      };

      // Find any instance
      var $tempInstance = $('#' + window.uid);
      
      // If there is an open version, close it
      if( $tempInstance.length )
         $tempInstance.extendedDialog('close');
            
      // Add the html to the document using a template
      $(document.body).append(window.template(window.templateData));
      
      // Set the current instance
      window.$instance = $('#' + window.uid);           
      
      // Turn it into a dialog box
      window.$instance.extendedDialog({
         position: ['center', 'center'],
         width: 340,
         resizable: false,
         autoOpen: false,
         close: function() {
            // Remove on close
            $('#' + window.uid).remove(); 
         },
         showHelp: true,
         showMinimise: true,
         dblclick: "collapse",
         help : function(e, dlg) {
            opec.gritter.showNotification ('graphCreatorTutorial', null);
         }
      });
      
      this.logic();
              
      // Open the dialog box
      graphCreator.extendedDialog('open');
      
      return window;
   },
   logic: function() {     
      var graphCreatorGenerate = window.$instance.find('#graphcreator-generate').first();
      
      // Add the jQuery UI datepickers to the dialog
      $('#graphcreator-time, #graphcreator-time2').datepicker({
         showButtonPanel: true,
         dateFormat: 'yy-mm-dd',
         changeMonth: true,
         changeYear: true
      });
      
      // Set the datepicker controls to the current view date if set
      //var viewDate = $('#viewDate').datepicker('getDate');
      //if ( viewDate !== "" ) {
         //$('#graphcreator-time').datepicker('setDate', viewDate);
         //$('#graphcreator-time2').datepicker('setDate', viewDate);
      //}
      
      //-----------------------------------------------------------------------
      
      // Get the currently selected layer
      var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
      $('#graphcreator-baseurl').val(layer.wcsURL);
      $('#graphcreator-coverage').val(layer.origName);
         
      $('.lPanel').bind('selectedLayer', function(event) {
         var layer = opec.getLayerByID($('.selectedLayer:visible').attr('id'));
         $('#graphcreator-baseurl').val(layer.wcsURL);
         $('#graphcreator-coverage').val(layer.origName);
      });
      
      //-----------------------------------------------------------------------
      
      // Hide the ajax spinner
      graphCreatorGenerate.find('img[src="img/ajax-loader.gif"]').hide();
                        
      // When selecting the bounding box text field, request user to draw the box to populate values
      $('#graphcreator-bbox').click(function() {
         opec.gritter.showNotification('bbox', null);
      });
      
      // Event to open and close the panels when clicked
      $('.ui-control-header').click(function() {
         $(this)
            .toggleClass("ui-control-header-active")
            .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
            .next().toggleClass("ui-control-content-active").slideToggle();
         return false;
      });
      
      // Gets the top layer that's checkbox is checked and puts it's ID into the coverage box
      $('#graphcreator-coverage-button').click(function() {
         $.each($('.sensor-accordion').children('li').children(':checkbox').get().reverse(), function(index, value) {
            if($(this).is(':checked')) {
               var layerID = $(this).parent('li').attr('id');
               $('#graphcreator-coverage').val(layerID);
               var layer = opec.getLayerByID(layerID);
               $('#graphcreator-baseurl').val(layer.wcsURL);   
            }
         });
   
         return false;
      });
      
      // Bind the spinner
      graphCreator.unbind('.loadGraph').bind('ajaxStart.loadGraph', function() {
         $(this).find('img[src="img/ajax-loader.gif"]').show();
      }).bind('ajaxStop.loadGraph', function() {
         $(this).find('img[src="img/ajax-loader.gif"]').hide();
      });
      
      $('#graphcreator-barwidth-button').click(function() {
         return false;
      });
      
      // Close histogram, advanced and format panels
      $('#histogram-inputs-header').trigger('click');
      $('#advanced-inputs-header').trigger('click');
      $('#graph-format-header').trigger('click');
      
      // Create and display the graph
      graphCreatorGenerate.on('click', ':button', function(e) {
         // Extract the date-time value from the datepickers either as single date-time or date-time range
         var dateRange = $('#graphcreator-time').val();         
         if ($('#graphcreator-time2').val() !== "") {
            dateRange += ("/" + $('#graphcreator-time2').val());
         }
         
         var graphXAxis = null,
         graphYAxis = null;
         
         if ( $('#graphcreator-gallery').val() == 'hovmollerLon' ) {
            graphXAxis = 'Lon';
            graphYAxis = 'Time';
         }
         else if ( $('#graphcreator-gallery').val() == 'hovmollerLat' ) {
            graphXAxis = 'Time';
            graphYAxis = 'Lat';
         }
         
         var params = {
            baseurl: $('#graphcreator-baseurl').val(),
            coverage: $('#graphcreator-coverage').val(),
            type: $('#graphcreator-gallery').val(),
            bins: $('#graphcreator-bins').val(),
            time: dateRange,
            bbox: $('#graphcreator-bbox').val(),
            graphXAxis: graphXAxis,
            graphYAxis: graphYAxis,
            graphZAxis: $('#graphcreator-coverage').val()
         };
         
         var request = $.param( params );
         
         $.ajax({
            type: 'GET',
            url: opec.wcsLocation + request,
            dataType: 'json',
            asyc: true,
            success: function(data) {
               if(data.error !== "") {
                  var d = {
                     error: data.error
                  };
                  opec.gritter.showNotification('graphError', d);
                  return;
               }
                               
               if(data.type == 'basic') {                                    
                  var start = new Date(data.output.global.time).getTime(),
                     d1 = [],
                     d2 = [], 
                     d3 = [],
                     d4 = [], 
                     d5 = [];
                  
                  $.each(data.output.data, function(i, value) {
                     d1.push([new Date(i).getTime(), value.std]);
                     d2.push([new Date(i).getTime(), value.max]);
                     d3.push([new Date(i).getTime(), value.min]);
                     d4.push([new Date(i).getTime(), value.median]);
                     d5.push([new Date(i).getTime(), value.mean]);
                  });
                  
                  var graphData = {
                     id: 'wcsgraph' + Date.now(),
                     title: 'WCS Test Graph',
                     data: [{
                        data: d1.sort(opec.utils.sortDates),
                        lines: { show: true },
                        points: { show: true },
                        label: 'STD'
                     },
                     {
                        data: d2.sort(opec.utils.sortDates),
                        lines: { show: true },
                        points: { show: true },
                        label: 'max'
                     },
                     {
                        data: d3.sort(opec.utils.sortDates),
                        lines: { show: true },
                        points: { show: true },
                        label: 'min'
                     },
                     {
                        data: d4.sort(opec.utils.sortDates),
                        lines: { show: true },
                        points: { show: true },
                        label: 'median'
                     },
                     {
                        data: d5.sort(opec.utils.sortDates),
                        lines: { show: true },
                        points: { show: true },
                        label: 'mean'
                     }],
                     options: basicTimeOptions(data.output.units),
                     selectable: true,
                     selectSeries: true
                  };
                  
                  createGraph(graphData);
               }
               else if(data.type == 'histogram') {
                  var num = data.output.histogram.Numbers;
                  var barwidth = (Math.abs(num[num.length-1][0] - num[0][0]))/num.length;
               
                  var graphData = {
                     id: 'wcsgraph' + Date.now(),
                     title: 'WCS Test Graph',
                     data: [num],
                     options: barOptions(barwidth),
                     selectable: false
                  };
                  
                  createGraph(graphData);
               }
               else if(data.type == 'hovmöllerLon') {
                  var start = new Date(data.output.global.time).getTime();
                  
                  var graphData = {
                     id: 'wcsgraph' + Date.now(),
                     title: 'WCS Hovmöller Test Graph'
                  };
                  
                  hovmoller(graphData, data.output);                                      
               }
            },
            error: function(request, errorType, exception) {
               var data = {
                  type: 'wcs data',
                  request: request,
                  errorType: errorType,
                  exception: exception,
                  url: this.url
               };          
               gritterErrorHandler(data);
            }
         });
      }); 
   },
   destroy: function() {
      
   }
};

opec.window.addWindow(graphCreator);