var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require(global.test.appPath + '/app.js');

chai.use(chaiHttp);
var expect = chai.expect;

describe('Start server', function() {

   // get the index page
   describe('GET /index.html', function() {
      it('respond with html', function(done) {
         chai.request(app)
            .get('/')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               done();
            });
      });
   });

   // get the javscript
   describe('GET /GISportal.js', function() {
      it('respond with javascript', function(done) {
         chai.request(app)
            .get('/GISportal.js')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('application/javascript');
               done();
            });
      });
   });

   describe('GET /GISportal.min.js', function() {
      it('respond with minified javascript', function(done) {
         chai.request(app)
            .get('/GISportal.min.js')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('application/javascript');
               done();
            });
      });
   });

   // get the CSS
   describe('GET /css/GISportal.css', function() {
      it('respond with css', function(done) {
         chai.request(app)
            .get('/css/GISportal.css')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('text/css');
               done();
            });
      });
   });

   describe('GET /css/GISportal.min.css', function() {
      it('respond with minified css', function(done) {
         chai.request(app)
            .get('/css/GISportal.min.css')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('text/css');
               done();
            });
      });
   });
});
