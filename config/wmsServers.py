#!/usr/bin/env python

servers = {
   'ecmwf_forcing_qair': { 
      'name': 'ecmwf_forcing_qair',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/qair_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/qair_monthly.nc?'
   },
   'ecmwf_forcing_lwdown': { 
      'name': 'ecmwf_forcing_lwdown',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/lwdown_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/lwdown_monthly.nc?'
   },
   'ecmwf_forcing_psurf': { 
      'name': 'ecmwf_forcing_psurf',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/psurf_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF',
         'license': 'The Apache Software License',
         'licenseUrl': 'https://www.apache.org/licenses/LICENSE-2.0.html',
         'allowDownload': 'false'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/psurf_monthly.nc?'
   },
   'ecmwf_forcing_rainf': { 
      'name': 'ecmwf_forcing_rainf',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/rainf_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/rainf_monthly.nc?'
   },
   'ecmwf_forcing_swdown': { 
      'name': 'ecmwf_forcing_swdown',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/swdown_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/swdown_monthly.nc?'
   },
   'ecmwf_forcing_snowf': { 
      'name': 'ecmwf_forcing_snowf',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/snowf_monthly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/snowf_monthly.nc?'
   },
    
  }
