opec.graphs = {};

opec.graphs.create = function(data) {
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
            data: d1.sort(sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'STD'
         },
         {
            data: d2.sort(sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'max'
         },
         {
            data: d3.sort(sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'min'
         },
         {
            data: d4.sort(sortDates),
            lines: { show: true },
            points: { show: true },
            label: 'median'
         },
         {
            data: d5.sort(sortDates),
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
   else if(data.type == 'hovmollerLon' || data.type == 'hovmollerLat') {
      var start = new Date(data.output.global.time).getTime();
      
      var graphData = {
         id: 'wcsgraph' + Date.now(),
         title: 'WCS Hovmöller Test Graph',
         type: data.type,
         colour: 'redToBlue',
         data: data.output
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
   var dialog = opec.graphs.createDialogAlt(graphOptions.id, graphOptions.title);

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
         '<input type="checkbox" name="' + key + '" checked="checked" id="id' + key + '">' +
         '<label for="id' + key + '">' + val.label + '</label>');
      });
      
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

opec.graphs.createDialogAlt = function(uid, title) {
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

opec.graphs.createDialog = function(uid, title) {
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

function hovmoller(graphData) {  
   var trends = graphData.data;
   
   // Set some defaults for the basic chart
   var 
      width = 520,
      height = 329;
   
   // Set margin for the chart main group svg:g element
   var margin = {top: 20, left: 80, right: 60, bottom: 35};
   
   // Use these defaults to make the overall needed area
   var overall_dims = {
      w : width + margin.left + margin.right,
      h : height + margin.top + margin.bottom
   };
   
   var dialog = opec.graphs.createDialog(graphData.id, graphData.title);

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
         return d[1].toFixed(2);
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
         return d[1].toFixed(2);
      }));
   }
   
   // Add the domain to the zScale - we re map the scale to 
   zScale.domain([d3.min(trends.data, function(trend) { 
      return trend[2];
   }), d3.max(trends.data, function(trend) {
      return trend[2];
   })])
   .domain([0,0.00001,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1]
      .map(zScale.invert))
      .range(["green", 
         "darkblue", 
         "deepskyblue", 
         "blue", 
         "lightblue", 
         "paleturquoise", 
         "white", 
         "lightyellow", 
         "orange", 
         "red", 
         "orangered", 
         "darkred"]);

   var xAxis,
      yAxis;
   
   if( graphData.type == 'hovmollerLon' ) {
      xAxis = d3.svg.axis()
         .scale(xScale) // set the range of the axis
         .tickSize(1) // height of the ticks
         .orient("bottom")
         .ticks(8)
         .tickValues([d3.min(trends.data, function(d, i) {
            return d[1].toFixed(2);
         }), d3.max(trends.data, function(d, i) {
            return d[1].toFixed(2);
         })]);
      
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
         .tickSize(1) // height of the ticks
         .orient("left")
         .ticks(8)
         .tickValues([d3.min(trends.data, function(d, i) {
            return d[1].toFixed(2);
         }), d3.max(trends.data, function(d, i) {
            return d[1].toFixed(2);
         })]);
   }
   
   g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + (height- margin.top + 31) + ")")
      .call(xAxis);
      
   if ( graphData.type == 'hovmollerLon' ) {
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
                .attr("x", function(d, i) { return  xScale( d[1].toFixed(2) ); })
                .attr("y", function(d, i) { return yScale( parseDate(d[0]) ); })
                .attr("width", xScale.rangeBand())
                .attr("height", function(d, i) { return 5; })
                .style("fill", function(d, i) { return zScale(d[2]); });  
   } else {
      g.append("g").attr("class", "yaxis");   
      g.select(".yaxis") 
         .call(yAxis)
         .append("text")
         .attr("transform", "rotate(270)")
         .attr("y", -80)
         .attr("x", 0 - (height/2))
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .text("Latitude ()"); 
         
      var rects = g.selectAll("rects")
         .data(trends.data)
         .enter()
            .append("rect")
                .attr("x", function(d, i) { return  xScale( parseDate(d[0]) ); })
                .attr("y", function(d, i) { return yScale( d[1].toFixed(2) ); })
                .attr("width", function(d, i) { return 5; })
                .attr("height", yScale.rangeBand())
                .style("fill", function(d, i) { return zScale(d[2]); });
   }
   
   g.selectAll(".xaxis text").attr("transform", "translate("+width/365/2+",0)");
   
   var gradient = svg.append("defs").append("linearGradient")
      .attr("id", "gradient")
      .attr("y1", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%")
      .attr("x2", "0%")
      .attr("spreadMethod", "pad");
   
   gradient.append("stop")
      .attr("offset", "1%")
      .attr("stop-color",zScale(zScale.domain()[0]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "1%")
      .attr("stop-color",zScale(zScale.domain()[1]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "10%")
      .attr("stop-color", zScale(zScale.domain()[2]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "20%")
      .attr("stop-color", zScale(zScale.domain()[3]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "30%")
      .attr("stop-color", zScale(zScale.domain()[4]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "40%")
      .attr("stop-color", zScale(zScale.domain()[5]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", zScale(zScale.domain()[6]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "60%")
      .attr("stop-color", zScale(zScale.domain()[7]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "70%")
      .attr("stop-color", zScale(zScale.domain()[8]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "80%")
      .attr("stop-color", zScale(zScale.domain()[9]))
      .attr("stop-opacity", 1);
   
   gradient.append("stop")
      .attr("offset", "90%")
      .attr("stop-color", zScale(zScale.domain()[10]))
      .attr("stop-opacity", 1);
      
   gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", zScale(zScale.domain()[11]))
      .attr("stop-opacity", 1);
   
   svg.append("g").attr("class", "legend_group").append("rect").attr("class", "legend")
      .attr("width", 20)
      .attr("height", height/1.5)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate("+[width + 90, height/10]+")");
   
   var legend_data = zScale.domain();
   
   var legend =  [0.0, 0.001, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
   
   
   svg.select("g.legend_group").selectAll(".labels")
      .data(legend_data).enter()
      .append("text")
         .text(function(d,i) {
            //console.log(d)
            //console.log("adding text element");
            if (i===0) { return null; }
            return parseFloat(d).toFixed(2);
         }).attr("class", "labels").attr("transform", function(d,i) {
            return "translate(" + [width + 115, ((height/15.5) * (i-0.7)) + height/10 ] + ")";
         });
}

opec.graphs.timeSeriesChart = function() {
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

opec.graphs.histogramChart = function() {
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
