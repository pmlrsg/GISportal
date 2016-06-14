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
   email:{
      method:"mailgun", //"mailgun", "smtp", "gmail"
      //MAILGUN
      //-----------------------------------------------------
      mailgun_api_key: "mailgun_api_key",
      mailgun_domain: "mailgun_domain",
      //-----------------------------------------------------
      //SMTP
      //-----------------------------------------------------
      smtp_server: "smtp_server",
      smtp_domain: "smtp_domain",
      //-----------------------------------------------------
      //GMAIL
      //-----------------------------------------------------
      gmail_api_key: "gmail_api_key",
      gmail_domain: "gmail_domain"
      //-----------------------------------------------------
   }
}
