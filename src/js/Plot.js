/**
 * This is a Plot class that works as a model
 * to contain all the data related to a plot
 * as well as support functions and event listeners
 * so multiple views can interactive with the plot
 * at the same time
 */

// Encapsulation it for neatness
gisportal.graphs.Plot = (function() {
   //
   var Plot = function() {

      EventEmitter.call(this);

      this._id = null;
      this._querySubmited = false;


      this._plotType = null;
      this._plotStyle = null;
      this._title = "";
      this._matchUpLog = false;
      this._animationFramerate = 1;
      this._createdOn = new Date();
      this._tBounds = [
         new Date(0),
         new Date(Math.pow(2, 31) * 1000)
      ];
      this._slicesInRange = [];

      this._components = [];
      //this._componentIdCounter = 1;

      //Place to store the interval id
      this._monitorJobStatusInterval = null;

      this._state = "building";

      this._serverStatus = null;

      //Any old daterange so with can initalise the slider. Its updated later
      this._dateRangeBounds = {
         min: new Date(0),
         max: new Date(Math.pow(2, 31) * 1000)
      };

      this._availableDates = {};
   };

   //Make the object able to fire events
   Plot.prototype = _.create(EventEmitter.prototype, {
      constructor: Plot
   });



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
   Plot.prototype.addComponent = function(component) {
      // Check the plot type id allowed more then 1 series
      if (this.components().length >= this.maxComponents) {
         return new Error("You already have the maximum number of series for this graph type");
      }
      // Does the current graph title match the generated one ?
      // If it does then remember that because we want to update
      // it when the new component has been added
      // 
      // If it doesn't match that means the user manually edited
      // it so we shouldn't touch it
      var updateGraphTitle = (this.getGraphTitle(this._components) == this.title() || this.title() === "");

      // Was the yAxis set manually?
      // If not auto set it
      if (!component.yAxis) {
         if (this._components.length === 0) {
            component.yAxis = 1;
         } else {
            component.yAxis = 2;
         }
      }

      // Add the component to the list of components
      this._components.push(component);

      // Fire an event so listeners no it was added
      this.emit('component-added', {
         component: component
      });

      // Update the date bounds, this is the outter date
      // limit covered by at least 1 series
      this.dateRangeBounds(this.calculateDateRangeBounds());
      
      // Update the graph title is the user hasnt
      // edited it
      if (updateGraphTitle) {
         this.title(this.getGraphTitle(this._components));
      }
   };

   /**
    * Removes a components from the array and the active plot window
    */
   Plot.prototype.removeComponent = function(component) {
      // Find the component index
      var index = this._components.indexOf(component);

      // Is the component in the components array ?
      if (index == -1) {
         return;
      }

      // Does the current graph title match the generated one ?
      // If it does then remember that because we want to update
      // it when the new component has been added
      // 
      // If it doesn't match that means the user manually edited
      // it so we shouldn't touch it
      var updateGraphTitle = (this.getGraphTitle(this._components) == this.title() || this.title() === "");

      this._components.splice(index, 1);

      // Update the graph title
      if (updateGraphTitle) {
         this.title(this.getGraphTitle(this._components));
      }

      // Event emit so listeners know it went
      this.emit('component-removed', {
         component: component
      });

      // Update the date bounds, this is the outter date
      // limit covered by at least 1 series
      this.dateRangeBounds(this.calculateDateRangeBounds());
   };

   /**
    * Returns the graph title for the components given
    * @param  {Array}  components The components to build the title
    * @return {String}            The new title
    */
   Plot.prototype.getGraphTitle = function(components) {
      return _.uniq(components.map(function(component) {
         var indicator = gisportal.layers[component.indicator];
         return indicator.displayName();
      })).join(" / ");
   };

   /**
    * Builds a request to send to the graphing server
    *
    * @return Object The graph object to be sent to the graphing server
    */
   Plot.prototype.buildRequest = function() {
      //Loads the basic graph request
      var plotRequest = {};
      var plotStyle = {};

      this.buildRequestBasics(plotRequest);
      this.buildRequestAxis(plotRequest);
      this.buildRequestData(plotRequest);
      this.buildRequestLogos(plotStyle);

      var request = {
         plot: plotRequest,
         style: plotStyle
      };
      return request;
   };

   /**
    * Adds basic information, the plot type,
    * the title and what formats can be downloaded
    * @param  Object  plotRequest  The plot request to
    *                              add the settings to
    */
   Plot.prototype.buildRequestBasics = function(plotRequest) {
      plotRequest.type = this.plotType();
      plotRequest.title = this.title();
      plotRequest.style = this._plotStyle;
      plotRequest.downloadTypes = [{
         key: 'csv',
         label: 'CSV'
      }, {
         key: 'png',
         label: 'PNG'
      }, {
         key: 'meta-data',
         label: 'Meta Data'
      }, {
         key: 'logos',
         label: 'Logos'
      }, {
         key: 'svg',
         label: 'SVG'
      }];
      plotRequest.matchup_log = this.matchUpLog();
      if (this.plotType() == 'animation' || this.plotType() == 'map') {
         plotRequest.framerate = this._animationFramerate;
         var baseMap = $('#select-basemap').data('ddslick').selectedData.value;
         var borders = $('#select-country-borders').data('ddslick').selectedData.value;
         if (gisportal.baseLayers[baseMap] &&
            gisportal.baseLayers[baseMap].getSource().getUrls() &&
            gisportal.baseLayers[baseMap].getSource().getUrls().length === 1 &&
            gisportal.baseLayers[baseMap].getSource().getParams) {
            plotRequest.baseMap = {
               wmsUrl: gisportal.baseLayers[baseMap].getSource().getUrls()[0],
               wmsParams: gisportal.baseLayers[baseMap].getSource().getParams()
            };
            if (plotRequest.baseMap.wmsParams.t) {
               delete plotRequest.baseMap.wmsParams.t;
            }
         } else if (baseMap !== 'none'){
            $.notify('Animations are not compatible with this basemap, no basemap will be used.', 'error');
         }
         if (borders != "0") {
            plotRequest.countryBorders = {
               wmsUrl: gisportal.countryBorderLayers[borders].getSource().getUrls()[0],
               wmsParams: gisportal.countryBorderLayers[borders].getSource().getParams()
            };
            if (plotRequest.countryBorders.wmsParams.t) {
               delete plotRequest.countryBorders.wmsParams.t;
            }
         }
      }
   };


   /**
    * Adds the logos for the providers used int this graph.
    * @param  {Object} The request object to add the values to
    */
   Plot.prototype.buildRequestLogos = function(plotStyle) {
      var providers = [];
      this._components.forEach(function(component) {
         var layer = gisportal.layers[component.indicator];

         if (!layer.provider || !layer.provider.logo) {
            return;
         }

         var providerLogo = gisportal.middlewarePath + layer.provider.logo;
         if (providers.indexOf(providerLogo) == -1) {
            providers.push(providerLogo);
         }
      });

      plotStyle.logos = providers;

   };

   /**
    * Adds the Axis options to a plot request.
    * @param  Object  plotRequest The request object to add the values to
    */
   Plot.prototype.buildRequestAxis = function(plotRequest) {

      var xAxis = {
         "scale": "linear",
         "label": "Date/Time",
         "ticks": "auto",
         "weight": "auto",
         "tickFormat": this.plotType() == "timeseries" ? "%d/%m/%Y" : ",.2f"
      };
      var y1Axis;
      plotRequest.xAxis = xAxis;

      // Get components that will go on the left Y axis
      var leftHandSideComoponents = this._components.filter(function(component) {
         return component.yAxis == 1;
      });
      // holder for the user label
      var userLabel = '';
      if (leftHandSideComoponents.length > 0) {
         // Using the left of left Y axis components build
         // axis names including the elevation and provider
         var yAxis1Label = leftHandSideComoponents.map(function(component) {
            var indicator = gisportal.layers[component.indicator];
            userLabel = component.userLabel;
            var output =  userLabel;
            if ('elevation' in component)
               output += ' Elv:' + component.elevation + 'M';
            if (indicator.units)
               output += " (" + indicator.units + ")";

            return output;
         }).join(' / ');

         y1AxisIsLog = $('.js-indicator-is-log[data-id="' + leftHandSideComoponents[0].indicator + '"]')[0].checked;

         y1Axis = {
            "scale": y1AxisIsLog ? "log" : "linear", //( linear | log_scale | ordinal | time)
            "label": yAxis1Label,
            "userLabel": userLabel,
            "ticks": "auto",
            "weight": "auto",
            "tickFormat": "auto"
         };
         plotRequest.y1Axis = y1Axis;
         if (gisportal.methodThatSelectedCurrentRegion.method == "csvUpload") {
            plotRequest.transectFile = gisportal.methodThatSelectedCurrentRegion.value;
         }
      }


      // Get components that will go on the left Y axis
      var rightHandSideComoponents = this._components.filter(function(component) {
         return component.yAxis == 2;
      });
      // holder for user label
      var userLabel2 = '';
      if (rightHandSideComoponents.length > 0) {
         // Using the left of left Y axis components build
         // axis names including the elevation and provider
         var yAxis2Label = rightHandSideComoponents.map(function(component) {
            var indicator = gisportal.layers[component.indicator];
            userLabel2 = component.userLabel;
            var output = userLabel2;
            if ('elevation' in component)
               output += ' Elv:' + component.elevation + 'M';
            if (indicator.units)
               output += " (" + indicator.units + ")";

            return output;
         }).join(' / ');

         y2AxisIsLog = $('.js-indicator-is-log[data-id="' + rightHandSideComoponents[0].indicator + '"]')[0].checked;

         var y2Axis = {
            "scale": y2AxisIsLog ? "log" : "linear", //( linear | log_scale | ordinal | time)
            "label": yAxis2Label,
            "userLabel": userLabel2,
            "ticks": "auto",
            "weight": "auto",
            "tickFormat": "auto"
         };
         if (this.plotType() == "scatter") {
            //Overwrites the xAxis if its a scatter
            plotRequest.xAxis = y1Axis;
            plotRequest.y1Axis = y2Axis;
            plotRequest.y2Axis = null;
         }
         plotRequest.y2Axis = y2Axis;
      }
   };

   /**
    * Added for the possibly to change the function
    * based on the current graph type but it was
    * never used.
    * @param  Object  plotRequest The request object to add the values to
    */
   Plot.prototype.buildRequestData = function(plotRequest) {
      plotRequest.data = {
         series: []
      };

      this.buildRequestDataGeneric(plotRequest.data.series);
   };

   /**
    * Adds all the request series to the array
    * pass in. It builds the series from the 
    * components array
    * @param  Array  seriesArray 
    */
   Plot.prototype.buildRequestDataGeneric = function(seriesArray) {
      var totalCount = 0;
      for (var i = 0; i < this._components.length; i++) {
         var component = this._components[i];
         var layer = gisportal.layers[component.indicator];

         // Add the drop down meta data
         var bbox_name = component.bboxName || component.bbox;
         var meta = "";
         meta += "Region: " + layer.tags.region + "<br>";
         meta += "Confidence: " + layer.tags.Confidence + "<br>";
         meta += "Provider: " + layer.providerTag + "<br>";
         meta += "Interval: " + layer.tags.interval + "<br>";
         meta += "Bounding Box: " + bbox_name + "<br>";

         if (component.elevation)
            meta += "Depth: " + component.elevation + layer.elevationUnits + "<br>";

         if (layer.provider) {
            logo = layer.provider.logo;
         } else {
            logo = undefined;
         }
         var nice_bbox = component.bbox;
         var current_projection = gisportal.projection;
         if (current_projection != "EPSG:4326") {
            if (nice_bbox.startsWith('POLYGON')) {
               nice_bbox = gisportal.reprojectPolygon(nice_bbox, "EPSG:4326");
            } else if (nice_bbox.indexOf("(") === -1) {
                  nice_bbox = gisportal.reprojectBoundingBox(nice_bbox.split(","), current_projection, "EPSG:4326").join(",");
            } 
            // if we get here then we are using a geometry collection and no reprojection is needed
         }

         var yAxis = component.yAxis;
         if (this._plotType == "scatter") {
            // Inverts the yAxis number for scatters to get the right data
            if (yAxis === 2) {
               yAxis = 1;
            } else {
               yAxis = 0;
            }
         }

         // Gumph needed for the plotting serving to its thing
         var newSeries = {
            // Source handler file to use
            "handler": "OPEC_SERVICE_WCS",
            "data_source": {
               // Variable name
               "coverage": layer.urlName,
               // Layer ID
               "layer_id": layer.id,
               // Time range of the data
               // Rounded so that the requests stay the same over collaboration
               "t_bounds": [this.tBounds()[0].toISOString().split("T")[0], this.tBounds()[1].toISOString().split("T")[0]],
               // Bounds box of the data, also supports WKT
               "bbox": nice_bbox,
               // Depth, optional
               "depth": component.elevation,

               // Threads URL, passed to the middleware URL
               "threddsUrl": layer.wcsURL.split("?")[0],
            },
            "label": (++totalCount) + ') ' + layer.descriptiveName,
            "yAxis": yAxis,
            "userLabel" : component.userLabel,
            "type": "line",
            "meta": meta
               //"logo": gisportal.middlewarePath + "/" + logo
         };

         // If its a hovmoller then
         // set the correct axis'
         if (this.plotType() == "hovmollerLat") {
            newSeries.data_source.graphXAxis = "Time";
            newSeries.data_source.graphYAxis = "Lat";
            newSeries.data_source.graphZAxis = newSeries.data_source.coverage;
         } else if (this.plotType() == "hovmollerLon") {
            newSeries.data_source.graphXAxis = "Lon";
            newSeries.data_source.graphYAxis = "Time";
            newSeries.data_source.graphZAxis = newSeries.data_source.coverage;
         } else if (this.plotType() == 'animation' || this.plotType() == 'map') {
            newSeries.data_source.wmsUrl = gisportal.layers[layer.id].openlayers.anID.getSource().getUrls()[0];
            newSeries.data_source.wmsParams = gisportal.layers[layer.id].openlayers.anID.getSource().getParams();
            newSeries.data_source.autoScale = $('#tab-' + layer.id + '-autoScale').is(':checked');
            if (newSeries.data_source.wmsParams.t) {
               delete newSeries.data_source.wmsParams.t;
            }
            if (this.plotType() == 'animation'){
               newSeries.data_source.timesSlices = this.slicesInRange();
            }
            else if (this.plotType() == 'map'){
               // Need code similar to slicesInRange to determine the dates that are closest to what the calendar widget selects
               mapCalendarDate = new Date ($('#map-calendar-widget').val())
               mapCalendarFormat = mapCalendarDate.toISOString().split("T")[0];
               mapCalendarSlice = mapCalendarDate.toISOString();
               newSeries.data_source.mapDate = mapCalendarFormat;
               newSeries.data_source.mapSlice = mapCalendarSlice;
            }
         }

         seriesArray.push(newSeries);
      }
   };

   /**
    * Submits the request the user has been building to server.
    * Also builds status box and puts it into the que
    */
   Plot.prototype.submitRequest = function(options) {
      this._querySubmited = true;
      var _this = this;

      // Generate the request object
      var request = this.buildRequest();
      if (gisportal.currentSelectedRegion.indexOf('(') !== -1) {
         request.plot.isIrregular = 'true';
      }

      function accumulateEstimates(data) {
         if (data.time && data.size && data.layer_id) {
            _this.series_total--;
            var layer_times = gisportal.layers[data.layer_id].DTCache;
            var numbered_layer_times = [];
            for (var time in layer_times) {
               numbered_layer_times.push(Date.parse(layer_times[time]).valueOf());
            }
            // Works out the number of time slices so that the time and size can be made per indicator rather than indicator time slice
            var min_index = gisportal.utils.closestIndex(numbered_layer_times, _this._tBounds[0].valueOf());
            var max_index = gisportal.utils.closestIndex(numbered_layer_times, _this._tBounds[1].valueOf());
            var total_slices = Math.abs(max_index - min_index);
            _this.timeEstimate += (data.time * total_slices);
            _this.sizeEstimate += (data.size * total_slices);
         } else {
            $.notify("This error was returned when trying to estimate time: " + data.statusText, "error");
            _this.stopMonitoringJobStatus();
         }
         // Only gives the time estimate if the size is small enough and all the estimates were retrieved successfully
         if (_this.series_total === 0) {
            if (_this.sizeEstimate < 4294967296) {
               var t = new Date();
               _this.estimatedFinishTime = new Date(t.getTime() + 1000 * _this.timeEstimate);
            } else {
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
      if (_this._plotType != "transect" && _this._plotType != "matchup" && _this._plotType != "scatter_matchup" && _this._plotType != "animation" && _this._plotType != "map") {
         for (var series in series_list) {
            $.ajax({
               method: 'post',
               url: gisportal.middlewarePath + '/plotting/check_plot',
               contentType: 'application/json',
               data: JSON.stringify(series_list[series]),
               dataType: 'json',
               //timeout:3000,
               success: accumulateEstimates,
               error: accumulateEstimates
            });
         }
      }


      // Make the plot
      $.ajax({
         method: 'post',
         url: gisportal.middlewarePath + '/plotting/plot',
         contentType: 'application/json',
         data: JSON.stringify({
            request: request
         }),
         dataType: 'json',
         success: function(data) {
            // Do the polling!
            _this.id = data.hash;
            _this.monitorJobStatus();
            gisportal.graphs.storedGraphs.push({
               id: data.hash,
               _title: _this._title
            });
         },
         error: function(e) {
            var error = 'Sorry, we failed to create a graph: \n' +
               'The server informed us that it failed to make a graph for your selection with the message"' + e.statusText + '"';
            $.notify(error, "error");
            // TODO: Remove the graph from the list
         }
      });
   };

   /**
    * Starts firing requests to the server monitoring the jobs status.
    */
   Plot.prototype.monitorJobStatus = function() {
      // If we are already monitoring the job then
      // dont start another monitor ! Makes sense right ?
      if (this._monitorJobStatusInterval !== null)
         return;

      var _this = this;

      function updateStatus() {
         $.ajax({
            url: "plots/" + _this.id + "-status.json?_=" + new Date().getTime(),
            dataType: 'json',
            success: function(serverStatus) {
               _this.serverStatus(serverStatus);
            },
            error: function(response) {
               if (response.status == 200 || response.status === 0) {
                  return;
               }
               $('.graph-job[data-created="' + _this._createdOn + '"]').remove();
               if ($('.graph-job').length <= 0) {
                  $('.no-graphs-text').toggleClass("hidden", false);
               }
               clearInterval(_this._monitorJobStatusInterval);
               $.notify("There was an error creating the graph:\n" + response.statusText, "error");
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
   Plot.prototype.stopMonitoringJobStatus = function() {
      clearInterval(this._monitorJobStatusInterval);
   };


   //---------------
   // Getters and settings
   Plot.prototype.state = function(_new) {
      if (!arguments.length) return this._state;
      this._state = _new;
      return this;
   };

   /**
    * Get the server status if no parameter provided
    * If parameter is provided then store it and 
    * fire and event
    */
   Plot.prototype.serverStatus = function(_new) {
      if (!arguments.length) return this._serverStatus;
      var old = this._serverStatus;
      this._serverStatus = _new;

      this.state(_new.state);

      this.emit('serverStatus-change', {
         'old': old,
         'new': _new
      });

      if (_new.completed === true)
         this.stopMonitoringJobStatus();

      return this;
   };

   /**
    * Get the server status if no parameter provided
    * If parameter is provided then store it and 
    * fire and event. Also set whether this graph
    * is allowed multiple series
    */
   Plot.prototype.plotType = function(_new) {
      var _this = this;
      if (!arguments.length) return this._plotType;
      var old = this._plotType;
      this._plotType = _new;

      $('.graph-date-range-info-li').toggleClass("hidden", true);
      $('.graph-date-range-error-li').toggleClass("hidden", true);

      if (_new != old)
         this.emit('plotType-change', {
            'new': _new,
            'old': old
         });

      $('.js-create-graph').toggleClass("hidden", false);
      $('.js-components tr').attr("has-data-in-range", "yes");
      if (_new == 'timeseries') {
         this.setMinMaxComponents(1, 10);
         this.setComponentXYText("Left Axis", "Right Axis");
      } else if (_new == 'scatter') {
         this.setMinMaxComponents(2, 2);
         this.setComponentXYText("X Axis", "Y Axis");
         this._components.forEach(function(comElem) {
            _this.forceComponentDateRange(comElem);
         });
         _this.checkComponentOverlap();
      } else {
         this.setMinMaxComponents(1, 1);
      }

      return this;
   };

   /**
    * This makes sure that the correct tesxt is shown in the X & Y selection options
    */
   Plot.prototype.setComponentXYText = function(xText, yText) {
      //Makes sure any new options have the correct text
      for (var component in this._components) {
         this._components[component].xText = xText;
         this._components[component].yText = yText;
      }
      // Changes the text of any already selected options
      $('select.js-y-axis option[value="1"]').text(xText);
      $('select.js-y-axis option[value="2"]').text(yText);
   };

   /**
    * Sets the minimum and maximum amount of components
    * If there are more than the maximum then the excess are removed.
    */
   Plot.prototype.setMinMaxComponents = function(min, max) {
      var _this = this;
      this.minComponents = min;
      this.maxComponents = max;
      if (this.components().length > max) {
         this.components().slice(max).forEach(function(component) {
            _this.removeComponent(component);
         });
      }
   };


   /**
    * Get the server status if no parameter provided
    * If parameter is provided then store it and 
    * fire and event
    */
   Plot.prototype.title = function(_new) {
      if (!arguments.length) return this._title;
      var old = this._title;
      this._title = _new;

      if (_new != old)
         this.emit('title-change', {
            'new': _new,
            'old': old
         });

      return this;
   };

   Plot.prototype.matchUpLog = function() {
      if ($('#matchup_log_switch').length > 0) {
         return $('#matchup_log_switch')[0].checked;
      } else {
         return false;
      }
   };

   /**
    * Get the server status if no parameter provided
    */
   Plot.prototype.components = function(_new) {
      if (!arguments.length) return this._components;
      return this;
   };

   /**
    * Finds the widest time range that covers all the indicators data sets.
    */
   Plot.prototype.calculateDateRangeBounds = function() {
      //If theres no components return the current bounds
      if (this._components.length === 0)
         return this.dateRangeBounds();

      var min = null;
      var max = null;

      this._components.forEach(function(component) {
         var indicator = gisportal.layers[component.indicator];

         var firstDate = new Date(indicator.firstDate);
         var lastDate = new Date(indicator.lastDate);

         if (firstDate < min || min === null)
            min = firstDate;

         if (lastDate > max || max === null)
            max = lastDate;
      });

      return {
         min: min,
         max: max
      };
   };

      /**
    * Finds an array of available dates for all the indicators loaded.
    */
       Plot.prototype.availableDates = function() {
          var availableDates = {};
         //If theres no components return the current bounds
         if (this._components.length === 0)
            return {
               availableDates:{}
            };
         this._components.forEach(function(component) {
            var indicator = gisportal.layers[component.indicator];
            availableDates[indicator.name]=indicator.DTCache;
         });
         return availableDates;
      };

   /**
    * The data range is the maximum range that covers all the components
    * When this is called and if this graph is the active plot it updates the slide out :
    *  - Updates the date range slider
    *  - Calls set tBounds to check that all the indicators are in range 
    */
   Plot.prototype.dateRangeBounds = function(_new) {
      var _this = this;

      if (!arguments.length) return this._dateRangeBounds;

      var oldDateRange = this._dateRangeBounds;
      this._dateRangeBounds = _new;


      if (!_.isEqual(this._dateRangeBounds, oldDateRange))
         this.emit('dateRangeBounds-change', {
            'new': this._dateRangeBounds,
            'old': oldDateRange
         });

      // Adjust the tBounds to a new width 
      //  If a bound was equal to the old date range, the user probably wants the full time scale
      var newtBounds = [];

      if (this.tBounds()[0].getTime() == oldDateRange.min.getTime())
         newtBounds[0] = this._dateRangeBounds.min;
      else
         newtBounds[0] = this.tBounds()[0];

      if (this.tBounds()[1].getTime() == oldDateRange.max.getTime())
         newtBounds[1] = this._dateRangeBounds.max;
      else
         newtBounds[1] = this.tBounds()[1];

      this.tBounds(newtBounds);

      if (this.plotType() == "scatter") {
         var errFound = false;
         this._components.forEach(function(comElem) {
            if (_this.forceComponentDateRange(comElem)) {
               errFound = true;
            }
         });
         this.checkComponentOverlap();
         if (!errFound) {
            $('.graph-date-range-info-li').toggleClass("hidden", true);
         }
      }


      return this;
   };
   
   // this is called everytime label changes for future use
   Plot.prototype.checkAxisLabels = function() {
      var components = this._components;
      if (components.length >= 2) {
         var indicator1 = gisportal.layers[components[0].indicator];
         var indicator2 = gisportal.layers[components[1].indicator];
      }
   };

   // This function makes sure that the daterange ranges or the component fits within the input box values
   Plot.prototype.forceComponentDateRange = function(componentElement) {
      // The the layer of the current component
      var indicator = gisportal.layers[componentElement.indicator];

      // Date range of the components layer
      var firstDate = new Date(indicator.firstDate);
      var lastDate = new Date(indicator.lastDate);

      var tBounds = this.tBounds();

      if (firstDate > tBounds[0] || tBounds[1] > lastDate) {
         if (firstDate > tBounds[0]) {
            $('.js-active-plot-start-date').val(firstDate.toISOString().split("T")[0]);
            $('.js-active-plot-start-date').trigger("change");
         }
         if (tBounds[1] > lastDate) {
            $('.js-active-plot-end-date').val(lastDate.toISOString().split("T")[0]);
            $('.js-active-plot-end-date').trigger("change");
         }
         $('.graph-date-range-info-li').toggleClass("hidden", false);
         $('.graph-date-range-info-div').html("<p>When creating a scatter plot the sample times of each indicator must be matching, so the start and end times have been set to maximum extent possible for these two indicators</p>");
         return true;
      }
   };

   Plot.prototype.checkComponentOverlap = function() {
      $('.graph-date-range-error-li').toggleClass("hidden", true);
      var components = this._components;
      if (components.length >= 2) {
         // Could eventually be in a loop checking more than 2 components, currently only ever 2
         var indicator1 = gisportal.layers[components[0].indicator];
         var indicator2 = gisportal.layers[components[1].indicator];
         var start1 = indicator1.firstDate;
         var end1 = indicator1.lastDate;
         var start2 = indicator2.firstDate;
         var end2 = indicator2.lastDate;

         var interval1 = indicator1.tags.interval;
         var interval2 = indicator2.tags.interval;
         
         if (start1 > end2 || start2 > end1) {
            $('.graph-date-range-info-li').toggleClass("hidden", true);
            $('.graph-date-range-error-li').toggleClass("hidden", false);
            $('.graph-date-range-error-div').html("<p>When creating a scatter plot the sample times of each indicator must be matching; the indicators you have selected do not overlap in time</p>");
            $('.js-components tr').attr("has-data-in-range", "no");
            $('.js-create-graph').toggleClass("hidden", true);
            return;
         } else if (!interval1 || !interval2) {
            $('.graph-date-range-info-li').toggleClass("hidden", true);
            $('.graph-date-range-error-li').toggleClass("hidden", false);
            $('.graph-date-range-error-div').html("<p>To create a scatter plot the two indicators must be of the same sample frequency; The interval of one of your indicators is undefined</p>");
            $('.js-components tr').attr("has-data-in-range", "no");
            $('.js-create-graph').toggleClass("hidden", true);
            return;
         } else if (interval1[0] != interval2[0]) {
            $('.graph-date-range-info-li').toggleClass("hidden", true);
            $('.graph-date-range-error-li').toggleClass("hidden", false);
            $('.graph-date-range-error-div').html("<p>To create a scatter plot the two indicators must be of the same sample frequency; at the moment you have '" + indicator1.id + "' which is " + interval1 + " and '" + indicator2.id + "' which is " + interval2 + "</p>");
            $('.js-components tr').attr("has-data-in-range", "no");
            $('.js-create-graph').toggleClass("hidden", true);
            return;
         } else {
            $('.js-create-graph').toggleClass("hidden", false);
         }
      }
      $('.graph-date-range-error-li').toggleClass("hidden", true);
   };

   Plot.prototype.animationFramerate = function(_new) {
      if (!arguments.length) return this._animationFramerate;
      this._animationFramerate = parseFloat(_new);
      if (this._animationFramerate === 0) {
         this._animationFramerate = 0.1;
      }
      return this;
   };

   Plot.prototype.slicesInRange = function(_new) {
      if (!arguments.length) return this._slicesInRange;

      if (_new && this._components.length == 1) {
         var layer = gisportal.layers[this._components[0].indicator];
         var times = _.uniq(gisportal.layers[layer.id].DTCache);
         var start = new Date(this.tBounds()[0]);
         var end = new Date(this.tBounds()[1]);

         var slicesInRange = [];

         for (var j = 0; j < times.length; j++) {
            var time = new Date(times[j]);
            if (time >= start && time <= end) {
               slicesInRange.push(times[j]);
            }
         }
         this._slicesInRange = slicesInRange;
      }
      return this._slicesInRange;
   };

   /**
    * Checks that the new tBounds is with the allowed date range
    * It updates the tBounds and checks that all the components/indicators have data in this range.
    * - If any dont it marks the component as out of range
    */
   Plot.prototype.tBounds = function(_new) {
      if (!arguments.length) return this._tBounds;

      var old = this._tBounds;

      if (_new.length == 1)
         _new = [_new, _new];

      this._tBounds = _new;

      var dateRangeBounds = this.dateRangeBounds();

      //Make sure the tBounds fit in the allowed dateRangeBounds
      if (dateRangeBounds.min !== null && this._tBounds[0] < dateRangeBounds.min)
         this._tBounds[0] = dateRangeBounds.min;

      if (dateRangeBounds.max !== null && dateRangeBounds.max < this._tBounds[1])
         this._tBounds[1] = dateRangeBounds.max;

      this.slicesInRange(true);

      if (!_.isEqual(this._tBounds, old))
         this.emit('tBounds-change', {
            'new': this._tBounds,
            'old': old
         });

      return this;
   };

   /**
    * Produces a copy of the current Plot object
    * @return Plot A copy of the current plot
    */
   Plot.prototype.copy = function() {
      var newCopy = new Plot();
      newCopy.title(this.title());
      newCopy.plotType(this.plotType());
      newCopy._plotStyle = this._plotStyle;
      newCopy.dateRangeBounds(this.dateRangeBounds());
      newCopy.availableDates(this.availableDates());
      newCopy.animationFramerate(this.animationFramerate());
      newCopy.tBounds(this.tBounds());

      this._components.forEach(function(component) {
         newCopy.addComponent(component);
      });

      return newCopy;
   };

   return Plot;
})();

gisportal.graphs.createPlotFromState = function(plotState) {
   var Plot = gisportal.graphs.Plot;
   var plot = new Plot();

   plot._components = plotState._components;
   plot._createdOn = plotState._createdOn;
   plot._dateRangeBounds = plotState._dateRangeBounds;
   plot._plotType = plotState._plotType;
   plot._plotStyle = plotState._plotStyle;
   plot._animationFramerate = plotState._animationFramerate;
   plot._state = plotState._state;
   plot._tBounds = plotState._tBounds;
   plot._title = plotState._title;
   plot.maxComponents = plotState.maxComponents;
   plot.minComponents = plotState.minComponents;

   return plot;
};