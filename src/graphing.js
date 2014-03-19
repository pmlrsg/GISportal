gisportal.graphs = {};

// Options currently requires a title
gisportal.graphs.data = function(params, options)  {
   var request = $.param( params );    
   // Get graph
   $.ajax({
      type: 'GET',
      url: gisportal.wcsLocation + request,
      dataType: 'json',
      asyc: true,
      success: function(data) {
         console.log(data);
         gisportal.graphs.create(data, options);
         console.log("success");
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
}

gisportal.graphs.create = function(data, options) {
   if(data.error !== "") {
      var d = {
         error: data.error
      };
      gisportal.gritter.showNotification('graphError', d);
      return;
   }
                   
   if(data.type == 'timeseries') {                                    
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
         title: options.title || data.type + " of " + gisportal.layers[data.coverage].displayTitle,
         data: [{
            data: d1.sort(gisportal.utils.sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'STD'
         },
         {
            data: d2.sort(gisportal.utils.sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'max'
         },
         {
            data: d3.sort(gisportal.utils.sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'min'
         },
         {
            data: d4.sort(gisportal.utils.sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'median'
         },
         {
            data: d5.sort(gisportal.utils.sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'mean'
         }],
         options: basicTimeOptions(data.output.units),
         provider: options.provider,
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
         title: options.title || data.type + " of " + gisportal.layers[data.coverage].displayTitle,
         data: [num],
         options: barOptions(barwidth),
         selectable: false
      };
      
      createGraph(graphData);
   }
   else if(data.type == 'hovmollerLon' || data.type == 'hovmollerLat') {
      var start = new Date(data.output.global.time).getTime();
      
      var graphData = {
         id: 'wcsgraph' + Date.now(),
         title: data.type + " of " + gisportal.layers[data.coverage].displayTitle,
         type: data.type,
         colour: 'redToBlue',
         data: data.output,
         options: options
      };
      
      hovmoller(graphData);                                      
   }
}

/**
 * 
 * @param {Object} graphOptions
 */
function createGraph(graphOptions) {
   
   // Create the dialog and cache the selector
   var dialog = gisportal.graphs.createDialogAlt(graphOptions.id, graphOptions.title);

   // TODO: Tidy up css into a class
   dialog.children('.graph').width(600).height(384);
   
   var container = dialog.children('.graph').get(0), 
      start, 
      graph;
   
   // Set each colour so they don't change
   var i = 0;
   $.each(graphOptions.data, function(key, val) {
      val.color = i;
      ++i;
   });
   
   if(graphOptions.selectSeries && graphOptions.selectSeries === true)
   {
      // TODO: Tidy up css into a class
      dialog.append('<div class="choices">Show:</div>');
      var choiceContainer = dialog.children('.choices').css({"left": 620, "top": 20, "position": "absolute"});
      $.each(graphOptions.data, function(key, val) {
        choiceContainer.append('<br/>' +
         '<input type="checkbox" name="' + key + '" ' + (val.label==="median"?'checked="checked"':'') +  'id="id' + key + '">' +
         '<label for="id' + key + '">' + val.label + '</label>');
      });
      var logoStyles;
      if (gisportal.providers[graphOptions.provider])
      {
         if (gisportal.providers[graphOptions.provider].vertical === 'true')  {
            logoStyles = "float: right; width: 50px; margin-top: -140px;";
         }
         else {
            logoStyles = "float: right; margin-top: -30px;";
         }

         if (gisportal.providers[graphOptions.provider].url)  {
            dialog.append('<a href="' + gisportal.providers[graphOptions.provider].url + '"><img style="' + logoStyles + '" src="' + gisportal.providers[graphOptions.provider].logo  + '"></a>');
         } else  {
            dialog.append('<img style="' + logoStyles + '" src="' + gisportal.providers[graphOptions.provider].logo  + '">');
         }
      }
         
      // Update the graph when checkboxes are changed
      choiceContainer.find("input").click(function() {
         graph = drawGraph(container, plotAccordingToChoices());
      });
     


      // Draws the graph with only the datasets that have checks in their checkboxes
      function plotAccordingToChoices() {     
         var data = [];
         
         choiceContainer.find("input:checked").each(function() {
            var key = $(this).attr("name");
            if(key && graphOptions.data[key])
               data.push(graphOptions.data[key]);
         });
         
         return data;
      }
   
      function toCSV()  {
         var csv = 'time,'; // Time should be the first column
         for (var i = 0; i < graphOptions.data.length; i++) {         
            csv += graphOptions.data[i].label;
            csv = i === graphOptions.data.length -1 ? csv += "\n" : csv += ',';
         }   

         for (var i = 0; i < graphOptions.data[0].data.length; i++) {
            var line = '';
            for (var j = 0; j < graphOptions.data.length; j++) {
               if (j === 0) line += graphOptions.data[j].data[i][0] + ',';
               line += j === graphOptions.data.length -1 ? graphOptions.data[j].data[i][1]: graphOptions.data[j].data[i][1] + ',';
            }
            csv += line + "\n";
         }
         csv = "data:application/octet-stream," + encodeURIComponent(csv);
         return(csv);
      }

      dialog.append('<a href="' + toCSV() + '" download="data.csv">Export Data</a>');
   }
   
   // Initial call
   graph = drawGraph(container, graphOptions.selectSeries ? plotAccordingToChoices() : graphOptions.data, graphOptions.options);
   
   if(graphOptions.draggable && graphOptions.draggable === true) {
      Flotr.EventAdapter.observe(graph.overlay, 'mousedown', initDrag);
   }
   
   if(graphOptions.selectable && graphOptions.selectable === true) {
      Flotr.EventAdapter.observe(container, 'flotr:select', function(area) {
         // Draw selected area            
         graph = drawGraph(container, graphOptions.selectSeries ? plotAccordingToChoices() : graphOptions.data, {
            xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45 },
            yaxis : { min : area.y1, max : area.y2 }
         });
      });
           
      // When graph is clicked, draw the graph with default area.
      Flotr.EventAdapter.observe(container, 'flotr:click', function () { graph = drawGraph(container, graphOptions.selectSeries ? plotAccordingToChoices() : graphOptions.data); });
   }
   
   function drawGraph(container, data, opts)
   {
      var optionsClone = Flotr._.extend(Flotr._.clone(graphOptions.options), opts || {});
      
      return Flotr.draw(container, data, optionsClone);
   }
   
   function initDrag(e) {
      start = graph.getEventPosition(e);
      
      Flotr.EventAdapter.observe(document, 'mouseup', stopDrag);
      
      Flotr.EventAdapter.observe(document, 'mousemove', move);
   }
   
   function move(e) {
      var
         end = graph.getEventPosition(e),
         xaxis = graph.axes.x,
         offset = start.x - end.x;
         
      graph = drawGraph(container, graphOptions.selectSeries ? plotAccordingToChoices() : graphOptions.data, {
         xaxis: {
            min: xaxis.min + offset,
            max: xaxis.max + offset
         }
      });
      
      Flotr.EventAdapter.observe(graph.overlay, 'mousedown', initDrag);
   }
   
   function stopDrag() {
      Flotr.EventAdapter.stopObserving(document, 'mousemove', move);
   }
   
      // function animate(t) {
      // data = [];
      // offset = 2 * Math.PI * (t - start) / 10000;
//       
      // // Sample the sane function
      // for(i = 0; i < 4 * Math.PI; i += 0.2) {
         // data.push([i, Math.sin(i - offset)]);
      // }
//       
      // graph = Flotr.draw(container, [ data ], { 
         // yaxis: {
            // max: 2,
            // min: -2
         // }
      // });
//       
//       
      // // Animate
      // setTimeout(function () { 
         // animate((new Date).getTime());
      // }, 50);
   // }
   
   //console.log("created graph and function");
   
   //animate(start);
   
   //console.log("animate");
}

function generateLineData()
{
   var d1 = [], d2 = [], d3 = [];
   
   // Create Sample Data
   for(var i = -60; i < 60; i += 0.5) {
      d1.push([i, Math.sin(i)+3*Math.cos(i)]);
      d2.push([i, Math.pow(1.1, i)]);
      d3.push([i, i + Math.random()*10]);
   }
   
   return [d1, d2,
      {
         data: d3,
         lines: { show: true },
         points: { show: true }
      }];
}

function generateCandleData()
{
   var d1 = [], price = 3.206, a, b, c;
   
   for (var i = -50; i < 50; i++) {
      a = Math.random();
      b = Math.random();
      c = (Math.random() * (a + b)) - b;
      d1.push([i, price, price + a, price - b, price + c]);
      price = price + c;
   }
   
   return [d1];
}

function generateBasicTimeData()
{
   var 
      d1 = [], 
      x, 
      start = new Date("2009/01/01 01:00").getTime();
   
   for (var i = 0; i < 100; i++) {
      x = start+(i*1000*3600*24*36.5);
      d1.push([x, i+Math.random()*30+Math.sin(i/20+Math.random()*2)*20+Math.sin(i/10+Math.random())*10]);
   }
   
   return [d1];
}

function lineOptions()
{
   return {
      xaxis: { min: 0, max: 20 },
      yaxis: { min: -10, max: 60 },
      title: 'Example Graph',
      mouse : {
        track           : true, // Enable mouse tracking
        lineColor       : 'purple',
        relative        : true,
        position        : 'ne',
        sensibility     : 1,
        trackDecimals   : 2,
        trackFormatter  : function (o) { return 'x = ' + o.x +', y = ' + o.y; }
      }
   };
}

function barOptions(barwidth)
{
   return {
      bars: {
         show: true,
         horizontal: false,
         shadowsize: 0,
         barWidth: barwidth
      },
      title: 'Example Graph',
      yaxis: {
         min: 0,
         autoscaleMargin: 1,
         labelsAngle: 45,
         title: 'Number of Points'
      },
      HtmlText: false
   };
}

function candleOptions()
{
   return {
      candles: { show: true, candleWidth: 0.6 },
      xaxis: { noTicks: 10 },
      title: 'Example Graph'
   };
}

function basicTimeOptions(yaxisTitle)
{
   return {
      xaxis: {
         mode: 'time',
         labelsAngle: 45,
         title: 'time'
      },
      yaxis: {
         title: yaxisTitle
      },
      selection: {
         mode: 'x'
      },
      legend: {
         position: 'se', // Position the legend 'south-east'.
         backgroundColor: '#D2E8FF' // A light blue background color.
      },
      HtmlText: false,
      title: 'Time'
   };
}

gisportal.graphs.createDialogAlt = function(uid, title) {
   // Append html code
   $(document.body).append(
      '<div id="' + uid + '-graph" class="unselectable" title="' + title + '">' +
         '<div class="graph"></div>' +
      '</div>'
   );
   
   // Cache the selector
   var dialog = $('#' + uid + '-graph');
   
   // Create the dialog
   dialog.extendedDialog({
      position: ['center', 'center'],
      width: 700,
      height: 450,
      resizable: false,
      autoOpen: true,
      close: function() {
         $('#' + uid + '-graph').remove();
      },
      showHelp: false,
      showMinimise: true,
      dblclick: "collapse"
   });
   
   return dialog;
};

gisportal.graphs.createDialog = function(uid, title) {
   // Append html code
   $(document.body).append(
      '<div id="' + uid + '-graph" class="unselectable" title="' + title + '">' +
      '</div>'
   );
   
   // Cache the selector
   var dialog = $('#' + uid + '-graph');
   
   // Create the dialog
   dialog.extendedDialog({
      position: ['center', 'center'],
      width: 800,
      height: 550,
      resizable: false,
      autoOpen: true,
      close: function() {
         $('#' + uid + '-graph').remove();
      },
      showHelp: false,
      showMinimise: true,
      dblclick: "collapse"
   });
   
   return dialog;
};

function hovmoller(graphData) {  
   var trends = graphData.data;
   console.log(trends); 
   // Set some defaults for the basic chart
   var 
      width = 580,
      height = 429;
   
   // Set margin for the chart main group svg:g element
   var margin = {top: 20, left: 120, right: 60, bottom: 55};
   
   // Use these defaults to make the overall needed area
   var overall_dims = {
      w : width + margin.left + margin.right,
      h : height + margin.top + margin.bottom
   };
   
   var dialog = gisportal.graphs.createDialog(graphData.id, graphData.title);

   // TODO: Tidy up css into a class
   dialog.children('.graph').width(overall_dims.w).height(overall_dims.h);
    
   // Create svg element using overall_dims
   var svg = d3.selectAll('#' + graphData.id + '-graph')
      .append('svg')
      .attr("width", overall_dims.w)
      .attr("height", overall_dims.h);
   
   // Create main g element to contain graph transform to make 0,0 be inside the margins
   var g = svg.append("g").attr("transform" ,"translate("+[margin.left,margin.top]+")");
   
   var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
   
   if (trends.data[0][0].indexOf("Z") !== -1) { parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse; }
   
   var zScale = null,
      xScale = null,
      yScale = null;
   
   if ( graphData.type == 'hovmollerLon' ) {
      // Create basic linear scale for the x, y and z axis.
      zScale = d3.scale.linear();
      xScale = d3.scale.ordinal();
      yScale = d3.time.scale().range([0, height]);
      
      xScale.rangeRoundBands([0, width],  0);
      xScale.domain(trends.data.map(function(d, i) { 
         return d[1];
      }));
      
      yScale.domain(d3.extent(trends.data, function(d) { 
         return parseDate(d[0]);
      }));    
   } else {
      // Create basic linear scale for the x, y and z axis.
      zScale = d3.scale.linear();
      xScale = d3.time.scale().range([0, width]);
      yScale = d3.scale.ordinal();
      
      xScale.domain(d3.extent(trends.data, function(d) { 
         return parseDate(d[0]);
      }));
      
      yScale.rangeRoundBands([0, height],  0);
      yScale.domain(trends.data.map(function(d, i) { 
         return d[1];
      }));
   }
   
   var scale = [];
   var colours = ["rgb(0,0,0)",
   "rgb(144,0,111)",
   "rgb(141,0,114)",
   "rgb(138,0,117)",
   "rgb(135,0,120)",
   "rgb(132,0,123)",
   "rgb(129,0,126)",
   "rgb(126,0,129)",
   "rgb(123,0,132)",
   "rgb(120,0,135)",
   "rgb(117,0,138)",
   "rgb(114,0,141)",
   "rgb(111,0,144)",
   "rgb(108,0,147)",
   "rgb(105,0,150)",
   "rgb(102,0,153)",
   "rgb(99,0,156)",
   "rgb(96,0,159)",
   "rgb(93,0,162)",
   "rgb(90,0,165)",
   "rgb(87,0,168)",
   "rgb(84,0,171)",
   "rgb(81,0,174)",
   "rgb(78,0,177)",
   "rgb(75,0,180)",
   "rgb(72,0,183)",
   "rgb(69,0,186)",
   "rgb(66,0,189)",
   "rgb(63,0,192)",
   "rgb(60,0,195)",
   "rgb(57,0,198)",
   "rgb(54,0,201)",
   "rgb(51,0,204)",
   "rgb(48,0,207)",
   "rgb(45,0,210)",
   "rgb(42,0,213)",
   "rgb(39,0,216)",
   "rgb(36,0,219)",
   "rgb(33,0,222)",
   "rgb(30,0,225)",
   "rgb(27,0,228)",
   "rgb(24,0,231)",
   "rgb(21,0,234)",
   "rgb(18,0,237)",
   "rgb(15,0,240)",
   "rgb(12,0,243)",
   "rgb(9,0,246)",
   "rgb(6,0,249)",
   "rgb(0,0,252)",
   "rgb(0,0,255)",
   "rgb(0,5,255)",
   "rgb(0,10,255)",
   "rgb(0,16,255)",
   "rgb(0,21,255)",
   "rgb(0,26,255)",
   "rgb(0,32,255)",
   "rgb(0,37,255)",
   "rgb(0,42,255)",
   "rgb(0,48,255)",
   "rgb(0,53,255)",
   "rgb(0,58,255)",
   "rgb(0,64,255)",
   "rgb(0,69,255)",
   "rgb(0,74,255)",
   "rgb(0,80,255)",
   "rgb(0,85,255)",
   "rgb(0,90,255)",
   "rgb(0,96,255)",
   "rgb(0,101,255)",
   "rgb(0,106,255)",
   "rgb(0,112,255)",
   "rgb(0,117,255)",
   "rgb(0,122,255)",
   "rgb(0,128,255)",
   "rgb(0,133,255)",
   "rgb(0,138,255)",
   "rgb(0,144,255)",
   "rgb(0,149,255)",
   "rgb(0,154,255)",
   "rgb(0,160,255)",
   "rgb(0,165,255)",
   "rgb(0,170,255)",
   "rgb(0,176,255)",
   "rgb(0,181,255)",
   "rgb(0,186,255)",
   "rgb(0,192,255)",
   "rgb(0,197,255)",
   "rgb(0,202,255)",
   "rgb(0,208,255)",
   "rgb(0,213,255)",
   "rgb(0,218,255)",
   "rgb(0,224,255)",
   "rgb(0,229,255)",
   "rgb(0,234,255)",
   "rgb(0,240,255)",
   "rgb(0,245,255)",
   "rgb(0,250,255)",
   "rgb(0,255,255)",
   "rgb(0,255,247)",
   "rgb(0,255,239)",
   "rgb(0,255,231)",
   "rgb(0,255,223)",
   "rgb(0,255,215)",
   "rgb(0,255,207)",
   "rgb(0,255,199)",
   "rgb(0,255,191)",
   "rgb(0,255,183)",
   "rgb(0,255,175)",
   "rgb(0,255,167)",
   "rgb(0,255,159)",
   "rgb(0,255,151)",
   "rgb(0,255,143)",
   "rgb(0,255,135)",
   "rgb(0,255,127)",
   "rgb(0,255,119)",
   "rgb(0,255,111)",
   "rgb(0,255,103)",
   "rgb(0,255,95)",
   "rgb(0,255,87)",
   "rgb(0,255,79)",
   "rgb(0,255,71)",
   "rgb(0,255,63)",
   "rgb(0,255,55)",
   "rgb(0,255,47)",
   "rgb(0,255,39)",
   "rgb(0,255,31)",
   "rgb(0,255,23)",
   "rgb(0,255,15)",
   "rgb(0,255,0)",
   "rgb(8,255,0)",
   "rgb(16,255,0)",
   "rgb(24,255,0)",
   "rgb(32,255,0)",
   "rgb(40,255,0)",
   "rgb(48,255,0)",
   "rgb(56,255,0)",
   "rgb(64,255,0)",
   "rgb(72,255,0)",
   "rgb(80,255,0)",
   "rgb(88,255,0)",
   "rgb(96,255,0)",
   "rgb(104,255,0)",
   "rgb(112,255,0)",
   "rgb(120,255,0)",
   "rgb(128,255,0)",
   "rgb(136,255,0)",
   "rgb(144,255,0)",
   "rgb(152,255,0)",
   "rgb(160,255,0)",
   "rgb(168,255,0)",
   "rgb(176,255,0)",
   "rgb(184,255,0)",
   "rgb(192,255,0)",
   "rgb(200,255,0)",
   "rgb(208,255,0)",
   "rgb(216,255,0)",
   "rgb(224,255,0)",
   "rgb(232,255,0)",
   "rgb(240,255,0)",
   "rgb(248,255,0)",
   "rgb(255,255,0)",
   "rgb(255,251,0)",
   "rgb(255,247,0)",
   "rgb(255,243,0)",
   "rgb(255,239,0)",
   "rgb(255,235,0)",
   "rgb(255,231,0)",
   "rgb(255,227,0)",
   "rgb(255,223,0)",
   "rgb(255,219,0)",
   "rgb(255,215,0)",
   "rgb(255,211,0)",
   "rgb(255,207,0)",
   "rgb(255,203,0)",
   "rgb(255,199,0)",
   "rgb(255,195,0)",
   "rgb(255,191,0)",
   "rgb(255,187,0)",
   "rgb(255,183,0)",
   "rgb(255,179,0)",
   "rgb(255,175,0)",
   "rgb(255,171,0)",
   "rgb(255,167,0)",
   "rgb(255,163,0)",
   "rgb(255,159,0)",
   "rgb(255,155,0)",
   "rgb(255,151,0)",
   "rgb(255,147,0)",
   "rgb(255,143,0)",
   "rgb(255,139,0)",
   "rgb(255,135,0)",
   "rgb(255,131,0)",
   "rgb(255,127,0)",
   "rgb(255,123,0)",
   "rgb(255,119,0)",
   "rgb(255,115,0)",
   "rgb(255,111,0)",
   "rgb(255,107,0)",
   "rgb(255,103,0)",
   "rgb(255,99,0)",
   "rgb(255,95,0)",
   "rgb(255,91,0)",
   "rgb(255,87,0)",
   "rgb(255,83,0)",
   "rgb(255,79,0)",
   "rgb(255,75,0)",
   "rgb(255,71,0)",
   "rgb(255,67,0)",
   "rgb(255,63,0)",
   "rgb(255,59,0)",
   "rgb(255,55,0)",
   "rgb(255,51,0)",
   "rgb(255,47,0)",
   "rgb(255,43,0)",
   "rgb(255,39,0)",
   "rgb(255,35,0)",
   "rgb(255,31,0)",
   "rgb(255,27,0)",
   "rgb(255,23,0)",
   "rgb(255,19,0)",
   "rgb(255,15,0)",
   "rgb(255,11,0)",
   "rgb(255,7,0)",
   "rgb(255,3,0)",
   "rgb(255,0,0)",
   "rgb(250,0,0)",
   "rgb(245,0,0)",
   "rgb(240,0,0)",
   "rgb(235,0,0)",
   "rgb(230,0,0)",
   "rgb(225,0,0)",
   "rgb(220,0,0)",
   "rgb(215,0,0)",
   "rgb(210,0,0)",
   "rgb(205,0,0)",
   "rgb(200,0,0)",
   "rgb(195,0,0)",
   "rgb(190,0,0)",
   "rgb(185,0,0)",
   "rgb(180,0,0)",
   "rgb(175,0,0)",
   "rgb(170,0,0)",
   "rgb(165,0,0)",
   "rgb(160,0,0)",
   "rgb(155,0,0)",
   "rgb(150,0,0)",
   "rgb(145,0,0)",
   "rgb(140,0,0)",
   "rgb(135,0,0)",
   "rgb(130,0,0)",
   "rgb(125,0,0)",
   "rgb(120,0,0)",
   "rgb(115,0,0)",
   "rgb(110,0,0)",
   "rgb(105,0,0)",
   "rgb(0,0,0)"];
  /* 
   function addscales(scale) {
     var x = 0.003921569;  // 1 / 255
     for(var i = 0; i < 256; i++) {
       var z = (i * x) < 1 ? i * x : 1;
       scale.push(z);
     }
   }
   
   addscales(scale);
   */


   // Add the domain to the zScale - we re map the scale to 
   zScale.domain([
      d3.min(trends.data, function(trend) {
         return trend[2];
      }), 
      d3.max(trends.data, function(trend) {
         return trend[2];
      })
   ]);

   //scale = scale.map(zScale.invert);
   //zScale.domain(scale);
   zScale.range([0, colours.length]);

   var xAxis,
      yAxis;
   
   var myTicks = function(scale) {
      var values = scale.domain();
      var ticks = [];
      for (var i=0; i < values.length; i += Math.round(values.length/graphData.options.labelCount))  {
         ticks.push(values[i]);
      }
      return ticks;
   };
   
   if( graphData.type == 'hovmollerLon' ) {
      xAxis = d3.svg.axis()
         .scale(xScale) // set the range of the axis
         .tickSize(10) // height of the ticks
         .orient("bottom")
         .ticks(1)
         .tickValues(myTicks(xScale))
         .tickFormat(function(d,i) { return d.toFixed(2); });

      yAxis = d3.svg.axis()
         .scale(yScale)
         .tickSize(1)
         .orient("left");
      
   } else {     
      xAxis = d3.svg.axis()
         .scale(xScale)
         .tickSize(1)
         .ticks(6)
         .orient("bottom");
      

      yAxis = d3.svg.axis()
         .scale(yScale) // set the range of the axis
         .tickSize(10) // height of the ticks
         .orient("left")
         .ticks(8)
         .tickValues(myTicks(yScale))
         .tickFormat(function(d,i) { return d.toFixed(2); });
   }
      
   if ( graphData.type == 'hovmollerLon' ) {
      g.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + (height- margin.top + 31) + ")")
        .call(xAxis)
        .append("text")
        .attr("y", 30)
        .attr("x", 0 + (width/2) )
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Longitude");
        
      g.append("g").attr("class", "yaxis");   
      g.select(".yaxis") 
         .call(yAxis)
         .append("text")
         .attr("transform", "rotate(270)")
         .attr("y", -80)
         .attr("x", 0 - (height/2))
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .text("Time");
         
      var rects = g.selectAll("rects")
         .data(trends.data)
         .enter()
            .append("rect")
                .attr("x", function(d, i) { return  xScale( d[1] ); })
                .attr("y", function(d, i) { return yScale( parseDate(d[0]) ); })
                .attr("class", "graph-rect")
                .attr("width", xScale.rangeBand())
                .attr("height", function(d, i) { return 8; })
                .style("fill", function(d, i) { return colours[Math.round(zScale(d[2]))]; });  
   } else {
      g.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + (height- margin.top + 31) + ")")
        .call(xAxis)
        .append("text")
        .attr("y", 30)
        .attr("x", 0 + (width/2) )
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Time");
        
      g.append("g").attr("class", "yaxis");   
      g.select(".yaxis") 
         .call(yAxis)
         .append("text")
         .attr("transform", "rotate(270)")
         .attr("y", -80)
         .attr("x", 0 - (height/2))
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .text("Latitude"); 
         
      var rects = g.selectAll("rects")
         .data(trends.data)
         .enter()
            .append("rect")
                .attr("x", function(d, i) { return  xScale( parseDate(d[0]) ); })
                .attr("y", function(d, i) { return yScale( d[1] ); })
                .attr("class", "graph-rect")
                .attr("width", function(d, i) { return 8; })
                .attr("height", yScale.rangeBand())
                .style("fill", function(d, i) { 
                   return colours[Math.round(zScale(d[2]))]; 
                });
   }
   
   g.selectAll(".xaxis text").attr("transform", "translate("+width/365/2+",0)");
  
   // Percentage of the range
   function stopAmount(percentage)  {
      var x = (zScale.range()[1] - zScale.range()[0]) / 100;
      return x * percentage;
   }

   // Percentage of the domain
   function stopScale(percentage)  {
      var x = (zScale.domain()[1] - zScale.domain()[0]) / 100;
      return x * percentage;
   }

   // Colour from percentage of range
   function stopColor(percentage) {
      return colours[Math.round(stopAmount(percentage))];
   }

   var gradient = svg.append("defs").append("linearGradient")
      .attr("id", "gradient")
      .attr("y1", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%")
      .attr("x2", "0%")
      .attr("spreadMethod", "pad");
   
   gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color",stopColor(0))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "0.5%")
      .attr("stop-color",stopColor(0.5))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "6.25%")
      .attr("stop-color",stopColor(6.25))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "12.5%")
      .attr("stop-color", stopColor(12.5))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "18.75%")
      .attr("stop-color", stopColor(18.75))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "25%")
      .attr("stop-color", stopColor(25))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "31.25%")
      .attr("stop-color", stopColor(31.25))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "37.5%")
      .attr("stop-color", stopColor(37.5))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "43.75%")
      .attr("stop-color", stopColor(43.75))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", stopColor(50))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "56.25%")
      .attr("stop-color", stopColor(56.25))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "62.5%")
      .attr("stop-color", stopColor(62.5))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "68.75%")
      .attr("stop-color", stopColor(68.75))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "75%")
      .attr("stop-color", stopColor(75))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "81.25%")
      .attr("stop-color", stopColor(81.25))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "87.5%")
      .attr("stop-color", stopColor(87.5))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "93.75%")
      .attr("stop-color", stopColor(93.75))
      .attr("stop-opacity", 1);
      
   gradient.append("stop")
      .attr("offset", "99.9%")
      .attr("stop-color", stopColor(99.9))
      .attr("stop-opacity", 1);

   gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", stopColor(100))
      .attr("stop-opacity", 1);
   
   svg.append("g").attr("class", "legend_group").append("rect").attr("class", "legend")
      .attr("width", 20)
      .attr("height", height/1.5)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate("+[width + margin.left + 10, height/10]+")");
   
   var legend_data = [stopScale(0), stopScale(25), stopScale(50), stopScale(75), stopScale(100)];
   
   svg.select("g.legend_group").selectAll(".labels")
      .data(legend_data).enter()
      .append("text")
         .text(function(d,i) {
            //console.log(d)
            //console.log("adding text element");
            //if (i===0) { return null; }
            return gisportal.utils.ceil3places(d);
         }).attr("class", "labels").attr("transform", function(d,i) {
            return "translate(" + [width + margin.left + 35, ((height/6) * (i-0.5)) + height/5 ] + ")";
         });
     
   var graph = $('#' + graphData.id + '-graph');
   if (($('.graph-rect', graph).length === $('.graph-rect[width="0"]').length) 
       || ($('.graph-rect', graph).length === $('.graph-rect[height="0"]').length))  {
      
      graph.remove();
      gisportal.gritter.showNotification('graphData', null);

   }


}

