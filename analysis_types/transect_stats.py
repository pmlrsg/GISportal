import netCDF4 as netCDF
from ..extraction_utils import basic, getCsvDict, find_closest, getCoordinateVariable
import json
import csv
import datetime
import numpy as np

class TransectStats(object):
	"""docstring for TransectStats"""
	def __init__(self, filename, variable, _csv):
		super(TransectStats, self).__init__()
		self.filename = filename
		self.variable = variable
		self._csv = _csv
		

	def process(self):
		#print "running basic processing on %s" % self.filename
		#print self.variable
		netcdf_file = netCDF.Dataset(self.filename, "r")
		time_var = netcdf_file.variables['time']
		data_var = np.array(netcdf_file.variables[self.variable])
		#print data_var.shape
		times = time_var[:]
		#print "times from netcdf file"
		times = [datetime.datetime.strptime(netCDF.num2date(x, time_var.units, calendar='standard').isoformat(), "%Y-%m-%dT%H:%M:%S") for x in times]
		#2010-10-01T00:00:00
		#print times

		with open(self._csv, "rb") as csvfile:
			csv_file = csvfile.read()
		data = csv.DictReader(csv_file.splitlines(), delimiter=',')
		lats = []
		lons = []
		dates = []
		ret = []
		last_lat = 0
		last_lon = 0
		last_time = 0
		for row in data:
			#print "getting data from %f %f for %s" % (float(row['Latitude']), float(row['Longitude']), row['Date'])
			#lats.append(row['Lat'])
			#lons.append(row['Lon'])
			#dates.append(datetime.datetime.strptime(row['Date'], "%d/%m/%Y %H:%M"))
			lat_var = getCoordinateVariable(netcdf_file, "Lat")[:]
			lon_var = getCoordinateVariable(netcdf_file, "Lon")[:]
			#print len(lat_var)
			if (len(lat_var) <= 1):
				lat_index = 0
			else:
				lat_offset = lat_var[1] - lat_var[0]
				current_lat = float(row['Latitude'])
				t_lat = current_lat - lat_var[0]
				lat_index = int(round(abs(t_lat / lat_offset)))

			if (len(lon_var) <= 1):
				lon_index = 0
			else:
				lon_offset = lon_var[1] - lon_var[0]
				current_lon = float(row['Longitude'])
				t_lon = current_lon - lon_var[0]
				lon_index = int(round(abs(t_lon / lon_offset)))


			# current_lat = float(row['Latitude'])
			# current_lon = float(row['Longitude'])
			# t_lat = current_lat - lat_var[0]
			# t_lon = current_lon - lon_var[0]
			# lat_index = int(round(abs(t_lat / lat_offset)))
			# lon_index = int(round(abs(t_lon / lon_offset)))
			# #lat_index = find_closest(getCoordinateVariable(netcdf_file, "Lat")[:],float(row['Latitude']), last_lat )
			#lon_index = find_closest(getCoordinateVariable(netcdf_file, "Lon")[:],float(row['Longitude']), last_lon )
			# print "index test"
			# print "found using find_closest"
			# print "lat : %f" % lat_index
			# print "lon : %f" % lon_index

			# print "found using offset_func"
			# print "lat : %f" % lat_idx
			# print "lon : %f" % lon_idx
			#print row['Date']
			track_date = datetime.datetime.strptime(row['Date'], "%d/%m/%Y %H:%M")
			#print track_date
			time_index = find_closest(times, track_date, last_time,time=True)
			last_lat = lat_index
			last_lon = lon_index
			last_time = time_index
			#print "indexs for lat,lon,time : %d %d %d" % (lat_index, lon_index, time_index)
			data = data_var[time_index][lat_index][lon_index]
			#print data
			_ret = {}
			_ret['track_date'] = track_date.isoformat()
			_ret['data_date'] = netCDF.num2date(time_var[time_index], time_var.units, calendar='standard').isoformat()
			_ret['track_lat'] = row['Latitude']
			_ret['track_lon'] = row['Longitude']
			_ret['data_value'] = float(data) if not np.isnan(data)  else "null"
			ret.append(_ret)

		return ret


		#netcdf_variable = netcdf_file[variable]





		