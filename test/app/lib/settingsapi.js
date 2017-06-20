var chai = require('chai');
var fs = require('fs');

var settingsApi = require(global.test.appPath + '/app/lib/settingsapi.js');

var expect = chai.expect;

describe('settingsApi', function() {
   describe('groups', function() {
      var domain = '127.0.0.1:6789';
      var groupsExpected = JSON.parse(fs.readFileSync(global.test.dependPath + '/expected/groups.json'));

      describe('get_groups', function() {
         it('should get all the groups', function() {
            var groups = settingsApi.get_groups(domain);
            expect(groups).to.deep.equal(groupsExpected);
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

            settingsApi.save_group(domain, group, function(err) {
               expect(err).to.be.null;
               var groups = settingsApi.get_groups(domain);
               expect(groups).to.deep.equal(groupsExpected);
               // expect(groups[1]).to.deep.equal(group);
               done();
            });
         });

         it('should save a new group', function(done) {
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

            settingsApi.save_group(domain, group, function(err) {
               expect(err).to.be.null;
               var groups = settingsApi.get_groups(domain);
               expect(groups).to.deep.equal(groupsExpected);
               // expect(groups[2]).to.deep.equal(group);
               done();
            });
         });
      });

      describe('delete_group', function() {
         it('should delete a group', function(done) {
            groupsExpected.splice(2, 1);
            settingsApi.delete_group(domain, 'test3', function(err) {
               expect(err).to.be.null;
               var groups = settingsApi.get_groups(domain);
               expect(groups).to.deep.equal(groupsExpected);
               done();
            });
         });
      });
   });
});