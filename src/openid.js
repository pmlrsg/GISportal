/**
 * Openid
 * @namespace 
 */
opec.openid = {};

opec.openid.setup = function(containerID) {
   opec.openid.loginBox = containerID;
   opec.openid.$loginBox = $('#' + containerID);
   
   opec.openid.loginForm = 'opec-openid-form'; // Set id for login form
   opec.openid.$loginForm = $('#' + opec.openid.loginForm);
   
   var data = {
      id: opec.openid.loginForm,
      providers: opec.openid.providers,
      provider: function() {
         return function(text, render) {
            return render(opec.templates.providerBox({
               name: this.name, 
               title: this.title, 
               url: this.url, 
               imagePath: this.imagePath, 
               x: this.x, 
               y: this.y,
               width: this.width,
               height: this.height
            }));
         };
      }
   };
   
   opec.openid.$loginBox.append(opec.templates.loginBox(data)); 
      
   $('#' + opec.openid.loginForm + ' .opec-login-with-google').click(function() {
      var $this = $(this);
      var windowWidth = '500px';
      var windowHeight = '600px';
      
      var data = {
         urlToOpen: '/service/login/' + $this.attr('data-url'),
         width: windowWidth,
         height: windowHeight,         
         coordinates: opec.utils.getCenteredCoords(windowWidth, windowHeight),
         callback: opec.openid.waitForPopupClose()
      };
      opec.utils.openPopup(data); 
      
      alert("hi");   
   });
   
   $('#' + opec.openid.loginForm + ' .opec-login-with-yahoo').click(function() {
      
   });
   
   
};

opec.openid.login = function(urlToOpen) {
};

opec.openid.logout = function() {
   
};

opec.openid.showLogin = function() {
   opec.openid.$loginForm.show();
};

opec.openid.hideLogin = function() {
   opec.openid.$loginForm.hide();
};


//======== POPUP MANAGEMENT ========//
/* Taken from:
 *    https://code.google.com/p/step2/source/browse/code/java/trunk/example-consumer/src/main/webapp/popuplib.js 
 *    Apache 2.0 License
 */

// Check to perform at each execution of the timed loop. It also triggers
// the action that follows the closing of the popup
opec.openid.waitForPopupClose = function() {
   if (isPopupClosed()) {
      popupWindow = null;
      var darkCover = window.document.getElementById(window.popupManager.constants['darkCover']);
      if (darkCover) {
         darkCover.style.visibility = 'hidden';
      }
      if (onCloseHandler !== null) {
         onCloseHandler();
      }
      if ((null !== interval)) {
         window.clearInterval(interval);
         interval = null;
      }
   }
};

// Tests that the popup window has closed
opec.openid.isPopupClosed = function() {
   return (!popupWindow || popupWindow.closed);
   };

//======== ENDOF POPUP MANAGEMENT ========//

opec.openid.providers = [
   {name: 'google', title:'login with Google', url:'/service/login/google', imagePath:'img/Red-signin_Long_base_20dp.png', x:'0', y:'0', width:'147px', height:'30px'},
   {name: 'yahoo', title:'login with Yahoo', url:'/service/login/yahoo', imagePath:'img/yahoo_signin_btn.png', x:'0', y:'0', width:'161px', height:'22px'}
   //{name: 'myOpenID', title:'login with myOpenID', url:'/service/login/myopenid', imagePath:'0', x:'0', y:'0'},
   //{name: 'OpenID', title:'login with OpenID', url:'/service/login', imagePath:'', x:'0', y:'0'}
];
