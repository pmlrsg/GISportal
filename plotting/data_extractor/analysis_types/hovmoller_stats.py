import netCDF4 as netCDF
from extraction_utils import basic, hovmoller
import json

class HovmollerStats(object):
	"""docstring for BasicStats"""
	def __init__(self, files, xVariable, yVariable, dataVariable, progress_tracker=None):
		super(HovmollerStats, self).__init__()
		self.files = files
		self.xVariable = xVariable
		self.yVariable = yVariable
		self.dataVariable = dataVariable
		self.progress_tracker = progress_tracker
		

	def process(self):
		#print "running basic processing on %s" % self.files
		#print "gettingdata from %s" % self.files
		netcdf_file = netCDF.MFDataset(self.files, aggdim='time')
		#print netcdf_file.variables[self.dataVariable][:]
		return json.dumps(hovmoller(netcdf_file, self.xVariable, self.yVariable, self.dataVariable, self.progress_tracker))


		#netcdf_variable = netcdf_file[variable]





