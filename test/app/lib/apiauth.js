var chai = require('chai');
var chaiHttp = require('chai-http');

var app = require(global.test.appPath + '/app.js');
var apiAuth = require(global.test.appPath + '/app/lib/apiauth.js');

chai.use(chaiHttp);
var expect = chai.expect;

describe('apiAuth', function() {
   describe('authenticateToken', function() {
      it('should reject bad token', function(done) {
         chai.request(app)
            .get('/api/1/meep')
            .end(function(err, res) {
               expect(res).to.have.status(401);
               expect(res.text).to.equal("Unauthorised token!");
               done();
            });
      });

      it('should accept valid token', function(done) {
         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };

         var res = global.mocks.createRes();
         res.on('end', function() {
            expect.fail();
            done();
         });

         apiAuth.authenticateToken(req, res, function() {
            done();
         });
      });
   });

   describe('getAccessLevel', function() {
      it('should return guest for guest level token', function() {
         var req = global.mocks.createReq();
         req.params = {
            token: 'zxc'
         };
         var level = apiAuth.getAccessLevel(req);
         expect(level).to.equal('guest');
      });

      it('should return user for user level token', function() {
         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };
         var level = apiAuth.getAccessLevel(req);
         expect(level).to.equal('user');
      });

      it('should return admin for admin level token', function() {
         var req = global.mocks.createReq();
         req.params = {
            token: 'qwe'
         };
         var level = apiAuth.getAccessLevel(req);
         expect(level).to.equal('admin');
      });
   });

   describe('getUsername', function() {
      it('should return the username that matches the token', function() {
         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };
         var username = apiAuth.getUsername(req);
         expect(username).to.equal('a.user@pml.ac.uk');
      });
   });

   describe('denyGuest', function() {
      it('should deny guest token', function(done) {
         var req = global.mocks.createReq();
         req.params = {
            token: 'zxc'
         };

         var res = global.mocks.createRes();
         res.on('end', function() {
            expect(res.statusCode).to.equal(401);
            done();
         });

         apiAuth.denyGuest(req, res, function() {
            expect.fail();
            done();
         });
      });

      it('should allow user token', function(done) {
         var req = global.mocks.createReq();
         req.params = {
            token: 'asd'
         };

         var res = global.mocks.createRes();
         res.on('end', function() {
            expect.fail();
            done();
         });

         apiAuth.denyGuest(req, res, function() {
            done();
         });
      });

      it('should allow admin token', function(done) {
        var req = global.mocks.createReq();
         req.params = {
            token: 'qwe'
         };

         var res = global.mocks.createRes();
         res.on('end', function() {
            expect.fail();
            done();
         });

         apiAuth.denyGuest(req, res, function() {
            done();
         });
      });
   });
});