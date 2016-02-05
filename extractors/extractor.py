from extraction_utils import WCSHelper
import tempfile
import uuid


class Extractor(object):
	"""base Extractor class providing basic functions"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None):
		super(Extractor, self).__init__()
		self.wcs_url = wcs_url
		self.extract_dates = extract_dates
		self.extract_area = extract_area
		self.extract_variable = extract_variable
		self.outdir = "/users/rsg/olcl/scratch/extractor_testing/"

	def __repr__(self):
		return "< "+str(self.__class__)+"  "+self.wcs_url+" , ["+",".join(self.extract_dates)+"] >"


	def getData(self):
		pass