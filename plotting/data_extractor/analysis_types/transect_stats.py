import netCDF4 as netCDF
from extraction_utils import basic, getCsvDict, find_closest, getCoordinateVariable
import json
import csv
import datetime
import numpy as np

class TransectStats(object):
   """docstring for TransectStats"""
   def __init__(self, files, variable, _csv):
      super(TransectStats, self).__init__()
      self.files = files
      self.variable = variable
      self._csv = _csv
      

   def process(self):
      netcdf_file = netCDF.MFDataset(self.files, aggdim='time')
      time_var = netcdf_file.variables['time']
      data_var = netcdf_file.variables[self.variable]

      times = time_var[:]

      if time_var.units:
         times = [datetime.datetime.strptime(netCDF.num2date(x, time_var.units, calendar='standard').isoformat(), "%Y-%m-%dT%H:%M:%S") for x in times]
      else:
         # the time variable doesn't have units; this can be caused by a thredds aggregation that uses dateFormatMark
         # to grab the date from the filename, in which case the date is an array of strings
         times = [datetime.datetime.strptime(x.tostring(), "%Y-%m-%dT%H:%M:%SZ") for x in times]

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
         lat_var = getCoordinateVariable(netcdf_file, "Lat")[:]
         lon_var = getCoordinateVariable(netcdf_file, "Lon")[:]
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

         track_date = datetime.datetime.strptime(row['Date'], "%d/%m/%Y %H:%M")

         time_index = find_closest(times, track_date,time=True)
         last_lat = lat_index
         last_lon = lon_index
      #    last_time = time_index

         data = data_var[time_index][lat_index][lon_index]

         _ret = {}
         _ret['track_date'] = track_date.isoformat()
         if time_var.units:
            _ret['data_date'] = netCDF.num2date(time_var[time_index], time_var.units, calendar='standard').isoformat()
         else:
            _ret['data_date'] = time_var[time_index].tostring()
         
         _ret['track_lat'] = row['Latitude']
         _ret['track_lon'] = row['Longitude']
         _ret['data_value'] = float(data) if not np.isnan(data)  else "null"
         ret.append(_ret)

      return ret




      