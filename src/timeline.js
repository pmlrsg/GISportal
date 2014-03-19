/**
 * OPEC.Timeline is an interactive visualisation widget to visualise date-time ranges
 * with a start and end date and detail dates in between as timelines on a chart based around
 * d3.js (http://d3js.org/), a JavaScript library for manipulating documents based on data.
 *
 * OPEC.Timeline has been tested on Firefox 18.0, Safari 5.1.2, Chrome 24.0, Opera 11.64 & IE 9+.
 *
 * @author  Martyn J Atkins, <martat@pml.ac.uk>
 *          Shane Hudson, <shh@pml.ac.uk>
 * @date    2013-02-28
 * @version 1.0
 *
 * @note OPEC.Timeline options format
 *  {
 *     "__comment": {String},                                                                          A comment for the JSON data file (ignored)
 *     "selectedDate": {String},                                                                       Initial selected date (ISO8601 datetime string)
 *     "chartMargins": { "top": {number}, "right": {number}, "bottom": {number}, "left": {number} },   Widget chart margins (pixels)
 *     "barHeight": {number},                                                                          Height/thickness of the time bars (pixels)
 *     "barMargin": {number},                                                                          Margin spacing around time bars (pixels)
 *     "timebars": [
 *        {
 *           "name": {String},                                                                         Time bar: unique name
 *           "label": {String},                                                                        Time bar: label to show on bar
 *           "startDate": {String},                                                                    Time bar: start date for data range (ISO8601 datetime string)
 *           "endDate": {String},                                                                      Time bar: end date for data range (ISO8601 datetime string)
 *           "dateTimes": {String}[]                                                                   Time bar: comma separated array of ISO8601 datetime strings detailing available data
 *        },
 *        timebar {Object},                                                                            Further time bar objects in the array
 *        timebar {Object}                                                                             Further time bar objects in the array
 *     ]
 *  }
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (c) 2013 PML Applications Ltd
 *
 */

/**
 * The TimeLine is a visualisation chart to visualise events in time. 
 *
 * @constructor TimeLine
 *
 * @param {string}   id       The DOM element id in which the timeline will be created.
 * @param {Object}   options  Timeline options in JSON format
 */
