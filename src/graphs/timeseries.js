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
            .margin({left: 50})
            .tooltipContent(function(key, x, y, e, graph) {
               // y is already formatted so use e 
               var num = parseFloat(e.point.y);
               // If num%1 does not return 0 then it is a decimal
               num = num % 1 ? num.toFixed(2) : num;
               return '<h3>' + key + '</h3>' +'<p>' + num + ' - ' + x + '</p>'; 
            });
            //.useInteractiveGuideline(true); // There is a pull request for this waiting to be merged
                                               // https://github.com/novus/nvd3/pull/336
        
         chart.xTickFormat(function(d) {
            return d3.time.format('%x')(new Date(d));
         });

         chart.yTickFormat(function(d)  {
            var num = parseFloat(d);
            num = num % 1 ? num.toFixed(2) : num;
            return num;
         });

         var panel = $('#graphPanel .panel-container');
         d3.select('[data-id="' + data.coverage + '"] .graph svg')
              //.attr('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight)
              //.attr('preserveAspectRatio', "xMinYMin meet")
              .datum(lines())  
              .attr("width", $(panel).innerWidth() - 50).attr("height", $(panel).innerHeight() - 90 )
              //.attr("style", "width: 100%; height: 100%;")
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