gisportal.graphs.timeSeriesChart = function() {
   var margin = { top: 20, right: 20, bottom: 30, left: 50},
   width = 960,
   height = 500;
   
   var x = d3.time.scale()
   .range([0, width]);
   
   var y = d3.scale.linear()
   .range([height, 0]);
   
   var colour = d3.scale.category10();
   
   var xAxis = d3.svg.axis()
   .scale(x)
   .orient("bottom");
   
   var yAxis = d3.svg.axis()
   .scale(y)
   .orient("left");
   
   var line = d3.svg.line()
   .iterpolate("basis")
   .x(function(d) { return x(d.x); })
   .y(function(d) { return y(d.y); });
   
   function chart(selection) {
      selection.each(function(data) {
         x.domain(d3.extent(data, function(d) { return d.date; }));
         
         y.domain([
            d3.min(data, function(d) { return d3.min(d.values, function(v) { return v.temperature; }); }),
            d3.max(data, function(d) { return d3.max(d.values, function(v) { return v.temperature; }); })
         ]);
         
         var svg = d3.select(this).selectAll("svg").data([data]);
         
         var gEnter = svg.enter().append("svg").append("g");
         gEnter.append("g").attr("class", "x axis");
         
         svg.attr("width", width)
         .attr("height", height);
         
         var g = svg.select("g")
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      });  
   }
};

