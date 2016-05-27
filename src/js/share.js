gisportal.share = {};

gisportal.share.initDOM = function(){
   gisportal.events.bind("available-layers-loaded", function() {
      if(gisportal.utils.getURLParameter('state') && !gisportal.utils.getURLParameter('room')){
         $.ajax({
            url: gisportal.middlewarePath + '/settings/get_share?id=' + gisportal.utils.getURLParameter('state'),
            success: function( data ) {
               if (data) {
                  gisportal.stopLoadState = false;
                  gisportal.loadState(JSON.parse(data));
               }
            },
            error: function(err) {
               console.log(err);
            }
         });
      }
    });

   gisportal.share.getLink = function()  {
      $.ajax({
         method: 'POST',
         url: gisportal.middlewarePath + '/settings/create_share',
         data: {
            state: JSON.stringify(gisportal.getState())
         },
         success: function( data ) {
            if (data) {
               $('.js-shareurl').val(location.origin + location.pathname + '?state=' + data);
               $('.js-shareurl').focus(function() { $(this).select(); } ).on('mouseup cut paste', function (e) {e.preventDefault();}).on('keydown', function(){$(this).select();});
            }
         },
         error: function(err) {
            console.log(err);
         }
      });
   };

   gisportal.share.showShare = function()  {
      $('.share').removeClass('hidden');
      $('.js-close-share').on('click', function()  {
         $('.share').toggleClass('hidden', true);
      });
   };
};