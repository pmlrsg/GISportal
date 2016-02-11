
GLOBAL.config = {
   // Application settings
   app: {
      // the port that the application will run on
      port: 6789,             
   },
   // redis connection settings
   redisURL: 'http://localhost:6379/',
   // session settings
   session : {
      // ssssh! it's secret (any randon string to keep prying eyes from seeing the content of the cookie)
      secret : '9qD228jYbxh6MvmTM1kNdDbqjdEHfX20zRGCbDcGDAzPa9h9deiqIl851rSxz32gRLhd64wohTX0w3lkFN6zFVwhn3GZ6ML1chEN2oaCg5RiWL3CeJkFSyKjl4RU9N9o',
      // the age in seconds that the cookie should persist; 0 == session cookie that expires when the browser is closed
      age : 0
   },
   admins:[
      'admin1@admin.co.uk',
      'admin2@admin.co.uk',
      'admin3@admin.co.uk',
      'admin4@admin.co.uk'
   ]
 
}
