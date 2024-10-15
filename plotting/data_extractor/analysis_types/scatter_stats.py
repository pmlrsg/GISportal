import netCDF4 as netCDF
from extraction_utils import basic_scatter
import json

class ScatterStats(object):
	"""docstring for BasicStats"""
	def __init__(self, filenames):
		super(ScatterStats, self).__init__()
		
		
		self.variable1, self.variable2 = filenames.keys()
		self.filename1 = filenames[self.variable1]
		self.filename2 = filenames[self.variable2]

	def process(self):
		print("running basic processing on %s & %s" % (self.filename1, self.filename2))

		netcdf_file1 = netCDF.Dataset(self.filename1, "r")
		netcdf_file2 = netCDF.Dataset(self.filename2, "r")

		return json.dumps(basic_scatter(netcdf_file1, self.variable1, netcdf_file2, self.variable2))


		#netcdf_variable = netcdf_file[variable]





		