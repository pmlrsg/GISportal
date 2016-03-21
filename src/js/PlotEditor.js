

gisportal.graphs.PlotEditor = (function(){

   /**
    * Creates a new PlotEditor object which will edit a plot object
    *
    * @param {Plot} plot The plot object to edit
    * @dom {HTMLElement} editorParent The html object where the editor will be placed.
    */
   var PlotEditor = function( plot, editorParent ){
      this._plot = plot;

      this._editorParent = $(editorParent);

      this.buildEditor();
   };


   PlotEditor.prototype.buildEditor = function(){

      var transect_plot = false;
      if(gisportal.methodThatSelectedCurrentRegion.method == "csvUpload"){
         transect_plot = true;
      }
      var rendered = gisportal.templates['active-plot']({
         plot: this._plot,
         transect_plot: transect_plot
      });

      this._editorParent.find('.js-slideout-content').html( rendered );


      var _this = this;
      
      //Store all the relevent varibles
      this.setupTitleInput();
      this.setupPlotTypeSelect();
      this.setupDateRangeSlider();
      this.setupAddIndicatorBtn();

      this.setupComponents();
      
      //Setup the active "create graph" button
      this._editorParent.find('.js-create-graph').click(function(){
         _this.submitRequest();
      });

      this._editorParent.find('.js-close-active-plot').click(function(){
         if( confirm('Warning this will delete this plot. Try "Hide" to keep this plot.') )
            gisportal.graphs.deleteActiveGraph();
         else
            return false;
      });

   };

   /**
    * Setup the plot title element.
    * Adds a 2 way binding so if the INPUT is edited it updates the Plot
    * and if the Plot is updates it updates the INPUT.
    */
   PlotEditor.prototype.setupTitleInput = function(  ){
      var _this = this;

      this._plotTitleInput = this._editorParent.find('.js-active-plot-title');

      // Setup the title input box sync
      this.plot().on('title-change', function(value){
         var currentValue = _this._plotTitleInput.val();
         if( currentValue != value['new'] )
            _this._plotTitleInput.val(value['new']);
      });
      this._plotTitleInput.change(function(){
         _this.plot().title( $(this).val() );
      });
   };

   /**
    * Setup the plot type SELECT element.
    * Adds a 2 way binding so if the select is edited it updates the Plot
    * and if the Plot is updates it updates the SELECT.
    */
   PlotEditor.prototype.setupPlotTypeSelect = function(  ){
      var _this = this;

      this._plotTypeSelect = this._editorParent.find('.js-active-plot-type');

      // Setup the title input box sync
      this.plot().on('plotType-change', function(value){
         var currentValue = _this._plotTypeSelect.val();
         if( currentValue != value['new'] )
            _this._plotTypeSelect.val(value['new']);
      });
      this._plotTypeSelect.change(function(){
         _this.plot().plotType( $(this).val() );
      });
   };

   /**
    * Adds a component to the Editors plot.
    * Also catches any errors and displays them to the user
    * @param {Object} component Component to add
    */
   PlotEditor.prototype.addComponent = function( component ){

      var result = this.plot().addComponent( component );
      // Couldnt add component, show error
      if( result instanceof Error ){
         var alert = $('<div>')
         .addClass( 'alert alert-danger' )
         .text( result.toString() )
         .append( '<span class="pull-right btn js-alert-close icon-filled-delete-2-2" ></span>' );

         setTimeout(function(){ alert.remove(); }, 5000);
         this._editorParent.find( '.js-components-area' ).prepend( alert );
      }
   };

   

   /**
    * Setup the Add Indicator button
    * When a user clicks the button we need to make sure it
    * currently has a list of the active indicators
    * @return {[type]} [description]
    */
   PlotEditor.prototype.setupAddIndicatorBtn = function(){
      var _this = this;
      
      this._editorParent.find('.js-add-indicator-dropdown').click(function(){
         var layers = gisportal.selectedLayers.map( gisportal.getLayerByID );
         var rendered = gisportal.templates['add-indicator-dropdown']( { layers: layers } );
         $(this).next('.js-dropdown-menu').html( rendered );
         _this._editorParent.find('.js-slideout-content').scrollTop(10000);
      });
   };


   /**
    * Finished the building of this graph.
    *  - Closes the graph editor panel.
    *  - Tells the plot to make the request.
    *
    */
   PlotEditor.prototype.submitRequest = function(){
      var minComponents = this.plot().minComponents;
      var totComponents = this.plot().components().length;

      var hasLeftHandSeries = this.plot().components().some(function( component ){
         return component.yAxis == 1;
      });

      if( this.plot().components().length == 1 )
         this.plot().components()[0].yAxis = 1;

      if(minComponents <= totComponents){
         if(this.plot().plotType() == "scatter"){
            var _this = this;
            var errFound = false;
            this.plot()._components.forEach(function(comElem){
               if(_this.plot().forceComponentDateRange( comElem )){
                  errFound = true;
               }
            });
            this.plot().checkComponentOverlap();
            if(errFound){
               $.notify("Scatter plots must have time bounds contained within the components. \nPlease try submitting again.", "error");
               return;
            }
         }
         if( this.plot().components().length == 1 || hasLeftHandSeries ){
            this._editorParent.find('.js-slideout-content').removeClass('multiple-components');
            this.plot().submitRequest();
            gisportal.graphs.activeGraphSubmitted();
            if($('.graph-job').length > 0){
               $('.no-graphs-text').toggleClass("hidden", true);
            }
         }else{
            $.notify("A series on the left Y axis is required.", "error");
         }
      }else{
         $.notify("You must have at least " + minComponents + " compenents for this type of graph.", "error");
      }
   };

   /**
    * Updates the UI time bounds slider's currently selection
    */
   PlotEditor.prototype.updateDateRangeSliderTBounds = function(){

      var tBounds = this.plot().tBounds();
      var tBoundMillisec = tBounds.map(function( date ){ return date.getTime();});
      var sliderValInInts = this._rangeSlider.val().map(function(val){ return parseInt(val); });

      if( _.isEqual( tBoundMillisec, sliderValInInts) )
         return;
      
      this._rangeSlider.noUiSlider({
         start: [
            tBounds[0].getTime(),
            tBounds[1].getTime()
         ]
      }, true);
   };

   /**
    * Updates the UI time bounds slider's out bounds
    * @return {[type]} [description]
    */
   PlotEditor.prototype.updateDateRangeSliderBounds = function(){
      var dateRangeBounds = this.plot().dateRangeBounds();

      this._rangeSlider.noUiSlider({
         range:{
            min: dateRangeBounds.min.getTime(),
            max: dateRangeBounds.max.getTime()
         }
      }, true);
   };

   /**
    * Setups the the date slider on graph pane.
    * - Starts the slide and sets its initails values
    * - Sets up the 2 date text boxes to accept change events
    */
   PlotEditor.prototype.setupDateRangeSlider = function(){
      var tBounds = this.plot().tBounds();
      var dateRangeBounds = this.plot().dateRangeBounds();
      var _this = this;

      this._rangeSlider = this._editorParent.find('.js-range-slider');
      this._startDateInput = this._editorParent.find('.js-active-plot-start-date');
      this._endDateInput = this._editorParent.find('.js-active-plot-end-date');

      //Setup the date slider
      this._rangeSlider.noUiSlider({
         start: [
            tBounds[0].getTime(),
            tBounds[1].getTime(),
         ],
         connect: true,
         behaviour: 'tap-drag',
         range: {
            'min': dateRangeBounds.min.getTime(),
            'max': dateRangeBounds.max.getTime()
         },
         serialization: {
            lower: [
               $.Link({
                  target: this._startDateInput,
                  method: setDate 
               })
            ],
            upper: [
               $.Link({
                  target: this._endDateInput,
                  method: setDate
               })
            ],
            format: {
               decimals: 0
            }
         }
      })
      // Listen for when the user moves the slider and update the tBounds
      .on('slide', function(event, val){
         var tBounds = val.map(Number).map(function(stamp){ return new Date(stamp);});
         _this.plot().tBounds( tBounds );
      });
      
      // The start date input element is manually typed update  tBounds
      this._startDateInput.change(function(){
         var newDate = new Date( $(this).val() );
         var currentTBounds = _this.plot().tBounds();
         
         if( isNaN( newDate.getTime() ) )
            setDate.call(this, currentTBounds[0] );
         else
            _this.plot().tBounds( [ newDate, currentTBounds[1] ] );
      });
      
      // The end date input element is manually typed update  tBounds
      this._endDateInput.change(function(){
         var newDate = new Date( $(this).val() );
         var currentTBounds = _this.plot().tBounds();
         
         if( isNaN( newDate.getTime() ) )
            setDate.call(this, currentTBounds[1] );
         else
            _this.plot().tBounds( [ currentTBounds[0] , newDate ] );
      });

      this.plot().on('dateRangeBounds-change', function(){
         _this.updateDateRangeSliderBounds();
      });
      this.plot().on('tBounds-change', function(){
         _this.updateDateRangeSliderTBounds();
      });
   };

   /**
    * Setups up the functions required to handle the graph components.
    * A graph component consists of an indicatorId, BBox and Elevation.
    * This function does:
    *  - Setups up event listeners to the Plot object
    *  - Once theres trigger it adds or removes the element in the dom
    *  - It also adds events to the componentElements
    *       and listeners for clicks on the x button
    */
   PlotEditor.prototype.setupComponents = function(){
      
      this._componentsTable = this._editorParent.find('.js-components');

      var _this = this;

      function addComponent( component ){

         if( _this.plot().components().length > 1 ){
            _this._editorParent.find('.js-slideout-content').addClass('multiple-components');
         }

         var componentCopy = _.clone(component);
         componentCopy.indicatorObj = gisportal.layers[componentCopy.indicator];
         var rendered = gisportal.templates['active-plot-component']( componentCopy );
         var element = $(rendered).data('component', component);


         _this._componentsTable.append( element );


         _this.setComponentHasDataInRange( element );

         // On click X remove the component
         element.on('click', '.js-close-acitve-plot-component', function(){
            _this.plot().removeComponent( component );
         });


         element.on('click', '.js-y-axis', function(){
            component.yAxis = parseInt( $(this).val() );
         });

         // The tooltip which tells the user about the range of available data
         var indicator = gisportal.layers[componentCopy.indicator];
         var validRange =  indicator.firstDate + " - " + indicator.lastDate;

         element.tooltipster({
            position: 'right',
            maxWidth: 200,
            content: function(){
               var inRange = $(element).attr('has-data-in-range');
               switch( inRange ){
                  case "yes":
                     return "This indicator has data in the selected time range";
                  case "partial":
                     return "This indicator only has partial data in this date range.\nValid range: " + validRange;
                  case "no":
                     return "This indicator only has no data in this date range.\nValid range: " + validRange;
               }
            }
         });
      }

      // When a component is added to Plot add it to the UI
      this.plot().on('component-added', function( data ){
         addComponent( data.component );
      });
      
      // When a component is removed from the Plot remove it from the UI
      this.plot().on('component-removed', function( data ){
         if( _this.plot().components().length === 1 )
            _this._editorParent.find('.js-slideout-content').removeClass('multiple-components');
         if( _this.plot().components().length === 0 )
            gisportal.graphs.deleteActiveGraph();


         _this._componentsTable.children().each(function(){
            if( $(this).data('component') == data.component ){
               $(this).remove();
               return false;
            }
         });
      });

      // When the tBounds change change each component for if it has data in range
      var tBounds = this.plot().tBounds();

      this.plot().on('tBounds-change', function(){
         _this._componentsTable.children().each(function(){
            
            _this.setComponentHasDataInRange( this );

         });
      });

      // Reload any exisitng components
      this.plot().components().forEach( addComponent );
   };

   /**
    * Find out if the component passed in has data in range.
    * It will then update the component element with an 
    * attribute depending on if the component has data in 
    * range, not in range or partially in range.
    * 
    * @param {Object} componentElement Component element
    */
   PlotEditor.prototype.setComponentHasDataInRange = function( componentElement ){
      // The the layer of the current component
      var component = $(componentElement).data('component');
      var indicator = gisportal.layers[ component.indicator ];

      // Date range of the components layer
      var firstDate = new Date(indicator.firstDate);
      var lastDate = new Date(indicator.lastDate);
      
      var tBounds = this.plot().tBounds();

      var result;

      // Find the coverage
      if( firstDate <= tBounds[0] && tBounds[1] <= lastDate )
         result = "yes";
      else if(  lastDate < tBounds[0]  || tBounds[1] < firstDate )
         result = "no";
      else
         result = "partial";

       // Set the attribute of the result
      $(componentElement).attr('has-data-in-range', result);
   };

   /**
    * Returns the Plot that this editor is editing
    * @return {Plot} The current Plot
    */
   PlotEditor.prototype.plot = function(){
      return this._plot;
   };

   return PlotEditor;
})();
