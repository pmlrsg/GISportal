import json
import urllib
import urllib2
from . import Extractor
import tempfile
import uuid

class SOSExtractor(Extractor):
   """docstring for BasicExtractor"""
   def __init__(self, wcs_url, extract_dates, offering, observed_property, feature, extract_area=None, extract_variable=None, extract_depth=None):
      super(SOSExtractor, self).__init__(wcs_url, extract_dates,  extract_area=extract_area, extract_variable=extract_variable, extract_depth=extract_depth)
      self.offering = offering
      self.observed_property = observed_property
      self.feature = feature
      self.sos_url = wcs_url


   def getData(self):
      date_from = self.extract_dates[0]
      date_to = self.extract_dates[1]

      request_data = {
         'service': 'SOS',
         'request': 'GetResult',
         'version': '2.0.0',
         "offering": self.offering,
         "observedProperty": self.observed_property,
         "featureOfInterest": self.feature,
         "temporalFilter": [
            {
               "during": {
               "ref": "om:phenomenonTime",
               "value": [
                  date_from,
                  date_to
               ]
               }
            }
         ]
      }
      data = json.dumps(request_data)
      print data
      headers = {
         'Accept': 'application/json',
         'Content-Type': 'application/json'
      }

      req = urllib2.Request(self.sos_url, data, headers)
      res = urllib2.urlopen(req)

      fname = self.outdir+str(uuid.uuid4())+".txt"
      with open(fname, 'w') as outfile:
         outfile.write(res.read())
      return fname