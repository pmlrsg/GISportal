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
      "MSFD" : "MSFD"
   },
   popularIndicators : [
      "Heterotrophic flagellates biomass", "Net Primary Production", "Oxygen", "Temperature"
   ],
   defaultStates: [
      {
         "name" : "Cod in the North East Atlantic",
         "url" : "http://portaldev.marineopec.eu/?state=b8czastdcoioi",
         "icon" : "icon_map"
      },
      {
         "name" : "Seasonal Changes in Chlorophyll levels in the Med",
         "url" : "http://portaldev.marineopec.eu/?state=a9bmsjjtthehe",
         "icon" : "icon_analyse"
      },
      {
         "name" : "Interannual Nitrogen in the Baltic",
         "url" : "http://portaldev.marineopec.eu/?state=c7ebs12wvvmvm",
         "icon" : "icon_analyse"
      },
      {
         "name" : "Summer zooplankton growth in the Black Sea",
         "url" : "http://portaldev.marineopec.eu/?state=bqua1n6lk2yky",
         "icon" : "icon_map"
     }
   ],
};

