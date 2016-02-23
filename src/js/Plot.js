/**
 * This is a Plot class that works as a model
 * to contain all the data related to a plot
 * as well as support functions and event listeners
 * so multiple views can interactive with the plot
 * at the same time
 */

// Encapsulation it for neatness
gisportal.graphs.Plot =(function(){    
   //
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
      };
      
   };

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
      // Check the plot type id allowed more then 1 series
      if( this._allowMultipleSeries === false && this.components().length >= 1 )
         return new Error( "This graph type can only have 1 series" );

      var plot = this;
      
      // Does the current graph title match the generated one ?
      // If it does then remember that because we want to update
      // it when the new component has been added
      // 
      // If it doesn't match that means the user manually edited
      // it so we shouldn't touch it
      var updateGraphTitle = ( this.getGraphTitle(this._components) == this.title() || this.title() === "" );

      // Was the yAxis set manually?
      // If not auto set it
      if( !component.yAxis ){
         if( this._components.length === 0 )
            component.yAxis = 1;
         else
            component.yAxis = 2;
      }

      // Add the component to the list of components
      this._components.push( component );
      
      // Fire an event so listeners no it was added
      this.emit('component-added', { component: component });

      // Update the date bounds, this is the outter date
      // limit covered by at least 1 series
      this.dateRangeBounds( this.calculateDateRangeBounds() );

      // Update the graph title is the user hasnt
      // edited it
      if( updateGraphTitle )
         this.title( this.getGraphTitle( this._components ) );
   };
   
   /**
   * Removes a components from the array and the active plot window
   */
   Plot.prototype.removeComponent= function( component ){
      // Find the component index
      var index = this._components.indexOf( component );
      
      // Is the component in the components array ?
      if( index == -1 )
         return;

      // Does the current graph title match the generated one ?
      // If it does then remember that because we want to update
      // it when the new component has been added
      // 
      // If it doesn't match that means the user manually edited
      // it so we shouldn't touch it
      var updateGraphTitle = ( this.getGraphTitle(this._components) == this.title() || this.title() === "" );

      this._components.splice( index, 1);

      // Update the graph title
      if( updateGraphTitle )
         this.title( this.getGraphTitle( this._components ) );
      
      // Event emit so listeners know it went
      this.emit('component-removed', { component: component });

      // Update the date bounds, this is the outter date
      // limit covered by at least 1 series
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
   };
   
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
   };
   
   /**
    * Adds basic information, the plot type,
    * the title and what formats can be downloaded
    * @param  Object  plotRequest  The plot request to
    *                              add the settings to
    */
   Plot.prototype.buildRequestBasics = function( plotRequest ){
      plotRequest.type = this.plotType();
      plotRequest.title = this.title();
      plotRequest.style = "basic";
      plotRequest.downloadTypes = [
         { key: 'csv', label: 'CSV' },
         { key: 'png', label: 'PNG' },
         { key: 'meta-data', label: 'Meta Data' },
         { key: 'logos', label: 'Logos' },
         { key: 'svg', label: 'SVG' }
      ];
   };
   

   /**
    * Adds the logos for the providers used int this graph.
    * @param  {Object} The request object to add the values to
    */
   Plot.prototype.buildRequestLogos = function( plotStyle ){
      var providers = [];
      this._components.forEach(function( component ){
         var layer = gisportal.layers[ component.indicator ];

         if( ! layer.provider || ! layer.provider.logo )
            return;

         var providerLogo = portalLocation() + layer.provider.logo;
         if( providers.indexOf( providerLogo ) == -1 )
            providers.push( providerLogo );
      });

      plotStyle.logos = providers;

   };



   /**
    * Tells the editor to allow multiple series
    * for the current graph type
    */
   Plot.prototype.allowMultipleSeries = function(){
      this._allowMultipleSeries = true;
   };

   /**
    * Tells the editor to not allow multiple series.
    * Will also check the current state and remove any
    * extra if needed
    */
   Plot.prototype.allowSingleSeries = function(){
      var _this = this;
      this._allowMultipleSeries = false;

      // Remove all but the first series
      if( this.components().length > 1 )
         this.components().slice( 1 ).forEach(  function( component ){
            _this.removeComponent( component );
         });

   };

   /**
    * Adds the Axis options to a plot request.
    * @param  Object  plotRequest The request object to add the values to
    */
   Plot.prototype.buildRequestAxis = function( plotRequest ){

      var xAxis =  {
         "label" : "Date/Time",
         "ticks" : "auto",
         "weight" : "auto",
         "tickFormat" : this.plotType() == "timeseries" ? "%d/%m/%Y" : ",.2f"
      };
      plotRequest.xAxis = xAxis;

      // Get components that will go on the left Y axis
      var leftHandSideComoponents = this._components.filter(function( component ){
         return component.yAxis == 1;
      });
      
      if( leftHandSideComoponents.length > 0 ){
         // Using the left of left Y axis components build
         // axis names including the elevation and provider
         var yAxis1Label = leftHandSideComoponents.map(function( component ){
            var indicator = gisportal.layers[ component.indicator ];
            var output = indicator.name;
            if( 'elevation' in component )
               output += ' Elv:' + component.elevation + 'M';
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
      }


      // Get components that will go on the left Y axis
      var rightHandSideComoponents = this._components.filter(function( component ){
         return component.yAxis == 2;
      });
      
      if( rightHandSideComoponents.length > 0 ){
         // Using the left of left Y axis components build
         // axis names including the elevation and provider
         var yAxis2Label = rightHandSideComoponents.map(function( component ){
            var indicator = gisportal.layers[ component.indicator ];
            var output = indicator.name;
            if( 'elevation' in component )
               output += ' Elv:' + component.elevation + 'M';
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
      }
   };

   /**
    * Added for the possibly to change the function
    * based on the current graph type but it was
    * never used.
    * @param  Object  plotRequest The request object to add the values to
    */
   Plot.prototype.buildRequestData = function( plotRequest ){
      plotRequest.data = {
         series: []
      };

      this.buildRequestDataGeneric( plotRequest.data.series );
   };

   /**
    * Adds all the request series to the array
    * pass in. It builds the series from the 
    * components array
    * @param  Array  seriesArray 
    */
   Plot.prototype.buildRequestDataGeneric = function( seriesArray ){
      var totalCount = 0;
      for(var i = 0; i < this._components.length; i++ ){
         var component = this._components[ i ];
         var layer = gisportal.layers[ component.indicator ];

         // Add the drop down meta data
         var meta = "";
         meta += "Region: " + layer.tags.region + "<br>";
         meta += "Confidence: " + layer.tags.Confidence + "<br>";
         meta += "Provider: " + layer.providerTag + "<br>";
         meta += "Interval: " + layer.tags.interval + "<br>";
         if( component.bbox )
            meta += "Bounding Box: " + component.bbox + "<br>";
         else
            meta += "BBox: All coverage<br>";

         if( component.elevation )
            meta += "Depth: " + component.elevation + layer.elevationUnits + "<br>";

         // Add the external meta data URLS
         var markdowns = [];
         if( layer.moreIndicatorInfo )
            markdowns.push( gisportal.middlewarePath + '/metadata/indicator/' + layer.name );
         if( layer.moreProviderInfo )
            markdowns.push( gisportal.middlewarePath + '/metadata/provider/' + layer.providerTag );

         if(layer.provider){
            logo = layer.provider.logo;
         }
         else{
            logo = "undefined";
         }

         // Gumph needed for the plotting serving to its thing
         var newSeries = {
            // Source handler file to use
            "handler" : "OPEC_SERVICE_WCS",
            "data_source" : {
               // Variable name
               "coverage"  : layer.urlName,
               // Layer ID
               "layer_id"  : layer.id,
               // Time range of the data
               "t_bounds"  : [this.tBounds()[0].toISOString(), this.tBounds()[1].toISOString()],
               // Bounds box of the data, also supports WKT
               "bbox": component.bbox,
               // Depth, optional
               "depth": component.elevation,
               
               // Threads URL, passed to the middleware URL
               "threddsUrl"  : layer.wcsURL,
               // Meta cache is needed for the time estimation
               "metaCacheUrl" : layer.cacheUrl(),
               // Location of the middle ware to do the analytics 
               "middlewareUrl" : "http://portal.marineopec.eu/service/wcs" // Eventually will not be needed!!
            },
            "label": (++totalCount) + ') ' + layer.descriptiveName,
            "yAxis": component.yAxis,
            "type": "line",
            "meta": meta,
            "markdown": markdowns,
            "logo": portalLocation() + logo
         };

         // If its a hovmoller then 
         // set the correct axis'
         if( this.plotType() == "hovmollerLat" ){
            newSeries.data_source.graphXAxis = "Time";
            newSeries.data_source.graphYAxis = "Lat";
            newSeries.data_source.graphZAxis = newSeries.data_source.coverage;
         }else 
         if( this.plotType() == "hovmollerLon" ){
            newSeries.data_source.graphXAxis = "Lon";
            newSeries.data_source.graphYAxis = "Time";
            newSeries.data_source.graphZAxis = newSeries.data_source.coverage;
         }

         seriesArray.push( newSeries );
      }
   };

   /**
   * Submits the request the user has been building to server.
   * Also builds status box and puts it into the que
   */
   Plot.prototype.submitRequest = function( options ){
      this._querySubmited = true;
      var _this = this;
      
      // Generate the request object
      var request = this.buildRequest();

      function accumulateEstimates(data){
         if(data.time && data.size && data.layer_id){
            _this.series_total --;
            var layer_times = gisportal.layers[data.layer_id].DTCache;
            var numbered_layer_times = [];
            for(var time in layer_times){
               numbered_layer_times.push(Date.parse(layer_times[time]).valueOf());
            }
            // Works out the number of time slices so that the time and size can be made per indicator rather than indicator time slice
            var min_index = gisportal.utils.closestIndex(numbered_layer_times, _this._tBounds[0].valueOf());
            var max_index = gisportal.utils.closestIndex(numbered_layer_times, _this._tBounds[1].valueOf());
            var total_slices = Math.abs(max_index - min_index);
            _this.timeEstimate += (data.time * total_slices);
            _this.sizeEstimate += (data.size * total_slices);
         }else{
            $.notify("This error was returned: " + data.responseText, "error");
         }
         // Only gives the time estimate if the size is small enough and all the estimates were retrieved successfully
         if(_this.series_total === 0){
            if(_this.sizeEstimate < 4294967296){
               var t = new Date();
               _this.estimatedFinishTime = new Date(t.getTime() + 1000*_this.timeEstimate);
            }else{
               $.notify("There is too much data\n Try plotting a graph with a smaller bounding box or smaller time bounds", "error");
            }
         }
      }
      
      // Checks the time and size
      var series_list = request.plot.data.series;

      // Sets the number of series so we know when they are complete
      _this.series_total = _.size(series_list);
      _this.timeEstimate = 0;
      _this.sizeEstimate = 0;
      for(var series in series_list){
         $.ajax({
            method: 'post',
            url: gisportal.middlewarePath + '/plotting/check_plot',
            contentType : 'application/json',
            data: JSON.stringify(series_list[series]),
            dataType: 'json',
            timeout:3000,
            success: accumulateEstimates,
            error: accumulateEstimates
         });
      }
      

      // Make the plot
      $.ajax({
         method: 'post',
         url: gisportal.middlewarePath + '/plotting/plot',
         contentType : 'application/json',
         data: JSON.stringify({ request: request }),
         dataType: 'json',
         success: function( data ){
            console.log(data);
            // Do the polling!
            _this.id = data.hash;
            _this.monitorJobStatus();
         }, error: function(e){
            var error = 'Sorry, we failed to create a graph: \n'+
                           'The server informed us that it failed to make a graph for your selection with the message"' + e.statusText + '"';
            $.notify(error, "error");
         }
      });
   };

   /**
   * Starts firing requests to the server monitoring the jobs status.
   */
   Plot.prototype.monitorJobStatus = function(){
      // If we are already monitoring the job then
      // dont start another monitor ! Makes sense right ?
      if( this._monitorJobStatusInterval !== null )
         return;
      
      var _this = this;
      function updateStatus(){
         $.ajax({
            url: "/plots/" + _this.id + "-status.json?_="+ new Date().getTime(),
            dataType:'json',
            success: function( serverStatus ){
               _this.serverStatus( serverStatus );               
            },
            error: function( response ){
               $('.graph-job[data-created="' +_this._createdOn + '"]').remove();
               clearInterval( _this._monitorJobStatusInterval );
               $.notify( "There was an error creating the graph:\n" + response.responseText , "error");
            }
         });
      }
      
      this._monitorJobStatusInterval = setInterval(updateStatus, 1000);
      updateStatus();
   };

   /**
    * Storing monitor the job on the server
    * Just stops the interval on the ajax function
    */
   Plot.prototype.stopMonitoringJobStatus = function(){
      clearInterval( this._monitorJobStatusInterval );
   };
   
   
   //---------------
   // Getters and settings
   Plot.prototype.state = function( _new ){
      if( !arguments.length ) return this._state;
      this._state = _new;
      return this;
   };

   /**
    * Get the server status if no parameter provided
    * If parameter is provided then store it and 
    * fire and event
    */
   Plot.prototype.serverStatus = function( _new ){
      if( !arguments.length ) return this._serverStatus;
      var old = this._serverStatus;
      this._serverStatus = _new;

      this.state( _new.state );

      this.emit('serverStatus-change', {
         'old': old,
         'new': _new
      });
      
      if( _new.completed === true )
         this.stopMonitoringJobStatus();

      return this;
   };
  
   /**
    * Get the server status if no parameter provided
    * If parameter is provided then store it and 
    * fire and event. Also set whether this graph
    * is allowed multiple series
    */
   Plot.prototype.plotType = function( _new ){
      if( !arguments.length ) return this._plotType;
      var old = this._plotType;
      this._plotType = _new;
      
      if( _new != old )
         this.emit('plotType-change', { 'new': _new, 'old': old });
      

      if( _new == 'timeseries' )
        this.allowMultipleSeries();
      else
        this.allowSingleSeries();

      return this;
   };
   
   
   /**
    * Get the server status if no parameter provided
    * If parameter is provided then store it and 
    * fire and event
    */
   Plot.prototype.title = function( _new ){
      if( !arguments.length ) return this._title;
      var old = this._title;
      this._title = _new;

      if( _new != old )
         this.emit('title-change', { 'new': _new, 'old': old });

      return this;
   };
   
   /**
    * Get the server status if no parameter provided
    */
   Plot.prototype.components = function( _new ){
      if( !arguments.length ) return this._components;
      return this;
   };
   
   /**
   * Finds the widest time range that covers all the indicators data sets.
   */
   Plot.prototype.calculateDateRangeBounds = function(){
      //If theres no components return the current bounds
      if( this._components.length === 0 )
         return this.dateRangeBounds();
      
      var min = null;
      var max = null;
      
      this._components.forEach(function( component ){
         var indicator = gisportal.layers[component.indicator];
         
         var firstDate = new Date(indicator.firstDate);
         var lastDate = new Date(indicator.lastDate);
         
         if( firstDate < min || min === null )
            min = firstDate;
            
         if( lastDate > max || max === null )
            max = lastDate;
      });
      
      return {
         min: min,
         max: max
      };
   };
   
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
      if( dateRangeBounds.min !== null && this._tBounds[0] < dateRangeBounds.min )
         this._tBounds[0] = dateRangeBounds.min;
      
      if( dateRangeBounds.max !== null && dateRangeBounds.max < this._tBounds[1] )
         this._tBounds[1] = dateRangeBounds.max;
      


      if( ! _.isEqual(this._tBounds, old) )
         this.emit('tBounds-change', { 'new': this._tBounds, 'old': old });
      
      return this;
   };


   
   /**
    * Produces a copy of the current Plot object
    * @return Plot A copy of the current plot
    */
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

