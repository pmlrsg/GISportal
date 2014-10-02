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
   browseCategories : {
      "Ecosystem_Element" : "Ecosystem",
      "region": "Region",
      "MSFD" : "EU MSFD"
   },
   paths: {
    graphServer: 'http://localhost:3000/',
    middlewarePath: '/service'
   },

   // Should layers auto scale by default
   autoScale: true,

   requiresTermsAndCondictions: true,

   homepageSlides: [
      "img/homepage-slides/opec1.png",
      "img/homepage-slides/opec2.png",
      "img/homepage-slides/opec3.png",
      "img/homepage-slides/opec4.png",
      "img/homepage-slides/opec5.png",
      "img/homepage-slides/opec6.png",
      "img/homepage-slides/opec7.png"
   ]
};

