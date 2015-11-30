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
   siteMode: "development", //(development|production)

    // Skip start screen only is the user has a saved state, requires T&C
   autoResumeSavedState: false,
   
   // Always skip the welcome page, also skips T&C
   skipWelcomePage: false,

   // Do we require terms and conditions agreement to use the portal
   requiresTermsAndCondictions: true,

   browseMode : 'tabs',                       // (tabs|selectlist) tabs (default) = original method of 3 tabs; selectlist = makes all available categories selectable from a drop down list
   defaultCategory: 'indicator_type',                     // used to give the default category to show.
   paths: {
    graphServer: 'http://localhost:3000/',
    middlewarePath: '/service'
   },
   countryBorder : {
      'defaultLayer' : 'countries_all_white',      // (countries_all_white|countries_all_black|countries_all_blue)
      'alwaysVisible' : false                      // (true|false)  > If true the defaultLayer will be visible at page load
   },
   defaultBaseMap: 'EOX',
   showGraticules: true,                           // (true|false)   Display latitude and longitude lines on the map

   defaultStyle: "boxfill/rainbow",

   cacheTimeout: 60,                               // Used to specify what time must elapse before the cache can be refreshed by the user
   
   // Should layers auto scale by default
   autoScale: true,


   // Bing Maps; in order to use the Bing Maps base layer you will need to register for an API key at https://www.bingmapsportal.com and enter your key here
   //bingMapsAPIKey: 'xxxxxxxxxxxx',

   homepageSlides: [
      "img/homepage-slides/opec1.jpg",
      "img/homepage-slides/opec2.jpg",
      "img/homepage-slides/opec3.jpg",
      "img/homepage-slides/opec4.jpg",
      "img/homepage-slides/opec5.jpg",
      "img/homepage-slides/opec6.jpg",
      "img/homepage-slides/opec7.jpg"
   ],

   // Deny access to older browsers
   // none=Allow, advisory=Tell them only, strict=Stop them
   browserRestristion: "strict" //(none|advisory|strict)

};

