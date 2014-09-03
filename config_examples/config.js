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
   browseCategories : {
      "Ecosystem_Element" : "Ecosystem",
      "region": "Region",
      "MSFD" : "MSFD"
   },
   popularIndicators : [
      "Heterotrophic flagellates biomass", "Net Primary Production", "Oxygen", "Temperature"
   ],
   defaultStates: [
      {
         "name" : "Cod in the North East Atlantic",
         "url" : "http://portaldev.marineopec.eu/?state=b8czastdcoioi"
      },
      {
         "name" : "Seasonal Changes in Chlorophyll levels in the Med",
         "url" : "http://portaldev.marineopec.eu/?state=a9bmsjjtthehe"
      },
      {
         "name" : "Interannual Nitrogen in the Baltic",
         "url" : "http://portaldev.marineopec.eu/?state=c7ebs12wvvmvm"
      },
      {
         "name" : "Summer zooplankton growth in the Black Sea",
         "url" : "http://portaldev.marineopec.eu/?state=bqua1n6lk2yky"
     }
   ],
};

