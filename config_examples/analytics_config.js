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
  UATrackingId: 'UA-52647976-2',    // replace with a valid tracking id if enabled
  
  customDefinitions: {
    "cd1": 'indicator_name',
    "cd2": 'indicator_id',
    "cd3": 'indicator_region',
    "cd4": 'indicator_interval',
    "cd7": 'graph_type',
    "cd8": 'indicator_confidence',
    "cd11": 'indicator_provider',
    'cm1': "used_in_layer",
    'cm2': "used_in_graph",
    'cm3': 'graph_components_count'
  },
};

