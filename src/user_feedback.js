
window.session_id = (new Date).getTime() + "-" + Math.floor( Math.random() * 1000000 );

$(function(){
   $('body').on('click', '.uv-icon', function(){
       $.ajax({
            method: 'POST',
            url: gisportal.stateLocation,
            data: {
               state: JSON.stringify(gisportal.getState()),
               session_id: window.session_id
            }
         });
   });
});

UserVoice=window.UserVoice||[];

UserVoice.push(['setCustomFields',{  'Session ID': window.session_id }]);

// Set colors
UserVoice.push(['set', {
  accent_color: '#448dd6',
  trigger_color: 'white',
  trigger_background_color: 'rgba(46, 49, 51, 0.6)'
}]);


// Add default trigger to the bottom-right corner of the window:
UserVoice.push(['addTrigger', { mode: 'contact', trigger_position: 'bottom-right' }]);

// Or, use your own custom trigger:
//UserVoice.push(['addTrigger', '#id', { mode: 'contact' }]);

// Autoprompt for Satisfaction and SmartVote (only displayed under certain conditions)
UserVoice.push(['autoprompt', {}]);