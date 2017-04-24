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
      var testHash = '259d911a85ec876652f2d059b676faceb3f18ab7';
      var hash = null;

      it('should return the correct hash for a request', function(done) {
         var request = JSON.parse(fs.readFileSync(dependPathResources + '/timeseries/' + testHash + '-request.json', 'utf8'));

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
         checkComplete(testHash, hash, 'timeseries', function() {
            done();
         });
      });
   });

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
            doTests(testHash, hash, plotType, next);
         } else {
            setTimeout(function() {
               checkComplete(testHash, hash, plotType, next);
            }, 1000);
         }
   }

   function doTests(testHash, hash, plotType, next) {
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
});