
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
   cssFile:"GISportal.css"
}
