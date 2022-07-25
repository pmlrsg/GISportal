import netCDF4 as netCDF
from extraction_utils import basic
import json

class BasicStats(object):
	"""docstring for BasicStats"""
	def __init__(self, filename, variable, isLog=False):
		super(BasicStats, self).__init__()
		self.filename = filename
		self.variable = variable
		self.isLog = isLog
		

	def process(self):
		#print "running basic processing on %s" % self.filename

		netcdf_file = netCDF.Dataset(self.filename, "r")
		return json.dumps(basic(netcdf_file, self.variable, isLog=self.isLog))


		#netcdf_variable = netcdf_file[variable]





		