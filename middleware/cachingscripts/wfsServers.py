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
         'providerShortTag': 'bodc',
         'tag': 'gml:featuremembers',
         'style': {
            'default':{
               'strokeColor': "#00FF00",
               'strokeOpacity': 1,
               'strokeWidth': 3,
               'fillColor': "#FF5500",
               'fillOpacity': 0.5,
               'pointRadius': 6,
               'pointerEvents': "visiblePainted",             
               'fontSize': "12px",
               'fontFamily': "Courier New, monospace",
               'fontWeight': "bold",
               'labelOutlineColor': "white",
               'labelOutlineWidth': 3
            }
         }
      },
      'url': 'http://grid.bodc.nerc.ac.uk/web_services/wfs?' 
   },
   '50m_coastline': {
      'name': '50m_coastline',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'gn:ne_50m_coastline',
         'outputFormat': 'GML2'        
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': "#00FF00",
            'strokeOpacity': 1,
            'strokeWidth': 3
         }
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/wfs?'
   },
   'GreenlandSea': {
      'name': 'GreenlandSea',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:GreenlandSea',
         'outputFormat': 'GML2'        
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': "#00FF00",
            'strokeOpacity': 1,
            'strokeWidth': 3
         }
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'coast_high': {
      'name': 'coast_high',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:coast_high',
         'outputFormat': 'GML2'        
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': "#00FF00",
            'strokeOpacity': 1,
            'strokeWidth': 3
         }
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT12': {
      'name': 'AMT12',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT12',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'blue'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT13': {
      'name': 'AMT13',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT13',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'aqua'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT14': {
      'name': 'AMT14',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT14',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'lime'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT15': {
      'name': 'AMT15',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT15',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'magenta'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT16': {
      'name': 'AMT16',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT16',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'red'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT17': {
      'name': 'AMT17',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT17',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'orange'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'AMT19': {
      'name': 'AMT19',
      'params': {
         'service': 'wfs',
         'request': 'GetFeature',
         'version': '1.0.0',
         'TypeName': 'rsg:AMT19',
         'outputFormat': 'GML2'
      },
      'options': {
         'providerShortTag': 'rsg',
         'passthrough': True,
         'format': 'GML2',
         'style': {
            'strokeColor': 'yellow'
         } 
      },
      'url': 'http://rsg.pml.ac.uk/geoserver/rsg/ows?'
   },
   'The Black Sea': {
      'name': 'The_Black_Sea',
      'params': {},
      'options': {
         'providerShortTag': 'opec',
         'passthrough': True,
         'format': 'KML'
      },
      'url': 'black_sea.kml'
   }
   
}
