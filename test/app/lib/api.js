var chai = require('chai');
var chaiHttp = require('chai-http');
var path = require('path');
var fs = require('fs');

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
               expect(res.text).to.equal('Invalid API request');
               done();
            });
      });
   });

   describe('get_cache', function() {
      // Tested in apiutils.js
   });

   describe('get_cache_list', function() {
      // TODO
   });

   describe('refresh_wms_cache', function() {
      this.timeout(10000);
      var configPath = path.join(__dirname, '../../../config/site_settings/127.0.0.1:6789/');

      it('should successfully refresh a global cache', function(done) {
         var cachePath = path.join(configPath, 'rsg.pml.ac.uk-thredds-wms-PML-S-AGGSLOW.json');
         var old_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;

         chai.request(app)
            .get('/api/1/qwe/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-PML-S-AGGSLOW&user=global')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal('Successfully updated rsg.pml.ac.uk-thredds-wms-PML-S-AGGSLOW for 127.0.0.1:6789');
               var new_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;
               expect(new_time).to.be.above(old_time);
               done();
            });
      });

      it('should successfully refresh a user\'s own cache', function(done) {
         var cachePath = path.join(configPath, 'user_a.user@pml.ac.uk/rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW.json');
         var old_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;

         chai.request(app)
            .get('/api/1/asd/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal('Successfully updated rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW for a.user@pml.ac.uk');
               var new_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;
               expect(new_time).to.be.above(old_time);
               done();
            });
      });

      it('should successfully refresh another user\'s cache', function(done) {
         var cachePath = path.join(configPath, 'user_a.user@pml.ac.uk/rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW.json');
         var old_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;

         chai.request(app)
            .get('/api/1/qwe/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW&user=a.user@pml.ac.uk')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal('Successfully updated rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW for a.user@pml.ac.uk');
               var new_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;
               expect(new_time).to.be.above(old_time);
               done();
            });
      });

      it('should not allow a user to refresh another user\'s cache', function(done) {
         chai.request(app)
            .get('/api/1/asd/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-PML-Y-AGGSLOW&user=a.user@pml.ac.uk')
            .end(function(err, res) {
               expect(res).to.have.status(401);
               expect(res.text).to.equal('Error: You must be an admin to refresh another user\'s config!');
               done();
            });
      });

      it('should give a 400 error if the server isn\'t found', function(done) {
         chai.request(app)
            .get('/api/1/qwe/refresh_wms_cache?server=nyan')
            .end(function(err, res) {
               expect(res).to.have.status(400);
               done();
            });
      });

      it('should give a 400 error if url isn\'t specified', function(done) {
         chai.request(app)
            .get('/api/1/qwe/refresh_wms_cache')
            .end(function(err, res) {
               expect(res).to.have.status(400);
               done();
            });
      });

      it('should give a 404 error if config for url isn\'t found', function(done) {
         chai.request(app)
            .get('/api/1/qwe/refresh_wms_cache?url=nyan')
            .end(function(err, res) {
               expect(res).to.have.status(404);
               done();
            });
      });
   });
});