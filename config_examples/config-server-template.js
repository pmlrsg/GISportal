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
   cssFile:"GISportal",
   email:{
      method:"mailgun", //"mailgun", "gmail", "other"
      //MAILGUN
      //-----------------------------------------------------
      mailgun_api_key: "mailgun_api_key",
      mailgun_domain: "mailgun_domain",
      //-----------------------------------------------------
      //GMAIL
      //-----------------------------------------------------
      gmail_email: "gmail_email",
      gmail_pass: "gmail_pass",
      //-----------------------------------------------------
      //-----------------------------------------------------
      //OTHER
      //-----------------------------------------------------
      other_email: "other_email",
      other_pass: "other_pass"
      //-----------------------------------------------------
   }
}
