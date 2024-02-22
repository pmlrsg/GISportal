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
 * @param {str} name 
 * @param {str} id 
 * @param {str} label 
 * @param {Array} elevationList 
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

    if (!this.firstLoadComplete){
        // Now listen for button changes in the depthBar
        $('.js-current-depth').change(gisportal.depthBar.visualiseNewDepth);
        this.firstLoadComplete = true;
    }

};

 /**
 * Calculate and update the minDepth and maxdepth
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
    for (var i = 0; i < currentMapLayers.length; i++){
        if (gisportal.layers[currentMapLayers[i]].elevation){
            gisportal.layers[currentMapLayers[i]].selectedElevation = elevationToDisplay;
            var params = {
                ELEVATION: elevationToDisplay
             };
             gisportal.layers[currentMapLayers[i]].mergeNewParams(params);
        }
    }
};

// TODO - Point reading update with depth from bar
// TODO - Check that updating the depth works with non depth layers