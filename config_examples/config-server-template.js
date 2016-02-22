GLOBAL.config['DOMAIN_NAME'] = {
   auth: {
      google: {
         scope : 'https://www.googleapis.com/auth/userinfo.email',
         clientid : 'CLIENT_ID',
         clientsecret : 'CLIENT_SECRET',
         callback : 'CALLBACK_URL',
         prompt: 'select_account'
      }
   },
   session : {
      secret : 'SECRET',
      age : 0
   },
   admins:[ADMINISTRATOR]
}
