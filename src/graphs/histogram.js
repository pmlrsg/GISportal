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

         var panel = $('#graphPanel');
         d3.select('[data-id="' + data.coverage + '"] .graph svg')
           .datum(bars())              
           .attr("width", $(panel).innerWidth() - 40).attr("height", $(panel).innerHeight() - 40 )
           .call(chart);
      
         nv.utils.windowResize(chart.update);
         return chart;
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
