#!/usr/bin/env python

servers = {
   'ecmwf_qair_monthly': { 
      'name': 'ecmwf_qair_monthly',
      'url': 'http://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/qair_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'http://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/qair_monthly.nc?'
   },
   'ecmwf_lwdown_monthly': { 
      'name': 'ecmwf_lwdown_monthly',
      'url': 'http://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/lwdown_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'http://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/lwdown_monthly.nc?'
   },
   'ecmwf_psurf_monthly': { 
      'name': 'ecmwf_psurf_monthly',
      'url': 'http://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/psurf_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF',
         'license': 'The Apache Software License',
         'licenseUrl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
         'allowDownload': 'false'
      },
      'wcsurl': 'http://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/psurf_monthly.nc?'
   },
   'ecmwf_rainf_monthly': { 
      'name': 'ecmwf_rainf_monthly',
      'url': 'http://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/rainf_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'http://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/rainf_monthly.nc?'
   },
   'ecmwf_forcing_swdown': { 
      'name': 'ecmwf_forcing_swdown',
      'url': 'http://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/swdown_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'http://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/swdown_monthly.nc?'
   },
   'ecmwf_forcing_snowf': { 
      'name': 'ecmwf_forcing_snowf',
      'url': 'http://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/snowf_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'http://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/snowf_monthly.nc?'
   },
    
  }
