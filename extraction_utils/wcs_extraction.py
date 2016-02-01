from owslib.wcs import WebCoverageService
import logging

class WCSHelper(object):
	"""docstring for WCSHelper"""
	def __init__(self, url, dates, variable, bbox):
		super(WCSHelper, self).__init__()
		self.url = url
		self.dates = dates
		self.variable = variable
		self.bbox = bbox
		self.owslib_log = logging.getLogger('owslib')
		self.owslib_log.setLevel(logging.DEBUG)
		self.wcs = WebCoverageService(url, version="1.0.0")

	def __repr__(self):
		return str(self.wcs)

	def getData(self):
		print '-'*20
		print self.bbox
		print "/".join(self.dates)
		time = ["2009-11-01T00:00:00Z"]
		output = self.wcs.getCoverage(identifier=self.variable, time=self.dates, bbox=self.bbox, format="NetCDF3")
		return output



		
