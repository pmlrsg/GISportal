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
      "http://s3.amazonaws.com/awesome_screenshot/6031237?AWSAccessKeyId=0R7FMW7AXRVCYMAPTPR2&Expires=1412255641&Signature=0ApcTLs7xDxJmCb9CNKeL1O%2FnV8%3D"
   ],
};

