/**----------------------------------*\
 * This script visualises a depth bar 
 * so that the user can choose their 
 * desired depth
 * 
\ * -------------------------------- */ 

gisportal.depthBar = {};

gisportal.depthBar.initDOM=function(){

    if (gisportal.config.showDepthBar){
        console.log('DepthBar requested so initialising one here:');
        
    }

    else {
        console.log('No depthBar requested so skipping initialisation');
    }

};

// TODO handle positive depths via config
// TODO handle multiple layers with different depth spacing: https://rsg.pml.ac.uk/thredds/wms/PML-M-AGGSLOW?service=WMS&version=1.3.0&request=GetCapabilities
// TODO - Point reading update with depth from bar

/**
 * The DepthBar is a visualisation chart to visualise the depths of appropriate layer.
 * It is a singleton and can only be instantiated once.
 *
 * @constructor DepthBar
 *
 * @param {string}   id       The DOM element id in which the depthbar will be created.
 * @param {Object}   options  DepthBar options in JSON format
 */
gisportal.DepthBar = function(id, options) {
    // Ensure there can only ever be one DepthBar
    if (gisportal.DepthBar._instance) {
       throw new Error('DepthBar can only be instantiated once!');
    }
 
    // Store the DepthBar instance
    gisportal.DepthBar._instance = this;
    // Use "self" to refer to the DepthBar instance for initialising stuff
    var self = this;
 
    // Load and setup the options
    var defaults = {
       comment: "Sample depthBar data",
       minDepth:0.0,
       maxDepth:-50.0,
       chartMargins: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
       },
       barHeight: 5,
       barMargin: 4,
       depthbars: []
    };
 
   this.options = $.extend({}, defaults, options);

    // Initialise the fixed DepthBar widget properties from the JSON options file
   this.id = id;
   this.visible = true;
   this.d3Details = {
    xScale: '',
    circle: ''
   };

   // To lazy to go and rename everything "this.options.xxx"
   this.depthbars = this.options.depthbars;

   this.firstLoadComplete = false;
   
   var tooltip = null;
    // Setup next previous buttons
    $('.js-next-prev-depth').click(function() {
        var steps = $(this).data('steps');
        var newDepth = self.getNextPreviousDepth(steps);
        console.log('NewDepth: ',newDepth);
        if (newDepth || newDepth === 0) {
            self.setDepth(newDepth);
            if (tooltip) {
                tooltip.content(buildNextPrevTooltip(steps));
            }
        }
    });

    $('.js-next-prev-depth').tooltipster({
        contentCloning: true,
        contentAsHTML: true,
        content: '',
        position: "top",
        delay: 0,
        trigger: 'custom',
        triggerOpen: {
           mouseenter: true
        },
        triggerClose: {
           mouseleave: true
        },
        updateAnimation: null,
        functionBefore: function(instance, helper) {
           var steps = $(helper.origin).data('steps');
           tooltip = instance;
           instance.content(buildNextPrevTooltip(steps));
        }
     });
     /**
     * Builds the tooltip which is the hover-over for the arrows. 
     * This will let the user know what depth they are about to select.
     *
     * @param {number}   increment  The number of steps to take when looking for the next available depth
     * @return {string}  html string that is used to construct the tooltip based on gisportal templates
     */
     function buildNextPrevTooltip (increment) {
        var content = [];
        var newDepth = self.getNextPreviousDepth(increment);
    
        for (var i = 0; i < self.depthbars.length; i++) {
        //    var label = self.depthbars[i].label;
           var depths = self.depthbars[i].elevationList;
           var depthIndex = self.findLayerDepthIndex(i, newDepth);
           if (depthIndex != -1) {
              var depth = depths[depthIndex];
              content.push({
                 label: 'Depth: ',
                 date: depth
              });
           }
        }
        if (content.length === 0) {
           return 'No data';
        }
        return gisportal.templates['tooltip-next-previous'](content);
     }

 };
