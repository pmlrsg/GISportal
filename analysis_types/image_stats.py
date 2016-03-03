import netCDF4 as netCDF
from ..extraction_utils import basic
import json
import matplotlib.pyplot as plt

class ImageStats(object):
	"""docstring for ImageStats"""
	def __init__(self, filename, variable):
		super(ImageStats, self).__init__()
		self.filename = filename
		self.variable = variable
		

	def process(self):
		#print "running basic processing on %s" % self.filename

		netcdf_file = netCDF.Dataset(self.filename, "r")
		variable = netcdf_file.variables[self.variable]
		plt.figure()
		plt.imshow(variable[:])
		
		return json.dumps(basic(netcdf_file, self.variable))


		#netcdf_variable = netcdf_file[variable]





		