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
      "Ecosystem_Element" : "MSFD",
      "MSFD" : "Ecosystem"
   },
   popularIndicators : [
      "PSurf", 
      "Rainf", 
      "LWdown",
      "Qair",
   ]
};
