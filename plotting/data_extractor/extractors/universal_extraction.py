import math
import uuid
import hashlib
import os
import urllib2
import xml.etree.ElementTree as ET
from datetime import datetime
import netCDF4 as netCDF
from extraction_utils import create_mask, WCSRawHelper
from . import Extractor
try:
   from plotting.debug import debug
   from plotting.status import Plot_status, update_status
   plotting = True
except ImportError:
   plotting = False


class UniversalExtractor(Extractor):
   """docstring for UniversalExtractor"""

   thredds_max_request = 4000

   def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None, extract_depth=None, status_details=None, outdir="/tmp/", extra_slices=False, masking_polygon=None):
      super(UniversalExtractor, self).__init__(wcs_url, extract_dates, extract_area=extract_area,extract_variable=extract_variable,  extract_depth=extract_depth, outdir=outdir)
      self.status_details = status_details
      self.extra_slices = extra_slices
      self.masking_polygon = masking_polygon

   def getData(self):
      if plotting:
         debug(2,"Getting coverage description...")
      coverage_description = self.getCoverageDescriptionData()
      max_slices = self.getMaxSlices(coverage_description['offset_vectors'])
      slices_in_range = self.getSlicesInRange(coverage_description['time_slices'])

      files = []
      if slices_in_range:
         retries = 0
         if plotting:
            debug(2, "Getting files...")
         while not files and retries < 4:
            try:
               files = self.getFiles(slices_in_range, max_slices)
            except urllib2.HTTPError:
               max_slices = max_slices / 2
               retries += 1
      else:
         if plotting:
            debug(2, "No time slices in range.")

      return files

   def getFiles(self, slices_in_range, max_slices):
      files = []
      total_requests = int(math.ceil(len(slices_in_range) / float(max_slices)))
      next_start = 0
      for i in range(0, int(math.ceil(len(slices_in_range) / float(max_slices)))):
         start = slices_in_range[next_start].strftime('%Y-%m-%d %H:%M:%S')
         if next_start + max_slices <= len(slices_in_range):
            end_index = next_start + max_slices - 1
         else:
            end_index = len(slices_in_range) - 1
         end = slices_in_range[end_index].strftime('%Y-%m-%d %H:%M:%S')
         next_start = next_start + max_slices
         extract_dates = start + '/' + end

         wcs_extractor = WCSRawHelper(self.wcs_url, extract_dates, self.extract_variable, self.extract_area, self.extract_depth)

         # TODO Shorter name for irregular. Maybe hash previous hash joined with polygon.
         # Generate the file name based on the request URL
         fname_hash = hashlib.md5(wcs_extractor.generateGetCoverageUrl()).hexdigest()
         if self.masking_polygon:
            mask_hash = hashlib.md5(self.masking_polygon).hexdigest()
            fname = self.outdir + fname_hash + mask_hash + ".nc"
         else:
            fname = self.outdir + fname_hash + ".nc"

         if not os.path.isfile(fname):
            # If the same request hasn't been downloaded before
            download_complete = False
            while not download_complete:
               if plotting:
                  debug(3, "Making request {} of {}".format(i + 1, total_requests))
               data = wcs_extractor.getData()

               # Generate a temporary file name to download to
               fname_temp = self.outdir + str(uuid.uuid4()) + ".nc"

               if plotting:
                  debug(3,"Starting download {} of {}".format(i + 1, total_requests))
               # Download in 16K chunks. This is most efficient for speed and RAM usage.
               chunk_size = 16 * 1024
               with open(fname_temp, 'w') as outfile:
                  while True:
                     chunk = data.read(chunk_size)
                     if not chunk:
                        break
                     outfile.write(chunk)

               try:
                  netCDF.Dataset(fname_temp)
                  download_complete = True
               except (RuntimeError, IOError):
                  if plotting:
                     debug(3, "Download is corrupt. Retrying...")
            # Rename the file after it's finished downloading
            os.rename(fname_temp, fname)

         if plotting:
            self.update_status(i + 1, total_requests)
         files.append(fname)

      # TODO Move into download loop before rename
      if self.masking_polygon:
         for fname in files:
            create_mask(self.masking_polygon,fname,self.extract_variable)

      return files

   def getMaxSlices(self, offset_vectors):
      if isinstance(self.extract_area, basestring):
         # convert self.extract_area to a list if it is currently a string
         self.extract_area = [float(x) for x in self.extract_area.split(',')]

      # self.extract_area is formatted as [min(lons), min(lats), max(lons), max(lats)]
      area_width = self.extract_area[2] - self.extract_area[0]
      area_height = self.extract_area[3] - self.extract_area[1]

      # If the area width or height is less than the offset_vector, increase it in both directions by the offset_vector
      if abs(area_width) < abs(offset_vectors['x']):
         self.extract_area = (
            self.extract_area[0] - abs(offset_vectors['x']),
            self.extract_area[1],
            self.extract_area[2] + abs(offset_vectors['x']),
            self.extract_area[3])
         area_width = self.extract_area[3] - self.extract_area[1]
      if abs(area_height) < abs(offset_vectors['y']):
         self.extract_area = (
            self.extract_area[0],
            self.extract_area[1] - abs(offset_vectors['y']),
            self.extract_area[2],
            self.extract_area[3] + abs(offset_vectors['y']))
         area_height = self.extract_area[2] - self.extract_area[0]

      pixel_width = abs(area_width / offset_vectors['x'])
      pixel_height = abs(area_height / offset_vectors['y'])

      pixel_area = pixel_width * pixel_height

      slice_bytes = pixel_area * 4
      slice_megabytes = slice_bytes / 1024 / 1024

      max_slices = int(self.thredds_max_request / slice_megabytes)

      return max_slices

   def getSlicesInRange(self, time_slices):
      time_slices.sort()
      date_range = '/'.join(self.extract_dates).split('/')

      for i, date in enumerate(date_range):
         try:
            date_range[i] = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
         except ValueError:
            date_range[i] = datetime.strptime(date, '%Y-%m-%d')

      slices_in_range = []
      pre_range_time_slice = None
      pre_range_slice_index = 0
      last_slice_index = 0

      for i, time_slice in enumerate(time_slices):
         time_slice = datetime.strptime(time_slice, '%Y-%m-%dT%H:%M:%SZ')

         if not slices_in_range and time_slice < date_range[0]:
            pre_range_time_slice = time_slice
            pre_range_slice_index = i
         elif time_slice >= date_range[0] and time_slice <= date_range[1]:
            if not slices_in_range and pre_range_time_slice and self.extra_slices:
               slices_in_range.append(pre_range_time_slice)
            slices_in_range.append(time_slice)
            last_slice_index = i
         elif time_slice > date_range[1]:
            break

      if not slices_in_range and pre_range_time_slice:
         slices_in_range.append(pre_range_time_slice)
         last_slice_index = pre_range_slice_index
      if last_slice_index + 1 < len(time_slices) and self.extra_slices:
         post_range_time_slice = datetime.strptime(time_slices[last_slice_index + 1], '%Y-%m-%dT%H:%M:%SZ')
         slices_in_range.append(post_range_time_slice)

      return slices_in_range

   def getCoverageDescriptionData(self):
      coverage_description = {}
      ns = {'xmlns': 'http://www.opengis.net/wcs', 'gml': 'http://www.opengis.net/gml', 'xlink': 'http://www.w3.org/1999/xlink'}
      wcs_extractor = WCSRawHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area, self.extract_depth)
      coverage_description_xml = ET.fromstring(wcs_extractor.describeCoverage())

      rectified_grid = coverage_description_xml.find('./xmlns:CoverageOffering/xmlns:domainSet/xmlns:spatialDomain/gml:RectifiedGrid', ns)
      axis_names = []
      for axis_name in rectified_grid.findall('./gml:axisName', ns):
         axis_names.append(axis_name.text)

      coverage_description['offset_vectors'] = {}
      i = 0
      for offset_vector in rectified_grid.findall('./gml:offsetVector', ns):
         for item in offset_vector.text.split(' '):
            if float(item) != 0:
               coverage_description['offset_vectors'][axis_names[i]] = float(item)
               i += 1

      # time_slices =
      coverage_description['time_slices'] = []
      for time_slice in coverage_description_xml.findall('./xmlns:CoverageOffering/xmlns:domainSet/xmlns:temporalDomain/gml:timePosition', ns):
         coverage_description['time_slices'].append(time_slice.text)

      return coverage_description

   def mergeFiles(self, files):
      # NOT CURRENTLY USED
      # Create new file
      fname = self.outdir + str(uuid.uuid4()) + ".nc"
      new_file = netCDF.Dataset(fname, 'w', format='NETCDF4')
      # Load first downloaded file
      first_file = netCDF.Dataset(files[0], 'r')
      # Copy attrs from first file into new file
      for attr in first_file.ncattrs():
         new_file.setncattr(attr, first_file.getncattr(attr))

      # Create dimensions and variables in new file
      new_file.createDimension('time', None)
      new_file.createDimension('lat', len(first_file.dimensions['lat']))
      new_file.createDimension('lon', len(first_file.dimensions['lon']))

      time = new_file.createVariable('time', first_file.variables['time'].dtype, ('time',), zlib=False)
      lat = new_file.createVariable('lat', first_file.variables['lat'].dtype, ('lat',), zlib=False)
      lon = new_file.createVariable('lon', first_file.variables['lon'].dtype, ('lon',), zlib=False)
      variable = new_file.createVariable(self.extract_variable, first_file.variables[self.extract_variable].dtype, ('time', 'lat', 'lon'), zlib=False)

      # Copy variable attrs from first file variables to new file variables
      ignored_attr = ['size', 'shape']
      for attr in first_file.variables['time'].ncattrs():
         if attr not in ignored_attr:
            time.setncattr(attr, first_file.variables['time'].getncattr(attr))

      for attr in first_file.variables['lat'].ncattrs():
         if attr not in ignored_attr:
            lat.setncattr(attr, first_file.variables['lat'].getncattr(attr))

      for attr in first_file.variables['lon'].ncattrs():
         if attr not in ignored_attr:
            lon.setncattr(attr, first_file.variables['lon'].getncattr(attr))

      for attr in first_file.variables[self.extract_variable].ncattrs():
         if attr not in ignored_attr:
            variable.setncattr(attr, first_file.variables[self.extract_variable].getncattr(attr))

      new_lat = first_file.variables['lat']
      new_lon = first_file.variables['lon']
      start = 0
      end = len(new_lat)
      lat[start:end] = new_lat

      end = len(new_lon)
      lon[start:end] = new_lon

      first_file.close()

      for _file in files:
         f = netCDF.Dataset(_file, 'r')
         new_time = f.variables['time']
         new_variable = f.variables[self.extract_variable]

         start = len(time)
         end = start + len(new_time)

         time[start:end] = new_time
         variable[start:end] = new_variable

         f.close()

      new_file.close()

      return fname

   def update_status(self, progress, total_requests):
      if self.status_details:
         starting_percentage = 94.0 / self.status_details['num_series'] * self.status_details['current_series'] + 1
         percentage = int(round(progress / float(total_requests) * 19 / self.status_details['num_series'] + starting_percentage))
         update_status(self.status_details['dirname'], self.status_details['my_hash'],
            Plot_status.extracting, percentage=percentage)
         debug(3, "Overall progress: {}%".format(percentage))
