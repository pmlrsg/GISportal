#!/usr/bin/env python

servers = {
   'hawaii': { 
      'name': 'hawaii',
      'url': 'http://oos.soest.hawaii.edu/thredds/wms/hioos/satellite/dhw?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'HiOOS'
      },
      'wcsurl': 'http://oos.soest.hawaii.edu/thredds/wcs/hioos/satellite/dhw?'
   },
   'hcmr': { 
      'name': 'hcmr',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/HCMR/POMERSEM_MED_19900101000000-19900131000000.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'hcmr'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/HCMR/POMERSEM_MED_19900101000000-19900131000000.nc?'
   },
   'pml_monthly': { 
      'name': 'pml_monthly',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/PML-M-AGGSLOW?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'pml_monthly'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/PML-M-AGGSLOW?'
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
         'providerShortTag': 'pml_daily'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/PML-D-AGGSLOW?'
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
         'providerShortTag': 'dmi'
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
         'providerShortTag': 'ogs'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/OGS/myov02-med-ogs-bio-reanalysis_1342796868410.nc?'
   },
   'ccitim': { 
      'name': 'ccitim',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/CCITIM?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'ccitim'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/CCITIM?'
   },
   'esa_oc_cci_v095': { 
      'name': 'esa_oc_cci_v095',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/CCITIM2?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'esa_oc_cci_v095'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/CCITIM2?'
   }
}
