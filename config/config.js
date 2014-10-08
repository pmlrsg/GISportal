/*------------------------------------*\
    Configuration
    This file is for the configuration
    of the GIS Portal.

    browseCategories - Used to define
    which categories to be shown in the
    browse panel. This is currently
    limited to 2.
\*------------------------------------*/


// gisportal.config = {
//    browseCategories : {
//       "Ecosystem_Element" : "Ecosystem",
//       "MSFD" : "MSFD"
//    },
//    popularIndicators : [
//       "Z6c", "max_Chl_surf", "MicroZoo1",
//       "NPP", "Oxygen"
//    ]
// };

gisportal.config = {
   browseCategories : {
      "indicator_type" : "Indicator Type",
      "data_provider" : "Data Provider",
      "region" : "Region"
   },
   popularIndicators : [
      "Rainfall Rate",
      "Near surface specific humidity",
      "Surface incident longwave radiation",
      "Surface incident shortwave radiation"
   ],
   paths: {
    graphServer: 'https://wci.earth2observe.eu/plotting',
    middlewarePath: '/service'
   },

   // Should layers auto scale by default
   autoScale: true,
   requiresTermsAndCondictions: true,
   
};
