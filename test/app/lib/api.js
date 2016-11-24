var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../../app.js');

chai.use(chaiHttp);
var expect = chai.expect;

describe('api', function() {
   describe('invalid api request', function() {
      it('should return 400 "Invalid API request"', function(done) {
         chai.request(app)
            .get('/api')
            .end(function(err, res) {
               expect(res).to.have.status(400);
               expect(res.text).to.equal("Invalid API request");
               done();
            });
      });
   });

   describe('authenticateToken', function() {
      it('should not allow bad token', function(done) {
         chai.request(app)
            .get('/api/1/meep')
            .end(function(err, res) {
               expect(res).to.have.status(401);
               expect(res.text).to.equal("Unauthorised token!");
               done();
            });
      });
   });
});
