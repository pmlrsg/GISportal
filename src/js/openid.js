/**
 * Openid
 * @namespace 
 */
gisportal.openid = {};

gisportal.openid.setup = function(containerID) {
   gisportal.openid.loginBox = containerID;
   gisportal.openid.$loginBox = $('#' + containerID);
   gisportal.openid.darkCoverID = 'darkCover';
  
   gisportal.openid.logoutLocation = '/service/logout'; 
   gisportal.openid.popupWindow = null;
   
   gisportal.openid.loginForm = 'gisportal-openid-lin'; // Set id for login form
   gisportal.openid.$loginForm = $('#' + gisportal.openid.loginForm);

   gisportal.openid.saveButton = 'gisportal-openid-getlink';
   gisportal.openid.$saveButton = $('#' + gisportal.openid.saveButton);
 
   gisportal.openid.logoutButton = 'gisportal-openid-logout';
   gisportal.openid.$logoutButton = $('#' + gisportal.openid.logoutButton);

   gisportal.openid.content = 'gisportal-openid-content';
   gisportal.openid.$content = $('#' + gisportal.openid.content);

   gisportal.openid.onOpenHandler = function() {
      gisportal.openid.darkscreen(gisportal.openid.darkCoverID);
   };
   
   gisportal.openid.onCloseHandler = function() {
      if (gisportal.openid.loggedIn === true)  {
         gisportal.openid.hideLogin();
      }
      else  {
         //console.log('User did not log in');
      }
   };
   
   gisportal.openid.darkCoverStyle = [
      'position: absolute;',
      'top: 0px;',
      'left: 0px;',
      'padding-right: 0px;',
      'padding-bottom: 0px;',
      'background-color:#000000;',
      'opacity: 0.5;',
      '-moz-opacity: 0.5;',
      'filter: alpha(opacity = 0.5);',
      'z-index: 10000;',
      'width: 100%;',
      'height: 100%;'
   ].join(' ');
   gisportal.openid.interval = null;
   
   
   
   //gisportal.openid.$loginBox.append(gisportal.templates.loginBox(data)); 
 
   $.get('templates/share-logged-out.mst', function(template)  {
      var data = {
         id: gisportal.openid.loginForm,
         providers: gisportal.openid.providers
      };
      var rendered = Mustache.render(template, data);
      $('.js-logged-out').html(rendered);
   });

   $('.js-logged-out').on('click', '.js-login-button', function() {
      gisportal.openid.openPopup($(this).attr('data-url'));  
   });
   

   gisportal.openid.$saveButton.click(function() {
      gisportal.openid.getLink();
   });

   gisportal.openid.$logoutButton.click(function()  {
      gisportal.openid.logout();
   });
};

// getLink to state
gisportal.openid.getLink = function()  {
   // Move this back to setup when openid is being used again 
   $('.js-close-share').on('click', function()  {
      $('.share').toggleClass('hidden', true);
   });

   $.ajax({
      method: 'POST',
      url: gisportal.stateLocation,
      data: {
         state: JSON.stringify(gisportal.getState())
      },
      dataType: 'json',
      success: function( data ) { 
         if (data['output']['url']) {
            $('.js-shareurl').val(location.origin + location.pathname + '?state=' + data['output']['url']);
         }
      },
      error: function( request, errorType, exception ) {
         if (exception === 'UNAUTHORIZED')
            gisportal.openid.showLogin();
      }
   });
};

gisportal.openid.showShare = function()  {
   $('.share').removeClass('hidden');
   if (this.loggedIn)  {
      this.getLink();
   }
};

gisportal.openid.logout = function() { 

   $.ajax({
      url: gisportal.openid.logoutLocation,
      success: function( data ) {
         gisportal.openid.loggedIn = false;
         gisportal.openid.showLogin();
      }
   });
};

gisportal.openid.login = function()  {
   this.getLink();
};

gisportal.openid.openPopup = function(urlToOpen) {
   var windowWidth = '870px';
   var windowHeight = '600px';
      
   var dataObject = gisportal.utils.openPopup(windowWidth, windowHeight, urlToOpen, gisportal.openid.onOpenHandler, gisportal.openid.waitForPopupClose);  
    gisportal.openid.popupWindow = dataObject.popupWindow;
   gisportal.openid.interval = dataObject.interval;
};

gisportal.openid.showLogin = function() {
   $('#' + gisportal.openid.loginForm).show();
   gisportal.openid.$content.hide();
   gisportal.logout();
};

gisportal.openid.hideLogin = function() {
   $('#' + gisportal.openid.loginForm).hide();
   gisportal.openid.$content.show();
   gisportal.login();
};

//======== POPUP MANAGEMENT ========//
/* Taken from:
 *    https://code.google.com/p/step2/source/browse/code/java/trunk/example-consumer/src/main/webapp/popuplib.js 
 *    Apache 2.0 License
 */

gisportal.openid.darkscreen = function(darkCover) {
   var darkCoverDiv = $('#' + darkCover);
   if(darkCoverDiv.length === 0) {
      darkCoverDiv = $('<div></div>')
         .attr('style', gisportal.openid.darkCoverStyle)
         .attr('id', darkCover);
      $(document.body).append(darkCoverDiv);
      
   }
   darkCoverDiv.show();
};

// Check to perform at each execution of the timed loop. It also triggers
// the action that follows the closing of the popup
gisportal.openid.waitForPopupClose = function() {
   if (gisportal.openid.isPopupClosed()) {
      gisportal.openid.popupWindow = null;
      var darkCover = $('#' + gisportal.openid.darkCoverID);
      if (darkCover.length !== 0) {
         darkCover.hide();
      }
      if (gisportal.openid.onCloseHandler !== null) {
         gisportal.openid.onCloseHandler();
      }
      if (gisportal.openid.interval !== null) {
         window.clearInterval(gisportal.openid.interval);
         gisportal.openid.interval = null;
      }
      
   }
};

// Tests that the popup window has closed
gisportal.openid.isPopupClosed = function() {
   return (!gisportal.openid.popupWindow || gisportal.openid.popupWindow.closed);
};

//======== ENDOF POPUP MANAGEMENT ========//

gisportal.openid.providers = [
   {name: 'google', title:'login with Google', url:'/service/login/google', imagePath:'img/Red-signin_Long_base_20dp.png', x:'0', y:'0', width:'147px', height:'30px'},
   {name: 'yahoo', title:'login with Yahoo', url:'/service/login/yahoo', imagePath:'img/yahoo_signin_btn.png', x:'0', y:'0', width:'161px', height:'22px'}
];
