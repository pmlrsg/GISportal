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

   // these define how the user can search for indicators; this object uses the key as defined in the wmsLayers.py file
   // and assigns display names to each. If the `browseMode` flag is set to 'tabs' only the first three values are taken 
   // notice of to build the tabs on the indicator selection panel, but all categories are displayed on the indicator details
   // panel (provided a value has been set) once the indicator has been loaded onto the map.
   browseCategories : {
      "Ecosystem_Element" : "Ecosystem",
      "region": "Region",
      "MSFD" : "EU MSFD Descriptor"
   },
   browseMode : 'tabs',                       // (tabs|selectlist) tabs (default) = original method of 3 tabs; selectlist = makes all available categories selectable from a drop down list
   defaultCategory: '',                     // only used when browseMode = selectlist; any key value from browseCategories
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
   
   collaborationFeatures : {
      enabled : true,                               // (true|false) > If false the collaboration tab will be hidden
      protocol : 'http',                            // 'http' or 'https'; the connection is automagically upgraded to a websocket connection
      host : 'pmpc1465.npm.ac.uk',                  // the hostname of the node server running collaboration/index.js
      port : '',                                    // must match the port specified in collaboration/config/config.js
      path : '',                                    // optional path; must start with a /
   },
   // Should layers auto scale by default
   autoScale: true,

   requiresTermsAndCondictions: true,

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

