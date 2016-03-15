/**
 *  Code for the loading icon
 *  Can be used anyway buy calling gisportal.loading.increment()
 *  when the code starts loading and gisportal.loading.decrement()
 *  when the code stops loading.
 */

gisportal.loading = {};
gisportal.loading.counter = 0;
gisportal.loading.loadingElement = jQuery('');
gisportal.loading.loadingTimeout = null;


/**
 * Increases the counter of how many things are currently loading
 */
gisportal.loading.increment = function(){
   gisportal.loading.counter++;
   gisportal.loading.updateLoadingIcon();
};

/**
 * Decreases the counter of how many things are currently loading
 */
gisportal.loading.decrement = function(){
   gisportal.loading.counter--;
   gisportal.loading.updateLoadingIcon();
};

/**
 * Either show or hide the loading icon.
 *  A delay is added to show because layers can update in a few milliseconds causing a horrible flash
 */
gisportal.loading.updateLoadingIcon = function(){
   
   if( gisportal.loading.loadingTimeout !== null )
      return ;
   
   gisportal.loading.loadingTimeout = setTimeout(function(){
      gisportal.loading.loadingTimeout = null;
      if( gisportal.loading.counter > 0 ){
         gisportal.loading.loadingElement.show();
      
      }else{
         gisportal.loading.loadingElement.hide();
      }
   }, gisportal.loading.counter ? 300 : 600);
};
