GLOBAL.config['DOMAIN_NAME'] = {
   // OAuth2 settings from Google, plus others if applicable
   auth: {
      google: {
         scope : 'https://www.googleapis.com/auth/userinfo.email',
         clientid : 'CLIENT_ID',
         clientsecret : 'CLIENT_SECRET',
         callback : 'CALLBACK_URL',
         prompt: 'select_account'
      }
   },
   // session settings
   session : {
      // ssssh! it's secret (any randon string to keep prying eyes from seeing the content of the cookie)
      secret : 'SECRET',
      // the age in seconds that the cookie should persist; 0 == session cookie that expires when the browser is closed
      age : 0
   },
   admins:[ADMINISTRATOR]
}
