gisportal.graphs.histogram = function(data, options)  {
   var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  
   var numbers = [];
   for (var i = 0; i < data.output.histogram.Numbers.length; i++)  {
      var d = data.output.histogram.Numbers[i];
      numbers.push({ x:d[0], y:d[1]});
   }

   nv.addGraph({
      generate: function() {
         var chart = nv.models.historicalBarChart()
             .margin({left:25});
             //.useInteractiveGuideline(true);

         d3.select(svg)
           .datum(bars())
           .call(chart);
      
         svg.onresize = function() { chart.update(); };
      }
   });

   function bars()  {
      return [
         {
            values: numbers,
            key: 'Data',
            color: d3.scale.category10().range()[0]
         }
      ];
   };

   return svg;
};
