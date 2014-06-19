gisportal.graphs.timeseries = function(data, options)  {
   var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   var start = new Date(data.output.global.time).getTime();
   var std    = [],
       max    = [],
       min    = [],
       med = [],
       mean   = [];
   
   var sorted = Object.keys(data.output.data).sort(function(a,b) { return new Date(a) - new Date(b) });
   for (var i = 0; i < sorted.length; i++)  {
      var date = new Date(sorted[i]).getTime();
      var value = data.output.data[sorted[i]];
      std.push({ x:date, y:value.std});
      max.push({ x:date, y:value.max});
      min.push({ x:date, y:value.min});
      med.push({ x:date, y:value.median}); 
      mean.push({ x:date, y:value.mean});
   };

   console.log(data, std);

   nv.addGraph({
      generate: function() {

        /* 
          var chart = nv.models.lineChart()
            .useVoronoi(false) // Work around for a bug in nvd3 https://github.com/novus/nvd3/issues/330
            .margin({left: 50, right: 50})
            .showYAxis(true)
            .showXAxis(true)
            .useInteractiveGuideline(true);
       
         /* Chart with zooming
         */
         var chart = nv.models.lineWithFocusChart()
            .margin({left: 25});
            //.useInteractiveGuideline(true); // There is a pull request for this waiting to be merged
                                               // https://github.com/novus/nvd3/pull/336
        
         if (chart.xAxis)  { 
            chart.xAxis.tickFormat(function(d) {
               return d3.time.format('%x')(new Date(d))
            });
         }

         if (chart.yAxis)  {
            chart.yAxis.tickFormat(function(d)  {
               return d.toPrecision(1);
            });
         }
 
         if (chart.x2Axis)  {
            chart.x2Axis.tickFormat(function(d) {
               return d3.time.format('%x')(new Date(d))
            });
         }

         if (chart.y2Axis)  { 
            chart.y2Axis.tickFormat(function(d)  {
               return d.toPrecision(1);
            });
         }
         

         d3.select('[data-id="' + data.coverage + '"] .graph svg')
              //.attr('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight)
              //.attr('preserveAspectRatio', "xMinYMin meet")
              .datum(lines())  
              .attr("width", "500px").attr("height", "500px" )
              .attr("style", "width: 100%; height: 100%;")
              .call(chart);
         //chart.xScale(d3.time.scale());
         //chart.yScale(d3.scale.linear());

         //svg.onresize = function() { chart.update() };
         nv.utils.windowResize(chart.update);
         return chart;
      }, 
   });

   function lines() {
      return [
      {
         values: std,
         key: "Standard Deviation",
         color: d3.scale.category10().range()[0]
      }, 
      {
         values: max,
         key: "Maximum",
         color: d3.scale.category10().range()[1]
      },
      {
         values: min,
         key: "Minimum",
         color: d3.scale.category10().range()[2]
      },
      {
         values: med,
         key: "Median",
         color: d3.scale.category10().range()[3]  
      },
      {
         values: mean,
         key: "Mean",
         color: d3.scale.category10().range()[4]  
      }];
   }

   return svg;
};
