#!/usr/bin/env python

servers = {
   'ecmwf_forcing_lwdown': { 
      'name': 'ecmwf_forcing_lwdown',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/lwdown_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/lwdown_3hourly.nc?'
   },
   'ecmwf_forcing_psurf': { 
      'name': 'ecmwf_forcing_psurf',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/psurf_3hourly.nc?',
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
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/psurf_3hourly.nc?'
   },
   'ecmwf_forcing_qair': { 
      'name': 'ecmwf_forcing_qair',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/qair_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/qair_3hourly.nc?'
   },
   
   'ecmwf_forcing_rainf': { 
      'name': 'ecmwf_forcing_rainf',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/rainf_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/rainf_3hourly.nc?'
   },
   'ecmwf_forcing_swdown': { 
      'name': 'ecmwf_forcing_swdown',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/swdown_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/swdown_3hourly.nc?'
   },
   'ecmwf_forcing_snowf': { 
      'name': 'ecmwf_forcing_snowf',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/snowf_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/snowf_3hourly.nc?'
   },
   'ecmwf_forcing_tair': { 
      'name': 'ecmwf_forcing_tair',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/tair_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/tair_3hourly.nc?'
   },
   'ecmwf_forcing_wind': { 
      'name': 'ecmwf_forcing_wind',
      'url': 'https://wci.earth2observe.eu/thredds/wms/ecmwf/met_forcing_v0/wind_3hourly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ECMWF'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/ecmwf/met_forcing_v0/wind_3hourly.nc?'
   },
   'esa_cci_soilmoisture': { 
      'name': 'esa_cci_soilmoisture',
      'url': 'https://wci.earth2observe.eu/thredds/wms/tuw/esa-cci-soilmoisture-daily-agg.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'TUW'
      },
      'wcsurl': 'https://wci.earth2observe.eu/thredds/wcs/tuw/esa-cci-soilmoisture-daily-agg.nc?'
   },
    
  }
