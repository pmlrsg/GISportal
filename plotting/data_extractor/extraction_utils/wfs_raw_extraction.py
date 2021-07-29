import urllib
from urllib.request import urlopen
from urllib.parse import unquote

class WFSRawHelper(object):
	
	def __init__(self, url, variable, bbox, featureVariable):
		super(WFSRawHelper, self).__init__()
		self.url = url
		self.variable = variable
		self.bbox = bbox
		self.featureVariable = featureVariable

	def getData(self):
		output = self.getFeature()
		return output

	def generateGetFeatureUrl(self):
		params = {}
		params['Service'] = 'WFS'
		params['Request'] = 'GetFeature'
		params['version'] = '1.1.0'
		params['typename'] = self.variable
		params['outputFormat'] = 'JSON' # ? or CSV

		return urllib.parse.urlencode(params)
		ret = ''
		for key in params:
			ret += key+'='+params[key]+'&'
		if ret.endswith('&'):
			ret = ret[:-1]
		return ret


	def getFeature(self):
		if self.url.endswith("?"):
			full_url = unquote(self.url) + self.generateGetFeatureUrl()
		else:
			full_url = unquote(self.url) +'?'+ self.generateGetFeatureUrl()

		resp = urlopen(full_url)
		return resp
