from . import Extractor

class TransectExtractor(Extractor):
	"""docstring for TransectExtractor"""
	def __init__(self, wcs_url, extract_dates, transect_type, extract_area=None, extract_variable=None):
		super(TransectExtractor, self).__init__(wcs_url, extract_dates, extract_area=extract_area, extract_variable=extract_variable)
		
	def getData(self):
		print " I AM AN OVERLOADED FUNCTION"
		return "I WAS RETURNED FROM AN OVERLOADED FUNCTION"