/**------------------------------*\
 Impact Script to help collect
 User information via Brevo
\*------------------------------------*/


gisportal.impactDetails = {};

gisportal.impactDetails.initDOM=function(){
  gisportal.impactDetails.finaliseInitialisation();
  
};



gisportal.impactDetails.finaliseInitialisation=function(){

  
  if (gisportal.impactDetails.getFormCompleted()){
    console.log('Read local storage and the user has already completed form so allowing access');
    $('#brevo-form').toggleClass('hidden',true);
    // gisportal.launchMap();
  }
  else {
    $('.start-nav').toggleClass('hidden', true);
    gisportal.impactDetails.intialiseListenerForFormSubmission();
  }

};

gisportal.impactDetails.intialiseListenerForFormSubmission = function(){
  // We need to try the form with raw HTML as we can't get this to work from within an iframe
  
  var targetNode = document.querySelector("#success-message"); // Change this to the actual element that updates

  var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
          console.log("Form response detected:", mutations[i].target.textContent);
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

