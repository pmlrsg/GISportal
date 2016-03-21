GLOBAL.config['DOMAIN_NAME'] = {
   auth: {
      google: {
         scope : 'https://www.googleapis.com/auth/userinfo.email',
         clientid : 'CLIENT_ID',
         clientsecret : 'CLIENT_SECRET',
         callback : 'CALLBACK',
         prompt: 'select_account'
      }
   },
   admins:['ADMINISTRATOR'],
   cssFile:"CSS_FILE.CSS"
}
