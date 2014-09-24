
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

      var _this = this;
      this._element
         .find('.js-graph-status-open')
         .click(function(){
             var plot = _this.plot();

            var interactiveUrl = plot.interactiveUrl();

            window.open( interactiveUrl, plot.title(), 'width=640,height=480,toolbar=no' );
         });

      this._element
         .find('.js-graph-status-edit')
         .click(function(){
            alert( "Feature coming soon!" );
         });

      this._element
         .find('.js-graph-status-delete')
         .click(function(){
            $(this).closest('.graph-job').remove();
         });
   };

   PlotStatus.prototype.stateProcessing = function( serverStatus ){
      var isCalculating = false;
      var hasEstimation = false;
      var worestCaseEstimation = new Date();

      if( this.renderedState != "processing" )
         this.rebuildElement();

      for( var serverId in serverStatus.series ){
         var series = serverStatus.series[ seriesId ];

         switch( series.estimation.state ){
            case "calculating":
               isCalculating = true;
               break;
            case "success":
               var estimatedEst = new Date( series.estimation );
               if( estimatedEst.getTime() > worestCaseEstimation.getTime() )
                  worestCaseEstimation = estimatedEst;
               break;

         };
      };

      var message = serverStatus.message;

      if( isCalculating && ! hasEstimation )
         message += "\nCalculating est";
      if( hasEstimation )
         message += "\nEstimated time remaining: " + this.printSmallTimeDiffernce( worestCaseEstimation ) ;

      this._element
         .find('.js-message')
         .text( message );

   };

   /**
    * Takes in a Date object and return the differnce between then and now
    * in the format of **m**s
    * @param  {[type]} endTime
    * @return {[type]}
    */
   PlotStatus.prototype.printSmallTimeDiffernce = function( endTime, allowNegative ){
      var allowNegative = allowNegative || false;
      var startTime = new Date();

      var differnceInSecs = ( endTime.getTime() - startTime.getTime() ) / 1000;

      if( allowNegative && differnceInSecs == 0 )
         return "0m0s";

      var flip = false;
      if( differnceInSecs < 0 ){
         flip = true;
         differnceInSecs = Math.abs( differnceInSecs );
      }

      var minutes  = differnceInSecs / 60;
      var seconds  = differnceInSecs % 60;

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
