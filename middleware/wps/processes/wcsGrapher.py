from pywps.Process import WPSProcess
from pywps.Exceptions import *

class WCSGrapher(WPSProcess):
   def __init__(self):
      WPSProcess.__init__(self,
                          identifier = "wcsGrapher",
                          title = "WCS graph creator",
                          abstract = "Creates graphs from data provided by a WCS server",
                          version = 0.1,
                          storeSupported = True,
                          statusSupported = True)
      
      self.addLiteralInput(identifier = "coverage", title = "The name of the coverage to use", minOccurs = 1, maxOccurs = 1, type = type("String")) 
      self.addLiteralInput(identifier = "dataurl", title = "The url of the server to contact for data", minOccurs = 1, maxOccurs = 1, type = type("String"))    
      self.addLiteralInput(identifier = "format", title = "Format to get the data in", minOccurs = 0, maxOccurs = 1, type = type("String"), default = "NetCDF3", allowedValues = ["NetCDF3"] )
      self.addLiteralInput(identifier = "time", title = "Single time or a time range for the data to cover", minOccurs = 0, maxOccurs = 1, type = type("String"))
      self.addLiteralInput(identifier = "bbox", title = "Bbox covering the region wanted to graph", minOccurs = 0, maxOccurs = 1, type = type("String"))
      self.addLiteralOutput(identifier="stdout",title="Standard Output from gdalinfo", type = type("String"))
      #self.json = self.addComplexOutput(identifier = "jsonOutput", title = "Graph output as json", formats[{'mimeType':'application/json'}])
      
   def execute(self):
      self.outputs["stdout"].setValue("dfjdkfjd")
      