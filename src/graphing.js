


gisportal.config.graphServer = "http://localhost:3000/";

gisportal.graphs.jobs = [];

gisportal.graphs.defaultRequests = {
   
   timeseries: function(){
      return {
         plot:{
            type: "",
            title: "",
            data: {
               series: []
            },
            xAxis: {
               label: "",
               ticks: ""
            }
         }
      }
   }   
};


function getIndicatorDateRange( indicator ){
   var indicator = gisportal.layers[indicator];
   
   var firstDate = new Date(indicator.firstDate);
   var lastDate = new Date(indicator.lastDate);
   
   return [ firstDate, lastDate ];
}


gisportal.graphs.templates = {};


/* Add some usefull handlebars calls */
Handlebars.registerHelper('truncate', function(text, max_length) {
   
   if(text.length > max_length)
      return new Handlebars.SafeString('<span title="' + text + '">' + text.substring( 0 , max_length - 3 ) + '...</span>');
   else
      return text;
});



$.get('templates/active-plot.mst', function( template ){
   gisportal.graphs.templates['active-plot'] = Handlebars.compile(template);
});

$.get('templates/active-plot-component.mst', function( template ){
   gisportal.graphs.templates['active-plot-component'] = Handlebars.compile(template);
});


$.get('templates/graph-job.mst', function(template) {
   gisportal.graphs.templates['graph-job'] = Handlebars.compile(template);
});


gisportal.graphs.activePlot = null;

gisportal.graphs.addComponentToGraph = function( component ){
   
   if( gisportal.graphs.activePlot == null ){
      var newPlot = new (gisportal.graphs.Plot)();
         newPlot
         .plotType( 'timeseries' )
          .activePlot(true) //this will set 'gisportal.graphs.activePlot'
   }
   gisportal.graphs.activePlot.addComponent( component )
}




