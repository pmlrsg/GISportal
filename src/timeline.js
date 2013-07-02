/**
 * OPEC.Timeline is an interactive visualisation widget to visualise date-time ranges
 * with a start and end date and detail dates in between as timelines on a chart based around
 * d3.js (http://d3js.org/), a JavaScript library for manipulating documents based on data.
 *
 * OPEC.Timeline has been tested on Firefox 18.0, Safari 5.1.2, Chrome 24.0, Opera 11.64 & IE 9+.
 *
 * @author  Martyn J Atkins, <martat@pml.ac.uk>
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
opec.TimeLine = function(id, options) {
   
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

   // Initialise the fixed TimeLine widget properties from the JSON options file
   this.id = id;
   this.visible = true;
   this.now = new Date();
   
   // To lazy to go and rename everything "this.options.xxx"
   this.timebars = this.options.timebars;
   this.barHeight = this.options.barHeight;
   this.barMargin = this.options.barMargin;

   this.selectedDate = this.options.selectedDate;
   this.margin = this.options.chartMargins;
   this.laneHeight = this.barHeight + this.barMargin * 2 + 1;
   this.colours = d3.scale.category10(); // d3 colour categories scale with 10 cotrasting colours
   
   //--------------------------------------------------------------------------

   // Set up initial dynamic dimensions
   this.reHeight();
   this.reWidth();
   
   //--------------------------------------------------------------------------
   
   // Set initial x scale
   var minDate = d3.min(this.timebars, function(d) { return new Date(d.startDate); });
   var maxDate = d3.max(this.timebars, function(d) { return new Date(d.endDate); });
   
   // Set some default max and min dates if no initial timebars (6 months either side of selected date)
   if (typeof minDate === 'undefined' || minDate === null ) {
      minDate = new Date(this.selectedDate.getTime() - 15778450000);
   }
   if (typeof maxDate === 'undefined' || maxDate === null ) {
      maxDate = new Date(this.selectedDate.getTime() + 15778450000);
   }
   
   // Set initial y scale
   this.xScale = d3.time.scale().domain([minDate, maxDate]).range([0, this.width]);
   this.yScale = d3.scale.linear().domain([0, this.timebars.length]).range([0, this.height]);
   
   //--------------------------------------------------------------------------
   
   this.clickDate = function(d, i) {
      var x = d3.event.layerX;      
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
      opec.filterLayersByDate(self.selectedDate);
      // console.log('--->New selected date/time = ' + self.selectedDate);  // Debugging
   };
   
   //--------------------------------------------------------------------------

   // Set up the SVG chart area within the specified div; handle mouse zooming with a callback.
   this.zoom = d3.behavior.zoom().x(this.xScale).on('zoom', function() { self.redraw(); });
   this.chart = d3.select('div#' + this.id)
      .append('svg')
      .attr('class', 'timeline')
      .on('click', self.clickDate )
      .call(self.zoom);
      
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

   // Initialise a vertical line through all timelines for today's date
   this.nowLine = this.main.append('svg:line').attr('class', 'nowLine');

   // Set up callback functions to handle dragging of a selected date-time marker
   this.draggedDate = this.selectedDate;
   
   //--------------------------------------------------------------------------
   
   /**
    * Private method/function which handles the drag event of the selected date marker
    */
   this.dragDate = function() {
      var x = self.xScale(self.draggedDate) + d3.event.dx;
      // Prevent dragging the selector off-scale
      x = (x > self.xScale.range()[0] && x < self.xScale.range()[1]) ? x : (x - d3.event.dx);
      // Now update the date based on the new value of x
      self.draggedDate = self.xScale.invert(x);
      // Move the graphical marker
      self.selectedDateLine.attr('x', function(d) { return d3.round(self.xScale(self.draggedDate) - 1.5); });
   };
   this.dragDateEnd = function() {
      self.selectedDate = self.draggedDate;
      // **Update the OPEC map**
      // Change the selected date in the datepicker control
      $('#viewDate').datepicker('setDate', self.selectedDate);
      // Filter the layer data to the selected date
      opec.filterLayersByDate(self.selectedDate);
      // console.log('--->New selected date/time = ' + self.selectedDate);  // Debugging
   };

   // Initialise the selected date-time marker and handle dragging via a callback
   this.selectedDateLine = this.main.append('svg:rect').attr('cursor', 'e-resize').attr('class', 'selectedDateLine')
      .call(
         d3.behavior.drag().origin(Object)
         .on('drag', self.dragDate)
         .on('dragend', self.dragDateEnd)    
   );

   // X-axis intialisation
   this.xAxis = d3.svg.axis().scale(self.xScale).orient('bottom').tickSize(6, 0, 0);
   this.main.append('svg:g').attr('transform', 'translate(0,' + d3.round(this.height + 0.5) + ')').attr('class', 'axis');

   // Initialise the time bar label area to the left of the timeline
   this.labelArea = this.main.append('svg:g');
   
   $('#' + this.id + ' button').button({ icons: { primary: 'ui-icon-triangle-1-s'} })
      .click(function() {
         self.hide(); 
      });

   // Draw the graphical elements
   self.redraw();

   // Handle browser window resize event to dynamically scale the timeline chart along the x-axis
   $(window).resize(function() {
      // Change the widget width settings dynamically if the DIV is visible
      if(self.visible){ self.reWidth(); self.redraw(); }
   });
};

