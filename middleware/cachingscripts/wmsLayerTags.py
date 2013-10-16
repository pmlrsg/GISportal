layers = {
   # Server name from the wms server list
   'motherlodeAlaska': {
      # Layer name 
      'Total_precipitation': {
         'niceName': 'Total Precipitation',
         'type': 'Precipitation',
         'interval': '3 hours'
      }                
   },
   'pml_monthly': {
      # Layer name 
      'Chl4': {
         'niceName': 'Chlorophyll-a Large Plankton',
         'type': 'Chlorophyll',
         'region': ('UK Shelf Seas'),
         'interval': 'Monthly'
      }                
   },
   'dmi': {
      # Layer name 
      'chl': {
         'niceName': 'Chlorophyll',
         'type': 'Chlorophyll',
         'region': ('Baltic'),
         'interval': 'Monthly'
      }                
   },
                  
   'ccitim': {
      'chlor_a': {
         'niceName': 'SeaDAS Concentration of Chlorophyll-a',
         'niceTitle': 'Mass concentration of chlorophyll-a in sea water',
         'type': 'Chlorophyll-a',
         'measurement': 'milligram m-3'
      },
              
      'chlor_a_bias_uncertainty': {
         'niceName': 'SeaDAS Concentration of Chlorophyll-a Uncertainty'
      }
   }
}
