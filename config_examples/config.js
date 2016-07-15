/*------------------------------------*\
   Configuration
   This file is for the configuration
   of the GIS Portal.

   browseCategories - Used to define
   which categories to be shown in the
   browse panel. This is currently
   limited to 2.
\*------------------------------------*/



gisportal.config = {
   analytics:{
      active:false,
      UATrackingId: 'UATrackingId', // Replace with real tracking ID if enabled
      customDefinitions: {
         "cd1": 'indicator_name',
         "cd2": 'indicator_id',
         "cd3": 'indicator_region',
         "cd4": 'indicator_interval',
         "cd5": 'indicator_elevation',
         "cd6": 'indicator_layer_style',
         "cd7": 'graph_type',
         "cd8": 'indicator_confidence',
         "cd9": 'indicator_year',
         "cd10" : 'click_location',
         'cm1' : "used_in_layer",
         'cm2': "used_in_graph" // Used in layer
      }
   },

   catDisplayNames : { // Used to give a nice format to a tag category. overwrites the default title casing
      "msfd": "MSFD"
   },

   siteMode: "production", //(development|production)

    // Skip start screen only is the user has a saved state, requires T&C
   autoResumeSavedState: false,
   
   // Always skip the welcome page, also skips T&C
   skipWelcomePage: false,

   // Do we require terms and conditions agreement to use the portal
   requiresTermsAndCondictions: false,

   browseMode : 'selectlist',                       // (tabs|selectlist|simplelist) selectlist (default) = original method of 3 tabs; selectlist = makes all available categories selectable from a drop down list; simplelist = a simple list of all the ids in the portal
   defaultCategory: 'indicator_type',                     // used to give the default category to show.
   hiddenCategories: ['testing'],                     // a list of categories to not be shown.
   categoryPriorities: ['indicator_type', 'interval'], // This is a prioritised list of tags so they are shown at the top of the selectlist
   markdownPriorities: ['data_provider', 'indicator_type'], // This is a prioritised list of tags so they are shown in the right order in the markdown
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
      videoEnabled : false,                          // (true|false) > If false (or omitted) the collaboration video tab will be hidden
      protocol : 'http',                            // 'http' or 'https'; the connection is automagically upgraded to a websocket connection
      host : 'localhost',                  // the hostname of the node server running collaboration/index.js
      port : '',                                    // must match the port specified in collaboration/config/config.js
      path : '',                                    // optional path; must start with a /
   },
   // Should layers auto scale by default
   autoScale: true,

   // Should layers log by default
   defaultLog: false,

   // How many colourbands should scalebars have (1-255)
   colourbands: 255,

   // What the BELOWMINCOLOR should default to ('black', 'white', or 'transparent')
   belowMinColor: 'black',

   // What the ABOVEMAXCOLOR should default to ('black', 'white', or 'transparent')
   aboveMaxColor: 'black',

   // Bing Maps; in order to use the Bing Maps base layer you will need to register for an API key at https://www.bingmapsportal.com and enter your key here
   //bingMapsAPIKey: 'xxxxxxxxxxxx',


   // Deny access to older browsers
   // none=Allow, advisory=Tell them only, strict=Stop them
   browserRestristion: "strict", //(none|advisory|strict)

   // The HTML that you would like to be displayed on the splash welcome page.
   startPageHTML: '<p>The GIS portal provides model simulated, earth observation and in-situ data for global water resources.</p><p>Enter the portal now and plot data on a map, analyse it through graphs or export and share.</p>',

   aboutPage: "https://visual.pml.ac.uk/gisportal/", // The Page you would like the user to be taken to when they click 'About'. If not specified '/' will be used

   aboutText: "About", // The Text you would like the user to see on the 'About' button. If not specified 'About' will be used.

   pageTitle: "GIS Portal", // The Page title to be shown in the browser. If blank the title will be "GIS Portal",

   splashImage: '../img/PML-MAP-2.png', // The image that you would like to be displayed on the splash page

   logoImage: '../img/PML_LOGO.png'
};

