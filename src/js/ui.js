/*

   ###    ##       ##           #######  ########    ######## ##     ## ####  ######     ##    ## ######## ######## ########   ######     ########  #######      ######    #######  
  ## ##   ##       ##          ##     ## ##             ##    ##     ##  ##  ##    ##    ###   ## ##       ##       ##     ## ##    ##       ##    ##     ##    ##    ##  ##     ## 
 ##   ##  ##       ##          ##     ## ##             ##    ##     ##  ##  ##          ####  ## ##       ##       ##     ## ##             ##    ##     ##    ##        ##     ## 
##     ## ##       ##          ##     ## ######         ##    #########  ##   ######     ## ## ## ######   ######   ##     ##  ######        ##    ##     ##    ##   #### ##     ## 
######### ##       ##          ##     ## ##             ##    ##     ##  ##        ##    ##  #### ##       ##       ##     ##       ##       ##    ##     ##    ##    ##  ##     ## 
##     ## ##       ##          ##     ## ##             ##    ##     ##  ##  ##    ##    ##   ### ##       ##       ##     ## ##    ##       ##    ##     ##    ##    ##  ##     ## 
##     ## ######## ########     #######  ##             ##    ##     ## ####  ######     ##    ## ######## ######## ########   ######        ##     #######      ######    #######  

It's badly written and overly complicated; it really belongs in indicators.js when the indicator.mst template is rendered.

 */

/*------------------------------------*\
   ui.js
   This is an alternative entry point
   that should be used for DOM
   manipulation only.

   jQuery Ready
    - This is *only* for UI elements
    - This should *not* be used for
      GIS Portal functionality.
\*------------------------------------*/

$(document).ready(function()  {
   $('.panel').on('click', '.js-indicator-tab-trigger', function(){
      var layerId = $(this).closest('[data-id]').data('id');
      var tabName = $(this).closest('[data-tab-name]').data('tab-name');
      gisportal.indicatorsPanel.selectTab( layerId, tabName );

      var params = {
         "event" : "tab.select",
         "layerId": layerId,
         "tabName": tabName
      };
      gisportal.events.trigger('tab.select', params);
   });
   $(window).resize(function(e){
      if(e.target == window && collaboration.active && socket && socket.io && socket.io.engine){
         collaboration._emit("window.resized", {id: socket.io.engine.id, mapSize: [this.innerWidth, this.innerHeight]}, force=true);
      }
   });
   $('.panel').on('change', '.js-tab-trigger', changeTab);
   $('.panel').on('change', '.js-icon-trigger', activeIcon);
   $('.panel').on('mousedown', '.js-closable', closeTab);
   $('.js-about-button').on('click', function(){
      window.open(gisportal.config.aboutPage || "/",'_blank');
   });
});



/*------------------------------------*\
    Tabs
\*------------------------------------*/

function changeTab( tabElement )  {
  if( tabElement && tabElement instanceof HTMLElement )
    tabElement = tabElement;
  else
    tabElement = this;

  var e = $(tabElement)[0];

  $.each($('[name="' + e.name + '"]'), function(i,e)  {
    $('[for="' + e.id + '"]').removeClass('active');
  });
  $('[for="' + e.id + '"]').addClass('active');

  gisportal.events.trigger('metadata.close');

}

// http://stackoverflow.com/questions/4957207/how-to-check-uncheck-radio-button-on-click
function closeTab(){
  e = $(this);
  var button = $('#'+$(e).attr('for'));
  if( button.is(':checked') ){
    var uncheck = function(){
      setTimeout(function(){
        button.removeAttr('checked');
        e.removeClass('active');
        var params = {
          "event" : "layerTab.close",
          "layerId": e.attr('for').split('-')[1],
          "tabName": e.data('tab-name')
        };
        gisportal.events.trigger("layerTab.close", params);
      },0);
    };
    var unbind = function(){
      e.unbind('mouseup',up);
    };
    var up = function(){
      uncheck();
      unbind();
    };
    e.bind('mouseup',up);
    gisportal.events.trigger('metadata.close');
  }
}


function activeIcon()  {
   var e = $(this)[0];
   if (e.checked)  {
      $('[for="' + e.id + '"]').addClass('active');
   }
   else  {
      $('[for="' + e.id + '"]').removeClass('active');
   }
}

$(function(){
  // Close alert butto.n
  $('body').on( 'click', '.js-alert-close', function(){
    $(this).closest( '.alert' ).remove();
  });

});