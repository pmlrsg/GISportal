var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs-extra');

var app = require(global.test.appPath + '/app.js');

chai.use(chaiHttp);
var expect = chai.expect;

describe('api', function() {
   var USER_URL = '/api/1/asd';
   var ADMIN_URL = '/api/1/qwe';

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
      var testCacheServers;
      var testCacheLayers;

      before(function() {
         var cacheServersPath = global.test.expectedPath + '/get_cache_servers.json';
         testCacheServers = fs.readFileSync(cacheServersPath, 'utf8');
         var cacheLayersPath = global.test.expectedPath + '/get_cache_layers.json';
         testCacheLayers = fs.readFileSync(cacheLayersPath, 'utf8');
      });

      it('should get cache servers correctly', function(done) {
         chai.request(app)
            .get(USER_URL + '/get_cache_servers')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res).to.be.json;
               expect(res.text).to.equal(testCacheServers);
               done();
            });
      });

      it('should get cache layers correctly', function(done) {
         chai.request(app)
            .get(USER_URL + '/get_cache_layers')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res).to.be.json;
               expect(res.text).to.equal(testCacheLayers);
               done();
            });
      });
   });

   describe('refresh_wms_cache', function() {
      this.timeout(10000);
      var configPath = global.test.appPath + '/config/site_settings/127.0.0.1:6789/';

      it('should successfully refresh a global cache', function(done) {
         var cachePath = configPath + '/rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-DAILY.json';
         var old_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;

         chai.request(app)
            .get(ADMIN_URL + '/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-DAILY&user=global')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal('Successfully updated rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-DAILY for 127.0.0.1:6789');
               var new_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;
               expect(new_time).to.be.above(old_time);
               done();
            });
      });

      it('should successfully refresh a user\'s own cache', function(done) {
         var cachePath = configPath + '/user_a.user@pml.ac.uk/rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY.json';
         var old_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;

         chai.request(app)
            .get(USER_URL + '/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal('Successfully updated rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY for a.user@pml.ac.uk');
               var new_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;
               expect(new_time).to.be.above(old_time);
               done();
            });
      });

      it('should successfully refresh another user\'s cache', function(done) {
         var cachePath = configPath + '/user_a.user@pml.ac.uk/rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY.json';
         var old_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;

         chai.request(app)
            .get(ADMIN_URL + '/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY&user=a.user@pml.ac.uk')
            .end(function(err, res) {
               expect(res).to.have.status(200);
               expect(res.text).to.equal('Successfully updated rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY for a.user@pml.ac.uk');
               var new_time = JSON.parse(fs.readFileSync(cachePath)).timeStamp;
               expect(new_time).to.be.above(old_time);
               done();
            });
      });

      it('should not allow a user to refresh another user\'s cache', function(done) {
         chai.request(app)
            .get(USER_URL + '/refresh_wms_cache?server=rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-MONTHLY&user=a.user@pml.ac.uk')
            .end(function(err, res) {
               expect(res).to.have.status(401);
               expect(res.text).to.equal('Error: You must be an admin to refresh another user\'s config!');
               done();
            });
      });

      it('should give a 400 error if the server isn\'t found', function(done) {
         chai.request(app)
            .get(ADMIN_URL + '/refresh_wms_cache?server=nyan')
            .end(function(err, res) {
               expect(res).to.have.status(400);
               done();
            });
      });

      it('should give a 400 error if url isn\'t specified', function(done) {
         chai.request(app)
            .get(ADMIN_URL + '/refresh_wms_cache')
            .end(function(err, res) {
               expect(res).to.have.status(400);
               done();
            });
      });

      it('should give a 404 error if config for url isn\'t found', function(done) {
         chai.request(app)
            .get(ADMIN_URL + '/refresh_wms_cache?url=nyan')
            .end(function(err, res) {
               expect(res).to.have.status(404);
               done();
            });
      });
   });

   describe('refresh_all_wms_cache', function() {
      it('should refresh all global caches', function(done) {
         this.timeout(10000);
         var expected = {
            failedServers: [],
            refreshedServers: [
               'rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-5DAY',
               'rsg.pml.ac.uk-thredds-wms-CCI_ALL-v3.0-DAILY'
            ]
         };

         chai.request(app)
            .get(ADMIN_URL + '/refresh_all_wms_cache')
            .end(function(err, res) {
               res.body.refreshedServers.sort();
               expect(res.body).to.deep.equal(expected);
               done();
            });
      });
   });

   describe('groups', function() {
      var groupsExpected = JSON.parse(fs.readFileSync(global.test.dependPath + '/expected/groups.json'));

      describe('get_groups', function() {
         it('should get all the groups', function(done) {
            chai.request(app)
               .get(ADMIN_URL + '/groups')
               .end(function(err, res) {
                  var groups = res.body;
                  expect(groups).to.deep.equal(groupsExpected);
                  done();
               });
         });
      });

      describe('save_group', function() {
         it('should overwrite an existing group', function(done) {
            var group = {
               "groupName": "test2",
               "members": [
                  "member4",
                  "member5",
                  "member6",
                  "member7"
               ]
            };

            groupsExpected[1] = group;

            chai.request(app)
               .post(ADMIN_URL + '/group')
               .send(group)
               .end(function(err, res) {
                  var groups = res.body;
                  expect(groups).to.deep.equal(groupsExpected);
                  done();
               });
         });

         it('should add a new group', function(done) {
            var group = {
               "groupName": "test3",
               "members": [
                  "member11",
                  "member12",
                  "member13",
                  "member14"
               ]
            };

            groupsExpected.push(group);

            chai.request(app)
               .post(ADMIN_URL + '/group')
               .send(group)
               .end(function(err, res) {
                  var groups = res.body;
                  expect(groups).to.deep.equal(groupsExpected);
                  done();
               });
         });
      });

      describe('delete_group', function() {
         it('should delete a group', function(done) {
            groupsExpected.splice(2, 1);

            chai.request(app)
               .del(ADMIN_URL + '/group/' + 'test3')
               .end(function(err, res) {
                  expect(res).to.have.status(200);

                  chai.request(app)
                     .get(ADMIN_URL + '/groups')
                     .end(function(err, res) {
                        var groups = res.body;
                        expect(groups).to.deep.equal(groupsExpected);
                        done();
                     });
               });
         });
      });

      after(function() {
         // Copy the original members.json for group_test2 back into the config since it has been modified and is used by future tests
         fs.copySync(global.test.dependPath + '/config/site_settings/127.0.0.1\:6789/group_test2/members.json',
            global.test.appPath + '/config/site_settings/127.0.0.1\:6789/group_test2/members.json');
      });
   });
});