/**
 * Openid
 * @namespace 
 */
opec.openid = {};

opec.openid.setup = function(containerID) {
   opec.openid.loginBox = $('#' + containerID);
   
   var data = {
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
   
   opec.openid.loginBox.append(opec.templates.loginBox(data)); 
};

opec.openid.login = function() {
   
};

opec.openid.logout = function() {
   
};

opec.openid.showLogin = function() {
   
};

opec.openid.hideLogin = function() {
   
};

opec.openid.providers = [
   {name: 'Google', title:'login with Google', url:'/service/login/google', imagePath:'img/Red-signin_Long_base_20dp.png', x:'0', y:'0', width:'147px', height:'30px'},
   {name: 'Yahoo', title:'login with Yahoo', url:'/service/login/yahoo', imagePath:'img/yahoo_signin_btn.png', x:'0', y:'0', width:'161px', height:'22px'}
   //{name: 'myOpenID', title:'login with myOpenID', url:'/service/login/myopenid', imagePath:'0', x:'0', y:'0'},
   //{name: 'OpenID', title:'login with OpenID', url:'/service/login', imagePath:'', x:'0', y:'0'}
];
