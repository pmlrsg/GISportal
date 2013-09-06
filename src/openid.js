/**
 * Openid
 * @namespace 
 */
opec.openid = {};

opec.openid.setup = function(containerID) {
   opec.openid.loginBox = containerID;
   opec.openid.$loginBox = $('#' + containerID);
   opec.openid.darkCoverID = 'darkCover';
   
   opec.openid.popupWindow = null;
   
   opec.openid.loginForm = 'opec-openid-form'; // Set id for login form
   opec.openid.$loginForm = $('#' + opec.openid.loginForm);
   
   opec.openid.onOpenHandler = function() {
      opec.openid.darkscreen(opec.openid.darkCoverID);
   };
   
   opec.openid.onCloseHandler = function() {
      
   };
   
   opec.openid.darkCoverStyle = [
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
   opec.openid.interval = null;
   
   
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
      opec.openid.openPopup($this.attr('data-url'));  
   });
   
   $('#' + opec.openid.loginForm + ' .opec-login-with-yahoo').click(function() {
      var $this = $(this);     
      opec.openid.openPopup($this.attr('data-url'));
   });
   
};

opec.openid.login = function(urlToOpen) {
   
};

opec.openid.logout = function() {
   
};

opec.openid.openPopup = function(urlToOpen) {
   var windowWidth = '870px';
   var windowHeight = '600px';
      
   var dataObject = opec.utils.openPopup(windowWidth, windowHeight, urlToOpen, opec.openid.onOpenHandler, opec.openid.waitForPopupClose);  
    opec.openid.popupWindow = dataObject.popupWindow;
    opec.openid.interval = dataObject.interval;
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

opec.openid.darkscreen = function(darkCover) {
   var darkCoverDiv = $('#' + darkCover);
   if(darkCoverDiv.length === 0) {
      darkCoverDiv = $('<div></div>')
         .attr('style', opec.openid.darkCoverStyle)
         .attr('id', darkCover);
      $(document.body).append(darkCoverDiv);
      
   }
   darkCoverDiv.show();
};

// Check to perform at each execution of the timed loop. It also triggers
// the action that follows the closing of the popup
opec.openid.waitForPopupClose = function() {
   if (opec.openid.isPopupClosed()) {
      opec.openid.popupWindow = null;
      var darkCover = $('#' + opec.openid.darkCoverID);
      if (darkCover.length !== 0) {
         darkCover.hide();
      }
      if (opec.openid.onCloseHandler !== null) {
         opec.openid.onCloseHandler();
      }
      if (opec.openid.interval !== null) {
         window.clearInterval(opec.openid.interval);
         opec.openid.interval = null;
      }
   }
};

// Tests that the popup window has closed
opec.openid.isPopupClosed = function() {
   return (!opec.openid.popupWindow || opec.openid.popupWindow.closed);
};

//======== ENDOF POPUP MANAGEMENT ========//

opec.openid.providers = [
   {name: 'google', title:'login with Google', url:'/service/login/google', imagePath:'img/Red-signin_Long_base_20dp.png', x:'0', y:'0', width:'147px', height:'30px'},
   {name: 'yahoo', title:'login with Yahoo', url:'/service/login/yahoo', imagePath:'img/yahoo_signin_btn.png', x:'0', y:'0', width:'161px', height:'22px'}
   //{name: 'myOpenID', title:'login with myOpenID', url:'/service/login/myopenid', imagePath:'0', x:'0', y:'0'},
   //{name: 'OpenID', title:'login with OpenID', url:'/service/login', imagePath:'', x:'0', y:'0'}
];
