
GLOBAL.config = {
   // Application settings
   app: {
      // the port that the application will run on
      port: 6789,             
   },
   // redis connection settings
   redisURL: 'http://localhost:6379/' ,
   session : {
      secret : 'SECRET',
      age : 0
   },
   admins:[
      'admin1@admin.co.uk',
      'admin2@admin.co.uk',
      'admin3@admin.co.uk',
      'admin4@admin.co.uk'
   ],
   cssFile:"GISportal"
}
