var chai = require('chai');
var fs = require('fs-extra');

var moduleLoader = require(global.test.appPath + '/app/lib/moduleloader.js');
var testModule = require(global.test.dependPath + '/app/modules/test');

var expect = chai.expect;

describe('moduleloader', function() {
   describe('loadModules', function() {
      var moduleSource = global.test.dependPath + '/app/modules/test';
      var moduleDestination = global.test.appPath + '/app/modules/test';
      var moduleExists = false;

      it('should load test module correctly', function(done) {
         try {
            if (fs.statSync(moduleDestination).isDirectory) {
               console.error();
               console.error(' ----------------------------------------------------------- ');
               console.error('|   Error: app/modules/test already exists!                 |');
               console.error('|   Please move the folder to pass the moduleLoader test.   |');
               console.error(' ----------------------------------------------------------- ');
               console.error();
               moduleExists = true;
               expect.fail();
               done();
            }
         } catch (e) {
            fs.copy(moduleSource, moduleDestination, {
               clobber: false
            }, function() {
               var modules = moduleLoader.loadModules();
               expect(modules.test).to.deep.equal(testModule);
               done();
            });
         }
      });

      after(function(done) {
         if (!moduleExists) {
            fs.remove(moduleDestination, function() {
               done();
            });
         } else {
            done();
         }
      });
   });
});
