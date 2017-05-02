
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
    * Creates a new PlotEditor object which will edit a plot object
    *
    * @param {Plot} plot The plot object to edit
    */
   var PlotStatus = function( plot ){
      this._plot = plot;

      //Setup
      this.rebuildElement();
      this.setupPlotStatusChange();
   };
    /**
     * Rebuilds the UI in the status element
     * Is normally called when the plot api
     * says the status of the plot has changed
     */
   PlotStatus.prototype.rebuildElement = function(){
      // Get the plot
      var plot = this.plot();

      // Generate the HTML template
      var rendered = gisportal.templates['plot-status']( plot );

      // Convert it to a dom element
      var newElement = $(rendered);

      // Get the state used in the HTML
      // IE, success, error, processing
      this.renderedState = plot.state();

      // Replace the HTML in the dom if needed
      if( this._element )
         this._element.replaceWith( newElement );

      // Store the new element
      this._element = newElement;
      newElement.data('plot', plot);

      // Add listeners to the buttons that
      // maybe in the dom
      gisportal.graphs.addButtonListeners(this._element, noCopyEdit = false, plot);

      // Makes sure that any identical plots are removed
      $('.js-graphs-history-list [data-graph-id="' + this._plot.id + '"]').closest('.graph-job').not(':first').find('.js-graph-status-delete').trigger('click');
   };

   /**
    * Setup a listener so that if the state
    * on the plot changes we can handle the
    * event and update the UI
    */
   PlotStatus.prototype.setupPlotStatusChange = function(){
      var _this = this;

      this.plot().on('serverStatus-change', function( data ){
         var serverStatus = data['new'];
         switch( serverStatus.state ){
            case "complete":
               _this.stateSuccess( serverStatus );
               break;
            case "extracting":
            case "plotting":
            case "rendering":
            case "testing":
               _this.stateProcessing( serverStatus );
               break;
            case "failed":
               _this.stateError( serverStatus );
               _this._plot.stopMonitoringJobStatus();
               break;
         }
      });
   };

   /**
    * Handles what to do if the plots state
    * becomes an error.
    *
    * It reloads the state html block and adds
    * a listener to the Show Full Error button
    * which shows the full error from the server
    * 
    * @param  Object serverStatus The status as returned
    *                             from the server
    */
   PlotStatus.prototype.stateError = function( serverStatus ){

      if( this.renderedState != "failed" )
         this.rebuildElement();

      var id = serverStatus.job_id;
      var message = serverStatus.message;
      var error_element = this._element.find('.js-graph-status-show-full-error');
      error_element.on('click',function(){
         $.notify(message + '\nPlease report ' + id.substr(0, 8).toUpperCase() + ' when contacting support.', {className:"error", autoHide: false});
      });
   };

   /**
    * Handles what to do if the plots state
    * becomes an success.
    *
    * It just reloads the state element
    * 
    * @param  Object serverStatus The status as returned
    *                             from the server
    */
   PlotStatus.prototype.stateSuccess = function( serverStatus ){

      if( this.renderedState != "complete" )
         this.rebuildElement();

   };

   /**
    * When a Plot request is sent away the plot returns status
    * messages about how the progress of the graph on the server
    *
    * This function handles the processing state.
    * It will update the status element do some final calculations
    * on estimating the completion time from the information
    * the server has given.
    * 
    * @param  Object serverStatus The status as returned
    *                             from the server
    */
   PlotStatus.prototype.stateProcessing = function( serverStatus ){
      // var isCalculating = false;

      // Rebuild the element if we arent already showing
      // the processing template
      if( this.renderedState != "extracting" )
         this.rebuildElement();

      var message = serverStatus.message;

      // // Decide what the estimated completion 
      // // time message should be
      // if( isCalculating && ! this._plot.estimatedFinishTime )
      //    message += "<br>Estimated time remaining: calculating";
      // if( this._plot.estimatedFinishTime )
      //    message += "<br>Estimated time remaining: " + this.printSmallTimeDiffernce( this._plot.estimatedFinishTime ) ;

      // Add the message to the status element
      this._element
         .find('.js-message')
         .html( message );
   };

   /**
    * Takes in a Date object and return the differnce between then and now
    * in the format of **m**s
    * @param  Date endTime           The time to take the differnce between
    * @param  Boolean allowNegative  If true it can return minus numbers, if false it stops at 0m0s
    * @return String
    */
   PlotStatus.prototype.printSmallTimeDiffernce = function( endTime, allowNegative ){
      allowNegative = allowNegative || false;
      var startTime = new Date();

      var differnceInSecs = ( endTime.getTime() - startTime.getTime() ) / 1000;

      if( ! allowNegative && differnceInSecs <= 0 )
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
   };

   // Getter themes

   // Gets the HTML for the dom
   PlotStatus.prototype.element = function(){
      return this._element;
   };

   // Get the plot this View is associated with
   PlotStatus.prototype.plot = function(){
      return this._plot;
   };


   return PlotStatus;
})();
