var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs');
var path = require('path');

var app = require('../../../app.js');
var apiUtils = require('../../../app/lib/apiutils.js');

chai.use(chaiHttp);
var expect = chai.expect;

describe('apiUtils', function() {
   var globalCachePath1 = path.join(__dirname, '../../../config/site_settings/127.0.0.1:6789/rsg.pml.ac.uk-thredds-wms-PML-M-AGGSLOW.json');
   var globalCache1 = JSON.parse(fs.readFileSync(globalCachePath1));
   globalCache1.owner = '127.0.0.1:6789';
   var globalCachePath2 = path.join(__dirname, '../../../config/site_settings/127.0.0.1:6789/rsg.pml.ac.uk-thredds-wms-PML-S-AGGSLOW.json');
   var globalCache2 = JSON.parse(fs.readFileSync(globalCachePath2));
   globalCache2.owner = '127.0.0.1:6789';

   var userCachePath = path.join(__dirname, '../../../config/site_settings/127.0.0.1:6789/user_a.user@pml.ac.uk/rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW.json');
   var userCache = JSON.parse(fs.readFileSync(userCachePath));
   userCache.owner = 'a.user@pml.ac.uk';

   var testCache;

   beforeEach(function() {
      testCache = [];
      testCache.push(globalCache1);
      testCache.push(globalCache2);
   });

   describe('getCache and api get_cache', function() {
      it('should return the global cache for a guest user', function(done) {
         testCache = JSON.stringify(testCache);

         var req = global.mocks.createReq();
         req.params = {
            token: 'zxc'
         };
         var cache = apiUtils.getCache(req);
         cache = JSON.stringify(cache);
         expect(cache).to.equal(testCache);

         chai.request(app)
            .get('/api/1/zxc/get_cache')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal(testCache);
               done();
            });
      });

      it('should return the global and user cache for a user', function(done) {
         testCache.push(userCache);
         testCache = JSON.stringify(testCache);

         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };
         var cache = apiUtils.getCache(req);
         cache = JSON.stringify(cache);
         expect(cache).to.equal(testCache);

         chai.request(app)
            .get('/api/1/asd/get_cache')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal(testCache);
               done();
            });
      });

      it('should return the global and user cache for an admin', function(done) {
         testCache.push(userCache);
         testCache = JSON.stringify(testCache);

         var req = global.mocks.createReq();
         req.params = {
            token: 'qwe'
         };
         var cache = apiUtils.getCache(req);
         cache = JSON.stringify(cache);
         expect(cache).to.equal(testCache);

         chai.request(app)
            .get('/api/1/qwe/get_cache')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal(testCache);
               done();
            });
      });
   });

   describe('findServerURL', function() {
      var testName = 'rsg.pml.ac.uk-thredds-wms-PML-M-AGGSLOW';
      var testURL = 'http://rsg.pml.ac.uk/thredds/wms/PML-M-AGGSLOW?';

      it('should find the server URL without a cache provided', function() {
         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };
         var url = apiUtils.findServerURL(req, testName);
         expect(url).to.equal(testURL);
      });

      it('should find the server URL with a cache provided', function() {
         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };
         var url = apiUtils.findServerURL(req, testName, testCache);
         expect(url).to.equal(testURL);
      });
   });
});