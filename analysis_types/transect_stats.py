import netCDF4 as netCDF
from extraction_utils import basic
import json

class TransectStats(object):
	"""docstring for TransectStats"""
	def __init__(self, filename, variable, _csv):
		super(TransectStats, self).__init__()
		self.filename = filename
		self.variable = variable
		self._csv = _csv
		

	def process(self):
		print "running basic processing on %s" % self.filename

		netcdf_file = netCDF.Dataset(self.filename, "r")
		return json.dumps(basic(netcdf_file, self.variable))


		#netcdf_variable = netcdf_file[variable]





		