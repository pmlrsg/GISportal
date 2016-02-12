/*------------------------------------*\
   Configuration
   This file is for the configuration
   of the GIS Portal.

   browseCategories - Used to define
   which categories to be shown in the
   browse panel. This is currently
   limited to 2.
\*------------------------------------*/



$.extend(gisportal.config, {
   siteMode: "development", //(development|production)

    // Skip start screen only is the user has a saved state, requires T&C
   autoResumeSavedState: false,
   
   // Always skip the welcome page, also skips T&C
   skipWelcomePage: false,

   // Do we require terms and conditions agreement to use the portal
   requiresTermsAndCondictions: true,

   browseMode : 'selectlist',                       // (tabs|selectlist) tabs (default) = original method of 3 tabs; selectlist = makes all available categories selectable from a drop down list
   defaultCategory: 'indicator_type',                     // used to give the default category to show.
   countryBorder : {
      'defaultLayer' : 'countries_all_white',      // (countries_all_white|countries_all_black|countries_all_blue)
      'alwaysVisible' : false                      // (true|false)  > If true the defaultLayer will be visible at page load
   },
   defaultBaseMap: 'EOX',
   showGraticules: true,                           // (true|false)   Display latitude and longitude lines on the map

   defaultStyle: "boxfill/rainbow",

   cacheTimeout: 60,                               // Used to specify what time must elapse before the cache can be refreshed by the user
   
   collaborationFeatures : {
      enabled : false,                               // (true|false) > If false the collaboration tab will be hidden
      protocol : 'http',                            // 'http' or 'https'; the connection is automagically upgraded to a websocket connection
      host : 'pmpc1465.npm.ac.uk',                  // the hostname of the node server running collaboration/index.js
      port : '',                                    // must match the port specified in collaboration/config/config.js
      path : '',                                    // optional path; must start with a /
   },
   // Should layers auto scale by default
   autoScale: true,

   requiresTermsAndCondictions: true,

   // Bing Maps; in order to use the Bing Maps base layer you will need to register for an API key at https://www.bingmapsportal.com and enter your key here
   //bingMapsAPIKey: 'xxxxxxxxxxxx',


   // Deny access to older browsers
   // none=Allow, advisory=Tell them only, strict=Stop them
   browserRestristion: "strict", //(none|advisory|strict)

   startPageHTML: '<p>The GIS portal provides model simulated, earth observation and in-situ data for global water resources.</p><p>Enter the portal now and plot data on a map, analyse it through graphs or export and share.</p>'

});

