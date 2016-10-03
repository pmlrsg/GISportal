import json
import urllib
import urllib2
from . import Extractor
import tempfile
import uuid

class SOSExtractor(Extractor):
   """docstring for BasicExtractor"""
   def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None, extract_depth=None):
      super(SOSExtractor, self).__init__(wcs_url, extract_dates,  extract_area=extract_area, extract_variable=extract_variable, extract_depth=extract_depth)
      
   def getData(self):
      request_data = {
         'service': 'SOS',
         'request': 'GetResult',
         'version': '2.0.0',
         "offering": "PenleeMet",
         "observedProperty": "http://mmisw.org/ont/cf/parameter/air_temperature",
         "featureOfInterest": "penlee",
         "temporalFilter": [
            {
               "during": {
               "ref": "om:phenomenonTime",
               "value": [
                  "2014-05-02T11:20:00.000Z",
                 "2019-08-22T18:00:00.000Z"
                  ]
               }
            }
         ]
      }
      data = json.dumps(request_data)

      headers = {
         'Accept': 'application/json',
         'Content-Type': 'application/json'
      }

      req = urllib2.Request(self.wcs_url, data, headers)
      res = urllib2.urlopen(req)

      fname = self.outdir+str(uuid.uuid4())+".txt"
      with open(fname, 'w') as outfile:
         outfile.write(res.read())
      return fname