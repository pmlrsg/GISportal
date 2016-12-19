var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var fs = require('fs-extra');
var request = require('request');
var url = require('url');
var Jimp = require('jimp');
var async = require('async');

var animation = {};

module.exports = animation;

animation.animate = function(options) {
   console.log('Animation called');

   var maxWidth = 1024;
   var maxHeight = 1024;
   // var bbox = '-180,-90,180,90';

   var mapOptions = options.plot.baseMap;

   var bordersOptions;
   if (options.plot.countryBorders) {
      bordersOptions = options.plot.countryBorders;
   }

   var dataOptions = options.plot.data.series[0].data_source;
   var id = dataOptions.layer_id;
   var wmsUrl = dataOptions.wmsUrl;
   var params = dataOptions.wmsParams;
   var slices = dataOptions.timesSlices;

   var bbox = dataOptions.bbox;
   var bboxArr = bbox.split(',');
   var bboxWidth = bboxArr[2] - bboxArr[0];
   var bboxHeight = bboxArr[3] - bboxArr[1];

   var height;
   var width;

   if ((bboxHeight / bboxWidth) <= 1) {
      height = Math.round((bboxHeight / bboxWidth) * maxWidth);
      width = maxWidth;
   } else {
      height = maxHeight;
      width = Math.round((bboxWidth / bboxHeight) * maxHeight);
   }

   var mapUrl = url.parse(mapOptions.wmsUrl);
   mapUrl.search = undefined;
   mapUrl.query = {
      SERVICE: 'WMS',
      VERSION: mapOptions.wmsParams.VERSION,
      REQUEST: 'GetMap',
      FORMAT: 'image/jpeg',
      TRANSPARENT: false,
      LAYERS: mapOptions.wmsParams.LAYERS,
      wrapDateLine: mapOptions.wmsParams.wrapDateLine,
      SRS: mapOptions.wmsParams.SRS,
      WIDTH: width,
      HEIGHT: height,
      BBOX: bbox
   };

   var borders = false;
   var bordersUrl;
   if (bordersOptions) {
      borders = true;
      bordersUrl = url.parse(bordersOptions.wmsUrl);
      bordersUrl.search = undefined;
      bordersUrl.query = {
         SERVICE: 'WMS',
         VERSION: bordersOptions.wmsParams.VERSION,
         REQUEST: 'GetMap',
         FORMAT: 'image/png',
         TRANSPARENT: true,
         LAYERS: bordersOptions.wmsParams.LAYERS,
         STYLES: bordersOptions.wmsParams.STYLES,
         wrapDateLine: mapOptions.wmsParams.wrapDateLine,
         SRS: bordersOptions.wmsParams.SRS,
         WIDTH: width,
         HEIGHT: height,
         BBOX: bbox
      };
   }

   // var mapURL = 'https://tiles.maps.eox.at/wms/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fjpg&LAYERS=terrain-light&SRS=EPSG%3A4326&wrapDateLine=true&WIDTH=1024&HEIGHT=512&STYLES=&BBOX=-180%2C-90%2C180%2C90';
   // var bordersURL = 'https://rsg.pml.ac.uk/geoserver/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=rsg%3Afull_10m_borders&STYLES=line-white&SRS=EPSG%3A4326&WIDTH=1024&HEIGHT=512&BBOX=-180%2C-90%2C180%2C90';

   var dataURL = url.parse(wmsUrl, true);
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
      WIDTH: width,
      HEIGHT: height,
      BBOX: bbox
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

   var q = async.queue(download, 10);

   q.push({
      uri: url.format(mapUrl),
      filename: '/tmp/map.jpg',
      id: 'map'
   }, downloadComplete);

   if (borders) {
      q.push({
         uri: url.format(bordersUrl),
         filename: '/tmp/borders.png',
         id: 'borders'
      }, downloadComplete);
   }

   for (var i = 0; i < slices.length; i++) {
      dataURL.query.TIME = slices[i];
      var filename = '/tmp/' + id + '_' + slices[i] + '.png';
      q.push({
         uri: url.format(dataURL),
         filename: filename,
         id: slices[i]
      }, downloadComplete);
   }

   var retries = {};

   function downloadComplete(err, task) {
      // console.log('Download Complete: ' + task.id);
      if (err) {
         if (retries[task.id] === undefined) {
            retries[task.id] = 0;
         }
         if (retries[task.id] < 4) {
            retries[task.id]++;
            q.push({
               uri: task.uri,
               filename: task.filename,
               id: task.id
            }, downloadComplete);
         } else {
            console.error(err);
         }
      } else {
         if (task.id == 'map') {
            mapDownloaded = true;
         } else if (task.id == 'borders') {
            bordersDownloaded = true;
         } else {
            Jimp.read(task.filename, function(err, image) {
               Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function(font) {
                  image.print(font, 10, 10, task.id);
                  image.write(task.filename, function() {
                     // console.log('Adding date to ' + task.id);
                     slicesCount++;
                     slicesDownloaded.push(task.filename);
                     if (mapDownloaded && (!borders || bordersDownloaded) && slicesDownloaded.length == slices.length) {
                        render();
                     }
                  });
               });
            });
            // console.log(id);
            // console.log('Slice:' + slicesCount);
         }
      }
   }

   function render() {
      console.log('Rendering');
      // Do the render thing!
      if (borders) {
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
            .on('end', finishedRendering)
            .run();
      } else {
         ffmpeg()
            .input('/tmp/map.jpg')
            .input('/tmp/' + id + '_' + '*' + '.png')
            .inputOption('-pattern_type glob')
            .inputFPS(1)
            .complexFilter('overlay')
            .output('/tmp/test.mp4')
            .outputFPS(30)
            .noAudio()
            .on('end', finishedRendering)
            .run();
      }
   }

   function finishedRendering() {
      console.log('Finished rendering! ^_^');
      for (var i = 0; i < slicesDownloaded.length; i++) {
         fs.remove(slicesDownloaded[i]);
      }
   }
};

function download(task, callback) {
   // console.log('Downloading ' + task.id);
   request(task.uri, {
         timeout: 60000
      })
      .on('error', done)
      .pipe(fs.createWriteStream(task.filename))
      .on('error', done)
      .on('close', done);

   function done(err) {
      callback(err, task);
   }
}