
gisportal.graphs.Plot =(function(){
   
   var graphServerUrl = gisportal.config.paths.graphServer;
   
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

      this._state = "building";
      
      this._serverStatus = null;
      
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
      
      var updateGraphTitle = ( this.getGraphTitle(this._components) == this.title() || this.title() == "" );

      if( !component.yAxis ){
         if( this._components.length == 0 )
            component.yAxis = 1;
         else
            component.yAxis = 2;
      }

      this._components.push( component );
      
      this.emit('component-added', { component: component });

      this.dateRangeBounds( this.calculateDateRangeBounds() );

      if( updateGraphTitle )
         this.title( this.getGraphTitle( this._components ) );
   }
   
   /**
   * Removes a components from the array and the active plot window
   */
   Plot.prototype.removeComponent= function( component ){
      var index = this._components.indexOf( component );
      
      if( index == -1 )
         return;

      var updateGraphTitle = ( this.getGraphTitle(this._components) == this.title() || this.title() == "" );

      this._components.splice( index, 1);
      
      if( updateGraphTitle )
         this.title( this.getGraphTitle( this._components ) );
      
      this.emit('component-removed', { component: component });

      this.dateRangeBounds( this.calculateDateRangeBounds() );
   };

   /**
    * Returns the graph title for the components given
    * @param  {Array}  components The components to build the title
    * @return {String}            The new title
    */
   Plot.prototype.getGraphTitle = function( components ){
      return _.uniq(components.map(function( component ){
         var indicator = gisportal.layers[ component.indicator ];
         return indicator.displayName();
      })).join(" / ");
   }
   
   /**
   * Builds a request to send to the graphing server
   *
   * @return Object The graph object to be sent to the graphing server
   */ 
   Plot.prototype.buildRequest = function(){
      //Loads the basic graph request
      var plotRequest = {};
      var plotStyle = {};
      
      this.buildRequestBasics( plotRequest );
      this.buildRequestAxis( plotRequest );
      this.buildRequestData( plotRequest );
      this.buildRequestLogos( plotStyle );
      
      var request = { plot: plotRequest, style: plotStyle };
      return request;
   }
   
   Plot.prototype.buildRequestBasics = function( plotRequest ){
      plotRequest.type = this.plotType();
      plotRequest.title = this.title();
      plotRequest.style = "basic";
   }
   

   /**
    * Adds the logos for the providers used int this graph.
    * @param  {Object} The request object to add the values to
    */
   Plot.prototype.buildRequestLogos = function( plotStyle ){
      var providers = [];
      this._components.forEach(function( component ){
         var layer = gisportal.layers[ component.indicator ];

         if( ! layer.providerDetails.logo )
            return;

         var providerLogo = portalLocation() + layer.providerDetails.logo;
         if( providers.indexOf( providerLogo ) == -1 )
            providers.push( providerLogo );
      });

      plotStyle.logos = providers;

   }

   /**
    * Adds the Axis options to a plot request.
    * @param  {Object} The request object to add the values to
    */
   Plot.prototype.buildRequestAxis = function( plotRequest ){

      var xAxis =  {
         "label" : "Date/Time",
         "ticks" : "auto",
         "weight" : "auto",
         "tickFormat" : this.plotType() == "timeseries" ? "%d/%m/%Y" : ",.2f"
      };
      plotRequest.xAxis = xAxis;

      var leftHandSideComoponents = this._components.filter(function( component ){
         return component.yAxis == 1;
      });
      
      if( leftHandSideComoponents.length > 0 ){
         var yAxis1Label = leftHandSideComoponents.map(function( component ){
            var indicator = gisportal.layers[ component.indicator ];
            var output = indicator.descriptiveName;
            if( indicator.units )
               output += " (" + indicator.units + ")";

            return output;
         }).join(' / ');

         var y1Axis = {
            "scale" : "linear", //( linear | log_scale | ordinal | time)
            "label" : yAxis1Label,
            "ticks" : "auto",
            "weight" : "auto",
            "tickFormat" : "auto"
         };
         plotRequest.y1Axis = y1Axis;
      };


      var rightHandSideComoponents = this._components.filter(function( component ){
         return component.yAxis == 2;
      });
      
      if( rightHandSideComoponents.length > 0 ){
         var yAxis2Label = rightHandSideComoponents.map(function( component ){
            var indicator = gisportal.layers[ component.indicator ];
            var output = indicator.displayName();
            if( indicator.units )
               output += " (" + indicator.units + ")";

            return output;
         }).join(' / ');

         var y2Axis = {
            "scale" : "linear", //( linear | log_scale | ordinal | time)
            "label" : yAxis2Label,
            "ticks" : "auto",
            "weight" : "auto",
            "tickFormat" : "auto"
         };
         plotRequest.y2Axis = y2Axis;
      };


   }


   Plot.prototype.buildRequestData = function( plotRequest ){
      plotRequest.data = {
         series: []
      };

      switch( this._plotType ){
         case "timeseries":
            this.buildRequestDataTimeSeries( plotRequest.data.series );
            break;
      }
   }

   Plot.prototype.buildRequestDataTimeSeries = function( seriesArray ){
      var totalCount = 1;
      for( var i = 0; i < this._components.length; i++ ){
         var component = this._components[ i ];
         var indicator = gisportal.layers[ component.indicator ];

         // Add all 5 timeseires values
         var showByDefault = 'mean';
         var sub_series = [ 'std', 'min', 'max', 'median', 'mean' ].map(function( metric ){
            return {
               "label" : (totalCount++) + ') ' + indicator.descriptiveName + " " + metric ,
               "key"  : metric,
               "yAxis": component.yAxis,
               "type": "line",
               "disabled": metric != showByDefault
            };
         });

         var newSeries = {
            "handler" : "OPEC_SERVICE_WCS",
            "data_source" : {
               "coverage"  : indicator.urlName,
               "t_bounds"  : [this.tBounds()[0].toISOString(), this.tBounds()[1].toISOString()],
               "bbox": component.bbox,
               "depth": component.elevation,
               
               "threddsUrl"  : indicator.wcsURL,
               "metaCacheUrl" : indicator.cacheUrl(),
               "middlewareUrl" : gisportal.middlewarePath + '/wcs'
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
      
      $.ajax({
         method: 'post',
         url: graphServerUrl + '/plot',
         data: JSON.stringify(request),
         dataType: 'json',
         success: function( data ){
            
            _this.id = data.job_id;
            _this.monitorJobStatus();
            
         }, error: function(){
            gisportal.gritter.showNotification('graphError', {'error':''});
         }
      })
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

               clearInterval( _this._monitorJobStatusInterval );
            }
         })
      }
      
      this._monitorJobStatusInterval = setInterval(updateStatus, 1000);
      updateStatus();
   };


   Plot.prototype.stopMonitoringJobStatus = function(){
      clearInterval( this._monitorJobStatusInterval );
   };
   
   
   //---------------
   // Getters and settings
   Plot.prototype.state = function( _new ){
      if( !arguments.length ) return this._state;
      this._state = _new;
      return this;
   }
   Plot.prototype.serverStatus = function( _new ){
      if( !arguments.length ) return this._serverStatus;
      var old = this._serverStatus;
      this._serverStatus = _new;

      this.state( _new.state );

      this.emit('serverStatus-change', {
         'old': old,
         'new': _new
      });
      
      if( _new.completed == true )
         this.stopMonitoringJobStatus();

      return this;
   }
  
   Plot.prototype.plotType = function( _new ){
      if( !arguments.length ) return this._plotType;
      var old = this._plotType;
      this._plotType = _new;
      
      if( _new != old )
         this.emit('plotType-change', { 'new': _new, 'old': old });
      
      return this;
   }
   
   
   Plot.prototype.title = function( _new ){
      if( !arguments.length ) return this._title;
      var old = this._title;
      this._title = _new;

      if( _new != old )
         this.emit('title-change', { 'new': _new, 'old': old });

      return this;
   }
   Plot.prototype.components = function( _new ){
      if( !arguments.length ) return this._components;
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

   Plot.prototype.doesTBoundsCoverAllComponents = function(){
      var tBounds = this.tBounds();

      return this._components.every(function( component ){
         var layer = gisportal.layers[ component.indicator ];
         var firstDate = new Date( layer.firstDate );
         var lastDate = new Date( layer.lastDate );

         return ( firstDate <= tBounds[0]  && tBounds[1] <= lastDate );
      });

   }

   Plot.prototype.getValidTBoundsForAllComponents = function(){
      var minTime = null;
      var maxTime = null;

      this._components.forEach(function( component ){
         var layer = gisportal.layers[ component.indicator ];
         var firstDate = new Date( layer.firstDate );
         var lastDate = new Date( layer.lastDate );

         if( firstDate > minTime || minTime == null )
            minTime = firstDate;

         if( lastDate < maxTime || maxTime == null )
            maxTime = lastDate;
      });

      if( minTime > maxTime )
         throw new Error("There is no date range that covers all request graph components");
      else
         return [ minTime, maxTime ];

   };
   

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
   

   Plot.prototype.interactiveUrl = function(){
      return graphServerUrl + '/job/' + this.id + '/interactive'
   };
   

   Plot.prototype.copy = function(){
      var newCopy = new Plot();
      newCopy.title( this.title() );
      newCopy.plotType( this.plotType() );
      newCopy.dateRangeBounds( this.dateRangeBounds() );
      newCopy.tBounds( this.tBounds() );

      this._components.forEach(function( component ){
         newCopy.addComponent( component );
      });

      return newCopy;
   };
   
   
   return Plot;
})(); 

