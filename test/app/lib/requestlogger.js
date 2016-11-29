var chai = require('chai');
var fs = require('fs-extra');
var path = require('path');

var requestLogger = require('../../../app/lib/requestlogger.js');

var expect = chai.expect;

describe('requestLogger', function() {
   var logDir = path.join(__dirname, '../../../logs/test');
   var logFile = path.join(logDir, new Date().toISOString().substring(0, 10) + '.csv');
   var req;
   beforeEach(function() {
      req = global.mocks.createReq();
      req.ip = '127.0.0.1';
      req.session = {
         passport: false
      };
   });

   describe('init', function() {
      it('should have created log directory and columns file', function() {
         var columnsPath = path.join(logDir, 'columns.csv');

         expect(fs.statSync(logDir).isDirectory()).to.be.true;
         expect(fs.statSync(columnsPath).isFile()).to.be.true;
      });
   });

   describe('autoLog', function() {
      it('should log normal request corectly', function(done) {
         var res = global.mocks.createRes();
         req.originalUrl = '/autoLogTest';

         requestLogger.autoLog(req, res, function() {
            setTimeout(function() {
               var log = fs.readFileSync(logFile, 'utf8');
               expect(log).to.contain('Z","127.0.0.1","/autoLogTest","","",0,""');
               done();
            }, 100);
         });
      });

      it('should log api requests corectly', function(done) {
         var res = global.mocks.createRes();
         req.originalUrl = '/api/1/letmein/autoLogTest';
         req.params = {
            token: 'letmein'
         };

         requestLogger.autoLog(req, res, function() {
            setTimeout(function() {
               var log = fs.readFileSync(logFile, 'utf8');
               expect(log).to.contain('Z","127.0.0.1","/api/1/TOKEN/autoLogTest","guest","",0,""');
               done();
            }, 100);
         });
      });

      it('should not log urls in DO_NOT_AUTO_LOG', function(done) {
         var res = global.mocks.createRes();
         req.originalUrl = '/api/1/letmein/extras/point_extract';
         req.params = {
            token: 'letmein'
         };

         requestLogger.autoLog(req, res, function() {
            setTimeout(function() {
               var log = fs.readFileSync(logFile, 'utf8');
               expect(log).to.not.contain('Z","127.0.0.1","/api/1/TOKEN/extras/point_extract","guest","",0,""');
               done();
            }, 100);
         });
      });
   });

   describe('log file upload', function() {
      var fileSource;
      var fileDestination;

      before(function(done) {
         fileSource = path.join(global.test.dependenciesPath, 'uploads/testFileUpload.txt');
         fileDestination = path.join(global.test.appPath, 'uploads/testFileUpload.txt');
         fs.copy(fileSource, fileDestination, {
            clobber: false
         }, function() {
            done();
         });
      });

      it('should log uploaded file correctly', function(done) {
         var res = global.mocks.createRes();
         var uploadDir = path.join(global.test.appPath, 'uploads');
         req.originalUrl = '/api/1/letmein/testFileUpload';
         req.params = {
            token: 'letmein'
         };
         req.file = {
            destinaion: uploadDir,
            fieldname: 'files',
            filename: 'testFileUpload.txt',
            originalname: 'testFileUpload.txt.',
            path: fileDestination
         };

         requestLogger.log(req, res, function() {
            setTimeout(function() {
               var log = fs.readFileSync(logFile, 'utf8');
               expect(log).to.contain('Z","127.0.0.1","/api/1/TOKEN/testFileUpload","guest","testFileUpload.txt.",1,""');
               done();
            }, 200);
         });
      });

      after(function(done) {
         fs.remove(fileDestination, function() {
            done();
         });
      });
   });
});