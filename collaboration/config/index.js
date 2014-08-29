
var config = {};

module.exports = Config;

/**
 * Applies configurations settings
 * for application.
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Config (app) {
   console.log("Attempt to load from config.json")
   try {
      config = require('./config.json');
      app.set('config', config);
      console.log('Config loaded from config.json');
   } catch (err) {
     console.log("Failed to load file config.json %j", err);
   }


}