/**
 * Add a new depthBar using the detailed parameters
 * @param {str} name Name of the layer
 * @param {str} id ID of the layer 
 * @param {str} label Name of the layer
 * @param {Array} elevationList Array of available depths for the layer 
 */
 gisportal.DepthBar.prototype.addDepthBar = function(name, id, label, elevationList) {
    document.getElementsByClassName('depth-container')[0].style.display='block';

    numericElevationList = elevationList.map(Number);
    
    var newDepthBar = {};
    newDepthBar.name = name;
    newDepthBar.id = id;
    newDepthBar.label = label;
    newDepthBar.elevationList = numericElevationList;
    newDepthBar.hidden = false;
    newDepthBar.minDepth = Math.max.apply(null,numericElevationList); // TODO handle positive depths via config
    newDepthBar.maxDepth = Math.min.apply(null,numericElevationList); // TODO handle positive depths via config
    newDepthBar.numberOfChoices = numericElevationList.length;

    this.depthbars.push(newDepthBar);
    this.updateMinMaxDepth(newDepthBar.minDepth,newDepthBar.maxDepth);
    this.updateSelectedDepth(id);
    this.updateAvailableDepths(newDepthBar.elevationList); // TODO - this currently combines the values but not the UI

    var depthValues = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000];
    var layerValues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 80, 100, 120, 160, 200, 240, 280, 340, 420, 500, 620, 850, 1250, 1750, 2000];
    // var layerValues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 80, 100, 120, 160, 200, 240, 280, 340, 420, 500, 620, 850, 1250, 1750, 2000];
    var nextValues = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 150, 200, 500, 1000, 2000];
    // var nextValues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 80, 100, 120, 160, 200, 240, 280, 340, 420, 500, 620, 850, 1250, 1750, 2000];

    var svgWidth = 800;
    var svgHeight = 150;
    this.d3Details.svgHeight = svgHeight;

    var svg = d3.select("#depthSVG")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

    var xScale = d3.scale.linear()
    .domain([0, 2000])
    .range([50, svgWidth - 50]);
    this.d3Details.xScale = xScale;

    // Define the axis
    var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .tickValues(depthValues)
    .tickFormat(d3.format(".0f"));

    // Append the axis to the SVG
    svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (svgHeight / 2) + ")")
    .call(xAxis);

    // Define the upper axis for layer values
    // var xAxisUpper = d3.svg.axis()
    // .scale(xScale)
    // .orient("top")
    // .tickValues(layerValues)
    // .tickFormat(d3.format(".0f"));

    // // Append the upper axis to the SVG
    // svg.append("g")
    // .attr("class", "axis")
    // .attr("transform", "translate(0," + (svgHeight / 2 - 40) + ")") // Adjust the position above the main axis
    // .call(xAxisUpper);

    // Initial position of the draggable circle
    var initialDepth = 1000; // You can set this to any value within the depthValues range

    // Create the draggable circle and store the initial depth value
    var circle = svg.append("circle")
        .attr("class", "draggable")
        .attr("width", 10)
        .attr("height", 28)
        .attr("cx", xScale(initialDepth))
        .attr("cy", svgHeight / 2 - 9)
        .attr("r", 10);
    this.d3Details.circle = circle;

    // Create drag behavior
    var drag = d3.behavior.drag()
    .on("dragstart", function(d) {
        // No need to raise the element in this version
        d3.select(this).attr("stroke", "black");
    })
    .on("drag", function(d) {
        var newX = Math.max(50, Math.min(svgWidth - 50, d3.event.x));
        var newDepth = xScale.invert(newX);
        // d3.select(this)
        //     .attr("cx", xScale(newDepth))
        //     .attr("cy", svgHeight / 2);
        // d3.select(this).attr("data-depth", newDepth.toFixed(2)); // Store the new depth value
        circle
            .attr("cx", xScale(newDepth))
            .attr("cy", svgHeight / 2 - 9);
            circle.attr("data-depth", newDepth.toFixed(2)); // Store the new depth value
            
        })
        .on("dragend", function(d) {
            var newDepth = circle.attr("data-depth");
            // var newDepth = d3.select(this).attr("data-depth");
            console.log("New Depth Value (Dragged):", newDepth); // Log the new depth value
            $('.js-current-depth').val(newDepth);
            gisportal.depthBar.visualiseNewDepth();
            d3.select(this).attr("stroke", null);
        });
        
        circle.call(drag);
        
    // @TODO - Update the size of the draggable circle
    // @TODO - Update the location of the circle 
    
    // Add independent ticks for layer values
    var tickGroup = svg.append("g")
    .attr("class", "layer-ticks")
    .attr("transform", "translate(0," + (svgHeight / 2 - 12) + ")"); // Position above the main axis

    tickGroup.selectAll("line")
    .data(layerValues)
    .enter()
    .append("line")
    .attr("x1", function(d) { return xScale(d); })
    .attr("y1", 0)
    .attr("x2", function(d) { return xScale(d); })
    .attr("y2", 10)
    .attr("stroke", "black");

    // Add independent ticks for layer values
    var tickGroup1 = svg.append("g")
    .attr("class", "layer-ticks")
    .attr("transform", "translate(0," + (svgHeight / 2 - 24) + ")"); // Position above the main axis

    tickGroup1.selectAll("line")
    .data(nextValues)
    .enter()
    .append("line")
    .attr("x1", function(d) { return xScale(d); })
    .attr("y1", 0)
    .attr("x2", function(d) { return xScale(d); })
    .attr("y2", 10)
    .attr("stroke", "black");

    // tickGroup.selectAll("text")
    // .data(layerValues)
    // .enter()
    // .append("text")
    // .attr("x", function(d) { return xScale(d); })
    // .attr("y", -15)
    // .attr("text-anchor", "middle")
    // .text(function(d) { return d; });
    // svg.append("circle")
    //     .attr("class", "draggable")
    //     .attr("cx", xScale(initialDepth))
    //     .attr("cy", svgHeight / 2)
    //     .attr("r", 10)
    //     .call(drag);  

    // Add click event to the SVG to move the circle to the clicked position
    svg.on("click", function() {
        var coordinates = d3.mouse(this);
        var newX = Math.max(50, Math.min(svgWidth - 50, coordinates[0]));
        var newDepth = xScale.invert(newX);
        circle.transition()
            .duration(500) // Duration of the animation in milliseconds
            .attr("cx", xScale(newDepth))
            .attr("cy", svgHeight / 2 - 9);
        circle.attr("data-depth", newDepth.toFixed(2)); // Store the new depth value
        console.log("New Depth Value (Clicked):", newDepth.toFixed(2)); // Log the new depth value
        $('.js-current-depth').val(newDepth);
        gisportal.depthBar.visualiseNewDepth();
    });

    // Hide the circle underneath the depth bar
    document.getElementsByClassName('draggable')[0].style.display='none';

    circle.attr("width", 10);

    if (!this.firstLoadComplete){
        // Now listen for button changes in the depthBar
        $('.js-current-depth').change(gisportal.depthBar.visualiseNewDepth);

        // @TODO Update the circle location in the depthBar


        this.firstLoadComplete = true;
    }

};

 /**
 * Calculates and updates the minDepth and maxdepth for the depthbar object
 * @param {number} newMinDepth The minimum depth of the incoming layer
 * @param {number} newMaxDepth The maximum depth of the incoming layer 
 */
