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
   'imsmetu_annual': { 
      'name': 'imsmetu_annual',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/IMSMETU-Y/BIMS0.1_HC_IMSMETU_blacksea_19900101-20090101_ANNUAL.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'IMS-METU'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/IMSMETU-Y/BIMS0.1_HC_IMSMETU_blacksea_19900101-20090101_ANNUAL.nc?'
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
   'ogs_ammonia': { 
      'name': 'ogs_ammonia',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ammonia.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ammonia.nc?'
   },
   'ogs_CarnMesozoo': { 
      'name': 'ogs_CarnMesozoo',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_CarnMesozoo.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_CarnMesozoo.nc?'
   },
   'ogs_Cdia': { 
      'name': 'ogs_Cdia',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cdia.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cdia.nc?'
   },
   'ogs_chl-dia': { 
      'name': 'ogs_chl-dia',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-dia.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-dia.nc?'
   },
   'ogs_chl-largephy': { 
      'name': 'ogs_chl-largephy',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-largephy.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-largephy.nc?'
   },
   'ogs_chl-nflag': { 
      'name': 'ogs_chl-nflag',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-nflag.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-nflag.nc?'
   },
   'ogs_chl-picophy': { 
      'name': 'ogs_chl-picophy',
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
   },
   'ogs_Clargephy': { 
      'name': 'ogs_Clargephy',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Clargephy.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Clargephy.nc?'
   },
   'ogs_Cnflag': { 
      'name': 'ogs_Cnflag',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cnflag.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cnflag.nc?'
   },
   'ogs_Cpicophy': { 
      'name': 'ogs_Cpicophy',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cpicophy.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cpicophy.nc?'
   },
   'ogs_HeteroFlag': { 
      'name': 'ogs_HeteroFlag',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_HeteroFlag.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_HeteroFlag.nc?'
   },
   'ogs_Microzoo': { 
      'name': 'ogs_Microzoo',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Microzoo.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Microzoo.nc?'
   },
   'ogs_nitrate': { 
      'name': 'ogs_nitrate',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_nitrate.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_nitrate.nc?'
   },
   'ogs_OmniMesozoo': { 
      'name': 'ogs_OmniMesozoo',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_OmniMesozoo.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_OmniMesozoo.nc?'
   },
   'ogs_oxygen': { 
      'name': 'ogs_oxygen',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_oxygen.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_oxygen.nc?'
   },
   'ogs_pCO': { 
      'name': 'ogs_pCO',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_pCO.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_pCO.nc?'
   },
   'ogs_phosphate': { 
      'name': 'ogs_phosphate',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_phosphate.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_phosphate.nc?'
   },
   'ogs_ppn': { 
      'name': 'ogs_ppn',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ppn.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ppn.nc?'
   },
   'ogs_PO4': { 
      'name': 'ogs_PO4',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3NH4_PO4.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3NH4_PO4.nc?'
   },
   'ogs_PO4': { 
      'name': 'ogs_PO4',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_PO4.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_PO4.nc?'
   },
   'ogs_SIO4': { 
      'name': 'ogs_SIO4',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_SIO4.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_SIO4.nc?'
   },
   'ogs_Anomaly': { 
      'name': 'ogs_Anomaly',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_sal_Anomaly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_sal_Anomaly.nc?'
   },
   'ogs_sal': { 
      'name': 'ogs_sal',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_sal.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_sal.nc?'
   },
   'ogs_silicate': { 
      'name': 'ogs_silicate',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_silicate.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_silicate.nc?'
   },
   'ogs_Anomaly': { 
      'name': 'ogs_Anomaly',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_tem_Anomaly.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_tem_Anomaly.nc?'
   },
   'ogs_temp': { 
      'name': 'ogs_temp',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_temp.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_temp.nc?'
   },
   'ogs_Totalchlorophyll': { 
      'name': 'ogs_Totalchlorophyll',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalchlorophyll.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalchlorophyll.nc?'
   },
   'ogs_TotalPhytoC': { 
      'name': 'ogs_TotalPhytoC',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_TotalPhytoC.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_TotalPhytoC.nc?'
   },
   'ogs_Totalzooplankton': { 
      'name': 'ogs_Totalzooplankton',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalzooplankton.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalzooplankton.nc?'
   },
   'ogs_nitrate': { 
      'name': 'ogs_nitrate',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_nitrate.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_nitrate.nc?'
   },
   'ogs_phosphate': { 
      'name': 'ogs_phosphate',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_phosphate.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_phosphate.nc?'
   },
   'ogs_silicate': { 
      'name': 'ogs_silicate',
      'url': 'http://earthserver.pml.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_silicate.nc?',
      'params': {
         'SERVICE': 'WMS',
         'request': 'GetCapabilities',
         'version': '1.3.0'
      },
      'options': {
         'providerShortTag': 'OGS'
      },
      'wcsurl': 'http://earthserver.pml.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_silicate.nc?'
   }
}
