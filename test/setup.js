var fs = require('fs-extra');
var httpMocks = require('node-mocks-http');
var eventEmitter = require('events').EventEmitter;

before(function() {
   global.mocks = {
      createReq: function() {
         return httpMocks.createRequest({
            headers: {
               host: '127.0.0.1:6789'
            },
            ip: '127.0.0.1',
            session: {
               passport: false
            }
         });
      },
      createRes: function() {
         return httpMocks.createResponse({
            eventEmitter: eventEmitter
         });
      }
   };
});

after(function() {
   if (!global.test.configExists) {
      fs.removeSync(global.test.configDir);
   }
   var logDir = global.test.appPath + '/logs/test';
   fs.removeSync(logDir);
});