gisportal.graphs.histogramChart = function() {
   var margin = { top: 0, right: 0, bottom: 20, left: 0 },
      width = 700,
      height = 450;
      
   var histogram = d3.layout.histogram(),
   x = d3.scale.ordinal(),
   y = d3.scale.linear(),
   xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6, 0),
   yAxis = d3.svg.axis().scale(y).orient("left");
   
   function chart(selection) {
      selection.each(function(data) {
         data = histogram(data);
         
         x.domain(data.map(function(d) { return d.x; }))
         .rangeRoundBands([0, width - margin.left - margin.right], 0.1);
         
         y.domain([0, d3.max(data, function(d) { return d.y; })])
         .range([height - margin.top - margin.bottom, 0]);
         
         var svg = d3.select(this).selectAll("svg").data([data]);
         
         var gEnter = svg.enter().append("svg").append("g");
         gEnter.append("g").attr("class", "bars");
         gEnter.append("g").attr("class", "x axis");
         gEnter.append("g").attr("class", "y axis");
         
         svg.attr("width", width)
         .attr("height", height);
         
         var g = svg.select("g")
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
         
         var bar = svg.select(".bars").selectAll(".bar").data(data);
         bar.enter().append("rect");
         bar.exit().remove();
         bar.attr("width", x.rangeBand())
         .attr("x", function(d) { return x(d.x); })
         .attr("y", function(d) { return y(d.y); })
         .attr("height", function(d) { return y.range()[0] - y(d.y); })
         .order();
         
         g.select(".x.axis")
         .attr("transform", "translate(0," + y.range()[0] + ")");
      });
   }
   
   chart.margin = function(_) {
      if(!arguments.length) return margin;
      margin = _;
      return chart;
   };
   
   chart.width = function(_) {
      if(!arguments.length) return width;
      width = _;
      return chart;
   };
   
   chart.height = function(_) {
      if(!arguments.length) return height;
      height = _;
      return chart;
   };
   
   d3.rebind(chart, histogram, "value", "range", "bins");
   d3.rebind(chart, xAxis, "tickFormat");
   
   return chart;
};
