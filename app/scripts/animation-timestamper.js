var async = require('async');
var Jimp = require('jimp');

// Create queue
var queue = async.queue(processImage, 2);

// Preload fonts
var fontB = null;
var fontW = null;
Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(function(font) {
   fontB = font;
});
Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function(font) {
   fontW = font;
});

process.on('message', function(options) {
   // Add each image received to the queue
   queue.push(options, imageDone);
});

/**
 * Process an image to stamp it's ID (time) in the corner
 * @param  {object}   options The image options
 * @param  {Function} next    Function to call on completion or error
 */
function processImage(options, next) {
   if (fontB === null || fontW === null) {
      // If the fonts aren't ready yet then wait and try again
      setTimeout(function() {
         processImage(options, next);
      }, 50);
      return;
   }

   Jimp.read(options.tempPath, function(err, image) {
      if (err) {
         // Convert err to string as it is an unusual object type
         err = err.toString();
         return next(err, options);
      }
      image.print(fontB, 10, 10, options.id);
      image.print(fontW, 11, 11, options.id);
      image.write(options.tempPath, function(err) {
         if (err) {
            err = err.toString();
         }
         return next(err, options);
      });
   });
}

/**
 * When an image has been processed, send it's details back to the parent process
 * @param  {string} err     An error string or null
 * @param  {object} options The image options
 */
function imageDone(err, options) {
   if (err) {
      queue.kill();
      options.err = err;
   }
   process.send(options);
}