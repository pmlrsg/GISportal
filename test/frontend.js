var request = require('superagent');
var expect = require('expect.js');

describe('Start server', function() {

   var boot = require('../app').boot;
   var shutdown = require('../app').shutdown;
   var port = require('../app').port;

   // first things first, start the application
   before(function(done) {
      this.timeout(3000);
      boot();
      // wait a second before trying to get any of the files; express needs a little warm up time
      setTimeout(done, 2000);
   });

   // get the index page
   describe('GET /index.html', function() {
      it('respond with html', function(done) {
         request
            .get('http://localhost:' + port)
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               done();
            });
      });
   });

   // get the javscript
   describe('GET /GISportal.js', function() {
      it('respond with javascript', function(done) {
         request
            .get('http://localhost:' + port + '/GISportal.js')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('application/javascript');
               done();
            });
      });
   });   

   describe('GET /GISportal.min.js', function() {
      it('respond with minified javascript', function(done) {
         request
            .get('http://localhost:' + port + '/GISportal.min.js')
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
         request
            .get('http://localhost:' + port + '/css/GISportal.css')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('text/css');
               done();
            });
      });
   });   

   describe('GET /css/GISportal.min.css', function() {
      it('respond with minified css', function(done) {
         request
            .get('http://localhost:' + port + '/css/GISportal.min.css')
            .end(function(err, res) {
               expect(res.status).to.equal(200);
               expect(res.type).to.equal('text/css');
               done();
            });
      });
   });   

   after(function(done) {
      shutdown();
      done();
   });

});
