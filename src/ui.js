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
   });
   $('.panel').on('change', '.js-tab-trigger', changeTab);
   $('.panel').on('change', '.js-icon-trigger', activeIcon);
   $('.panel').on('mousedown', '.js-closable', closeTab);
});



/*------------------------------------*\
    Tabs
\*------------------------------------*/

function changeTab( tabElement )  {
  if( tabElement && tabElement instanceof HTMLElement )
    var tabElement = tabElement;
  else
    var tabElement = this;

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
    e.one('mouseout', unbind);
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


