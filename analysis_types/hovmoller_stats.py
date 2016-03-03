import netCDF4 as netCDF
from ..extraction_utils import basic, hovmoller
import json

class HovmollerStats(object):
	"""docstring for BasicStats"""
	def __init__(self, filename, xVariable, yVariable, dataVariable):
		super(HovmollerStats, self).__init__()
		self.filename = filename
		self.xVariable = xVariable
		self.yVariable = yVariable
		self.dataVariable = dataVariable
		

	def process(self):
		#print "running basic processing on %s" % self.filename

		netcdf_file = netCDF.Dataset(self.filename, "r")
		return json.dumps(hovmoller(netcdf_file, self.xVariable, self.yVariable, self.dataVariable))


		#netcdf_variable = netcdf_file[variable]