gisportal.TimeLine = function(id, options) {
   
   // Use "self" to refer to this instance of the OPEC.TimeLine object
   var self = this;
   
   // Check to see if the element with id exists, if not throw an error and return a null object
   if (!$('div#' + id).length) {
      console.error('No DIV with ID, "' + id + '" exists. Cannot render TimeLine.');
      return;
   }
   
   //--------------------------------------------------------------------------
   
   // Default options
   var defaults = {
      comment: "Sample timeline data",
      selectedDate: new Date(),
      chartMargins: {
         top: 0,
         right: 0,
         bottom: 0,
         left: 0
      },
      barHeight: 20,
      barMargin: 4,
      timebars: []
   };
   
   this.options = $.extend({}, defaults, options) ;

   this.hiddenRangebars = []; // Used to hide range bars

   // Initialise the fixed TimeLine widget properties from the JSON options file
   this.id = id;
   this.visible = true;
   this.now = new Date();
   
   // To lazy to go and rename everything "this.options.xxx"
   this.timebars = this.options.timebars;
   this.layerbars = this.timebars.filter(function(element, index, array) { return element.type == 'layer'; });
   this.rangebars = this.timebars.filter(function(element, index, array) { return element.type == 'range'; });
   
   this.barHeight = this.options.barHeight;
   this.barMargin = this.options.barMargin;
   
   this.selectedDate = this.options.selectedDate;
   this.margin = this.options.chartMargins;
   this.laneHeight = this.barHeight + this.barMargin * 2 + 1;
   this.colours = d3.scale.category10(); // d3 colour categories scale with 10 contrasting colours
   
   //--------------------------------------------------------------------------

   // Set up initial dynamic dimensions
   this.reHeight();
   this.reWidth();
   
   //--------------------------------------------------------------------------
   
   // Set initial x scale
   this.minDate = d3.min(this.timebars, function(d) { return new Date(d.startDate); });
   this.maxDate = d3.max(this.timebars, function(d) { return new Date(d.endDate); });
   
   // Set some default max and min dates if no initial timebars (6 months either side of selected date)
   if (typeof this.minDate === 'undefined' || this.minDate === null ) {
      this.minDate = new Date(this.selectedDate.getTime() - 15778450000);}
   if (typeof this.maxDate === 'undefined' || this.maxDate === null ) {
      this.maxDate = new Date(this.selectedDate.getTime() + 15778450000);
   }
   
   // Set initial y scale
   this.xScale = d3.time.scale().domain([this.minDate, this.maxDate]).range([0, this.width]);
   console.log("xscale width:" + this.width);
   this.yScale = d3.scale.linear().domain([0, this.timebars.length]).range([0, this.height]); 
   
   //--------------------------------------------------------------------------
   
   // Used to stop both events firing.
   var isDragging = false;
   
   this.clickDate = function(d, i) {
      console.log(d);
      console.log(i);
      console.log(this);
      // Stop the event firing if the drag event is fired.
      if(isDragging) {
         //isDragging = false;
         return;
      }
      

      var x = d3.mouse(this)[0];       
      
      // Prevent dragging the selector off-scale
      x = (x > self.xScale.range()[0] && x < self.xScale.range()[1]) ? x : (x - d3.event.layerX);
      
      // Now update the date based on the new value of x
      self.draggedDate = self.xScale.invert(x);
      
      // Move the graphical marker
      self.selectedDateLine.attr('x', function(d) { return d3.round(self.xScale(self.draggedDate) - 1.5); });
      
      self.selectedDate = self.draggedDate;
      
      // **Update the OPEC map**
      // Change the selected date in the datepicker control      
      $('#viewDate').datepicker('setDate', self.selectedDate);
      
      // Filter the layer data to the selected date      
      gisportal.filterLayersByDate(self.selectedDate);
      console.log('--->New clicked date/time = ' + self.selectedDate);  // Debugging
      $('#viewDate').change();
   };
  

   // Set up the SVG chart area within the specified div; handle mouse zooming with a callback.
   this.zoom = d3.behavior.zoom()
                .x(this.xScale)
              .on('zoom', function() { isDragging = true; console.log(self.xScale.domain()); self.redraw(); console.log("ZOOM-2!"); });
                 

   // Append the svg and add a class before attaching both events.
   this.chart = d3.select('div#' + this.id)
      .append('svg')
      .attr('class', 'timeline')
      .call(self.zoom)
      .on('click', self.clickDate)
      .on('mousedown', function() {  isDragging = false; console.log('mousedown || ' + isDragging); });


   //--------------------------------------------------------------------------
      
   // Create the graphical drawing area for the widget (main)
   this.main = this.chart.append('svg:g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      .attr('class', 'main');

   // Separator line drawing initialisation
   this.separatorArea = this.main.append('svg:g');

   // Initialise the area to hold the range bars as horizontal timelines
   this.barArea = this.main.append('svg:g');

   // Initialise the fine-grained date-time detail bar area
   this.dateDetailArea = this.main.append('svg:g');   
   

   // Initialise the fine-grained date-time detail bar area
   this.rangeBarArea = this.main.append('svg:g');   
   
   // Initialise a vertical line through all timelines for today's date
   this.nowLine = this.main.append('svg:line').attr('class', 'nowLine');

   // Set up callback functions to handle dragging of a selected date-time marker
   this.draggedDate = this.selectedDate;
   
   //--------------------------------------------------------------------------
   
   /**
    * Private method/function which handles the drag event of the selected date marker
    */
   this.dragDate = function() {
      var self = gisportal.timeline;
      var x = self.xScale(self.draggedDate) + d3.event.dx;
      
      // Prevent dragging the selector off-scale
      x = (x > self.xScale.range()[0] && x < self.xScale.range()[1]) ? x : (x - d3.event.dx);
      
      // Now update the date based on the new value of x
      self.draggedDate = self.xScale.invert(x);
      
      // Move the graphical marker
      self.selectedDateLine.attr('x', function(d) { return d3.round(self.xScale(self.draggedDate) - 1.5); });
      console.log('--->New drag date/time = ' + self.draggedDate);  // Debugging
   };
   
   this.dragDateEnd = function() {
      self.selectedDate = self.draggedDate;
      
      // **Update the OPEC map**
      // Change the selected date in the datepicker control
      $('#viewDate').datepicker('setDate', self.selectedDate);
      
      // Filter the layer data to the selected date
      gisportal.filterLayersByDate(self.selectedDate);
      console.log('--->New selected date/time = ' + self.selectedDate);  // Debugging
   };

   // Initialise the selected date-time marker and handle dragging via a callback
   this.selectedDateLine = this.main.append('svg:rect').attr('cursor', 'e-resize').attr('class', 'selectedDateLine')
      .call(
         d3.behavior.drag().origin(Object)
         .on('drag', self.dragDate)
         .on('dragend', self.dragDateEnd)    
      ).on("mousedown", function() { d3.event.stopPropagation(); });

   // X-axis intialisation
   this.xAxis = d3.svg.axis().scale(this.xScale).orient('bottom').tickSize(6, 0, 0);
   this.main.append('svg:g').attr('transform', 'translate(0,' + d3.round(this.height + 0.5) + ')').attr('class', 'axis');

   // Initialise the time bar label area to the left of the timeline
   this.labelArea = this.main.append('svg:g');
//    
   // $('#' + this.id + ' button').button({ icons: { primary: 'ui-icon-triangle-1-s'} })
      // .click(function() {
         // self.hide(); 
      // });

   $('#' + this.id + ' .togglePanel')
      .button({  label:'Toggle Panel', icons: { primary: 'ui-icon-triangle-1-s'}, 'text': false })
      .click(function() {
         if ($(this).parent().css('bottom') != "0px") {
            self.show();
         }
         else {
            self.hide();
         }
      });


   // Draw the graphical elements
   self.redraw();

   // Handle browser window resize event to dynamically scale the timeline chart along the x-axis
   $(window).resize(function(event) {
      // Change the widget width settings dynamically if the DIV is visible
      if(self.visible && event.target == window){ self.reWidth(); self.redraw(); }
   });
};

// Handle browser window resize event to dynamically scale the timeline chart along the x-axis
gisportal.TimeLine.prototype.redraw = function() {
   console.log("redraw");
   
   var self = this;  // Useful for when the scope/meaning of "this" changes
   console.log('------ ' + this.xScale.domain());
   // Recalculate the x and y scales before redraw
    this.xScale.range([0, this.width]);
   //this.xScale.domain([self.minDate, self.maxDate]).range([0, this.width]);
   this.yScale.domain([0, this.timebars.length]).range([0, this.height]);
   // Scale the chart and main drawing areas
   $('#' + this.id).height(this.chartHeight);
   this.main.attr('width', this.width).attr('height', this.height);
   this.chart.attr('width', this.chartWidth).attr('height', this.chartHeight)
      // Set the SVG clipping area to prevent drawing outside the bounds of the widget chart area
      .style('clip', 'rect( 0px, '+ (this.width + this.margin.left) +'px, ' + this.chartHeight + 'px, ' + this.margin.left + 'px)');

   // Scale the x-axis and define the x-scale label format
   this.main.selectAll('.axis').attr('transform', 'translate(0,' + d3.round(this.height + 0.5) + ')').call(this.xAxis);
   // Generate a dynamic x-axis scale dependent on dimensions
   
   var scaling = (self.xScale.domain()[1] - self.xScale.domain()[0]) / (this.width * 4e7);
   if (scaling > 12) {
      this.xAxis.ticks(d3.time.years, d3.round(scaling/12)).tickFormat(d3.time.format('%Y'));
   }
   else if (scaling <= 12 && scaling > 1) {
      this.xAxis.ticks(d3.time.months, getNearestInArray([1, 2, 3, 4, 6, 12], scaling)).tickFormat(d3.time.format('%b %y'));
   }
   else if (scaling <= 1 && scaling > 1/7) {
      this.xAxis.ticks(d3.time.weeks, d3.round(scaling*4.3)).tickFormat(d3.time.format('%d/%m/%y'));
   }
   else if (scaling <= 1/7 && scaling > 1/365) {
      this.xAxis.ticks(d3.time.days, d3.round(scaling*30)).tickFormat(d3.time.format('%d/%m/%y'));
   }
   else if (scaling <= 1/365) {
      this.xAxis.ticks(d3.time.hours, d3.round(scaling*730)).tickFormat(d3.time.format('%I %p'));
   }

   //--------------------------------------------------------------------------
   
   // These are used to create the full width bars of the timeline
   // It uses lines to depict the separate timelines and transparent rectangles
   // so that each timeline can have its own event handlers.
   // Previously it was using just lines but obviously you cannot add event handlers
   // to empty space.
   
   // Draw the separator lines between time bars
   this.sepLines = this.separatorArea.selectAll('rect').data(this.timebars);
   
   // New separator lines arriving
   this.sepLines.enter().append('svg:line')
      .attr('x1', 0)
      .attr('x2', this.width)
      .attr('y1', function(d, i) { return d3.round(self.yScale(i) ); })
      .attr('y2', function(d, i) { return d3.round(self.yScale(i) ); })
      .attr('class', 'separatorLine');
   
	var dragging = null;	
   this.sepLines.enter().append('svg:rect')
      .attr('x', 0)
      .attr('y', function(d, i) { d.y = d3.round(self.yScale(i) + 0.5) + "px"; return d3.round(self.yScale(i) + 0.5); })
      .attr('height', function(d, i) { return d3.round(self.barHeight + (self.barMargin*2)); })
      .attr('width', this.width)
      .attr('class', function(d,i) { return 'timeline-bar' + ' bar-type--' + d.type; })
      .style('fill', 'transparent')
      .on('click', function(d)  {
         if (d.type == 'range')  {
            d3.event.stopPropagation();
            d3.event.preventDefault();
         }
      })
      .on('mousedown', function(d) {
         if(d.type == 'range') {
            d3.event.stopPropagation();
            if (dragging === null)  {
               // There will be a maximum of 1 being dragged
               d.selectedStart = self.xScale.invert(d3.mouse(this)[0]);
               dragging = d.name;
            }
      	}  
      })
      .on('mousemove', function(d) {
			if(d.type == 'range') {
            d3.event.stopPropagation();
            // Check if mousemove should drag the rectangle
            if (dragging !== null)  {
               self.rangebars.filter(function(d) { return d.name === dragging; })[0].selectedEnd = self.xScale.invert(d3.mouse(this)[0]);
               self.redraw();  
            }
         }
      })
		.on('mouseup', function(d) {
			if(d.type == 'range') {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (dragging !== null)  {
               d = self.rangebars.filter(function(d) { return d.name === dragging; })[0];
               var selectedEnd = self.xScale.invert(d3.mouse(this)[0]);
               if (new Date(d.selectedStart) > new Date(selectedEnd))  {
                  d.selectedEnd = d.selectedStart;
                  d.selectedStart = selectedEnd;
               }
               else  {
                  selectedEnd = selectedEnd;
               }
               $(gisportal).trigger('rangeUpdate.gisportal', [d]);
               dragging = null;
               self.redraw();  
            }
         }
		});
//       
   // // Separator line removal
   this.sepLines.exit().remove();
   
   //--------------------------------------------------------------------------

   // Draw the time bars
   // Note: Had to use closures to move variables from each into the .attr etc.
   this.bars = this.barArea.selectAll('rect').data(this.timebars);
   this.bars
      .enter().append('svg:rect')
      .each(function(d, i) {
         d.colour = d.colour || self.colours(i);
         if(d.type == 'layer')  {
            d3.select(this).attr('y', (function(d, i) { return d3.round(self.yScale(i) + self.barMargin + 0.5); })(d,i))
            .transition().duration(500)
            .attr('height', d3.round(self.barHeight + 0.5))
            .attr('stroke', (function(d, i) { return d.colour || self.colours(i); })(d,i))
            .attr('class', 'timeRange');
         }
      });
      
   // Time bar removal
   this.bars.exit().remove();
   
   // Re-scale the x values and widths of ALL the time bars
   this.bars
      .attr('x', function(d) { 
         if(d.startDate) { 
            var x = d3.round(self.xScale(new Date(d.startDate)) + 0.5); 
            return x; 
         } else { 
            return 0;
         } 
      }).attr('width', function(d) { 
         if(d.endDate) { 
            return d3.round(self.xScale(new Date(d.endDate)) - self.xScale(new Date(d.startDate))); 
         } else { 
            return 0; 
         } 
      });
      
   //--------------------------------------------------------------------------
   
   // Position the date time detail lines (if available) for each time bar
   this.dateDetails = this.dateDetailArea.selectAll('g').data(this.timebars);

   this.dateDetails.enter().append('svg:g')
      .each(function(d1, i1) {
         if(d1.type == 'layer')  {
            // Time Bar
            d3.select(this).selectAll('g').data(d1.dateTimes)  // <-- second level data-join
              .enter().append('svg:line')
               .attr('stroke', function() { return d1.colour || self.colours(i1); })
               .attr('y1', function() { return d3.round(self.yScale(i1) + self.barMargin + 1.5); })
               .attr('y2', function() { return d3.round(self.yScale(i1) + self.laneHeight - self.barMargin + 0.5); })
               .attr('class', 'detailLine');
         }
      });
      
   //--------------------------------------------------------------------------
   this.rangeBarArea.selectAll('rect').remove(); // Dirty hack so that it forces functions 
   this.rangeBarRectangles = this.rangeBarArea.selectAll('rect').data(this.rangebars, function(d) { return d.y; });
   this.rangeBarRectangles.enter()
        .append("svg:rect")
          .attr("x", function(d, i) { 
             var x = 0;
             if (new Date(d.selectedStart) < new Date(d.selectedEnd))  {
                x = d3.round(self.xScale(new Date(d.selectedStart)) + 0.5); 
             }
             else {
                x = d3.round(self.xScale(new Date(d.selectedEnd)) + 0.5); 
             }
             return x;
          })
          .attr("y", function(d) { console.log("d.y: " + d.y); return d.y; })
          .attr("width", function(d, i) { 
             var width = 0;
             if (new Date(d.selectedStart) < new Date(d.selectedEnd))  {
               width = d3.round(self.xScale(new Date(d.selectedEnd)) - self.xScale(new Date(d.selectedStart))); 
             }
             else {
               width = d3.round(self.xScale(new Date(d.selectedStart)) - self.xScale(new Date(d.selectedEnd))); 
             }
             return width;
          })
          .attr("height", function(d, i) { return d3.round(self.laneHeight); })
          .style("fill", function(d,i) { return d.colour || self.colours(i); })
          .attr('class', 'data-bar-type--range');

   //--------------------------------------------------------------------------
   
   // Date detail removal at time bar level
   this.rangeBarRectangles.exit().remove();
   
   // Date detail removal at time bar level
   this.dateDetails.exit().remove(); 
   
   // Re-scale the x values for all the detail lines for each time bar
   this.main.selectAll('.detailLine')
      .attr('x1', function(d) { return d3.round(self.xScale(new Date(d)) + 0.5); })
      .attr('x2', function(d) { return d3.round(self.xScale(new Date(d)) + 0.5); });
      
      
   // Re-scale the x values for all rangebars
   this.main.selectAll('.data-bar-type--range').data(this.rangebars).each(function(d) {
      if(d.type == 'range' && d.selectedStart !== 0 && d.selectedEnd !== 0)  {
         d3.select(this).attr('x', function(d, i) { 
             var x = 0;
             if (new Date(d.selectedStart) < new Date(d.selectedEnd))  {
                x = d3.round(self.xScale(new Date(d.selectedStart)) + 0.5); 
             }
             else {
                x = d3.round(self.xScale(new Date(d.selectedEnd)) + 0.5); 
             }
             return x;
          })
          .attr('width', function(d, i) { 
             var width = 0;
             if (new Date(d.selectedStart) < new Date(d.selectedEnd))  {
               width = d3.round(self.xScale(new Date(d.selectedEnd)) - self.xScale(new Date(d.selectedStart))); 
             }
             else {
               width = d3.round(self.xScale(new Date(d.selectedStart)) - self.xScale(new Date(d.selectedEnd))); 
             }
             return width;
          });
      }
   });
   
   // Draw the current date-time line
   this.nowLine
      .attr('x1', d3.round(this.xScale(self.now) + 0.5)).attr('y1', 0)
      .attr('x2', d3.round(this.xScale(self.now) + 0.5)).attr('y2', self.height);

   // Draw the selected date-time line
   this.selectedDateLine
      .attr('x', function(d) { return d3.round(self.xScale(self.selectedDate) - 1.5); }).attr('y', 2)
      .attr('width', 4).attr('height', self.height - 2);
   
   // Draw the time bar labels
   this.labelArea.selectAll('text').remove(); // Dirty hack to redraw labels for update
   this.labels = this.labelArea.selectAll('text').data(this.timebars);
   
   // New labels arriving
   this.labels.enter().append('svg:text')
      .text(function(d) { return d.label; })
      .attr('x', 1.5)
      .attr('y', function(d, i) { return d3.round(self.yScale(i + 0.5)); })
      .attr('dy', '0.5em')
      .attr('text-anchor', 'end').attr('class', 'laneText');
   // Label removal
   this.labels.exit().remove();  
      
   //-------------------------------------------------------------------------- 
};

// Re-calculate the dynamic widget height
gisportal.TimeLine.prototype.reHeight = function() {
   this.height = this.laneHeight*(this.timebars.length);
   // If no timebars, we'll need a default height, say 25 pixels
   if (this.height === 0){ this.height = 25; }
   this.chartHeight = this.height + this.margin.top + this.margin.bottom + 20; // +20 pixels to accomodate the x-axis labels
};

// Re-calculate the dynamic widget width
gisportal.TimeLine.prototype.reWidth = function() {
   this.chartWidth = $('div#' + this.id).width();
   this.width = this.chartWidth - this.margin.right - this.margin.left;
};

// Reset the timeline to its original data extents
gisportal.TimeLine.prototype.reset = function() {
   this.zoom.translate([0, 0]).scale(1);
   this.reHeight();
   this.reWidth();
   this.redraw();
};

// Zoom function to a new date range
gisportal.TimeLine.prototype.zoomDate = function(startDate, endDate){
   var self = this;
   var minDate = new Date(startDate);
   var maxDate = new Date(endDate);
   var padding = (maxDate - minDate) * 0.05; 
   this.minDate = ((minDate instanceof Date) ? new Date(minDate.getTime() - padding) : this.minDate);
   this.maxDate = ((maxDate instanceof Date) ? new Date(maxDate.getTime() + padding) : this.maxDate);
   console.log(minDate, maxDate);
   console.log(this.xScale.domain());
   this.xScale.domain([this.minDate, this.maxDate]).range([0, this.width]);
   this.zoom.x(this.xScale); // This is absolutely required to programatically zoom and retrigger internals of zoom
   this.redraw();
};

// Show the timebar
gisportal.TimeLine.prototype.hide = function() {
   $('div#' + this.id).animate({bottom: '-' + ($('div#timeline').height() - 2) + 'px'});
   $('div#' + this.id + ' .togglePanel').button( "option", "icons", { primary: 'ui-icon-triangle-1-n'} );
};

// Hide the timebar
gisportal.TimeLine.prototype.show = function() {
   $('div#' + this.id).animate({bottom: 0 });
   $('div#' + this.id + ' .togglePanel').button( "option", "icons", { primary: 'ui-icon-triangle-1-s'} );
};

// Add a new time bar to the chart in JSON timeBar notation
gisportal.TimeLine.prototype.addTimeBarJSON = function(timeBar) {
   this.timebars.push(timeBar);
   this.reHeight();
   this.redraw();
};

// Add a new time bar using detailed parameters
gisportal.TimeLine.prototype.addTimeBar = function(name, label, startDate, endDate, dateTimes) {
   var newTimebar = {};
   newTimebar.name = name;
   newTimebar.label = label;
   newTimebar.startDate = startDate;
   newTimebar.endDate = endDate;
   newTimebar.dateTimes = dateTimes;
   newTimebar.type = 'layer';  
   newTimebar.hidden = false;
   newTimebar.colour = '';
   
   this.timebars.push(newTimebar);
   this.layerbars.push(newTimebar); 

   // TODO: Move asap. tidy up
   if (Object.keys(gisportal.layers).length === 1 && (!gisportal.cache.state || !gisportal.cache.state.timeline))  {
      this.reHeight();
      // redraw is done in zoom
      var data = gisportal.timeline.layerbars[0];
      gisportal.timeline.zoomDate(data.startDate, data.endDate);
      gisportal.timeline.setDate(data.endDate);
      // Already redraws within zoom - this.redraw();
   }  
   
   this.reHeight();
   this.redraw();
   
};

gisportal.TimeLine.prototype.addRangeBar = function(name, callback) {
   var newRangebar = {};
   newRangebar.name = gisportal.utils.uniqueID();
   newRangebar.label = name;
   newRangebar.callback = callback;
   newRangebar.type = 'range';
   newRangebar.dateTimes = [];
   newRangebar.selectedStart = 0;
   newRangebar.selectedEnd = 0;
   newRangebar.y = ''; // So that the y can be specifically set to avoid bugs and complications with other types of timebars
   newRangebar.isDragging = false; // Each bar needs to know if it is being modified so that it doesn't draw over over bars
   newRangebar.colour = '';
   this.timebars.push(newRangebar);
   this.rangebars.push(newRangebar);
   
   this.reHeight();
   this.redraw(); 

};

// NOTE: There may be problems with duplicated unique IDs
gisportal.TimeLine.prototype.addRangeBarCopy = function(rangebar)  {
   if (rangebar.selectedEnd) rangebar.selectedEnd = new Date(rangebar.selectedEnd);
   if (rangebar.selectedStart) rangebar.selectedStart = new Date(rangebar.selectedStart);

   this.timebars.push(rangebar);
   this.rangebars.push(rangebar);

   this.reHeight();
   this.redraw();
}

// Rename timebar
gisportal.TimeLine.prototype.rename = function(name, label)  {
   this.rangebars.filter(function(d) { return d.name == name; })[0].label = label;   
   this.timebars.filter(function(d) { return d.name == name; })[0].label = label;
   this.reHeight();
   this.redraw();
}

// Remove a time bar by name (if found)
gisportal.TimeLine.prototype.removeTimeBarByName = function(name) {
   var self = this,
   type = "";
   
   function removeByName(anArray) {
      for (var j = 0; j < anArray.length; j++){
         if (anArray[j].name == name) {
            var bar = anArray[j];
            anArray.splice(j, 1);
            return bar;
         }
      }
   }
   
   var bar = removeByName(self.timebars);
   type = bar.type;
   
   if(type == 'layer') { removeByName(self.layerbars); }
   else if (type == 'range') { removeByName(self.rangebars); }
   
   var temp = this.timebars;
   // Kludge to clear out the display
   this.timebars = [];
   this.reHeight();
   this.redraw();
   // Now re-instate the newly altered array and redraw
   this.timebars = temp;
   this.reHeight();
   this.redraw();
};

// Set the currently selected date and animated the transition
gisportal.TimeLine.prototype.setDate = function(date) {
   var self = this;  // Useful for when the scope/meaning of "this" changes
   var selectedDate = self.draggedDate = new Date(date);
   this.selectedDate = ((selectedDate instanceof Date) ? selectedDate : this.selectedDate);
   // Move the selected date-time line
   this.selectedDateLine.transition().duration(1000).attr('x', function(d) { return d3.round(self.xScale(self.selectedDate) - 1.5); });
   $('#viewDate').datepicker('setDate', self.selectedDate).blur();
   gisportal.filterLayersByDate(date);
   $('#viewDate').change();
};

// Get the currently selected date 
gisportal.TimeLine.prototype.getDate = function() {
   var selectedDate = new Date(this.selectedDate);
   return ((selectedDate instanceof Date) ? selectedDate : null);
};

gisportal.TimeLine.prototype.hideRange = function(name)  {
   var self = this;
   for (var i = 0; i < this.rangebars.length; i++)  {
      var r = this.rangebars[i];
      if (r.name == name)  {
         self.hiddenRangebars.push(r);
         self.removeTimeBarByName(name);
      }
   }
};
 
gisportal.TimeLine.prototype.showRange = function(name)  {
   var self = this;
   var tmp = [];
   $.each(this.hiddenRangebars, function(i, r) { 
      if(r.name == name)  {
         self.timebars.push(r);
         self.rangebars.push(r);
      }  
      else {
         tmp.push(r);
      }
   });
   this.hiddenRangebars = tmp;
   this.reHeight();
   this.redraw();  
};