// Handle browser window resize event to dynamically scale the timeline chart along the x-axis
opec.TimeLine.prototype.redraw = function() {
   
   var self = this,  // Useful for when the scope/meaning of "this" changes
      timeLayers = self.timebars.filter(function(element, index, array) { return element.type == 'layer'; });

   // Recalculate the x and y scales before redraw
   this.xScale.range([0, this.width]);
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
   var scaling = (this.xScale.domain()[1] - this.xScale.domain()[0]) / (this.width * 4e7);
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
   
   // Draw the separator lines between time bars
   this.sepLines = this.separatorArea.selectAll('line').data(this.timebars);
   // New separator lines arriving
   this.sepLines.enter().insert('svg:line')
      .attr('x1', 0)
      .attr('y1', function(d, i) { return d3.round(self.yScale(i) + 0.5); })
      .attr('y2', function(d, i) { return d3.round(self.yScale(i) + 0.5); })
      .attr('class', 'separatorLine');
   // Separator line removal
   var ex = this.sepLines.exit();
   ex.remove();
   // Re-scale the width of ALL the separator lines
   this.sepLines.attr('x2', this.width);
   
   //--------------------------------------------------------------------------

   // Draw the time bars
   this.bars = this.barArea.selectAll('rect').data(this.timebars);
   this.bars
     .enter().insert('svg:rect')
      //.attr('fill', 'white')
      .attr('y', function(d, i) { return d3.round(self.yScale(i) + self.barMargin + 0.5); })
     .transition().duration(500)
      .attr('height', d3.round(self.barHeight + 0.5))
      .attr('stroke', function(d, i) { return self.colours(i); })
      .attr('class', 'timeRange');
   // Time bar removal
   ex = this.bars.exit();
   ex.remove();
   // Re-scale the x values and widths of ALL the time bars
   this.bars
      .attr('x', function(d) { var x = d3.round(self.xScale(new Date(d.startDate)) + 0.5); return x; })
      .attr('width', function(d) { return d3.round(self.xScale(new Date(d.endDate)) - self.xScale(new Date(d.startDate))); });
      
   //--------------------------------------------------------------------------
   
   // Position the date time detail lines (if available) for each time bar
   this.dateDetails = this.dateDetailArea.selectAll('g').data(this.timeLayers);
   this.dateDetails.enter().insert('svg:g')
      .each(function(d1, i1) {
         d3.select(this).selectAll('g').data(d1.dateTimes)  // <-- second level data-join
           .enter().append('svg:line')
            .attr('stroke', function() { return self.colours(i1); })
            .attr('y1', function() { return d3.round(self.yScale(i1) + self.barMargin + 1.5); })
            .attr('y2', function() { return d3.round(self.yScale(i1) + self.laneHeight - self.barMargin + 0.5); })
            .attr('class', 'detailLine');
   });
   
   //--------------------------------------------------------------------------
   
   // Date detail removal at time bar level
   ex = this.dateDetails.exit();
   ex.remove();
   
   // Re-scale the x values for all the detail lines for each time bar
   this.main.selectAll('.detailLine')
      .attr('x1', function(d) { return d3.round(self.xScale(new Date(d)) + 0.5); })
      .attr('x2', function(d) { return d3.round(self.xScale(new Date(d)) + 0.5); });

   // Draw the current date-time line
   this.nowLine
      .attr('x1', d3.round(self.xScale(self.now) + 0.5)).attr('y1', 0)
      .attr('x2', d3.round(self.xScale(self.now) + 0.5)).attr('y2', self.height);

   // Draw the selected date-time line
   this.selectedDateLine
      .attr('x', function(d) { return d3.round(self.xScale(self.selectedDate) - 1.5); }).attr('y', 2)
      .attr('width', 4).attr('height', self.height - 2);
   
   // Draw the time bar labels
   this.labels = this.labelArea.selectAll('text').data(this.timebars);
   // New labels arriving
   this.labels.enter().insert('svg:text')
      .text(function(d) { return d.label; })
      .attr('x', 1.5)
      .attr('y', function(d, i) { return d3.round(self.yScale(i + 0.5)); })
      .attr('dy', '0.7ex')
      .attr('text-anchor', 'end').attr('class', 'laneText');
   // Label removal
   ex = this.labels.exit();
   ex.remove();  
      
   //-------------------------------------------------------------------------- 
};

