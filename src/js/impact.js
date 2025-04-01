/**------------------------------*\
 Impact Script to help collect
 User information via Brevo
\*------------------------------------*/

gisportal.impactDetails = {};

gisportal.impactDetails.initDOM=function(){
  gisportal.impactDetails.finaliseInitialisation();
  
};

gisportal.impactDetails.finaliseInitialisation=function(){
  
    document.onreadystatechange = function () {
      if (document.readyState == "complete") {
        // Everything has loaded so now we can unhide the splash screen
        $('.js-start-container').toggleClass('hidden', false);
    }
  };

  if (gisportal.impactDetails.getFormCompleted()){
    console.log('Read local storage and the user has already completed form so allowing access');
    $('#brevo-form').toggleClass('hidden',true);
  }
  else {
    $('.js-start-container').toggleClass('hidden', true);
    $('.start-nav').toggleClass('hidden', true);
    gisportal.impactDetails.read_impact_html();
    
  }
  
};

gisportal.impactDetails.intialiseListenerForFormSubmission = function(){
  var targetNode = document.querySelector("#success-message"); // Change this to the actual element that updates
  
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
  sessionStorage.setItem('form-completed',true);
};

gisportal.impactDetails.getFormCompleted = function(){
  return sessionStorage.getItem('form-completed');
};

gisportal.impactDetails.read_impact_html=function(){
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
      $('#project-to-replace').replaceWith('<p>Error finding the HTML File for this specific project side panel - please contact the data owner</p>');
      return;
    }
  });
};

gisportal.impactDetails.reStylePage = function(){
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