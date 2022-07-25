import netCDF4 as netCDF
from extraction_utils import basic, hovmoller
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
		#print "gettingdata from %s" % self.filename
		netcdf_file = netCDF.Dataset(self.filename, "r")
		#print netcdf_file.variables[self.dataVariable][:]
		return json.dumps(hovmoller(netcdf_file, self.xVariable, self.yVariable, self.dataVariable))


		#netcdf_variable = netcdf_file[variable]





