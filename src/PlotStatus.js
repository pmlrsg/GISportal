
/**
 * The PlotStatus object is used to display a small view of a plot.
 * It will be used on the history panel.
 * After a plot is made or loaded from the server it will give given
 * one of these views and added to the history panel.
 * This interfaces with the Plot object to allow the user to:
 *  - Save or unsave the plot
 *  - View the status of it, downloading, complete, expired, etc...
 *  - Open the plot or possibly see download methods
 * 
 */
gisportal.graphs.PlotStatus = (function(){

   /**
    * Creates a new PlotEditer object which will edit a plot object
    *
    * @param {Plot} plot The plot object to edit
    */
   var PlotStatus = function( plot ){
      this._plot = plot;

      //Setup
      this.rebuildElement();
      this.setupPlotStatusChange();
   };

   PlotStatus.prototype.rebuildElement = function(){
      var plot = this.plot();
      var rendered = gisportal.templates['plot-status']( plot );
      var newElement = $(rendered);
      this.renderedState = plot.state();

      // Replace the HTML in the dom if needed
      if( this._element )
         this._element.replaceWith( newElement );

      this._element = newElement;
      newElement.data('plot', plot);


      this._element
         .on('click', '.js-graph-status-delete', function(){
            $(this).closest('.graph-job').remove();
         })
         .on('click', '.js-graph-status-open', function(){

            var interactiveUrl = plot.interactiveUrl();

            window.open( interactiveUrl, plot.title(), 'width=' + window.innerWidth * 0.90 + ',height=' + window.innerHeight * 0.70  + ',toolbar=no' );
         });
   };

   PlotStatus.prototype.setupPlotStatusChange = function(){
      var _this = this;

      this.plot().on('serverStatus-change', function( data ){
         var serverStatus = data.new;
         switch( serverStatus.state ){
            case "success":
               _this.stateSuccess( serverStatus );
               break;
            case "processing":
            case "testing":
               _this.stateProcessing( serverStatus );
               break;
            case "error":
               _this.stateError( serverStatus );
               break;
         };
      });
   };

   PlotStatus.prototype.stateError = function( serverStatus ){

      if( this.renderedState != "error" )
         this.rebuildElement();

      var message = serverStatus.message;
      this._element
         .find('.js-graph-status-show-full-error')
         .click(function(){
            alert( message );
         });
   };

   PlotStatus.prototype.stateSuccess = function( serverStatus ){

      if( this.renderedState != "success" )
         this.rebuildElement();

   };

   PlotStatus.prototype.stateProcessing = function( serverStatus ){
      var isCalculating = false;
      var hasEstimation = false;
      var worestCaseEstimation = new Date();

      if( this.renderedState != "processing" )
         this.rebuildElement();

      for( var sourceId = 0; sourceId < serverStatus.sources.length; sourceId++ ){
         var source = serverStatus.sources[ sourceId ];

         switch( source.estimation.state ){
            case "calculating":
               isCalculating = true;
               break;
            case "success":
               hasEstimation = true;
               var estimatedEst = new Date( source.estimation.endTime );
               if( estimatedEst.getTime() > worestCaseEstimation.getTime() )
                  worestCaseEstimation = estimatedEst;
               break;

         };
      };

      var message = serverStatus.message;

      if( isCalculating && ! hasEstimation )
         message += "<br>Calculating est";
      if( hasEstimation )
         message += "<br>Estimated time remaining: " + this.printSmallTimeDiffernce( worestCaseEstimation ) ;

      this._element
         .find('.js-message')
         .html( message );

   };

   /**
    * Takes in a Date object and return the differnce between then and now
    * in the format of **m**s
    * @param  {Date} endTime The time to take the differnce between
    * @param {bool} allowNegative If true it can return minus numbers, if false it stops at 0m0s
    * @return {[type]}
    */
   PlotStatus.prototype.printSmallTimeDiffernce = function( endTime, allowNegative ){
      var allowNegative = allowNegative || false;
      var startTime = new Date();

      var differnceInSecs = ( endTime.getTime() - startTime.getTime() ) / 1000;

      if( ! allowNegative && differnceInSecs == 0 )
         return "0m0s";

      var flip = false;
      if( differnceInSecs < 0 ){
         flip = true;
         differnceInSecs = Math.abs( differnceInSecs );
      }

      var minutes  = Math.floor(differnceInSecs / 60);
      var seconds  = Math.floor(differnceInSecs % 60);

      var output = flip ? "-":"+";

      output += minutes + "m";
      output += seconds + "s";

      return output;
   }

   PlotStatus.prototype.element = function(){
      return this._element;
   };

   PlotStatus.prototype.plot = function(){
      return this._plot;
   };


   return PlotStatus;
})();
