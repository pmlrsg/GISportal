
GLOBAL.config = {
   // Application settings
   app: {
      // the port that the application will run on
      port: 6789,             
   },
   // redis connection settings
   redisURL: "http://localhost:6379/",
   // OAuth2 settings from Google, plus others if applicable
   auth: {
      google: {
         scope : "https://www.googleapis.com/auth/userinfo.email",
         clientid : "741961836801-v58t7bv2t08jglenlj9vlvh6usr57l2d.apps.googleusercontent.com",
         clientsecret : "PndOco4Zzj4RZin_nHrPNsnH",
         callback : "https://pmpc1465.npm.ac.uk/app/user/auth/google/callback",
         prompt: "select_account"
      }
   },
   // session settings
   session : {
      // ssssh! it's secret (any randon string to keep prying eyes from seeing the content of the cookie)
      secret : "9qD228jYbxh6MvmTM1kNdDbqjdEHfX20zRGCbDcGDAzPa9h9deiqIl851rSxz32gRLhd64wohTX0w3lkFN6zFVwhn3GZ6ML1chEN2oaCg5RiWL3CeJkFSyKjl4RU9N9o",
      // the age in seconds that the cookie should persist; 0 == session cookie that expires when the browser is closed
      age : 0
   },
   // an array of email address to grant admin privilges to when when they login
   admins: [], 
}
