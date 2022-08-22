import tempfile
import uuid


class Extractor(object):
	"""base Extractor class providing basic functions"""
	def __init__(self, wcs_url, extract_dates=None, extract_area=None, extract_variable=None, feature_variable=None, extract_depth=None, outdir="/tmp/"):
		super(Extractor, self).__init__()
		self.wcs_url = wcs_url
		self.extract_dates = extract_dates
		self.extract_area = extract_area
		self.extract_variable = extract_variable
		self.extract_depth= extract_depth
		self.outdir = outdir
		self.feature_variable = feature_variable

        #@TODO_BOD fix this method to be python 3
	#def __repr__(self):
	#	return "< "+str(self.__class__)+"  "+self.wcs_url+" , ["+",".join(self.extract_dates)+"] >"


	def getData(self):
		pass

	def metadataBlock(self):
		ret = {}
		ret['variable'] = self.extract_variable
		ret['extract_dates'] = self.extract_dates
		ret['extract_area'] = self.extract_area
		ret['wcs_url'] = self.wcs_url

		return ret
