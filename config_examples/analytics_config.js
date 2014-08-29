/*------------------------------------*\
    Configuration
    This file is for the configuration
    of the GIS Portal.

    browseCategories - Used to define
    which categories to be shown in the
    browse panel. This is currently
    limited to 2.
\*------------------------------------*/

gisportal.config.analytics = {
  active: false,                    // set to 'true' to enable tracking
  UATrackingId: 'UA-XXXXXXXX-X',    // replace with a valid tracking id if enabled
  
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
  },
  
  customDefinitionsUsedInEvents: {
     layerChange: [
          'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'indicator_elevation',
        'indicator_layer_style',
        'indicator_confidence',
        'indicator_year',
        'click_location',
        'used_in_layer'
     ],
     
     selectionBoxDrawn: [
        'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'click_location'
     ],
     
     selectionBoxTyped: [
        'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'click_location'
     ],
     
     dateRangeUsed: [
        'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'click_location'
     ],
     
     createGraph: [
        'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'indicator_elevation',
        'graph_type',
        'click_location',
        'used_in_graph'
     ],
     
     
     //Does not a get a true gisportal.layer. Only: [ 'name': 'Oxygen' ].
     selectLayer: [
        'indicator_name',
        'click_location'
     ],
     
     //Does not a get a true gisportal.layer. Only: [ 'name': 'Oxygen' ].
     deselectLayer: [
        'indicator_name',
        'click_location'
     ],
     
     
     showLayer: [
        'indicator_name',
        'click_location'
     ],
     
     hideLayer: [
        'indicator_name',
        'click_location'
     ],
     
     timelineUpdate: [
        'timeline_year',
        'click_location'
     ]
     
  }
  
}
