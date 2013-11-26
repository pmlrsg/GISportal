#!/usr/bin/env python

servers = {
   'hcmr': { 
      'name': 'hcmr',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/HCMR/POMERSEM_MED_19900101000000-19900131000000.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'HCMR'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/HCMR/POMERSEM_MED_19900101000000-19900131000000.nc?'
   },
   'pml_annual': { 
      'name': 'pml_annual',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/PML-Y-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/PML-Y-AGGSLOW?'
   },
   'pml_seasonal': { 
      'name': 'pml_seasonal',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/PML-S-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/PML-S-AGGSLOW?'
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
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/PML-D-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'PML'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/PML-D-AGGSLOW?'
   },
   'cefas': { 
      'name': 'cefas',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/CEFAS/resoutcut.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'Cefas'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/CEFAS/resoutcut.nc?'
   },
   'dmi': { 
      'name': 'dmi',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/DMI/chl.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'DMI'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/DMI/chl.nc?'
   },
   'ogs': { 
      'name': 'ogs',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/OGS/myov02-med-ogs-bio-reanalysis_1342796868410.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/OGS/myov02-med-ogs-bio-reanalysis_1342796868410.nc?'
   }
}
