var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var express = require('express');
var fs = require('fs');
var request = require('request');
var url = require('url');

var router = express.Router();

module.exports = router;

router.use('/app/animate', function(req, res) {
   res.send('Processing');

   var id = req.body.id;
   var wmsURL = req.body.url;
   var params = req.body.params;
   var slices = req.body.slices;

   var mapURL = 'https://tiles.maps.eox.at/wms/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=terrain-light&SRS=EPSG%3A4326&wrapDateLine=true&WIDTH=1024&HEIGHT=512&STYLES=&BBOX=-180%2C-90%2C180%2C90';
   var bordersURL = 'https://rsg.pml.ac.uk/geoserver/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=rsg%3Afull_10m_borders&STYLES=line-white&SRS=EPSG%3A4326&WIDTH=1024&HEIGHT=512&BBOX=-180%2C-90%2C180%2C90';

   var dataURL = url.parse(wmsURL, true);
   dataURL.search = undefined;
   var time = new Date(params.time);

   dataURL.query = {
      SERVICE: 'WMS',
      VERSION: params.VERSION,
      REQUEST: 'GetMap',
      FORMAT: 'image/png',
      TRANSPARENT: true,
      LAYERS: params.LAYERS,
      wrapDateLine: params.wrapDateLine,
      SRS: params.SRS,
      STYLES: params.STYLES,
      NUMCOLORBANDS: params.NUMCOLORBANDS,
      TIME: time.toISOString(),
      colorscalerange: params.colorscalerange,
      logscale: params.logscale,
      WIDTH: 1024,
      HEIGHT: 512,
      BBOX: '-180,-90,180,90'
   };

   if (params.ABOVEMAXCOLOR) {
      dataURL.query.ABOVEMAXCOLOR = params.ABOVEMAXCOLOR;
   }
   if (params.BELOWMINCOLOR) {
      dataURL.query.BELOWMINCOLOR = params.BELOWMINCOLOR;
   }

   var mapDownloaded = false;
   var bordersDownloaded = false;
   var slicesDownloaded = [];
   var slicesCount = 0;

   download(mapURL, '/tmp/map.jpg', downloadComplete);

   download(bordersURL, '/tmp/borders.png', downloadComplete);

   for (var i = 0; i < slices.length; i++) {
      dataURL.query.TIME = slices[i];
      var filename = '/tmp/' + id + '_' + slices[i] + '.png';
      download(url.format(dataURL), filename, downloadComplete);
   }

   function downloadComplete(err, filename) {
      if (err) {
         console.error(err);
      } else {
         if (filename == '/tmp/map.jpg') {
            mapDownloaded = true;
            // console.log("map downloaded");
         } else if (filename == '/tmp/borders.png') {
            bordersDownloaded = true;
            // console.log("borders downloaded");
         } else {
            slicesCount++;
            slicesDownloaded.push(filename);
            // console.log('Slice:' + slicesCount);
         }
      }

      if (mapDownloaded && bordersDownloaded && slicesDownloaded.length == slices.length) {
         console.log('Rendering');
         // Do the render thing!
         ffmpeg()
            .input('/tmp/map.jpg')
            .input('/tmp/' + id + '_' + '*' + '.png')
            .inputOption('-pattern_type glob')
            .inputFPS(1)
            .input('/tmp/borders.png')
            .complexFilter('overlay,overlay')
            .output('/tmp/test.mp4')
            .outputFPS(30)
            .noAudio()
            .on('end', function() {
               console.log('Finished rendering! ^_^');
               for (var i = 0; i < slicesDownloaded.length; i++) {
                  fs.unlink(slicesDownloaded[i]);
               }
            })
            .run();
      }
   }
});

function download(url, filename, callback) {
   request(url).pipe(fs.createWriteStream(filename))
      .on('error', function(err) {
         callback(err, filename);
      })
      .on('close', function(err) {
         callback(err, filename);
      });
}