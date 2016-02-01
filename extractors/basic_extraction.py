from . import Extractor

class BasicExtractor(Extractor):
	"""docstring for BasicExtractor"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None):
		super(BasicExtractor, self).__init__(wcs_url, extract_dates,  extract_area=extract_area, extract_variable=extract_variable)
		