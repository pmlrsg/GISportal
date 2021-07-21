import netCDF4 as netCDF
from extraction_utils.analysis_utils import basic, basicWFS
import json

class BasicStats(object):
	"""docstring for BasicStats"""
	def __init__(self, filename, variable, feature_variable, isLog=False):
		super(BasicStats, self).__init__()
		self.filename = filename
		self.variable = variable
		self.isLog = isLog
		self.feature_variable = feature_variable
		

	def process(self):
		#print "running basic processing on %s" % self.filename

		netcdf_file = netCDF.Dataset(self.filename, "r")
		return json.dumps(basic(netcdf_file, self.variable, isLog=self.isLog))


		#netcdf_variable = netcdf_file[variable]

	def processWFS(self):
		print("self.filename", type(self.filename), self.filename)
		
		with open(self.filename) as jsonFile:
			data = json.load(jsonFile)
			jsonFile.close()

		print("data", data)
		return json.dumps(basicWFS(data, self.feature_variable))





		