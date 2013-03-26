$(document).ready(function() {
   
   // IE 9 Fix for missing console
   if (Function.prototype.bind && console && typeof console.log == "object") {
      [ 
         "log","info","warn","error","assert","dir","clear","profile","profileEnd"
      ].forEach(function (method) {
         console[method] = this.call(console[method], console);
      }, Function.prototype.bind);
   }
   
   main();
});
