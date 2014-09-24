

gisportal.graphs.PlotEditor = (function(){

   /**
    * Creates a new PlotEditer object which will edit a plot object
    *
    * @param {Plot} plot The plot object to edit
    * @dom {HTMLElement} editorParent The html object where the editor will be placed.
    */
   var PlotEditor = function( plot, editorParent ){
      this._plot = plot;

      this._editorParent = $(editorParent);

      this.rebuildEditor();
   }


   PlotEditor.prototype.rebuildEditor = function(){

      var rendered = gisportal.templates['active-plot']({
         plot: this._plot,
      });

      this._editorParent.find('.js-slideout-content').html( rendered );


      var _this = this;
      
      //Store all the relevent varibles
      this.setupTitleInput();
      this.setupPlotTypeSelect();

      this.setupDateRangeSlider();

      this.setupComponents();
      
      //Setup the active "create graph" button
      this._editorParent.find('.create-graph').click(function(){
         _this.submitRequest();
      })

   }

   PlotEditor.prototype.setupTitleInput = function(  ){
      var _this = this;

      this._plotTitleInput = this._editorParent.find('.js-active-plot-title');

      // Setup the title input box sync
      this.plot().on('title-change', function(value){
         var currentValue = _this._plotTitleInput.val();
         if( currentValue != value['new'] )
            _this._plotTitleInput.val(value['new'])
      });
      this._plotTitleInput.change(function(){
         _this.plot().title( $(this).val() );
      });
   }


   PlotEditor.prototype.setupPlotTypeSelect = function(  ){
      var _this = this;

      this._plotTypeSelect = this._editorParent.find('.js-active-plot-type');

      // Setup the title input box sync
      this.plot().on('plotType-change', function(value){
         var currentValue = _this._plotTypeSelect.val();
         if( currentValue != value['new'] )
            _this._plotTypeSelect.val(value['new'])
      });
      this._plotTypeSelect.change(function(){
         _this.plot().plotType( $(this).val() );
      });

   }


   /**
    * Finished the building of this graph.
    *  - Closes the graph editor panel.
    *  - Tells the plot to make the request.
    *
    */
   PlotEditor.prototype.submitRequest = function(){
         this.plot().submitRequest();
         gisportal.graphs.activeGraphSubmitted();
   }


   PlotEditor.prototype.updateDateRangeSliderTBounds = function(){

      var tBounds = this.plot().tBounds();
      var tBoundMillisec = tBounds.map(function( date ){ return date.getTime() });
      var sliderValInInts = this._rangeSlider.val().map(function(val){ return parseInt(val); });

      if( _.isEqual( tBoundMillisec, sliderValInInts) )
         return;
      
      this._rangeSlider.noUiSlider({
         start: [
            tBounds[0].getTime(),
            tBounds[1].getTime()
         ]
      }, true);

   }


   PlotEditor.prototype.updateDateRangeSliderBounds = function(){
      var dateRangeBounds = this.plot().dateRangeBounds();

      this._rangeSlider.noUiSlider({
         range:{
            min: dateRangeBounds.min.getTime(),
            max: dateRangeBounds.max.getTime()
         }
      }, true);

   }

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
         var tBounds = val.map(Number).map(function(stamp){ return new Date(stamp) });
         _this.plot().tBounds( tBounds );
      })
      
      // The start date input element is manually typed update  tBounds
      this._startDateInput.change(function(){
         var newDate = new Date( $(this).val() );
         var currentTBounds = _this.plot().tBounds();
         
         if( isNaN( newDate.getTime() ) )
            setDate.call(this, currentTBounds[0] );
         else
            _this.plot().tBounds( [ newDate, currentTBounds[1] ] );
      })
      
      // The end date input element is manually typed update  tBounds
      this._endDateInput.change(function(){
         var newDate = new Date( $(this).val() );
         var currentTBounds = _this.plot().tBounds();
         
         if( isNaN( newDate.getTime() ) )
            setDate.call(this, currentTBounds[1] );
         else
            _this.plot().tBounds( [ currentTBounds[0] , newDate ] );
      })

      this.plot().on('dateRangeBounds-change', function(){
         _this.updateDateRangeSliderBounds();
      });
      this.plot().on('tBounds-change', function(){
         _this.updateDateRangeSliderTBounds();
      });

   }

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

      // When a component is added to Plot add it to the UI
      this.plot().on('component-added', function( data ){
         var componentCopy = _.clone(data.component);

         componentCopy.indicatorObj = gisportal.layers[componentCopy.indicator];
         var rendered = gisportal.templates['active-plot-component']( componentCopy );
         var element = $(rendered).data('component', data.component);


         _this._componentsTable.append( element );


         _this.setComponentHasDataInRange( element );

         // On click X remove the component
         element.on('click', '.js-close-acitve-plot-component', function(){
            _this.plot().removeComponent( data.component );
         });

         // The tooltip which tells the user about the range of available data
         var component = $(this).data('component');
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
                     return "This indicator only has partial data in this date range.\nValid range: " + validRange
                  case "no":
                     return "This indicator only has no data in this date range.\nValid range: " + validRange
               };
            }
         });


      });
      
      // When a component is removed from the Plot remove it from the UI
      this.plot().on('component-removed', function( data ){
         var component = data.component;

         _this._componentsTable.children().each(function(){
            if( $(this).data('component') == component ){
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
   }

   PlotEditor.prototype.setComponentHasDataInRange = function( componentElement ){
      var component = $(componentElement).data('component');
      var indicator = gisportal.layers[ component.indicator ];

      var firstDate = new Date(indicator.firstDate);
      var lastDate = new Date(indicator.lastDate);
      
      var tBounds = this.plot().tBounds();

      var result;

      if( firstDate <= tBounds[0] && tBounds[1] <= lastDate )
         result = "yes";
      else if(  lastDate < tBounds[0]  || tBounds[1] < firstDate )
         result = "no";
      else
         result = "partial";

      $(componentElement).attr('has-data-in-range', result);

   }




   PlotEditor.prototype.plot = function(){
      return this._plot;
   }




   return PlotEditor;
})();
