from . import Extractor
from extraction_utils import WCSHelper
import tempfile
import uuid

class TransectExtractor(Extractor):
	"""docstring for TransectExtractor"""
	def __init__(self, wcs_url, extract_dates, transect_type, extract_area=None, extract_variable=None):
		super(TransectExtractor, self).__init__(wcs_url, extract_dates, extract_area=extract_area, extract_variable=extract_variable)
		
	def getData(self):
		print " I AM AN OVERLOADED FUNCTION"
		print self.extract_area
		print "="*20
		print self.extract_area
		wcs_extractor = WCSHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area)
		data = wcs_extractor.getData()
		fname = self.outdir+str(uuid.uuid4())+".nc"
		with open(fname, 'w') as outfile:
			outfile.write(data.read())
		return fname
