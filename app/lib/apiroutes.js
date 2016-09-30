var express = require('express');
var router = express.Router();
var apiRouter = express.Router({
   mergeParams: true
});
var apiAuth = require('./apiauth.js');

var api = require('./api.js');

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

apiRouter.get('/refresh_wms_layer', api.refresh_wms_layer);