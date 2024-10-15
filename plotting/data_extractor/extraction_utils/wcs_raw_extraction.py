import logging
import urllib
import urllib3

class WCSRawHelper(object):
	"""docstring for WCSHelper
	https://rsg.pml.ac.uk/thredds/wcs/CCI_ALL-v2.0-MONTHLY?Service=WCS&Format=NetCDF3&Request=GetCoverage&version=1.0.0&BBOX=47.92008333,1.0731783,125.83,30.4258&Coverage=chlor_a&Time=2009-01-07%2000:00:00/2016-02-24%2000:00:00
	"""
	def __init__(self, url, dates, variable, bbox, depth,single=False):
		super(WCSRawHelper, self).__init__()
		self.url = url
		self.single = single
		self.dates = dates
		self.variable = variable
		self.bbox = bbox
		self.depth = depth

	def __repr__(self):
		return str(self.wcs)

	def getData(self):
		#print '-'*20
		#print self.bbox
		#print self.dates
		if self.single :
			output = self.getCoverage()
		else:	
			output = self.getCoverage()
		return output

	def generateGetCoverageUrl(self):
		params = {}
		params['Service'] = 'WCS'
		params['Request'] = 'GetCoverage'
		params['version'] = '1.0.0'
		params['Coverage'] = self.variable
		if(self.depth):
			params['Vertical'] = self.depth
		if(not isinstance(self.dates, str)):
			# Should join with '/'?
			params['Time'] = urllib.quote_plus(','.join(self.dates))
		else:
			params['Time'] = urllib.quote_plus(self.dates)
		if(not isinstance(self.bbox, str)):
			params['BBOX'] = ','.join([str(x) for x in self.bbox])
		else:
			params['BBOX'] = self.bbox
		params['Format'] = 'NetCDF3'
		#print params
		ret = ''
		for key in params:
			ret += key+'='+params[key]+'&'
		if ret.endswith('&'):
			ret = ret[:-1]
		return ret


	def getCoverage(self):
		if self.url.endswith("?"):
			full_url = self.url + self.generateGetCoverageUrl()
		else:
			full_url = self.url +'?'+ self.generateGetCoverageUrl()
		#print full_url
		resp = urllib3.urlopen(full_url)
		return resp

	def generateDescribeCoverageUrl(self):
		params = {}
		params['Service'] = 'WCS'
		params['Request'] = 'DescribeCoverage'
		params['version'] = '1.0.0'
		params['Coverage'] = self.variable
		#print params
		ret = ''
		for key in params:
			ret += key+'='+params[key]+'&'
		if ret.endswith('&'):
			ret = ret[:-1]
		return ret

	def describeCoverage(self):
		if self.url.endswith("?"):
			full_url = self.url + self.generateDescribeCoverageUrl()
		else:
			full_url = self.url +'?'+ self.generateDescribeCoverageUrl()
		#print full_url
		resp = urllib3.urlopen(full_url)
		return resp.read()