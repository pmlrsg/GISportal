import netCDF4 as netCDF
from extraction_utils import basic
import json

class BasicStats(object):
	"""docstring for BasicStats"""
	def __init__(self, files, variable, progress_tracker=None):
		super(BasicStats, self).__init__()
		self.files = files
		self.variable = variable
		self.progress_tracker = progress_tracker

	def process(self):
		#print "running basic processing on %s" % self.files

		netcdf_file = netCDF.MFDataset(self.files, aggdim='time')
		return json.dumps(basic(netcdf_file, self.variable, self.progress_tracker))


		#netcdf_variable = netcdf_file[variable]





		