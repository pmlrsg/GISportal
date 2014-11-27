sensors = [
   {
      "name": "penlee",
      "options": {
         "providerShortTag": "PML"
      },
      "services": {
         "sos": {
            "url": "https://vortices.npm.ac.uk/thredds/sos/penlee/met-agg.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "SOS",
                  "request": "GetCapabilities",
                  "version": "1.0.0"
               },
               "DescribeSensor": {
                  "SERVICE": "SOS",
                  "request": "DescribeSensor",
                  "version": "1.0.0",
                  "outputFormat": 'text/xml;subtype="sensorML/1.0.1/profiles/ioos_sos/1.0"',
                  "procedure": "urn:ioos:station:Plymouth Marine Laboratory:Penlee"
               }
            }
         }
      },
      "observedProperty": {
         "http://mmisw.org/ont/cf/parameter/air_temperature": {
            "Confidence": "Low",
            "Ecosystem_Element": "Fish",
            "MSFD": [
               "Foodwebs",
               "Fisheries"
            ],
            "interval": "daily",
            "niceName": "Adult Cod",
            "region": "N. Atlantic"
         }
      }
   }
   
]