// Re-calculate the dynamic widget height
opec.TimeLine.prototype.reHeight = function() {
   this.height = this.laneHeight*(this.timebars.length);
   // If no timebars, we'll need a default height, say 25 pixels
   if (this.height === 0){ this.height = 25; }
   this.chartHeight = this.height + this.margin.top + this.margin.bottom + 20; // +20 pixels to accomodate the x-axis labels
};

// Re-calculate the dynamic widget width
opec.TimeLine.prototype.reWidth = function() {
   this.chartWidth = $('div#' + this.id).width();
   this.width = this.chartWidth - this.margin.right - this.margin.left;
};

// Reset the timeline to its original data extents
opec.TimeLine.prototype.reset = function() {
   this.zoom.translate([0, 0]).scale(1);
   this.reHeight();
   this.reWidth();
   this.redraw();
};

// Zoom function to a new date range
opec.TimeLine.prototype.zoomDate = function(startDate, endDate){
   var minDate = new Date(startDate);
   var maxDate = new Date(endDate);
   this.minDate = ((minDate instanceof Date) ? minDate : this.minDate);
   this.maxDate = ((minDate instanceof Date) ? maxDate : this.maxDate);
   this.xScale.domain([this.minDate, this.maxDate]);
   this.redraw();
};

// Show the timebar
opec.TimeLine.prototype.hide = function() {
   this.chart.transition().duration(800).attr('height', 0);
   this.main.transition().duration(800).attr('height', 0);
   $('div#' + this.id).slideUp(1000);
   this.visible = false;
};

// Hide the timebar
opec.TimeLine.prototype.show = function() {
   this.chart.transition().duration(1000).attr('height', this.chartHeight);
   this.main.transition().duration(1000).attr('height', this.height);
   $('div#' + this.id).slideDown(800);
   this.visible = true;
};

// Add a new time bar to the chart in JSON timeBar notation
opec.TimeLine.prototype.addTimeBarJSON = function(timeBar) {
   this.timebars.push(timeBar);
   this.reHeight();
   this.redraw();
};

// Add a new time bar using detailed parameters
opec.TimeLine.prototype.addTimeBar = function(name, label, startDate, endDate, dateTimes) {
   var newTimebar = {};
   newTimebar.name = name;
   newTimebar.label = label;
   newTimebar.startDate = startDate;
   newTimebar.endDate = endDate;
   newTimebar.dateTimes = dateTimes;
   newTimebar.type = 'layer';  
   this.timebars.push(newTimebar);
   this.reHeight();
   this.redraw();
};

opec.TimeLine.prototype.addRangeBar = function(name, callback) {
   var newTimebar = {};
   newTimebar.name = name;
   newTimebar.callback = callback;
   newTimebar.type = 'range';  
   this.timebars.push(newTimebar);
   this.reHeight();
   this.redraw();  
};

// Remove a time bar by name (if found)
opec.TimeLine.prototype.removeTimeBarByName = function(name) {
   var self = this;
   var match = false;
   for (var i = 0; i < self.timebars.length; i++){
      if (self.timebars[i].name == name) {
         self.removeTimeBar(i);
         break;
      }
   }
};

// Remove a time bar by index
opec.TimeLine.prototype.removeTimeBar = function(index) {
   this.timebars.splice(index, 1);
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
opec.TimeLine.prototype.setDate = function(date) {
   var self = this;  // Useful for when the scope/meaning of "this" changes
   var selectedDate = self.draggedDate = new Date(date);
   this.selectedDate = ((selectedDate instanceof Date) ? selectedDate : this.selectedDate);
   // Move the selected date-time line
   this.selectedDateLine.transition().duration(1000).attr('x', function(d) { return d3.round(self.xScale(self.selectedDate) - 1.5); });
};

// Get the currently selected date
opec.TimeLine.prototype.getDate = function() {
   var selectedDate = new Date(this.selectedDate);
   return ((selectedDate instanceof Date) ? selectedDate : null);
};