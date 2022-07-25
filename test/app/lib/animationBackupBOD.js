var admZip = require('adm-zip');
var chai = require('chai');
var fs = require('fs-extra');
var glob = require('glob');
var md5 = require('md5');

var expect = chai.expect;

var animation = require(global.test.appPath + '/app/lib/animation.js');

describe('animation', function() {
   var testHash = 'cd1ae320a55777f114ee6177bd409728c0954716';
   var _hash = null;
   var plotDir = global.test.appPath + '/html/plots/';

   before(function() {
      fs.copySync(global.test.dependPath + '/resources/plotting/animation/2eb07c2130bf866a984ec65a488a13184d162bd4_2015-11-01T00-00:00.000Z.png', '/tmp/2eb07c2130bf866a984ec65a488a13184d162bd4_2015-11-01T00-00:00.000Z.png');
      fs.copySync(global.test.dependPath + '/resources/plotting/animation/2eb07c2130bf866a984ec65a488a13184d162bd4_2015-12-01T00-00:00.000Z.png', '/tmp/2eb07c2130bf866a984ec65a488a13184d162bd4_2015-12-01T00-00:00.000Z.png');
   });

   it('should return the correct hash for a request', function(done) {
      var request = JSON.parse(fs.readFileSync(global.test.dependPath + '/resources/plotting/animation/' + testHash + '-request.json', 'utf8'));
      var downloadDir = '/tmp/';
      var logDir = '';

      animation.animate(request, plotDir, downloadDir, logDir, function(err, hash) {
         expect(err).to.be.not.exist;
         expect(hash).to.equal(testHash);
         _hash = hash;
         done();
      });
   });

   it('should produce all the correct files when it completes', function(done) {
      this.timeout(30000);

      var status = {};

      checkComplete();

      function checkComplete() {
         var newStatus = null;
         try {
            newStatus = JSON.parse(fs.readFileSync(plotDir + '/' + testHash + '-status.json', 'utf8'));
         } catch (err) {
            newStatus = status;
         }
         status = newStatus;
         if (status.completed) {
            doTests();
         } else {
            setTimeout(checkComplete, 1000);
         }
      }

      function doTests() {
         var testFilesPath = global.test.dependPath + '/expected/plotting/animation/' + testHash;
         var testRequest = JSON.parse(fs.readFileSync(testFilesPath + '-request.json', 'utf8'));
         var testStatus = JSON.parse(fs.readFileSync(testFilesPath + '-status.json', 'utf8'));
         var testMp4 = md5(fs.readFileSync(testFilesPath + '-video.mp4'));
         var testWebM = md5(fs.readFileSync(testFilesPath + '-video.webm'));

         var filesPath = plotDir + _hash;
         var request = JSON.parse(fs.readFileSync(filesPath + '-request.json', 'utf8'));
         var mp4 = md5(fs.readFileSync(filesPath + '-video.mp4'));
         var webM = md5(fs.readFileSync(filesPath + '-video.webm'));

         expect(request, 'Request file').to.deep.equal(testRequest);
         expect(status, 'Status file').to.deep.equal(testStatus);
         expect(mp4, 'MP4 file').to.equal(testMp4);
         expect(webM, 'WebM file').to.equal(testWebM);

         done();
      }
   });

   after(function(done) {
      glob(plotDir + _hash + '*', function(err, files) {
         if (!err) {
            files.forEach(function(file) {
               fs.removeSync(file);
            });
         }
         done();
      });
   });
});