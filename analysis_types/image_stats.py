import netCDF4 as netCDF
from ..extraction_utils import basic, getCoordinateVariable
import json
import matplotlib.pyplot as plt
import decimal
import numpy as np

class ImageStats(object):
	"""docstring for ImageStats"""
	def __init__(self, filename, variable):
		super(ImageStats, self).__init__()
		self.filename = filename
		self.variable = variable


	def process(self):
		#print "running basic processing on %s" % self.filename
		# create three arrays, 1D lat 1D lon 2D data
		netcdf_file = netCDF.Dataset(self.filename, "r")
		variable = np.ma.masked_array(netcdf_file.variables[self.variable])
		lats = getCoordinateVariable(netcdf_file, "Lat")
		lons = getCoordinateVariable(netcdf_file, "Lon")
		time_dim_index = netcdf_file.variables[self.variable].dimensions.index('time')
		if 'depth' in netcdf_file.variables[self.variable].dimensions:
			depth_dim_index = netcdf_file.variables[self.variable].dimensions.index('depth')
		var_list = []
		lat_list = []
		lon_list = []
		print variable.shape
		if(len(variable.shape) > 3 ):
			var_list = [[float(x) if not np.isinf(x) and not np.isnan(x) else None for x in y  ] for y in np.nanmean(variable, axis=time_dim_index)]
			lat_list = [float(x) for x in lats]
			lon_list = [float(x) for x in lons]
		elif(len(variable.shape) > 2 ):
			var_list = [[float(x) if not np.isinf(x) and not np.isnan(x) else None for x in y  ] for y in np.nanmean(variable, axis=time_dim_index)]
			#var_list = [[float(x) for x in y] for y in variable[0]]
			lat_list = [float(x) for x in lats]
			lon_list = [float(x) for x in lons]
		else:
			var_list = [list(x) for x in variable]
			lat_list = [float(x) for x in lats]
			lon_list = [float(x) for x in lons]
		
		#print len(lat_list)
		#print len(lon_list)
		#print len(var_list)
		#print len(var_list[0])
		print lat_list
		_ret = {}
		_ret['vars'] = ['Data','Latitudes','Longitudes']
		_ret['data'] = []
		_ret['data'].append(var_list)
		_ret['data'].append(lat_list)
		_ret['data'].append(lon_list)
		#print json.dumps(_ret )
		return json.dumps(_ret )


		#netcdf_variable = netcdf_file[variable]





		