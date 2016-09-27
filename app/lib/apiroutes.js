var express = require('express');
var router = express.Router();
var apiRouter = express.Router({
   mergeParams: true
});
var apiAuth = require('./apiauth.js');
var utils = require('./utils.js');
var settingsApi = require('./settingsapi.js');

module.exports = router;

router.use('/api/1/:token/', apiAuth.authenticateToken, apiRouter);

apiRouter.get('/', function(req, res) {
   res.status(200).send('Get success!');
});

apiRouter.post('/', function(req, res) {
   res.status(200).send('Post success!');
});

apiRouter.get('/test', function(req, res) {
   res.status(200).send('Get testpage success!');
});

apiRouter.get('/load_wms_layer', function(req, res) {
   if (req.query.url) {
      var url = req.query.url.replace(/\?/g, "") + "?"; // Gets the given url
      var refresh = true;
      var domain = utils.getDomainName(req); // Gets the given domain

      settingsApi.load_new_wms_layer(url, refresh, domain, function(err, data) {
         if (err) {
            utils.handleError(err, res);
         } else {
            if (data !== null) {
               res.send(data);
            } else {
               res.send({
                  "Error": "Could not find any loadable layers in the <a href='" + url + "service=WMS&request=GetCapabilities'>WMS file</a> you provided"
               });
            }
         }
      });
   } else {
   }
});