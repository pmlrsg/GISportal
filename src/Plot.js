
gisportal.graphs.Plot =(function(){
   
   var graphServerUrl = gisportal.config.graphServer;
   var defaultRequests = gisportal.graphs.defaultRequests;
   var middlewareUrl = 'http://portaldev.marineopec.eu/service/wcs';
   
   var Plot = function(){
      
      EventEmitter.call( this );

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
      
      //Any old daterange so with can initalise the slider. Its updated later
      this._dateRangeBounds = {
         min: new Date(0),
         max: new Date( Math.pow(2,31) * 1000 )
      }
      
   }

   //Make the object able to fire events
   Plot.prototype = _.create( EventEmitter.prototype, { constructor: Plot } );

   
   
   /**
   * Inserts a indicator with some settings into this plot.
   * If this plot is active it adds an element to the active plot window
   *
   * @param component {
   *   indicator: {String} The ID of the indicator to add
   *   bbox: {String} OPTIONAL Depth if valid for indicator
   *   elevation:  {int} OPTIONAL // Depth if valid for indicator
   *   yAxis: {int} OPTIONAL // What yAxis should th component be put on
   * }
   * 
   */
   Plot.prototype.addComponent= function( component ){
      var plot = this;
      
      if( this._components.length == 0 && this.title() == "" ){
         var indicator = gisportal.layers[ component.indicator ];
         this.title( indicator.name + " - " + (new Date()) );
      }

      component.yAxis = 1;

      this._components.push( component );
      
      this.emit('component-added', { component: component });

      this.dateRangeBounds( this.calculateDateRangeBounds() );
   }
   
   /**
   * Removes a components from the array and the active plot window
   */
   Plot.prototype.removeComponent= function( component ){
      var index = this._components.indexOf( component );
      
      this._components.splice( index, 1);
      
      this.emit('component-removed', { component: component });

      this.dateRangeBounds( this.calculateDateRangeBounds() );
   };
   
   
   /**
   * Builds a request to send to the graphing server
   *
   * @return Object The graph object to be sent to the graphing server
   */
   Plot.prototype.buildRequest = function(){
      //Loads the basic graph request
      var requestPlot = {};
      
      this.buildRequestBasics( requestPlot );
      this.buildRequestAxis( requestPlot );
      this.buildRequestData( requestPlot );

      switch( this._plotType ){
         case "":
            
            break;
         
      }
      
      var request = { plot: requestPlot };
      return request;
   }
   
   Plot.prototype.buildRequestBasics = function( requestPlot ){
      requestPlot.type = this.plotType();
      requestPlot.title = this.title();
      requestPlot.style = "basic";
   }
   
   Plot.prototype.buildRequestAxis = function( requestPlot ){

      var xAxis =  {
         "label" : "Sample Date/Time",
         "ticks" : "auto",
         "weight" : "auto",
         "tickFormat" : this.plotType() == "timeseries" ? "%d/%m/%Y" : ",.2f"
      };
      requestPlot.xAxis = xAxis;

      var leftHandSideComoponents = this._components.filter(function( component ){
         return component.yAxis == 1;
      });
      
      if( leftHandSideComoponents.length > 0 ){
         var yAxis1Label = leftHandSideComoponents.map(function( component ){
            var indicator = gisportal.layers[ component.indicator ];
            var output = indicator.niceName;
            if( indicator.units )
               output += " (" + indicator.units + ")"
         }).join(' / ');

         var y1Axis = {
            "scale" : "linear", //( linear | log_scale | ordinal | time)
            "label" : yAxis1Label,
            "ticks" : "auto",
            "weight" : "auto",
            "tickFormat" : ",.2f"
         };
         requestPlot.y1Axis = y1Axis;
      };


      var rightHandSideComoponents = this._components.filter(function( component ){
         return component.yAxis == 2;
      });
      
      if( rightHandSideComoponents.length > 0 ){
         var yAxis2Label = rightHandSideComoponents.map(function( component ){
            var indicator = gisportal.layers[ component.indicator ];
            var output = indicator.niceName;
            if( indicator.units )
               output += " (" + indicator.units + ")"
         }).join(' / ');

         var y2Axis = {
            "scale" : "linear", //( linear | log_scale | ordinal | time)
            "label" : yAxis2Label,
            "ticks" : "auto",
            "weight" : "auto",
            "tickFormat" : ",.2f"
         };
         requestPlot.y2Axis = y2Axis;
      };


   }


   Plot.prototype.buildRequestData = function( requestPlot ){
      requestPlot.data = {
         series: []
      };

      switch( this._plotType ){
         case "timeseries":
            this.buildRequestDataTimeSeries( requestPlot.data.series );
            break;
      }
   }

   Plot.prototype.buildRequestDataTimeSeries = function( seriesArray ){
      for( var i = 0; i < this._components.length; i++ ){
         var component = this._components[ i ];
         var indicator = gisportal.layers[ component.indicator ];

         // 
         var sub_series = [ 'std', 'min', 'max', 'median', 'mean' ].map(function( metric ){
            return {
               "label" : indicator.name + " " + metric,
               "key"  : metric,
               "yAxis": indicator.yAxis,
               "type": "line",
            };
         });

         var newSeries = {
            "handler" : "OPEC_SERVICE_WCS",
            "data_source" : {
               "coverage"  : indicator.urlName,
               "t_bounds"  : [this.tBounds()[0].toISOString(), this.tBounds()[1].toISOString()],
               "bbox": component.bbox,
               "depth": component.elevation,
               
               "threddsUrl"  : indicator.wscURL,
               "metaCacheUrl" : indicator.cacheUrl(),
               "middlewareUrl" : location.origin + gisportal.middlewarePath + '/wcs'
            },
            "sub_series" : sub_series
            
         };
         seriesArray.push( newSeries );
      }
   }

   /**
   * Submits the request the user has been building to server.
   * Also builds status box and puts it into the que
   */
   Plot.prototype.submitRequest = function( options ){
      this._querySubmited = true;
      var _this = this;
      
      var request = this.buildRequest();
      console.log( request );
      return;
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
      
      var template = gisportal.templates['graph-job'] ;
         
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
   
   Plot.prototype.status = function( _new ){
      if( !arguments.length ) return this._status;
      this._status = _new;
      return this;
   }
   Plot.prototype.serverStatus = function( _new ){
      if( !arguments.length ) return this._serverStatus;
      this._serverStatus = _new;
      
      $(this._statusElement).find('pre.json').html( _new );
      
      return this;
   }
  
   Plot.prototype.plotType = function( _new ){
      if( !arguments.length ) return this._plotType;
      var old = this._plotType;
      this._plotType = _new;
      
      if( _new != old )
         this.emit('plotType-changed', { 'new': _new, 'old': old });
      
      return this;
   }
   
   
   Plot.prototype.title = function( _new ){
      if( !arguments.length ) return this._title;
      var old = this._title;
      this._title = _new;

      if( _new != old )
         this.emit('title-changed', { 'new': _new, 'old': old });

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
   * The data range is the maximum range that covers all the components
   * When this is called and if this graph is the active plot it updates the slide out :
   *  - Updates the date range slider
   *  - Calls set tBounds to check that all the indicators are in range 
   */
   Plot.prototype.dateRangeBounds = function( _new ){
      if( !arguments.length ) return this._dateRangeBounds;

      var oldDateRange = this._dateRangeBounds;
      this._dateRangeBounds = _new;
      

      if( ! _.isEqual(this._dateRangeBounds, oldDateRange ) )
         this.emit('dateRangeBounds-change', { 'new': this._dateRangeBounds, 'old': oldDateRange });

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


      return this;
   }
   

   /**
   * Checks that the new tBounds is with the allowed date range
   * It updates the tBounds and checks that all the components/indicators have data in this range.
   * - If any dont it marks the component as out of range
   */
   Plot.prototype.tBounds = function( _new ){
      if( !arguments.length ) return this._tBounds;
         
      var old = this._tBounds;

      if( _new.length == 1 )
         _new = [ _new, _new ];
      
      this._tBounds = _new;
      
      var dateRangeBounds = this.dateRangeBounds();
      
      //Make sure the tBounds fit in the allowed dateRangeBounds
      if( dateRangeBounds.min != null && this._tBounds[0] < dateRangeBounds.min )
         this._tBounds[0] = dateRangeBounds.min;
      
      if( dateRangeBounds.max != null && dateRangeBounds.max < this._tBounds[1] )
         this._tBounds[1] = dateRangeBounds.max;
      


      if( ! _.isEqual(this._tBounds, old) )
         this.emit('tBounds-change', { 'new': this._tBounds, 'old': old });
      
      return this;
   }
   
   
   
   return Plot;
})(); 

