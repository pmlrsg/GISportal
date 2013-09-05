/**
 * @constructor
 * @param {Object} placeholderID
 * @param {Object} containerID
 */
opec.window.history = function() {
   var self = this;
   
   $('#opec-historyWindow').extendedDialog({
      position: ['left', 'center'],
      width: 500,
      minWidth:500,
      height: 350,
      minHeight: 500,
      resizable: true,
      autoOpen: false,
      showHelp: true,
      showMinimise: true,
      dblclick: "collapse",
      restore: function(e, dlg) {
         // Used to resize content on the dialog.
         $(this).trigger("resize");
      },
      help : function(e, dlg) {
         opec.gritter.showNotification('history', null);
      }
   });
   
   $('#opec-historyWindow-tabs').buttonset();
   $('#opec-historyWindow-tab button').button();
   $('#opec-historyWindow-tabs button').click(function(e) { 
      var tabToShow = $(this).attr('href');
      $('#opec-historyWindow-content div').filter(function(i) { 
         return $(this).attr('id') != tabToShow.slice(1); 
      }).hide();
      $(tabToShow).show();
   });
   
   /* Graphs */
   opec.genericAsync(
      'GET',
      '/service/graph',
      {},
      function(d) {
         $.each(d.output, function(k,v) { 
               var data = JSON.parse(v.graph);
               data.id = data.description + v.lastUsed;
               data.data = JSON.stringify(data.graphData);
               $('#opec-historyWindow-graphs .opec-historyWindow--scroll').append(opec.templates.historyList(data));
               $('#opec-historyWindow-graphs .opec-historyWindow--data').append(opec.templates.historyData(data));
            } 
         );
      },
      function() { console.log('Data was not available'); },
      'json',
      {}
   );
   
   $('#opec-historyWindow-graphs .opec-historyWindow--scroll').on('click', 'li', function() {
      $('.opec-historyWindow--scroll li').removeClass('selected ui-state-highlight');
      $(this).addClass('selected ui-state-highlight');
      $('#opec-historyWindow-graphs .opec-historyWindow--data li').addClass('hidden');
      $('#opec-historyWindow-graphs .opec-historyWindow--data li').filter(function(d, e) {
         return $(e).data('id') == $('#opec-historyWindow-graphs .opec-historyWindow--scroll li.selected').data('id');
      }).removeClass('hidden');
   });
   
   $('#opec-historyWindow-graphs').on('click', '#load-graph', function() {
      /* Open the Analyses Graphing panel */
      opec.rightPanel.open();
      $('#opec-button-analyses').click();
      $('#opec-graphing').show('fast');
      
      /* Store data from JSON into Graphing panel */
      var el = $('#opec-historyWindow-graphs .opec-historyWindow--data li:not(".hidden") .json-data');
      var title = $('#opec-historyWindow-graphs .opec-historyWindow--data li:not(".hidden") p');
      var data = JSON.parse(el.html());
      $('#graphcreator-title').val(title.html());
      $('#graphcreator-baseurl').val(data.baseurl);
      $('#graphcreator-coverage').val(data.coverage);
      $('#graphcreator-gallery input[name="gallery"][value="' + data.type + '"]').attr("checked", true);
      $('#graphcreator-bins').val(data.bins);
      $('#graphcreator-time').datepicker('setDate', data.time.substring(0, 10));
      $('#graphcreator-time2').datepicker('setDate', data.time.substring(11));
      $('#graphcreator-bbox').val(data.bbox);
      
      /* Give the generate button focus, so that pressing enter creates graph */
      $('#graphcreator-generate input').focus();
   });
   
   /* States */
   opec.genericAsync(
      'GET',
      '/service/state',
      {},
      function(d) {
         $.each(d.output, function(k,v) { 
               var data = JSON.parse(v.state);
               data.id = data.description + v.lastUsed;
               data.data = JSON.stringify(data.state);
               data.title = v.title;
               $('#opec-historyWindow-states .opec-historyWindow--scroll').append(opec.templates.historyList(data));
               $('#opec-historyWindow-states .opec-historyWindow--data').append(opec.templates.historyData(data));
            } 
         );
      },
      function() { console.log('Data was not available'); },
      'json',
      {}
   );
   
   $('#opec-historyWindow-states .opec-historyWindow--scroll').on('click', 'li', function() {
      $('.opec-historyWindow--scroll li').removeClass('selected ui-state-highlight');
      $(this).addClass('selected ui-state-highlight');
      $('.opec-historyWindow--data li').addClass('hidden');
      $('.opec-historyWindow--data li').filter(function(d, e) {
         return $(e).data('id') == $('.opec-historyWindow--scroll li.selected').data('id');
      }).removeClass('hidden');
   });
};