from . import Extractor

class IrregularExtractor(Extractor):
	"""docstring for IrregularExtractor"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None):
		super(IrregularExtractor, self).__init__(wcs_url, extract_dates, extract_area, extract_variable)
		