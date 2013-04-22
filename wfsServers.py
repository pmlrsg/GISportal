#!/usr/bin/env python

servers = {
   'bodc': { 
      'name': 'bodc',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.3.0',
         'TypeName': 'bodc:O2025_SERIES',
         'propertyName': 'STARTDATE',
         'cql_filter': "PROJECTNAM='Oceans 2025 Theme 10 SO1 AMT' AND DATACAT='CTD or STD cast'",
         
      },
      'options': {
         'format': 'image/png',
         'transparent': True,
         'exceptions': 'XML'
      },
      'url': 'http://grid.bodc.nerc.ac.uk/web_services/wfs?' 
   }
}
