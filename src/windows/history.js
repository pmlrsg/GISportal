/**
 * @constructor
 * @param {Object} placeholderID
 * @param {Object} containerID
 */
gisportal.window.history = function() {
   var self = this;
   
   $('#gisportal-historyWindow').extendedDialog({
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
         gisportal.gritter.showNotification('history', null);
      }
   });
   
   refreshGraphs();
   
   $('#gisportal-historyWindow-tabs').buttonset();
   $('#gisportal-historyWindow-tab button').button();
   $('#gisportal-historyWindow-tabs .gisportal-tab').click(function(e) { 
      var tabToShow = $(this).attr('href');
      $('#gisportal-historyWindow-content div').filter(function(i) { 
         return $(this).attr('id') != tabToShow.slice(1); 
      }).hide();
      $(tabToShow).show();
   });
   
   $("#gisportal-historyWindow-tab-Refresh").click(function() {
      refreshGraphs();
   });
   
   $("#remove-graph").click(function()  {
      gisportal.genericAsync(
         'POST',
         '/service/graph',
         {},
         function(d) {
            $('#gisportal-historyWindow-graphs .gisportal-historyWindow--scroll li').remove();
                  $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data li').remove();
            $.each(d.output, function(k,v) { 
                  var data = JSON.parse(v.graph);
                  data.id = data.description + v.lastUsed;
                  data.data = JSON.stringify(data.graphData);
                  $('#gisportal-historyWindow-graphs .gisportal-historyWindow--scroll').append(gisportal.templates.historyList(data));
                  $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data').append(gisportal.templates.historyData(data));
               } 
            );
         },
         function() { console.log('Data was not available'); },
         'json',
         {}
      );
   });
   
   /* Graphs */
   function refreshGraphs() {
      gisportal.genericAsync(
         'GET',
         '/service/graph',
         {},
         function(d) {
            $('#gisportal-historyWindow-graphs .gisportal-historyWindow--scroll li').remove();
                  $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data li').remove();
            $.each(d.output, function(k,v) { 
                  var data = JSON.parse(v.graph);
                  data.id = data.description + v.lastUsed;
                  data.data = JSON.stringify(data.graphData);
                  $('#gisportal-historyWindow-graphs .gisportal-historyWindow--scroll ul').append(gisportal.templates.historyList(data));
                  $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data').append(gisportal.templates.historyData(data));
               } 
            );
         },
         function() { console.log('Data was not available'); },
         'json',
         {}
      );
   }
   
   $('#gisportal-historyWindow-graphs .gisportal-historyWindow--scroll').on('click', 'li', function() {
      $('.gisportal-historyWindow--scroll li').removeClass('selected ui-tate-highlight');
      $(this).addClass('selected ui-state-highlight');
      $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data li').addClass('hidden');
      $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data li').filter(function(d, e) {
         return $(e).data('id') == $('#gisportal-historyWindow-graphs .gisportal-historyWindow--scroll li.selected').data('id');
      }).removeClass('hidden');
   });
   
   $('#gisportal-historyWindow-graphs').on('click', '#load-graph', function() {
      /* Open the Analyses Graphing panel */
      gisportal.rightPanel.open();
      $('#gisportal-button-analyses').click();
      $('#gisportal-graphing').show('fast');
      
      /* Store data from JSON into Graphing panel */
      var el = $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data li:not(".hidden") .json-data');
      var title = $('#gisportal-historyWindow-graphs .gisportal-historyWindow--data li:not(".hidden") p');
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
   gisportal.window.history.loadStateHistory = function() {
      if (gisportal.openid.loggedIn === true) {
         gisportal.genericAsync(
            'GET',
            '/service/state',
            {},
            function(d) {
               $.each(d.output, function(k,v) {
                     console.log('-- ' + k, v); 
                     var data = {};
                     data.id = k;
                     var d = new Date(v.lastUsed);
                     data.description = d.toDateString() + ' ' + d.getUTCHours() + ':' + d.getUTCMinutes();
                     data.title = data.description; // So that it works with same template as graphs
                     data.data = v.state;
                     console.log(data.data);
                     $('#gisportal-historyWindow-states .gisportal-historyWindow--scroll ul').append(gisportal.templates.historyList(data));
                     $('#gisportal-historyWindow-states .gisportal-historyWindow--data').append(gisportal.templates.historyData(data));
                  } 
               );
            },
            function() { console.log('Data was not available'); },
            'json',
            {}
         );
      }
   }

   $('#gisportal-historyWindow').on('click', '#gisportal-historyWindow-loadState', function() {
      gisportal.ajaxState($('#gisportal-historyWindow-states .gisportal-historyWindow--scroll li.selected').data('id'));
   });

   $('#gisportal-historyWindow').on('click', '#gisportal-historyWindow-reloadState', function()  {
      window.location = location.origin + location.pathname + '?state=' + $('#gisportal-historyWindow-states .gisportal-historyWindow--scroll li.selected').data('id');
   });
   
   $('#gisportal-historyWindow-states .gisportal-historyWindow--scroll').on('click', 'li', function() {
      $('.gisportal-historyWindow--scroll li').removeClass('selected ui-state-highlight');
      $(this).addClass('selected ui-state-highlight');
      $('.gisportal-historyWindow--data li').addClass('hidden');
      $('.gisportal-historyWindow--data li').filter(function(d, e) {
         return $(e).data('id') == $('.gisportal-historyWindow--scroll li.selected').data('id');
      }).removeClass('hidden');
   });
};
