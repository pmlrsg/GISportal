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
    newDepthBar.minDepth = Math.min.apply(null,numericElevationList);
    newDepthBar.maxDepth = Math.max.apply(null,numericElevationList);
 
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
        $('.js-current-depth').val(this.selectedDepth);
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