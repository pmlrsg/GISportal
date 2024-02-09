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

        document.getElementsByClassName('depth-container')[0].style.display='block';

    }

    else {
        console.log('No depthBar requested so skipping initialisation');
    }


};