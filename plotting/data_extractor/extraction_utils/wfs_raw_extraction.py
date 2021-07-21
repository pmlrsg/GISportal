import logging
import urllib
from urllib.request import urlopen

class WFSRawHelper(object):
	
	def __init__(self, url, variable, bbox, featureVariable):
		super(WFSRawHelper, self).__init__()
		self.url = url
		self.variable = variable
		self.bbox = bbox
		self.featureVariable = featureVariable

	def getData(self):
		output = self.getFeature()
		print("output", output)
		return output

	def generateGetFeatureUrl(self):
		params = {}
		params['Service'] = 'WFS'
		params['Request'] = 'GetFeature'
		params['version'] = '1.1.0'
		params['typename'] = self.variable
		params['outputFormat'] = 'JSON' # ? or CSV


		print("generate get feature url", urllib.parse.urlencode(params))
		print("")
		return urllib.parse.urlencode(params)
		ret = ''
		for key in params:
			ret += key+'='+params[key]+'&'
		if ret.endswith('&'):
			ret = ret[:-1]
		return ret


	def getFeature(self):
		if self.url.endswith("?"):
			print(1)
			full_url = self.url + self.generateGetFeatureUrl()
		else:
			print(2)
			full_url = self.url +'?'+ self.generateGetFeatureUrl()
		#print full_url
		print("full url", full_url)
		full_url = "http://rsg.pml.ac.uk/geoserver/rsg/wfs?Service=WFS&Request=GetFeature&version=1.1.0&typename=scipper:emission_sensible_15th_october&outputFormat=JSON"
		resp = urlopen(full_url)
		return resp