gisportal.DepthBar.prototype.updateMinMaxDepth = function(newMinDepth, newMaxDepth) {
    if (!this.minDepth){
        this.minDepth = newMinDepth;
    }
    else if (newMinDepth < this.minDepth){
        this.minDepth = newMinDepth;
    }
    
    if (!this.maxDepth){
        this.maxDepth = newMaxDepth;
    }
    else if (newMaxDepth > this.maxDepth){
        this.maxDepth = newMaxDepth;
    }
    $('.js-min-depth').val(this.minDepth);
    $('.js-max-depth').val(this.maxDepth);
    // TODO - function here to update visualisation
};
 /**
 * Generates a list of depths that is used to scroll through
 * @param {array} elevationList The minimum depth of the incoming layer
 */
gisportal.DepthBar.prototype.updateAvailableDepths = function(newElevationList) {
    if (!this.availableDepths){
        this.availableDepths = newElevationList;
    }
    else {
        // Merge the newElevationList with the existing availableDates
        var combinedArray = [];
        var mergedArray = this.availableDepths.concat(newElevationList);
        var sortedArray = mergedArray.sort(function(a,b){
            return a - b;
        });
        for (var i = 0; i < sortedArray.length; i++){
            if (!combinedArray.includes(sortedArray[i])){
                combinedArray.push(sortedArray[i]);
            }
        }
        var sortedCombinedArray = combinedArray.sort(function(a,b){
            return a - b;
        });
        this.availableDepths = sortedCombinedArray;
    }
};

 /**
 * Updates the selectedDepth for Calculates and updates the minDepth and maxdepth for the depthbar object
 * @param {number} newMinDepth The minimum depth of the incoming layer
 * @param {number} newMaxDepth The maximum depth of the incoming layer 
 */
