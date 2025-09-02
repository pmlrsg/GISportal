/**-----------------------------------*\
 Impact Script to help collect
 User information via Brevo. This script
 spoofs a login for users. Session
 storage handles returning users
\*------------------------------------*/

gisportal.impactDetails = {};

gisportal.impactDetails.initDOM=function(){
  if (gisportal.config.impactDetails){
    gisportal.impactDetails.finaliseInitialisation();
  }
};

gisportal.impactDetails.finaliseInitialisation=function(){
  // If we want to collect user data we need to finalise the setup here
  
  document.onreadystatechange = function () {
    // Once the page has loaded we want to display the splash screen. 
      if (document.readyState == "complete") {
        // Everything has loaded so now we can unhide the splash screen
        $('.js-start-container').toggleClass('hidden', false);
    }
  };

  if (gisportal.impactDetails.getFormCompleted()){
    $('#brevo-form').toggleClass('hidden',true);
  }
  else {
    $('.js-start-container').toggleClass('hidden', true);
    $('.start-nav').toggleClass('hidden', true);
    gisportal.impactDetails.read_impact_html();
  }
};

gisportal.impactDetails.intialiseListenerForFormSubmission = function(){
  // We need to detect a successful form submission to track when the user has provided details.
  // We do this by monitoring to see if the success message is displayed on the form.
  // Once this has been recorded, add some session storage to prevent the form from appearing again. 

  var targetNode = document.querySelector("#success-message");
  
  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      gisportal.impactDetails.handleSuccessfulSubmission();
      }
  });
  if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
  }
};

gisportal.impactDetails.setFormCompleted = function(){
  // Set session storage 
  localStorage.setItem('form-completed',true);
};

gisportal.impactDetails.getFormCompleted = function(){
  // Get session storage 
  return localStorage.getItem('form-completed');
};

gisportal.impactDetails.read_impact_html=function(){
  // Find the Brevo form associated with this portal and display it on the screen. Then finalise page styling. 
  $.ajax({
    url:  '.../../app/settings/read_impact_html/'+gisportal.config.impactDetails.impactName,
    success: function(data){
      $('#impactCollectionFormPlaceholder').replaceWith(data.toString());
      gisportal.impactDetails.intialiseListenerForFormSubmission();
      gisportal.impactDetails.reStylePage();
      
      // Timeout below acts as a backstop in case the splash screen never shows itself
      setTimeout(function(){
        if (document.querySelector('.js-start-container').className.includes('hidden')){
          $('.js-start-container').toggleClass('hidden', false);
        }
      },3000);
    },
    error: function(e){
      console.error('Error with sending off ajax: ',e);
      $.notify("Error finding the HTML File for this specific project side panel - please contact the data owner");
      return;
    }
  });
};

gisportal.impactDetails.reStylePage = function(){
  // Finalise the styling of the page so that it looks pretty
  if (gisportal.config.impactDetails.styleSplashScreen == 'vertical'){
    document.querySelector('.overlay-container').style['max-height'] = '-webkit-fill-available';
  }
  else{
    document.querySelector('.overlay-container').style['max-height'] = '-webkit-fill-available';
    document.querySelector('.overlay-container').style['max-width'] = '900px';
    document.querySelector('.overlay-container').style.display = 'flex';
    document.querySelector('.intro-text').style.width = '50%';
    
  }
  var allInputs = document.querySelectorAll('.input');
  for (var inputIndex = 0; inputIndex < allInputs.length; inputIndex++){
    allInputs[inputIndex].style.color = 'black';
  }
};

gisportal.impactDetails.handleSuccessfulSubmission = function(){
  // User has submitted a form and Brevo has confirmed success. Now we want to save info to session storage and display thanks in the splash screen
  gisportal.impactDetails.setFormCompleted();
  $('.sib-form').toggleClass('hidden',true);
  $('.start-nav').toggleClass('hidden', false);
  
  if (gisportal.config.impactDetails.styleSplashScreen == 'horizontal'){
    // We need to undo our previous styling changes so that the splash screen looks normal again
    document.querySelector('.overlay-container').style.display = 'block';
    document.querySelector('.overlay-container').style['max-width'] = '750px';
    document.querySelector('.overlay-container').style['max-height'] = 'none';
    document.querySelector('.intro-text').style.width = '100%';
  }

  splashText = document.querySelector('.intro-text');
  thankYouParagraph = document.createTextNode(gisportal.config.impactDetails.thankYouMessage);
  splashText.appendChild(thankYouParagraph);
  $.notify(gisportal.config.impactDetails.thankYouMessage);
};