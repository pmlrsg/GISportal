

gisportal.graphs.PlotEditor = (function(){

   var addPlottingTriggers = function(){
      $('.js-active-plot-title').on('change keyup paste', function(e){
         var value = $(this).val();
         if(e.type == "paste"){
            try{
               value = e.originalEvent.clipboardData.getData('text/plain');
            }catch(err){}
         }
         var params = {
            "event": "graphTitle.edit",
            "value":value
         };
         gisportal.events.trigger('graphTitle.edit', params);
      });
      $('.js-active-plot-type').on('change', function(){
         var params = {
            "event": "graphType.edit",
            "value": $(this).val()
         };
         gisportal.events.trigger('graphType.edit', params);
      });
      $('.js-active-plot-style').on('change', function(){
         var params = {
            "event": "graphStyle.edit",
            "value": $(this).val()
         };
         gisportal.events.trigger('graphStyle.edit', params);
      });
   };

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
      var matchup_plot = false;
      if(gisportal.methodThatSelectedCurrentRegion.method == "csvUpload"){
         transect_plot = true;
         if(gisportal.methodThatSelectedCurrentRegion.matchup === true){
           matchup_plot = true;
           transect_plot = false;
         }
      }
      var rendered = gisportal.templates['active-plot']({
         plot: this._plot,
         transect_plot: transect_plot,
         matchup_plot: matchup_plot
      });

      this._editorParent.find('.js-slideout-content').html( rendered );

      var layer;
      if(this._plot._components[0]){
         layer = gisportal.layers[this._plot._components[0].indicator];
      }else{
         layer = gisportal.layers[gisportal.graphs.creatorId];
      }
      var style = layer.style || layer.defaultStyle;
      if($('.js-active-plot-style').has('option[value="' + style + '"]').length <= 0){
        style = "default";
      }
      this._plot._plotStyle = this._plot._plotStyle || style;
      $('.js-active-plot-style').val(this._plot._plotStyle);

      addPlottingTriggers();


      var _this = this;
      
      //Store all the relevent varibles
      this.setupTitleInput();
      this.setupAnimationDuration();
      this.setupPlotTypeSelect();
      this.setupFramerateSlider();
      this.setupDateRangeSlider();
      this.setupAddIndicatorBtn();
      this.setupCalendarWidget();

      this.setupComponents();
      
      //Setup the active "create graph" button
      this._editorParent.find('.js-create-graph').click(function(){
         _this.submitRequest();
         var params = {
            "event": "graph.submitted"
         };
         gisportal.events.trigger('graph.submitted', params);
      });

      this._editorParent.find('.js-close-active-plot').click(function(){
         if($(".notifyjs-gisportal-close-plot-option-info").length <= 0){
            $.notify({'title':"Are you sure you want to delete this plot?", "yes-text":"Yes", "no-text":"No"},{style:"gisportal-close-plot-option", autoHide:false, clickToHide: false});
            $(document).one('click', '.notifyjs-gisportal-close-plot-option-base .no', function() {
               //hide notification
               $(this).trigger('notify-hide');
            });
            $(document).one('click', '.notifyjs-gisportal-close-plot-option-base .yes', function() {
               gisportal.graphs.deleteActiveGraph();
               var params = {
                  "event": "graphs.deleteActive"
               };
               gisportal.events.trigger('graphs.deleteActive', params);
               $(this).trigger('notify-hide');
            });
         }
      });

   };

   /**
    * Setup the plot title element.
    * Adds a 2 way binding so if the INPUT is edited it updates the Plot
    * and if the Plot is updates it updates the INPUT.
    */
   PlotEditor.prototype.setupTitleInput = function(){
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
   PlotEditor.prototype.setupPlotTypeSelect = function(){
      var _this = this;

      this._plotTypeSelect = this._editorParent.find('.js-active-plot-type');
      this._plotStyleSelect = this._editorParent.find('.js-active-plot-style');
      toggleStyles();

      // Setup the title input box sync
      this.plot().on('plotType-change', function(value){
         var currentValue = _this._plotTypeSelect.val();
         if( currentValue != value['new'] )
            _this._plotTypeSelect.val(value['new']);
      });
      this._plotTypeSelect.change(function(){
         _this.plot().plotType( $(this).val() );
         toggleStyles();
      });
      this._plotStyleSelect.change(function(){
         _this._plot._plotStyle = $(this).val();
      });

      function toggleStyles() {
         var styleOptions = $('.plot-style-options-li');
         var framerateOptions = $('.plot-framerate-options-li');
         var animationDuration = $('.plot-animation-duration-info');
         var plottingLimits = $('.plot-max-and-min');
         plottingLimits.toggleClass('hidden',false);
         var mapCalendarWidget = $('.map-calendar-holder');
         if (_this._plotTypeSelect.val() == 'animation' || _this._plotTypeSelect.val() == 'timeseries' || _this._plotTypeSelect.val() == 'scatter' || _this._plotTypeSelect.val() == 'map') {
            styleOptions.toggleClass('hidden', true);
         } else {
            styleOptions.toggleClass('hidden', false);
         }
         if (_this._plotTypeSelect.val() == 'animation') {
            framerateOptions.toggleClass('hidden', false);
            animationDuration.toggleClass('hidden', false);
            if (_this.plot().plotType() == 'animation') {
               _this.updateAnimationDuration();
            }
         }
         else if (_this._plotTypeSelect.val() == 'map'){
            mapCalendarWidget.toggleClass('hidden',false);
            plottingLimits.toggleClass('hidden',true);
            animationDuration.toggleClass('hidden', true);
            framerateOptions.toggleClass('hidden', true);
         }
         else {
            mapCalendarWidget.toggleClass('hidden',true);
            framerateOptions.toggleClass('hidden', true);
            animationDuration.toggleClass('hidden', true);
         }
      }
   };

   /**
    * Adds a component to the Editors plot.
    * Also catches any errors and displays them to the user
    * @param {Object} component Component to add
    */
   PlotEditor.prototype.addComponent = function( component ){
         
      var result = this.plot().addComponent( component );

      if (!(result instanceof Error) && component.bbox.substr(0,7) == 'POLYGON') {
            var animation = $('.js-active-plot-type option[value*="animation"]');
            animation.prop('disabled', true);
            animation.text('Animation (requires regular polygon)');
         }

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
         if (this.plot().plotType() == 'animation' || this.plot().plotType() =='map') {
            var baseMap = $('#select-basemap').data('ddslick').selectedData.value;
            if (baseMap !== 'none' &&
               !(gisportal.baseLayers[baseMap] &&
                  gisportal.baseLayers[baseMap].getSource().getUrls() &&
                  gisportal.baseLayers[baseMap].getSource().getUrls().length === 1 &&
                  gisportal.baseLayers[baseMap].getSource().getParams)) {
               var baseMaps = $('#select-basemap').data('ddslick').settings.data;
               var compatibleMaps = [];
               for (var i = 0; i < baseMaps.length; i++) {
                  baseMap = baseMaps[i].value;
                  if (gisportal.baseLayers[baseMap] &&
                     gisportal.baseLayers[baseMap].getSource().getUrls() &&
                     gisportal.baseLayers[baseMap].getSource().getUrls().length === 1 &&
                     gisportal.baseLayers[baseMap].getSource().getParams) {
                     compatibleMaps.push(baseMap);
                  }
               }
               var notifyString = 'Animations are not compatible with this basemap. ' +
                  'Please use one of the following basemaps:';
               for (var j = 0; j < compatibleMaps.length; j++) {
                  notifyString = notifyString + '\n- ' + compatibleMaps[j];
               }
               $.notify(notifyString, 'error');
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

   PlotEditor.prototype.setupFramerateSlider = function() {
      var _this = this;
      this._framerateSlider = this._editorParent.find('.js-framerate-slider');
      this._framerateInput = this._editorParent.find('.js-active-plot-framerate');

      this._framerateSlider.noUiSlider({
            start: [this.plot().animationFramerate()],
            connect: 'lower',
            range: {
               'min': [1 / 10],
               'max': [60]
            },
            serialization: {
               lower: [
                  $.Link({
                     target: this._framerateInput,
                     method: setFramerate
                  })
               ],
               format: {
                  decimals: 1
               }
            }
         })
         .on('slide', function(event, val) {
            if (val > 1) {
               val = Math.round(val);
            }
            _this.plot().animationFramerate(val);
            _this.updateAnimationDuration();
         })
         .on('change', function(event, val) {
            if (!val) {
               val = _this._framerateSlider.val();
            }
            if (val > 1) {
               val = Math.round(val);
            }
            _this.plot().animationFramerate(val);
            _this.updateAnimationDuration();
            var params = {
               "event": "graphFramerate.change",
               "value": val
            };
            gisportal.events.trigger('graphFramerate.change', params);
         });

      this._framerateInput.change(function() {
         var newFramerate = $(this).val();
         if (isNaN(newFramerate) || newFramerate > 60 || newFramerate < 0.1) {
            setFramerate.call(this, _this.plot().animationFramerate());
         } else {
            _this._framerateSlider.val(newFramerate).trigger('change');
         }
      });

      function setFramerate(value) {
         if (value > 1) {
            value = Math.round(value);
         }
         $(this).val(value);
      }
   };

   PlotEditor.prototype.setupAnimationDuration = function() {
      this._animationDuration = this._editorParent.find('.js-active-plot-animation-duration');
   };

   PlotEditor.prototype.updateAnimationDuration = function() {
      var frames = this.plot().slicesInRange().length;
      var framerate = this.plot().animationFramerate();
      var seconds = frames / framerate;
      var duration = secondsToHHmmss(seconds);

      this._animationDuration.html(duration);

      function secondsToHHmmss(seconds) {
         seconds = Number(seconds);
         var h = Math.floor(seconds / 3600);
         var m = Math.floor(seconds % 3600 / 60);
         var s = Math.floor(seconds % 3600 % 60);
         return ((h > 0 ? h + ' hours, ' : '') + (m > 0 ? m + ' minutes, ' : '') + s + ' seconds');
      }
   };

   /**
    * Updates the UI time bounds slider's currently selection
    */
   PlotEditor.prototype.updateDateRangeSliderTBounds = function() {

      var tBounds = this.plot().tBounds();
      var tBoundMillisec = tBounds.map(function(date) {
         return date.getTime();
      });
      var sliderValInInts = this._rangeSlider.val().map(function(val) {
         return parseInt(val);
      });

      if (_.isEqual(tBoundMillisec, sliderValInInts))
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
   PlotEditor.prototype.updateDateRangeSliderBounds = function() {
      var dateRangeBounds = this.plot().dateRangeBounds();

      this._rangeSlider.noUiSlider({
         range: {
            min: dateRangeBounds.min.getTime(),
            max: dateRangeBounds.max.getTime()
         }
      }, true);
   };

   /**
    * Setups the the calendar widget.
    * - Details 1
    * - Details 2
    */
   PlotEditor.prototype.setupCalendarWidget = function() {
      var tBounds = this.plot().tBounds();
      var dateRangeBounds = this.plot().dateRangeBounds();
      var _this = this;

      this._calendarWidget = this._editorParent.find('#map-calendar-widget');


      console.log('Daterange Bounds: ',dateRangeBounds);
      console.log('tBounds: ',tBounds);
      gisportal.projectSpecific.dateRangeBounds=dateRangeBounds;
      gisportal.projectSpecific.tBounds=tBounds;

      this._calendarWidget.datepicker('destroy');
      this._calendarWidget.datepicker({
         minDate:dateRangeBounds.min.getDate(),
         maxDate:dateRangeBounds.max.getDate(),
         // changeYear: true,
         // beforeShowDay: function(date){
         //   var string = $.datepicker.formatDate('yy-mm-dd', date);
         //   return [ gisportal.enhancedOverlay.satellite[satelliteSelection][typeSelection].missing.indexOf(string) == -1 ];
         // },
       });
       this._calendarWidget.datepicker('refresh');
};


   /**
    * Setups the the date slider on graph pane.
    * - Starts the slide and sets its initails values
    * - Sets up the 2 date text boxes to accept change events
    */
   PlotEditor.prototype.setupDateRangeSlider = function() {
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
         .on('slide', function(event, val) {
            // Convert both date number strings in the array into Dates
            var tBounds = val.map(Number).map(function(dateNum) {
               return new Date(dateNum);
            });
            _this.plot().tBounds(tBounds);
            if (_this.plot().plotType() == 'animation') {
               _this.updateAnimationDuration();
            }
         })
         // Listen for when the user moves the slider and sends a trigger
         .on('change', function(event, val) {
            var params = {
               "event": "graphRange.change",
               "value": val
            };
            gisportal.events.trigger('graphRange.change', params);
         });

      // The start date input element is manually typed update  tBounds
      this._startDateInput.change(function() {
         var newDate = new Date($(this).val());
         var params = {
            "event": "graphStartDate.change",
            "value": newDate.getTime()
         };
         gisportal.events.trigger('graphStartDate.change', params);
         var currentTBounds = _this.plot().tBounds();

         if (isNaN(newDate.getTime()))
            setDate.call(this, currentTBounds[0]);
         else
            _this.plot().tBounds([newDate, currentTBounds[1]]);
         if (_this.plot().plotType() == 'animation') {
            _this.updateAnimationDuration();
         }
      });

      // The end date input element is manually typed update  tBounds
      this._endDateInput.change(function() {
         var newDate = new Date($(this).val());
         var params = {
            "event": "graphEndDate.change",
            "value": newDate.getTime()
         };
         gisportal.events.trigger('graphEndDate.change', params);
         var currentTBounds = _this.plot().tBounds();

         if (isNaN(newDate.getTime()))
            setDate.call(this, currentTBounds[1]);
         else
            _this.plot().tBounds([currentTBounds[0], newDate]);
         if (_this.plot().plotType() == 'animation') {
            _this.updateAnimationDuration();
         }
      });

      this.plot().on('dateRangeBounds-change', function() {
         _this.updateDateRangeSliderBounds();
      });
      this.plot().on('tBounds-change', function() {
         _this.updateDateRangeSliderTBounds();
      });
      this.plot().on('component-label-change', function(params){
         _this.plot().checkAxisLabels(params);   
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
         componentCopy.userLabel = componentCopy.userLabel || gisportal.layers[componentCopy.indicator].descriptiveName;
         component.userLabel = componentCopy.userLabel || gisportal.layers[componentCopy.indicator].descriptiveName;
         var rendered = gisportal.templates['active-plot-component']( componentCopy );
         var element = $(rendered).data('component', component);


         _this._componentsTable.append( element );


         _this.setComponentHasDataInRange( element );

         // On click X remove the component
         element.on('click', '.js-close-acitve-plot-component', function(){
            _this.plot().removeComponent( component );
            //TODO: When this is no longer a table, give each component an id to be identified easier.
            var tableIndex = $(this).closest('tr').index();
            var params = {
               "event": "graphComponent.remove",
               "index": tableIndex
            };
            gisportal.events.trigger('graphComponent.remove', params);
         });


         element.on('click', '.js-y-axis', function(){
            component.yAxis = parseInt( $(this).val() );
            //TODO: When this is no longer a table, give each component an id to be identified easier.
            var tableIndex = $(this).closest('tr').index();
            var value = $(this).val();
            var params = {
               "event": "graphComponent.axisChange",
               "index": tableIndex,
               "value": value
            };
            gisportal.events.trigger('graphComponent.axisChange', params);
         });

         // trigger callback for unfocus on axis label
         element.on('blur', '.axis_label_input', function(){
            component.userLabel = value = $(this).val();
            var tableIndex = $(this).closest('tr').index();
            var params = {
               "event": "graphComponent.axisLabelChange",
               "index": tableIndex,
               "value": value
            };
            gisportal.events.trigger('graphComponent.axisLabelChange', params);
            _this.plot().emit('component-label-change', params);
            
         });

         // The tooltip which tells the user about the range of available data
         var indicator = gisportal.layers[componentCopy.indicator];
         var validRange =  indicator.firstDate + " - " + indicator.lastDate;

         element.tooltipster({
            contentCloning: true,
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