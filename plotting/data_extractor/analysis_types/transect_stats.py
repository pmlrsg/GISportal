import csv
import datetime
import netCDF4 as netCDF
import numpy as np
from extraction_utils.analysis_utils import find_closest, getCoordinateVariable
from math import radians, cos, sin, asin, sqrt
try:
   from plotting.debug import debug
   from plotting.status import Plot_status, update_status
   plotting = True
except ImportError:
   plotting = False

import time


class TransectStats(object):
   """docstring for TransectStats"""


   def __init__(self, files, variable, _csv, status_details=None,  matchup=False):

      super(TransectStats, self).__init__()
      self.files = files
      self.variable = variable
      self._csv = _csv
      self.status_details = status_details
      self.percentage = 0
      self.matchup = matchup


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

      average_time_interval = (times_sorted[-1] - times_sorted[0]) / len(set(times_sorted))

      lat_var = getCoordinateVariable(netcdf_file, "Lat")[:]
      lon_var = getCoordinateVariable(netcdf_file, "Lon")[:]

      if np.amax(lat_var) > 90:
         for i, lat in enumerate(lat_var):
            if lat > 90:
               lat_var[i] = lat - 180

      if np.amax(lon_var) > 180:
         for i, lon in enumerate(lon_var):
            if lon > 180:
               lon_var[i] = lon - 360

      lat_end = len(lat_var) - 1
      lat_offset = (lat_var[lat_end] - lat_var[0]) / lat_end

      lon_end = len(lon_var) - 1
      lon_offset = (lon_var[lon_end] - lon_var[0]) / lon_end

      # Calculate the distance from the centre of a pixel to a corner
      offset_distance = calculateDistance(0, 0, lat_offset, lon_offset) / 2

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

         try:
            track_date = datetime.datetime.strptime(row['Date'], "%d/%m/%Y %H:%M:%S")
         except ValueError:
            try:
                  track_date = datetime.datetime.strptime(row['Date'], "%d/%m/%Y %H:%M")
            except ValueError:
                  track_date = datetime.datetime.strptime(row['Date'], "%d/%m/%Y")

         time_index = find_closest(times_sorted, track_date, arr_indexes=times_sorted_indexes, time=True, arr_sorted=True)

         if lat_index > lat_end:
            lat_index = lat_end
         if lon_index > lon_end:
            lon_index = lon_end

         # Calculate the distance from the desired point to the centre of the chosen pixel
         distance_from_desired = calculateDistance(current_lat, current_lon, lat_var[lat_index], lon_var[lon_index])

         if distance_from_desired > offset_distance:
            # If the distance is greater than the offset distance then something has gone wrong
            # and the wrong pixel has been chosen.
            # Set the value to NaN to avoid returning an incorrect result
            data_value = float('nan')
            if plotting:
               debug(0, "Incorrect pixel selected! Pixel at {:+07.3f}, {:+08.3f} is further than {:6.2f}km from point at {:+07.3f}, {:+08.3f} ({:8.2f}km). Setting {} value to NaN.".format(
                  lat_var[lat_index], lon_var[lon_index], offset_distance, current_lat, current_lon, distance_from_desired, self.variable))
         elif abs(times[time_index] - track_date) > (2 * average_time_interval):
            data_value = float('nan')
         elif len(data_var.dimensions) == 4:
            # If the file has a depth variable, use the first depth
            data_value = data_var[time_index][0][lat_index][lon_index]
         else:
            data_value = data_var[time_index][lat_index][lon_index]


         _ret = {}
         _ret['track_date'] = track_date.isoformat()
         if time_var.units:
            _ret['data_date'] = netCDF.num2date(time_var[time_index], time_var.units, calendar='standard').isoformat()
         else:
            _ret['data_date'] = time_var[time_index].tostring()


         if self.matchup:
            _ret['match_value'] = row['data_point']

         _ret['track_lat'] = row['Latitude']
         _ret['track_lon'] = row['Longitude']
         _ret['data_value'] = float(data_value) if not np.isnan(float(data_value)) else "null"
         ret.append(_ret)
         if plotting and self.status_details:
            self.update_status(len(ret))

      return ret

   def update_status(self, progress):
      if time.clock() > self.last_time + 60:
         self.last_time = time.clock()
         starting_percentage = 94.0 / self.status_details['num_series'] * self.status_details['current_series'] + 1
         percentage = int(round((progress / float(self.numline) * 75 + 19) / self.status_details['num_series'] + starting_percentage))
         debug(3, "Overall progress: {}%".format(percentage))
         if self.status_details['current_series'] == self.status_details['num_series'] - 1:
            minutes_remaining = int(round((time.clock() - self.start_time) / progress * (self.numline - progress) / 60))
            debug(3, "Remaining: {} mins".format(minutes_remaining))
         else:
            minutes_remaining = -1

         update_status(self.status_details['dirname'], self.status_details['my_hash'],
            Plot_status.extracting, percentage=percentage,
            minutes_remaining=minutes_remaining)

      debug(5, "Extracting: {}%".format(round(progress / float(self.numline) * 100, 3)))

def calculateDistance(lat1, lon1, lat2, lon2):
   """
   Calculate the distance in kilometres between two points on the earth (specified in decimal degrees)
   """
   # convert decimal degrees to radians
   lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

   # haversine formula
   dlat = lat2 - lat1
   dlon = lon2 - lon1
   a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
   c = 2 * asin(sqrt(a))
   r = 6371 # Radius of earth in kilometers. Use 3956 for miles
   return c * r