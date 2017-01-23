var async = require('async');
var Jimp = require('jimp');

var queue = async.queue(processImage, 10);

process.on('message', function(options) {
   queue.push(options, imageDone);
});

function processImage(options, next) {
   // console.log('Timestamping ' + options.id);
   Jimp.read(options.tempPath, function(err, image) {
      if (err) {
         console.error(err);
      }
      Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(function(fontB) {
         Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function(fontW) {
            image.print(fontB, 10, 10, options.id);
            image.print(fontW, 11, 11, options.id);
            image.write(options.filePath, function(err) {
               next(err, options);
            });
         });
      });
   });
}

function imageDone(err, options) {
   if (err) {
      console.error(err);
   }
   // console.log('Timestamped ' + options.id);
   process.send(options);
}