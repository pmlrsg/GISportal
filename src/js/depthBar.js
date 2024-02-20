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


// TODO - Remove the depthbar when no depth layers remain

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
       selectedDepth: 0.0,
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
   
 };
/**
 * Add a new depthBar using the detailed parameters
 * @param {str} name 
 * @param {str} id 
 * @param {str} label 
 * @param {Array} elevation_list 
 */
 gisportal.DepthBar.prototype.addDepthBar = function(name, id, label, elevation_list) {
    document.getElementsByClassName('depth-container')[0].style.display='block';
    
    var newDepthBar = {};
    newDepthBar.name = name;
    newDepthBar.id = id;
    newDepthBar.label = label;
    newDepthBar.elevation_list = elevation_list;
    newDepthBar.hidden = false;
    newDepthBar.colour = '';
 
    this.depthbars.push(newDepthBar);
    console.log('Added new DepthBar ',newDepthBar);
    this.updateMinMaxDepth();
 };

 /**
 * Calculate and update the minDepth and maxdepth
 */
gisportal.DepthBar.prototype.updateMinMaxDepth = function() {
    console.log('Going to update the max-mins');
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