import csv
import datetime
import netCDF4 as netCDF
import numpy as np
from data_extractor.extraction_utils import find_closest, getCoordinateVariable
from plotting.status import Plot_status, update_status


class TransectStats(object):
   """docstring for TransectStats"""

   def __init__(self, files, variable, _csv, status_details):
      super(TransectStats, self).__init__()
      self.files = files
      self.variable = variable
      self._csv = _csv
      self.status_details = status_details
      self.percentage = 1

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
      with open(self._csv, "rb") as csvfile:
         numline = len(csvfile.readlines())

      data = csv.DictReader(csv_file.splitlines(), delimiter=',')

      ret = []

      times_sorted_indexes = np.argsort(times)
      times_sorted = np.sort(times)

      for row in data:
         lat_var = getCoordinateVariable(netcdf_file, "Lat")[:]
         lon_var = getCoordinateVariable(netcdf_file, "Lon")[:]
         if len(lat_var) <= 1:
            lat_index = 0
         else:
            lat_end = len(lat_var) - 1
            lat_offset = (lat_var[lat_end] - lat_var[0]) / lat_end
            current_lat = float(row['Latitude'])
            t_lat = current_lat - lat_var[0]
            lat_index = int(round(abs(t_lat / lat_offset)))

         if len(lon_var) <= 1:
            lon_index = 0
         else:
            lon_end = len(lon_var) - 1
            lon_offset = (lon_var[lon_end] - lon_var[0]) / lon_end
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
         # print "Extraction: {}%".format(round(len(ret) / float(numline) * 100, 3))
         self.update_status_percent(len(ret), numline)

      return ret

   def update_status_percent(self, progress, numline):
      percentage = int(round(progress / float(numline) * 95))
      if percentage > self.percentage:
         self.percentage = percentage
         update_status(self.status_details['dirname'], self.status_details['my_hash'], Plot_status.extracting, percentage=percentage / self.status_details['series'])
