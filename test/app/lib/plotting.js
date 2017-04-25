var admZip = require('adm-zip');
var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs-extra');
var glob = require('glob');

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

   describe('scatter', function() {
      var testHash = '7fc2b7d48a3d45d0450a82e297b01bad002f50a1';
      setupTests(testHash, 'scatter');
   });

   describe('extract (geographic)', function() {
      var testHash = '19541046a974ba4671175a12f151fcefdae9b6f4';
      setupTests(testHash, 'extract');
   });

   /**
    * Setup the tests for a plotting type
    * @param  {string} testHash The expected hash
    * @param  {string} plotType The plot type
    */
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
         this.timeout(10000);
         checkComplete(testHash, hash, plotType, done);
      });

      after(function(done) {
         deletePlotFiles(hash, done);
      });
   }

   /**
    * Check if the plot has completed and call testOutputs if it has
    * @param  {string}   testHash The expected hash
    * @param  {string}   hash     The hash returned from the program
    * @param  {string}   plotType The plot type
    * @param  {Function} next     The chai 'done' function
    */
   function checkComplete(testHash, hash, plotType, next) {
      var status = {};
      try {
         status = JSON.parse(fs.readFileSync(plotDir + '/' + hash + '-status.json', 'utf8'));
      } catch (err) {
         setTimeout(function() {
            checkComplete(testHash, hash, plotType, next);
         }, 250);
         return;
      }
      if (status.completed) {
         testOutputs(testHash, hash, plotType, next);
      } else {
         setTimeout(function() {
            checkComplete(testHash, hash, plotType, next);
         }, 250);
      }
   }

   /**
    * Test that the plot outputs match the expected ones.
    * @param  {string}   testHash The expected hash
    * @param  {string}   hash     The hash returned from the program
    * @param  {string}   plotType The plot type
    * @param  {Function} next     The chai 'done' function
    */
   function testOutputs(testHash, hash, plotType, next) {
      var hasZip = false;

      var testFilesPath = dependPathExpected + plotType + '/' + testHash;
      var testRequest = JSON.parse(fs.readFileSync(testFilesPath + '-request.json', 'utf8'));
      var testStatus = JSON.parse(fs.readFileSync(testFilesPath + '-status.json', 'utf8'));
      var testData = JSON.parse(fs.readFileSync(testFilesPath + '-data.json', 'utf8')).data;
      var testZip = null;

      var filesPath = plotDir + hash;
      var request = JSON.parse(fs.readFileSync(filesPath + '-request.json', 'utf8'));
      var status = JSON.parse(fs.readFileSync(filesPath + '-status.json', 'utf8'));
      var data = JSON.parse(fs.readFileSync(filesPath + '-data.json', 'utf8')).data;
      var zip = null;

      expect(request, 'Request file').to.deep.equal(testRequest);
      expect(status, 'Status file').to.deep.equal(testStatus);
      expect(data, 'Data file').to.deep.equal(testData);

      // If a zip is expected, test all the files in the zip
      try {
         testZip = admZip(testFilesPath + '.zip');
         hasZip = true;
      } catch (err) {}

      if (hasZip) {
         zip = admZip(filesPath + '.zip');
         var testZipEntries = testZip.getEntries();
         var zipEntries = zip.getEntries();

         for (var i = 0; i < testZipEntries.length; i++) {
            var testEntry = testZip.readAsText(testZipEntries[i]);
            var entry = zip.readAsText(zipEntries[i]);
            expect(entry, 'zip file').to.equal(testEntry);
         }
      }

      next();
   }

   /**
    * Delete the output files produced by the test
    * @param  {string}   hash The hash returned from the program
    * @param  {Function} next The chai 'done' function
    */
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