gisportal.DepthBar.prototype.updateSelectedDepth = function(layerId) {
    if (!this.selectedDepth){
        this.selectedDepth = gisportal.layers[layerId].elevationDefault;
        console.log('No selectedDepth set so setting one now: ',layerId, this.selectedDepth);
        this.setDepth(this.selectedDepth);
    }
};

 /**
 * Remove the depthBar from view
 */
 gisportal.DepthBar.prototype.removeDepthBarById = function(layer_id) {
    // Need to remove the appropriate depthBar from the vis
    for (var i = 0; i < this.depthbars.length; i++ ){
        if (layer_id == this.depthbars[i].id){
            this.depthbars.splice(i,1);
        }
    }

    // If there are still depthBars then keep the Panel visible
    if (this.depthbars.length === 0){
        document.getElementsByClassName('depth-container')[0].style.display='none';
    }
};

gisportal.DepthBar.prototype.getNextPreviousDepth = function(increment){
    increment = increment || 0;
    var newDepth = null;
    var depths = null;
    var layerIntervals = [];

    // Calculate the average interval for each layer on the timebar
   for (var i = 0; i < this.depthbars.length; i++) {
    var numberOfChoices = this.depthbars[i].numberOfChoices;
    var minDepth = this.depthbars[i].minDepth;
    var maxDepth = this.depthbars[i].maxDepth;
    var interval = (maxDepth - minDepth) / numberOfChoices;
    layerIntervals.push({
       layer: i,
       interval: interval
    });
  }

    // Sort the layers by their intervals
    layerIntervals.sort(function(a, b) {
        return a.interval - b.interval;
     });

     // Find the best layer to use
    for (i = 0; i < layerIntervals.length; i++) {
        var layerIndex = layerIntervals[i].layer;
        // Sort a copy of the layer's depths
        depths = this.depthbars[layerIndex].elevationList; // TODO - Need to sort based on value

        // Find the depths index for the selected depth
        var depthIndex = this.findLayerDepthIndex(layerIndex, parseFloat(this.selectedDepth), depths);

        if (depthIndex != -1 &&
            depthIndex + increment >= 0 && depthIndex + increment < depths.length &&
            depths[depthIndex + increment] <= this.depthbars[layerIndex].minDepth &&
            depths[depthIndex + increment] >= this.depthbars[layerIndex].maxDepth) {
        // If a depth index was found, and incrementing it doesn't go out of bounds of depths,
        // and it doesn't go past the saved minDepth or maxDepth for the layer (which can be different to the ends of depths)
        var tempNewDepth = depths[depthIndex + increment];
        if (i > 0) {
            // If this isn't the most regular layer
            // Check if incrementing this layer will overlap with a more regular layer, and if so,
            // then pick the start or end depth of that layer
            for (var j = i - 1; j >= 0; j--) {
                var jLayerIndex = layerIntervals[j].layer;
                var jStartDepth = this.depthbars[jLayerIndex].minDepth;
                var jEndDepth = this.depthbars[jLayerIndex].maxDepth;

                if (jStartDepth <= tempNewDepth && tempNewDepth <= jEndDepth) {
                    if (increment < 0) {
                    if (!newDepth || jEndDepth > newDepth) {
                        newDepth = jEndDepth;
                    }
                    } else {
                    if (!newDepth || jEndDepth < newDepth) {
                        newDepth = jStartDepth;
                    }
                    }
                }
            }
            if (!newDepth) {
                newDepth = tempNewDepth;
            }
            break;
        } else {
            newDepth = tempNewDepth;
            break;
        }
        }
    }
    return newDepth;

};