gisportal.graphs.Plot =(function(){
   
   var graphServerUrl = gisportal.config.graphServer;
   var defaultRequests = gisportal.graphs.defaultRequests;
   var middlewareUrl = 'http://portaldev.marineopec.eu/service/wcs';
   
   var Plot = function(){
      
      this._id  = null;
      this._querySubmited = false;
      
      
      this._plotType = null;
      this._title = "";
      this._createdOn = new Date();
      this._tBounds = [
         new Date(0),
         new Date( Math.pow(2,31) * 1000 )
      ];
      
      this._components = [];
      //this._componentIdCounter = 1;
      
      //Place to store the interval id
      this._monitorJobStatusInterval = null;
      
      // Varibles to ignore when saving object
      this._statusElement = null;
      
      this._activePlot = false;
      
      this._status = {
         state: "",
         message: ""
      };
      
      this._serverStatus = {
         state: "building",
         message: "Designing graph"
      }
      
      this._dateRangeBounds = {
         min: new Date(0),
         max: new Date( Math.pow(2,31) * 1000 )
      }
      
   }
   
   
   /**
   * Inserts a indicator with some settings into this plot.
   * If this plot is active it adds an element to the active plot window
   *
   * @param component {
   *   depth: int // Depth if valid for indicator
   *   geo_bounds: [int] // Depth if valid for indicator
   *   
   *   threddsUrl : String // url to the thredds server
   *   metaCacheUrl : String // url for the cache file
   *   
   * }
   *
   * @return int A unqiue id for that component
   */
   Plot.prototype.addComponent= function( component ){
      var plot = this;
      
      //var element = $('<div></div>').appendTo('#')
      
      if( this._components.length == 0 && this.title() == "" ){
         var indicator = gisportal.layers[ component.indicator ];
         this.title( indicator.name + " - " + (new Date()) );
      }
      
      this._components.push( {
         indicator: component.indicator,
         bbox: component.bbox,
         
         hasDataInRange: void(0),
         setHasDataInRange: function( _ ){
            if( _ == this.hasDataInRange )
               return;
            
            this.hasDataInRange = _;
            
            //If the date range change means that this indicator cant forfill the entier request
            // Update the UI to inform the user 
            if( plot.activePlot() ){
               if( this.slideOutElement == void(0) ){
                  var template = gisportal.graphs.templates['active-plot-component'];
                  
                  var indicatorDateRange = getIndicatorDateRange( this.indicator )
                     .map(function( date ){
                        return new Date(date).toISOString().substring(0,10);
                     })
                     .join(' - ');
                  
                  var rendered = template( {
                     indicatorObj: gisportal.layers[ component.indicator ],
                     bbox: this.bbox,
                     hasDataInRange: this.hasDataInRange
                  });
                  
                  this.slideOutElement = $(rendered).appendTo( plot.slideout.find('.components') );
                  
                  var _this = this;
                  this.slideOutElement.find('.close-acitve-plot-component').click(function(){
                     plot.removeComponent( _this );
                  });
               }else{
                  this.slideOutElement
                     .removeClass('has-data-in-range-yes has-data-in-range-no has-data-in-range-partial')
                     .addClass( 'has-data-in-range-' + this.hasDataInRange );
               }
            }
         }
      } );
      
      this.dateRangeBounds( this.calculateDateRangeBounds() );
   }
   
   /**
   * Removes a components from the array and the active plot window
   */
   Plot.prototype.removeComponent= function( component ){
      var index = this._components.indexOf( component );
      
      $(this._components[ index ].slideOutElement).remove();
      this._components.splice( index, 1);
      
      this.dateRangeBounds( this.calculateDateRangeBounds() );
   };
   
   
   /**
   * Removes the active plot slideout
   */
   Plot.prototype.removeActivePlotSlideout = function(){
      
      gisportal.graphs.activePlotSlideout.removeClass( 'show-all show-side' );
   }
   
   /**
   * Setups up the active plot window and binds all the events
   */
   Plot.prototype.setupActivePlotSlideout = function(){
      
      var _this = this;
      
      var template = gisportal.graphs.templates['active-plot'];
   
      var rendered = template({
         title : this._title,
         components: this.components
      });
      
      var rendered = $( rendered );
      
      this.slideout = rendered;
      
      var activePlotSlideout = gisportal.graphs.activePlotSlideout;
      
      
      activePlotSlideout.addClass('show-all').find('.js-slideout-content').html('').append( rendered );
      
      //Setup the event listeners for the plot title and plot tpye fields
      rendered
         .on('change', '.active-plot-title', function(){
            _this.title( $(this).val() );
         })
         .on('change', '.active-plot-type', function(){
            _this.plotType( $(this).val() );
         })
      
      //Setup the date slider
      rendered.find('.range-slider').noUiSlider({
         start: [
            this.tBounds()[0].getTime(),
            this.tBounds()[1].getTime(),
         ],
         connect: true,
         behaviour: 'tap-drag',
         range: {
            'min': this.dateRangeBounds().min.getTime(),
            'max': this.dateRangeBounds().max.getTime()
         },
         serialization: {
            lower: [
               $.Link({
                  target: rendered.find('.active-plot-start-datetime'),
                  method: setDate 
               })
            ],
            upper: [
               $.Link({
                  target: rendered.find('.active-plot-end-datetime'),
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
         _this.tBounds( tBounds );
      })
      
      // The start date input element is manually typed update  dataRangeBounds
      rendered.find('.active-plot-start-datetime').change(function(){
         var newDate = new Date( $(this).val() );
         var currentTBounds = _this.tBounds();
         
         if( isNaN( newDate.getTime() ) )
            setDate.call(this, currentTBounds[0] );
         else
            _this.tBounds( [ newDate, currentTBounds[1] ] );
      })
      
      // The end date input element is manually typed update  dataRangeBounds
      rendered.find('.active-plot-end-datetime').change(function(){
         var newDate = new Date( $(this).val() );
         var currentTBounds = _this.tBounds();
         
         if( isNaN( newDate.getTime() ) )
            setDate.call(this, currentTBounds[1] );
         else
            _this.tBounds( [ currentTBounds[0] , newDate ] );
      })
      
      
      //Setup the active "create graph" button
      rendered.on('click', '.create-graph', function(){
         _this.activePlot( false );
         _this.submitRequest();
         $('.panel.active').removeClass('active').addClass('hidden');
         $('#historyPanel').removeClass('hidden').addClass('active')
      })
      
   }
   
   
   /**
   * Builds a request to send to the graphing server
   *
   * @return Object The graph object to be sent to the graphing server
   */
   Plot.prototype.buildRequest = function(){
      //Loads the basic graph request
      var request = defaultRequests[ this._plotType ]();
      
      switch( this._plotType ){
         case "":
            
            break;
         
      }
      
      return request;
   }
   
   /**
   * Submits the request the user has been building to server.
   * Also builds status box and puts it into the que
   */
   Plot.prototype.submitRequest = function( options ){
      this._querySubmited = true;
      var _this = this;
      
      var request = this.buildRequest();
      
      this.addStatusElementToDom();
      
      $.ajax({
         method: 'post',
         url: graphServerUrl + 'plot',
         post: request,
         dataType: 'json',
         success: function( data ){
            
            _this.id = data.job_id;
            _this.monitorJobStatus();
            
         }
      })
   }
   
   /**
   * Adds the status element to the dom.
   *  This element will allow the user to save, view, delete, and view the progress of their graph
   */
   Plot.prototype.addStatusElementToDom = function(){
      var _this = this;
      
      var template = gisportal.graphs.templates['graph-job'] ;
         
      var rendered = template({
         title : _this._title,
      });
      
      _this._statusElement = $( rendered ).appendTo( '#graphs-history-list' );         
   }
   
   /**
   * Starts firing requests to the server monitoring the jobs status.
   */
   Plot.prototype.monitorJobStatus = function(){
      if( this._monitorJobStatusInterval !== null )
         return;
      
      var _this = this;
      function updateStatus(){
         $.ajax({
            dataType: 'json',
            url: graphServerUrl + '/job/' + _this.id + '/status',
            cache: false,
            success: function( serverStatus ){
               _this.serverStatus( serverStatus );
            },
            error: function( response ){
               if( response.status == 404 )
                  _this.error( "Job not found on server" );
               else
                  _this.error( "Invalid reply from server. It possibly crashed." );
            }
         })
      }
      
      this._monitorJobStatusInterval = setInterval(updateStatus, 1000);
      updateStatus();
   }
   
   
   
   
   
   
   
   
   
   
   
   /**
   * Gets a Plot based on its server id
   * 
   * @return Plot A new graph job object which the settings will be loaded into.
   */
   Plot.loadFromId = function(){
      
      var job = new Plot();
      
      $.ajax({
         url: graphServerUrl + 'job/request',
         dataType: 'json',
         success: function( data ){
            job.restoreRequest( data );
         },
         error: function(){
            job.error("Could not get job details from server.");
         }
      })
   }
   
   
   /**
   * Takes a JSON of a graph job, and loads it up internally.
   * 
   */
   Plot.prototype.restorePlot = function( graphVaribles ){
      
   }
   
   Plot.prototype.error = function( errorMessage ){
      this.querySubmited = true;
      $(this._statusElement).find('.error').show().text( errorMessage );
   }
   
   Plot.prototype.statusElement = function(){
      return this._statusElement;
   }
   
   //---------------
   // Getters and settings
   
   Plot.prototype.status = function( _ ){
      if( !arguments.length ) return this._status;
      this._status = _;
      return this;
   }
   Plot.prototype.serverStatus = function( _ ){
      if( !arguments.length ) return this._serverStatus;
      this._serverStatus = _;
      
      $(this._statusElement).find('pre.json').html( _ );
      
      return this;
   }
   
   /**
   * Checks that the new tBounds is with the allowed date range
   * It updates the tBounds and checks that all the components/indicators have data in this range.
   * - If any dont it marks the component as out of range
   */
   Plot.prototype.tBounds = function( _ ){
      if( !arguments.length ) return this._tBounds;
      
      if( _.length == 1 )
         _ = [ _, _ ];
      
      this._tBounds = _;
      
      var dateRangeBounds = this.dateRangeBounds();
      
      //Make sure the tBounds fit in the allowed dateRangeBounds
      if( dateRangeBounds.min != null && this._tBounds[0] < dateRangeBounds.min )
         this._tBounds[0] = dateRangeBounds.min;
      
      if( dateRangeBounds.max != null && dateRangeBounds.max < this._tBounds[1] )
         this._tBounds[1] = dateRangeBounds.max;
      
      // Check is each indicator has data in range. If not, tell the users.
      var _this = this;
      this._components.forEach(function( component ){
         var indicator = gisportal.layers[component.indicator];
         
         var firstDate = new Date(indicator.firstDate);
         var lastDate = new Date(indicator.lastDate);
         
         
         
         if( firstDate <= _this._tBounds[0] && _this._tBounds[1] <= lastDate )
            component.setHasDataInRange("yes");
         
         else if(  lastDate < _this._tBounds[0]  || _this._tBounds[1] < firstDate )
            component.setHasDataInRange("no");
         else
            component.setHasDataInRange("partial");
      })
      
      //Update the slide with the new range ONLY if the slider doesnt already have this range
      var currentSliderValues = this.slideout.find('.range-slider').val().map(Number);
      if( ! currentSliderValues.equals( this._tBounds.map(Number) ) ){
         _this.slideout.find('.range-slider').noUiSlider({
            start: [
               this._tBounds[0].getTime(),
               this._tBounds[1].getTime()
            ]
         }, true);
      };
      
      return this;
   }
   
   Plot.prototype.plotType = function( _ ){
      if( !arguments.length ) return this._plotType;
      this._plotType = _;
      
      if( this.activePlot() ){
         var plotType = this.slideout.find('.active-plot-type');
         plotType.val( _ );
      }
      
      return this;
   }
   
   
   Plot.prototype.title = function( _ ){
      if( !arguments.length ) return this._title;
      this._title = _;
      
      if( this.activePlot() ){
         var title = this.slideout.find('.active-plot-title');
         title.val( _ );
      }
      
      return this;
   }
   
   /**
   * Finds the widest time range that covers all the indicators data sets.
   */
   Plot.prototype.calculateDateRangeBounds = function(){
      //If theres no components return the current bounds
      if( this._components.length == 0 )
         return this.dataRangeBounds();
      
      var min = null;
      var max = null;
      
      this._components.forEach(function( component ){
         var indicator = gisportal.layers[component.indicator];
         
         var firstDate = new Date(indicator.firstDate);
         var lastDate = new Date(indicator.lastDate);
         
         if( firstDate < min || min == null )
            min = firstDate;
            
         if( lastDate > max || max == null )
            max = lastDate;
      })
      
      return {
         min: min,
         max: max
      };
   }
   
   /**
   * The data range is the maxium range that covers all the components
   * When this is called and if this graph is the active plot it updates the slide out :
   *  - Updates the date range slider
   *  - Calls set tBounds to check that all the indicators are in range 
   */
   Plot.prototype.dateRangeBounds = function( _ ){
      if( !arguments.length ) return this._dateRangeBounds;
      var oldDateRange = this._dateRangeBounds;
      this._dateRangeBounds = _;
      
      if( this.activePlot() ){
         
         //Update the slide with the new range
         this.slideout.find('.range-slider').noUiSlider({
            range:{
               min: this._dateRangeBounds.min.getTime(),
               max: this._dateRangeBounds.max.getTime()
            }
         }, true);
         
         // Adjust the tBounds to a new width 
         //  If a bound was equal to the old date range, the user probably wants the full time scale
         var newtBounds = [];
         
         if( this.tBounds()[0].getTime() == oldDateRange.min.getTime() )
            newtBounds[0] = this._dateRangeBounds.min;
         else
            newtBounds[0] = this.tBounds()[0];
            
         if( this.tBounds()[1].getTime() == oldDateRange.max.getTime() )
            newtBounds[1] = this._dateRangeBounds.max;
         else
            newtBounds[1] = this.tBounds()[1];
         
         this.tBounds( newtBounds );
      }
      
      return this;
   }
   
   
   /**
   * If set to true it setups up the active graph slider automaticlly.
   * This will remove any currently active plot
   */
   Plot.prototype.activePlot = function( _ ){
      if( !arguments.length ) return this._activePlot;
      
      if( _ == true ){
         //If the plot is becoming active connect it to the UI
         this._activePlot = _;
         
         //Remove the last active plot
         var lastActivePlot = gisportal.graphs.activePlot;
         if( lastActivePlot instanceof Plot  )
            lastActivePlot.activePlot( false );
         
         //Setup self as new active plot
         gisportal.graphs.activePlot = this;
         this.setupActivePlotSlideout();
         
      }else if( _ == false  ){
         //Unset the current graph from being the active plot
         this._activePlot = _;
         if( gisportal.graphs.activePlot == this ){
            gisportal.graphs.activePlot = null;
            this.removeActivePlotSlideout();
         }
      }
      
      return this;
   }
   
   
   
   
   return Plot;
})(); 


gisportal.graphs.close_export_data = function(){
   $('.export-data').removeClass('show-all').html('');
}

gisportal.graphs.export_data = function( indicator ){
   var indicator = gisportal.layers[ indicator ];
   $('.export-data').addClass('show-all');
   
   
   $('.export-data').html( "Pull from the template at some point" );
   
}


gisportal.graphs.initDOM = function() {
   gisportal.graphs.oldInitDOM();
   
   gisportal.graphs.activePlotSlideout = $('.js-active-plot-slideout');
   
   $('body').on('click', '.remove-active-graph', function(){
         gisportal.graphs.activePlot.activePlot( false );
   })
   
   $('body').on('mousemove tap click', '.tooltips', function(){
         var $tooltip = $(this).find('.tooltip')
      var positon = $(this).offset();
      
      $tooltip.css({
         top: positon.top,
         left: positon.left + $(this).outerWidth(),
      })
   })
   
   
   $('body').on('click', '.js-export-button', function(){
      gisportal.graphs.export_data( $(this).data('id') );
   })
   
   $('body').on('click', '.js-close-export-data', function(){
      gisportal.graphs.close_export_data();
   })
   
   $('.js-return-analysis').on('click', function() {
        $('#historyPanel').toggleClass('hidden', true).toggleClass('active', false); 
        $('#indicatorsPanel').toggleClass('hidden', false).toggleClass('active', true);
   });
   
}




//-----------------------
// OLD STUFF


gisportal.graphs.oldInitDOM = function() {
   $('.js-return-analysis').on('click', function() {
      $('#indicatorsPanel').toggleClass('hidden', false).toggleClass('active', true);
      $('#graphPanel').toggleClass('hidden', true).toggleClass('active', false);      
      $('.graph-wait-message').toggleClass("hidden", false);    
      $('.graph-holder').html('');   
      
   });
   
}


// Options currently requires a title
gisportal.graphs.data = function(params, options)  {
   var request = $.param( params );    

   function success(data) {
      gisportal.graphs.addGraph(data, options);
   }
      
   function error(request, errorType, exception) {
      var data = {
         type: 'wcs data',
         request: request,
         errorType: errorType,
         exception: exception,
         url: this.url
      };          
      gritterErrorHandler(data);
   }

   gisportal.genericAsync('GET', gisportal.wcsLocation + request, null, success, error, 'json', null);
}

gisportal.graphs.create = function(data, options)  {
   if (data.error !== "") {
      var d = { error: data.error };
      gisportal.gritter.showNotification('graphError', d);
      return;
   }

   var graph;
   switch (data.type)  {
      case 'timeseries':
         graph = gisportal.graphs.timeseries(data, options);
         break;
      case 'histogram':
         graph = gisportal.graphs.histogram(data, options);
         break;
      case 'hovmollerLat':
         break;
      case 'hovmollerLon':
         break;
   }
}

gisportal.graphs.addGraph = function(data, options)  {
   var uid = 'wcsgraph' + Date.now();
   var title = options.title || "Graph";
   var units = gisportal.layers[options.id].units;

   $.get('templates/graph.mst', function(template) {
      var rendered = Mustache.render(template, {
         id : data.coverage,
         title : title,
         units: units
      });
      $('.graph-holder').html(rendered);    
      $('.graph-wait-message').toggleClass("hidden", true);   
      gisportal.graphs.create(data, options);
      gisportal.replaceAllIcons();
   });

}

