#!/usr/bin/env python

servers = {
   'motherlodeAlaska': { 
      'name': 'motherlodeAlaska',
      'url': 'http://motherlode.ucar.edu:8080/thredds/wms/fmrc/NCEP/GFS/Alaska_191km/NCEP-GFS-Alaska_191km_best.ncd?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'wcsurl': 'http://motherlode.ucar.edu:8080/thredds/wcs/fmrc/NCEP/GFS/Alaska_191km/NCEP-GFS-Alaska_191km_best.ncd?'
   },
   'hawaii': { 
      'name': 'hawaii',
      'url': 'http://oos.soest.hawaii.edu/thredds/wms/hioos/satellite/dhw?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'wcsurl': 'http://oos.soest.hawaii.edu/thredds/wcs/hioos/satellite/dhw?'
   },
   'ogs': { 
      'name': 'ogs',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/OGS/myov02-med-ogs-bio-reanalysis_1342796868410.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk:8080/thredds/wcs/OGS/myov02-med-ogs-bio-reanalysis_1342796868410.nc?'
   },
   'met-no': { 
      'name': 'met-no',
      'url': 'http://thredds.met.no/thredds/wms/osisaf_test/met.no/ice/conc_nh_agg?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'wcsurl': 'http://thredds.met.no/thredds/wcs/osisaf_test/met.no/ice/conc_nh_agg?'
   },
   'ccitim': { 
      'name': 'ccitim',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/CCITIM?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'wcsurl': ''
   },
   'metOffice': { 
      'name': 'metOffice',
      'url': 'http://earthserver.pml.ac.uk:8080/thredds/wms/metoffice_mrcs_agg/Met_Office_MRCS_best.ncd?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'wcsurl': ''
   }
}