// Find the index for a depth on a depthbar layer
/**
 * Fine the index for a depth on a depthbar layer
 * @param  {number} layer        The index of the layer on the depthbar
 * @param  {depth}   selectedDepth The depth to find
 * @param  {array}  depths    (optional) Depth to search in
 * @return {number}              The index for the provided depth
 */
gisportal.DepthBar.prototype.findLayerDepthIndex = function(layer, selectedDepth, depths) {
    var layerDepthIndex = -1;
    depths = depths || this.depthbars[layer].elevationList;
    var minDepth = this.depthbars[layer].minDepth;
    var maxDepth = this.depthbars[layer].maxDepth;
    if (minDepth >= selectedDepth && selectedDepth >= maxDepth) { //TODO - Handle Positive Depths
       for (var i = 0; i < depths.length; i++) {
          var depth = depths[i];
          if (depth >= selectedDepth) {
             layerDepthIndex = i;
          }
       }
    }
    return layerDepthIndex;
 };

 gisportal.DepthBar.prototype.setDepth = function(desiredDepth){
    $('.js-current-depth').val(desiredDepth);
    gisportal.depthBar.visualiseNewDepth();
    this.selectedDepth=desiredDepth;
 };


gisportal.depthBar.visualiseNewDepth = function(){
    var currentMapLayers = gisportal.selectedLayers;
    var elevationToDisplay = $('.js-current-depth').val();
    console.log('Detected a change here!:', elevationToDisplay);
    // TODO Need to update this so that it finds the closest value
    for (var i = 0; i < currentMapLayers.length; i++){
        if (gisportal.layers[currentMapLayers[i]].elevation){
            gisportal.layers[currentMapLayers[i]].selectedElevation = elevationToDisplay;
            
            // @TODO Hacking this here temporarily - We need the scale to be negative
            if (elevationToDisplay[0] != '-'){
                elevationToDisplay = '-'.concat(elevationToDisplay);
            }

            var numberElevationCache = gisportal.layers[currentMapLayers[i]].numberElevationCache;
            var numberElevationToDisplay = Number(elevationToDisplay);
            console.log('We are looking for: ', numberElevationToDisplay);

            // @TODO Need to handle this differently if the values are positive 
            // This currently sorted negative numbers from lowest e.g. 0 up to lowest -2000
            var sortedElevationCache = numberElevationCache.sort(function(a,b){
                return b - a;
            });


            for (var j = 0; j < sortedElevationCache.length; j++){
                if ( j + 1 > sortedElevationCache.length ) {
                    console.log('Breaking out of loop');
                    break;
                }
                if (sortedElevationCache[j] == numberElevationToDisplay ){
                    // Easy peasy - just assign the elevation out and be done with it
                    console.log('Easiest result now assigning and breaking loop');
                    availableElevationToDisplay = sortedElevationCache[j];
                    break;
                }
                else if (sortedElevationCache[j] > numberElevationToDisplay && numberElevationToDisplay > sortedElevationCache[j + 1]) {
                    console.log('Smaller than ',sortedElevationCache[j]);
                    console.log('Greater than ',sortedElevationCache[j + 1]);
                    availableElevationToDisplay = String(sortedElevationCache[j]);
                    console.log('Selecting: ',availableElevationToDisplay);
                    break;
                }
                else{
                    console.log('Number is not between these values:', sortedElevationCache[j], sortedElevationCache[j+1]);
                }
            }
            
            var params = {
                ELEVATION: availableElevationToDisplay
             };
             gisportal.layers[currentMapLayers[i]].mergeNewParams(params);
        }
    }
};

