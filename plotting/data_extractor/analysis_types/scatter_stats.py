import netCDF4 as netCDF
from extraction_utils import basic_scatter
import json

class ScatterStats(object):
	"""docstring for BasicStats"""
	def __init__(self, filenames, progress_tracker=None):
		super(ScatterStats, self).__init__()
		self.variable1, self.variable2 = filenames.keys()
		self.files1 = filenames[self.variable1]
		self.files2 = filenames[self.variable2]
		self.progress_tracker = progress_tracker

	def process(self):
		print "running basic processing on %s & %s" % (self.files1, self.files2)

		netcdf_file1 = netCDF.MFDataset(self.files1, aggdim='time')
		netcdf_file2 = netCDF.MFDataset(self.files2, aggdim='time')

		return json.dumps(basic_scatter(netcdf_file1, self.variable1, netcdf_file2, self.variable2, self.progress_tracker))


		#netcdf_variable = netcdf_file[variable]





		