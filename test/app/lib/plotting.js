var admZip = require('adm-zip');
var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs-extra');
var glob = require('glob');
var md5 = require('md5');

chai.use(chaiHttp);
var expect = chai.expect;

var app = require(global.test.appPath + '/app.js');

describe('plotting', function() {
   var dependPathResources = global.test.dependPath + '/resources/plotting/';
   var dependPathExpected = global.test.dependPath + '/expected/plotting/';
   var plotDir = global.test.appPath + '/html/plots/';

   describe('timeseries', function() {
      var testHash = '22e591f68bd47fcbed8c106b2ab6fb1c1ef1b1b9';
      setupTests(testHash, 'timeseries');
   });

   describe('hovmoller_lat', function() {
      var testHash = '8944f55de97239899d1ed4d2f1278526d5e8390e';
      setupTests(testHash, 'hovmoller_lat');
   });

   describe('hovmoller_lon', function() {
      var testHash = 'f270ebf53f3d02c8506d6ab7181e0e99ddcd2369';
      setupTests(testHash, 'hovmoller_lon');
   });

   function setupTests(testHash, plotType) {
      var hash = null;

      it('should return the correct hash for a request', function(done) {
         var request = JSON.parse(fs.readFileSync(dependPathResources + '/' + plotType + '/' + testHash + '-request.json', 'utf8'));

         chai.request(app)
            .post('/app/plotting/plot')
            .send({
               request: request
            })
            .end(function(err, res) {
               hash = res.body.hash;
               expect(hash).to.equal(testHash);
               done();
            });
      });

      it('should produce all the correct files when it completes', function(done) {
         this.timeout(30000);
         checkComplete(testHash, hash, plotType, done);
      });

      after(function(done) {
         deletePlotFiles(hash, done);
      });
   }

   function checkComplete(testHash, hash, plotType, next) {
      var status = {};
      try {
         status = JSON.parse(fs.readFileSync(plotDir + '/' + hash + '-status.json', 'utf8'));
      } catch (err) {
         setTimeout(function() {
            checkComplete(testHash, hash, plotType, next);
         }, 1000);
      }
      if (status.completed) {
         testOutputs(testHash, hash, plotType, next);
      } else {
         setTimeout(function() {
            checkComplete(testHash, hash, plotType, next);
         }, 1000);
      }
   }

   function testOutputs(testHash, hash, plotType, next) {
      var testFilesPath = dependPathExpected + plotType + '/' + testHash;
      var testRequest = JSON.parse(fs.readFileSync(testFilesPath + '-request.json', 'utf8'));
      var testStatus = JSON.parse(fs.readFileSync(testFilesPath + '-status.json', 'utf8'));
      var testData = JSON.parse(fs.readFileSync(testFilesPath + '-data.json', 'utf8')).data;

      var filesPath = plotDir + hash;
      var request = JSON.parse(fs.readFileSync(filesPath + '-request.json', 'utf8'));
      var status = JSON.parse(fs.readFileSync(filesPath + '-status.json', 'utf8'));
      var data = JSON.parse(fs.readFileSync(filesPath + '-data.json', 'utf8')).data;

      expect(request, 'Request file').to.deep.equal(testRequest);
      expect(status, 'Status file').to.deep.equal(testStatus);
      expect(data, 'Data file').to.deep.equal(testData);

      next();
   }

   function deletePlotFiles(hash, next) {
      glob(plotDir + hash + '*', function(err, files) {
         if (!err) {
            files.forEach(function(file) {
               fs.removeSync(file);
            });
         }
         next();
      });
   }
});