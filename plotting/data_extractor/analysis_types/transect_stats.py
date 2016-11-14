import csv
import datetime
import netCDF4 as netCDF
import numpy as np
from extraction_utils import find_closest, getCoordinateVariable
try:
   from plotting.debug import debug
   from plotting.status import Plot_status, update_status
   plotting = True
except ImportError:
   plotting = False

import time


class TransectStats(object):
   """docstring for TransectStats"""

   def __init__(self, files, variable, _csv, status_details=None):
      super(TransectStats, self).__init__()
      self.files = files
      self.variable = variable
      self._csv = _csv
      self.status_details = status_details
      self.percentage = 0

   def process(self):
      if plotting:
         debug(2, "Extracting...")
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
      with open(self._csv, "rb") as csvfile:
         self.numline = len(csvfile.readlines())

      data = csv.DictReader(csv_file.splitlines(), delimiter=',')

      ret = []

      times_sorted_indexes = np.argsort(times)
      times_sorted = np.sort(times)

      lat_var = getCoordinateVariable(netcdf_file, "Lat")[:]
      lon_var = getCoordinateVariable(netcdf_file, "Lon")[:]

      lat_end = len(lat_var) - 1
      lat_offset = (lat_var[lat_end] - lat_var[0]) / lat_end

      lon_end = len(lon_var) - 1
      lon_offset = (lon_var[lon_end] - lon_var[0]) / lon_end

      self.start_time = time.clock()
      self.last_time = time.clock()

      for row in data:
         if len(lat_var) <= 1:
            lat_index = 0
         else:
            current_lat = float(row['Latitude'])
            t_lat = current_lat - lat_var[0]
            lat_index = int(round(abs(t_lat / lat_offset)))

         if len(lon_var) <= 1:
            lon_index = 0
         else:
            current_lon = float(row['Longitude'])
            t_lon = current_lon - lon_var[0]
            lon_index = int(round(abs(t_lon / lon_offset)))

         track_date = datetime.datetime.strptime(row['Date'], "%d/%m/%Y %H:%M")
         time_index = find_closest(times_sorted, track_date, arr_indexes=times_sorted_indexes, time=True, arr_sorted=True)

         data = data_var[time_index][lat_index][lon_index]

         _ret = {}
         _ret['track_date'] = track_date.isoformat()
         if time_var.units:
            _ret['data_date'] = netCDF.num2date(time_var[time_index], time_var.units, calendar='standard').isoformat()
         else:
            _ret['data_date'] = time_var[time_index].tostring()

         _ret['track_lat'] = row['Latitude']
         _ret['track_lon'] = row['Longitude']
         _ret['data_value'] = float(data) if not np.isnan(data) else "null"
         ret.append(_ret)
         # print "Extraction: {}%".format(round(len(ret) / float(self.numline) * 100, 3))
         if plotting and self.status_details:
            self.update_status(len(ret))

      return ret

   def update_status(self, progress):
      if time.clock() > self.last_time + 60:
         self.last_time = time.clock()
         percentage = round(progress / float(self.numline) * 75 + 20, 1) / self.status_details['series']
         minutes_remaining = int(round((time.clock() - self.start_time) / progress * (self.numline - progress) / 60))

         debug(3, "Overall progress: {}%".format(percentage))
         debug(3, "Remaining: {} mins".format(minutes_remaining))

         update_status(self.status_details['dirname'], self.status_details['my_hash'],
            Plot_status.extracting, percentage=percentage,
            minutes_remaining=minutes_remaining)

      debug(5, "Extracting: {}%".format(round(progress / float(self.numline) * 100, 3)))
