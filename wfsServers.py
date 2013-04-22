#!/usr/bin/env python

servers = {
   'bodc': { 
      'name': 'bodc',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.1.0',
         'TypeName': 'bodc:O2025_SERIES',
         'propertyName': 'STARTDATE',
         'cql_filter': "PROJECTNAM='Oceans 2025 Theme 10 SO1 AMT' AND DATACAT='CTD or STD cast'",
         
      },
      'options': {
         'tag': 'gml:featuremembers'
      },
      'url': 'http://grid.bodc.nerc.ac.uk/web_services/wfs?' 
   }
#   '50m_coastline': {
#      'name': '50m_coastline',
#      'params': {
#         'service': 'wfs',
#         'request': 'GetFeature',
#         'version': '1.1.0',
#         'TypeName': 'gn:ne_50m_coastline',
#         'outputFormat': 'GML2'        
#      },
#      'options': {
#         'passthrough': True,
#         'format': 'GML2'
#      },
#      'url': 'http://rsg.pml.ac.uk/geoserver/wfs?'
#   }
}
