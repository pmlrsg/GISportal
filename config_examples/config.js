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
      "MSFD" : "MSFD"
   },
   popularIndicators : [
      "Z6c", "max_Chl_surf", "MicroZoo1",
      "NPP", "Oxygen"
   ],
   analytics: {
      active: true,
      UATrackingId: 'UA-52647976-1',
      
      customDimensions: {
         layerChange: {
            /**
            *  Layout:
            *     {{ cd_index : ( function(){} | predefined_function )
            *  Example:
            *     2 : 'indicator_name' //Call the indicator_name default function and apply to dimension 2
            *     3 : function( indicator ){ return indicator.name + "-" + indicator.id  } // Sets dimension 3 to the indicator name + id
            */
            8: 'indicator_name',
            9: 'indicator_id',
            2: 'indicator_region',
            3: 'indicator_interval',
            7: 'indicator_confidence',
            4: 'indicator_elevation',
            5: 'indicator_layer_style',
            10:'indicator_year'
         },
         
         selectionBoxDrawn: {
            8: 'indicator_name',
            9: 'indicator_id',
            2: 'indicator_region',
            3: 'indicator_interval'
         },
         
         selectionBoxTyped: {
            8: 'indicator_name',
            9: 'indicator_id',
            2: 'indicator_region',
            3: 'indicator_interval'
         },
         
         dateRangeUsed: {
            8: 'indicator_name',
            9: 'indicator_id',
            2: 'indicator_region',
            3: 'indicator_interval'
         },
         
         createGraph: {
            8: 'indicator_name',
            9: 'indicator_id',
            2: 'indicator_region',
            3: 'indicator_interval',
            6: 'graph_type'
         },
         
         
         //Does not a get a true gisportal.layer. Only: { 'name': 'Oxygen' }.
         selectLayer: {
            8: 'indicator_name'
         },
         
         //Does not a get a true gisportal.layer. Only: { 'name': 'Oxygen' }.
         deselectLayer: {
            8: 'indicator_name'
         },
         
         
         showLayer: {
            8: 'indicator_name'
         },
         
         hideLayer: {
            8: 'indicator_name'
         },
         
         timelineUpdate: {
            10: 'timeline_year'
         }
         
      }
      
   }
};
