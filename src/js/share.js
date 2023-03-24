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
            }
         });
      }
      else if (gisportal.config.initialState !== undefined && !gisportal.config.initialState.neodaasBoot){
         $.ajax({
            url: gisportal.middlewarePath + '/settings/get_share?id=' + gisportal.config.initialState.stateName,
            success: function( data ) {
               if (data) {
                  gisportal.stopLoadState = false;
                  gisportal.loadState(JSON.parse(data));
               }
            }
         });
      }
      else if (gisportal.config.initialState !== undefined && gisportal.config.initialState.neodaasBoot){
         $.ajax({
            url: gisportal.middlewarePath + '/settings/get_share?id=' + gisportal.config.initialState.stateName,
            success: function( data ) {
               if (data) {
                  var parsedState=JSON.parse(data);
                  var numberOfLayers=parsedState.selectedIndicators.length;
                  var lastDateFromIndicators=[];
                  var lastSecondsFromIndicators=[];

                  // Loop over the layers and find the most recent date that they all share
                  for (i =0; i< numberOfLayers; i++){
                     if (!gisportal.layers[parsedState.selectedIndicators[i]]){ // Capture this potential error seen with water_class_1__Plymouth_Marine_Laboratory
                        continue;
                     }
                     lastDateFromIndicators.push(gisportal.layers[parsedState.selectedIndicators[i]].lastDate);
                     lastDateAsSeconds = new Date(gisportal.layers[parsedState.selectedIndicators[i]].lastDate);
                     lastSecondsFromIndicators.push(lastDateAsSeconds.getTime());
                  }
                  if (gisportal.config.initialState.dateCase=='LatestShared'){
                     var indicatorWithLatestShared = gisportal.share.indexFromArray(lastSecondsFromIndicators,'min');
                     nameLayer=parsedState.selectedIndicators[indicatorWithLatestShared];
                     latestSharedDateFromLayer=gisportal.layers[nameLayer].lastDate;
                     parsedState.map.date=latestSharedDateFromLayer;
                  }
                  if (gisportal.config.initialState.dateCase=='LatestSingleLayer'){
                     var indicatorWithMostRecentDate = gisportal.share.indexFromArray(lastSecondsFromIndicators,'max');
                     nameLayer=parsedState.selectedIndicators[indicatorWithMostRecentDate];
                     lastDateFromLayer=gisportal.layers[nameLayer].lastDate;
                     parsedState.map.date=lastDateFromLayer;
                  }
                  gisportal.stopLoadState = false;
                  gisportal.loadState(parsedState);
               }
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
               $('.js-shareurl').val(location.origin + location.pathname + '?state=' + data).select();
               $('.js-shareurl').focus(function() { $(this).select(); } ).on('mouseup cut paste', function (e) {e.preventDefault();}).on('keydown', function(){$(this).select();});
            }
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

gisportal.share.indexFromArray= function(arr,find) {
   if (arr.length === 0) {
       return -1;
   }

   var max = arr[0];
   var maxIndex = 0;
   
   var min = arr[0];
   var minIndex = 0;

   if (find=='max'){
      for (var i = 1; i < arr.length; i++) {
          if (arr[i] > max) {
              maxIndex = i;
              max = arr[i];
          }
      }
      return maxIndex;
   }
   else if (find=='min'){
      for (var j = 1; j < arr.length; j++) {
         if (arr[j] < min) {
            minIndex = j;
            min = arr[j];
         }
      }   
      return minIndex;
   }


};