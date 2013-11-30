#!/usr/bin/env python

servers = {
   'hcmr': { 
      'name': 'hcmr',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/HCMR-M-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'HCMR'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/HCMR-M-AGGSLOW?'
   },
   'pml_annual': { 
      'name': 'pml_annual',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/PML-Y-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/PML-Y-AGGSLOW?'
   },
   'pml_seasonal': { 
      'name': 'pml_seasonal',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/PML-S-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/PML-S-AGGSLOW?'
   },
   'pml_monthly': { 
      'name': 'pml_monthly',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/PML-M-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/PML-M-AGGSLOW?'
   },
   'pml_daily': { 
      'name': 'pml_daily',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/PML-D-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/PML-D-AGGSLOW?'
   },
   'cefas': { 
      'name': 'cefas',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/CEFAS/resoutcut.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'Cefas'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/CEFAS/resoutcut.nc?'
   },
   'dmi': { 
      'name': 'dmi',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/DMI/DMI_1990_2009.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'DMI'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/DMI/DMI_1990_2009.nc?'
   },
   'ogs': { 
      'name': 'ogs',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-picophy.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-picophy.nc?'
   }
}
