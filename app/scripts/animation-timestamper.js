var async = require('async');
var Jimp = require('jimp');

var queue = async.queue(processImage, 2);

var fontB = null;
var fontW = null;

Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(function(font) {
   fontB = font;
});
Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function(font) {
   fontW = font;
});

process.on('message', function(options) {
   queue.push(options, imageDone);
});

function processImage(options, next) {
   if (fontB === null || fontW === null) {
      // If the fonts aren't ready yet
      setTimeout(function() {
         processImage(options, next);
      }, 50);
      return;
   }

   Jimp.read(options.tempPath, function(err, image) {
      if (err) {
         err = err.toString();
         return next(err, options);
      }
      image.print(fontB, 10, 10, options.id);
      image.print(fontW, 11, 11, options.id);
      image.write(options.tempPath, function(err) {
         return next(err, options);
      });
   });
}

function imageDone(err, options) {
   if (err) {
      queue.kill();
      options.err = err;
   }
   process.send(options);
}