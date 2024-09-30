global.config = {
   // the port that the node application will run on
   appPort: 6789,
   // redis connection settings
   redisURL: 'http://localhost:6379/' ,
   session : {
      secret : 'SECRET',
      age : 0
   },
   auth: {
      // requireAuthBeforeAccess: true,
      // "specificUsersOnly": []    // list of emails addresses of users allowed access
      // google: {
      //    scope : 'https://www.googleapis.com/auth/userinfo.email',
      //    clientid : 'something',
      //    clientsecret : 'something', 
      //    callback : 'https://pmpc1568:6789/data/app/user/auth/google/callback',
      //    prompt: 'select_account'
      // },
      // "saml": {
      //    "issuer": "<replace with Identifier (Entity ID)>",
      //    "callbackUrl": "https://<domain-name>/app/user/auth/saml/callback",
      //    "entryPoint": "<replace with Login URL, e.g. https://login.microsoftonline.com/75...bd1e/saml2>",
      //    "cert": "<replace with SAML Certificate (Base 64) with line breaks replaced with \\n>",
      //    "loginButton": "/img/sign-in-with-microsoft.png"
      // },
   },
   // session settings
   session : {
      // ssssh! it's secret (any randon string to keep prying eyes from seeing the content of the cookie)
      secret : 'bw56bwBWGW56vw45v45b45vRTVWERmMl9IBjArLM8e3n7MNL3Copza7U9skoGsbc3HSeFQcigWy6Re8JxDtbvT1IcZVk9QWCtDN47EVh3V5wU15qpo5ZFkkwYryLJKIqcsFsU4y',
      // the age in seconds that the cookie should persist; 0 == session cookie that expires when the browser is closed
      age : 0
   },
   admins:[
      'bac@pml.ac.uk'
   ],
   tokens: {
     '090efeb3246456e5f40252afc1f91ac': 'bac@pml.ac.uk',
   }
};
