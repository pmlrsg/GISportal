global.config = {
   // the port that the node application will run on
   appPort: 6789,
   // redis connection settings
   redisURL: 'http://localhost:6379/' ,
   session : {
      secret : 'SECRET',
      age : 0
   }
};
