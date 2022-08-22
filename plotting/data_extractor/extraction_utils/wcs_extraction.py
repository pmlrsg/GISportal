import owslib
import logging

class WCSHelper(object):
	"""docstring for WCSHelper"""
	def __init__(self, url, dates, variable, bbox, single=False):
		super(WCSHelper, self).__init__()
		self.url = url
		self.single = single
		self.dates = dates
		self.variable = variable
		self.bbox = bbox
		self.owslib_log = logging.getLogger('owslib')
		self.owslib_log.setLevel(logging.DEBUG)
		self.wcs = "owslib.wcs.WebCoverageService(url, version=\"1.0.0\")"

	def __repr__(self):
		return str(self.wcs)

	def getData(self):
		#print '-'*20
		#print self.bbox
		#print self.dates
		if self.single :
			output = self.wcs.getCoverage(identifier=self.variable, time=[self.dates], bbox=self.bbox, format="NetCDF3")
		else:	
			output = self.wcs.getCoverage(identifier=self.variable, time=self.dates, bbox=self.bbox, format="NetCDF3")
		return output



		
