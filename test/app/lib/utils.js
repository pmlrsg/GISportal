var chai = require('chai');
var fs = require('fs');
var utils = require('../../../app/lib/utils.js');

var expect = chai.expect;

describe('utils', function() {
   describe('URLtoServerName', function() {
      it('should correctly return url to server name', function(){
         var url = 'http://rsg.pml.ac.uk/thredds/wms/CCI_ALL-v3.0-MONTHLY?service=WMS&version=1.3.0&request=GetCapabilities';
         var serverName = 'rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY';
         expect(utils.URLtoServerName(url)).to.equal(serverName);
      });
   });

   describe('fileExists', function() {
      it('should return true for an existing file', function() {
         fs.writeFileSync('/tmp/testFile', 'Test File');
         expect(utils.fileExists('/tmp/testFile')).to.equal(true);
         fs.unlinkSync('/tmp/testFile');
      });

      it('should return false for a non-existing file', function() {
         expect(utils.fileExists('/testFileThatMostDefinitelyShouldntExist_Hopefully')).to.equal(false);
      });
   });

   describe('directoryExists', function() {
      it('should return true for an existing directory', function() {
         var dir = '/tmp/testDir' + Date.now();
         fs.mkdirSync(dir);
         expect(utils.directoryExists(dir)).to.equal(true);
         fs.rmdirSync(dir);
      });

      it('should return false for a non-existing directory', function() {
         expect(utils.directoryExists('/testDirThatMostDefinitelyShouldntExist_Hopefully')).to.equal(false);
      });
   });

   describe('getDomainName', function() {
      it('should get the domain name correctly', function() {
         var req= {};
         req.headers = {};
         req.headers.host = 'http://visual.pml.ac.uk/';
         expect(utils.getDomainName(req)).to.equal('visual.pml.ac.uk');
         req.headers.host = 'https://visual.pml.ac.uk/';
         expect(utils.getDomainName(req)).to.equal('visual.pml.ac.uk');
         req.headers.host = 'https://visual.pml.ac.uk/subdir/';
         expect(utils.getDomainName(req)).to.equal('visual.pml.ac.uk_subdir');
      });
   });

   describe('mkdirpSync', function() {
      it('should create directory tree correctly', function(){
         var baseDir = '/tmp/testDir' + Date.now();
         var dir = baseDir + '/sub1/sub2';
         utils.mkdirpSync(dir);
         expect(utils.directoryExists(dir)).to.equal(true);
         fs.rmdirSync(baseDir + '/sub1/sub2');
         fs.rmdirSync(baseDir + '/sub1');
         fs.rmdirSync(baseDir);
      });
   });
});