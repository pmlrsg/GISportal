from . import Extractor
from ..extraction_utils import WCSHelper, WCSRawHelper
import tempfile
import uuid


class ScatterExtractor(Extractor):
	"""docstring for BasicExtractor"""
	def __init__(self, wcs_url, wcs_url_2,extract_dates, extract_area=None, extract_variable=None, extract_variable_2=None):
		super(ScatterExtractor, self).__init__(wcs_url, extract_dates,  extract_area=extract_area, extract_variable=extract_variable)
		self.second_var = extract_variable_2
		self.wcs_url_2 = wcs_url_2


	def getData(self):
		#print "="*20
		#print self.extract_area
		# print self.wcs_url
		# print self.wcs_url_2
		wcs_extractor = WCSRawHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area)
		data = wcs_extractor.getData()
		fname_one = self.outdir+str(uuid.uuid4())+".nc"
		with open(fname_one, 'w') as outfile:
			outfile.write(data.read())
		wcs_extractor = WCSRawHelper(self.wcs_url_2, self.extract_dates, self.second_var, self.extract_area)
		data = wcs_extractor.getData()
		fname_two = self.outdir+str(uuid.uuid4())+".nc"
		with open(fname_two, 'w') as outfile:
			outfile.write(data.read())
		#print "getting data for %s and %s" % (self.extract_variable, self.second_var)

		return {self.extract_variable :fname_one, self.second_var : fname_two }
		# 