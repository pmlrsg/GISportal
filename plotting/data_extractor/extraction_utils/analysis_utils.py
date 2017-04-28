from datetime import timedelta, datetime
from PIL import Image, ImageDraw
from shapely import wkt
import netCDF4 as netCDF
import numpy as np
"""
Performs a basic set of statistical functions on the provided data.
"""
def basic(dataset, variable, progress_tracker=None):
   arr = dataset.variables[variable]

   time = getCoordinateVariable(dataset, 'Time')

   if time is None:
      raise ValueError('Could not find time dimension.')

   times = np.array(time[:])
   output = {}

   units = getUnits(dataset.variables[variable])
   output['units'] = units

   timeUnits = getUnits(time)
   start = None
   if timeUnits:
      try:
         start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
      except:
         start = ''.join(times[0])
   else:
      start = ''.join(times[0])

   output['global'] = {'time': start}
   output['data'] = {}

   if progress_tracker:
      progress_tracker.start_series_analysis(len(arr))

   for i in range(len(arr)):
      # print("processing row {} of {}".format(i, len(arr)))
      row = arr[i]
      # Mask any invalid (nan) values
      masked_row = np.ma.masked_invalid(row, copy=False)

      if timeUnits:
         if i < len(time):
            try:
               date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
            except:
               date = ''.join(times[i])
      else:
         date = ''.join(times[i])
      mean = getMean(masked_row)
      median = getMedian(masked_row)
      std = getStd(masked_row)
      minimum = getMin(masked_row)
      maximum = getMax(masked_row)

      if np.isnan(maximum) or np.isnan(minimum) or np.isnan(std) or np.isnan(mean) or np.isnan(median):
         pass
      else:
         output['data'][date] = {'mean': mean, 'median': median,'std': std, 'min': minimum, 'max': maximum}

      if progress_tracker:
         progress_tracker.analysis_progress(i + 1)

   if len(output['data']) < 1:
      raise ValueError('no valid data available to use')

   return output


def basic_scatter(dataset1, variable1, dataset2, variable2,):
   
   arr1 = np.ma.array(dataset1.variables[variable1][:])
   arr2 = np.ma.array(dataset2.variables[variable2][:])
      #print arr
   #current_app.logger.debug(arr)
   # Create a masked array ignoring nan's

   maskedArray1 = np.ma.masked_invalid(arr1)
   maskedArray2 = np.ma.masked_invalid(arr2)
   #maskedArray = arr
   #print '-'*40
   #print maskedArray
   #plt.imshow(maskedArray[0])
   #plt.savefig(filename+'.2.png')
   time1 = getCoordinateVariable(dataset1, 'Time')
   time2 = getCoordinateVariable(dataset2, 'Time')
   # current_app.logger.debug('time channel test')
   # current_app.logger.debug(time)
   if time1 == None:
      g.graphError = "could not find time dimension"
      return
   if time2 == None:
      g.graphError = "could not find time dimension"
      return
   
   times1 = np.array(time1[:])
   isotimes1 = [(netCDF.num2date(x, time1.units, calendar='standard')).isoformat() for x in times1[:]]

   times2 = np.array(time2[:])
   isotimes2 = [(netCDF.num2date(x, time2.units, calendar='standard')).isoformat() for x in times2[:]]
   output = {}
   
   units1 = getUnits(dataset1.variables[variable1])
   units2 = getUnits(dataset2.variables[variable2])
   output['units1'] = units1
   output['units2'] = units2
   
   
   #mean = getMean(maskedArray)
   #median = getMedian(maskedArray)
   #std = getStd(maskedArray)
   #min = getMin(maskedArray)
   #max = getMax(maskedArray)
   data1 = gen_data(time1, times1, maskedArray1)
   data2 = gen_data(time2, times2, maskedArray2)
   time_data = gen_time_array()
   #print data1, data2, time_data
   zipped_data = zip(data1, data2, isotimes1)
      
   #original.close()
   return {'order' : [variable1, variable2, 'Time'], 'data' : zipped_data}

def gen_time_array():
   pass

def gen_data(time, times, maskedArray):
   timeUnits = getUnits(time)
   start = None
   if timeUnits:
      try:
         start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
      except:
         start = ''.join(times[0])
   else: 
      start = ''.join(times[0])
   
   #=========================================================================
   # if np.isnan(max) or np.isnan(min) or np.isnan(std) or np.isnan(mean) or np.isnan(median):
   #   output = {}
   #   g.graphError = "no valid data available to use"
   # else:
   #   output['global'] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max, 'time': start}
   #=========================================================================
   
   output = {}
   output['data'] = {}
   data = []
   #print len(time)
   for i, row in enumerate(maskedArray):
      #print i
      if timeUnits:
         if (i < len(time)):
            try:
               date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
            except:
               date = ''.join(times[i])
      else:     
         date = ''.join(times[i])
      mean = getMean(row)
      
      
      
      if  np.isnan(mean) :
         pass
      else:
         data.append(mean)
   return data

def getHistogram(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   bins = request.args.get('bins', None) # TODO move to get params
   numbers = []
   
   if bins == None or not bins:
      max = getMax(maskedarr)
      min = getMin(maskedarr)
      bins = np.linspace(min, max, 11) # Create ten evenly spaced bins 
      N,bins = np.histogram(maskedarr, bins) # Create the histogram
   else:
      values = bins.split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i]) # Cast string to float
      bins = np.array(values)
      N,bins = np.histogram(maskedarr, bins) # Create the histogram
   
   for i in range(len(bins)-1): # Iter over the bins       
      if np.isnan(bins[i]) or np.isnan(bins[i+1] or np.isnan(N[i])):
         g.graphError = 'no valid data available to use'
         return       
      
      numbers.append((bins[i] + (bins[i+1] - bins[i])/2, float(N[i]))) # Get a number halfway between this bin and the next
   return {'Numbers': numbers, 'Bins': bins.tolist()}


"""
Utility function to find the time dimension from a netcdf file. Needed as the
time dimension will not always have the same name or the same attributes.
"""
def getCoordinateVariable(dataset, axis):
   for i, key in enumerate(dataset.variables):
      var = dataset.variables[key]
      #current_app.logger.debug("========== key:" + key + " ===========") # DEBUG
      for name in var.ncattrs():
         #current_app.logger.debug(name) # DEBUG
         if name == "_CoordinateAxisType" and var._CoordinateAxisType == axis:
            return var
   return None

def getDepth(dataset):
   for i, key in enumerate(dataset.variables):
      var = dataset.variables[key]
      if "_CoordinateAxisType" in var.ncattrs() and "_CoordinateZisPositive" in var.ncattrs():
         #if var._CoordinateAxisType == "Height" and var._CoordinateZisPositive == "down":
         if var._CoordinateAxisType == "Height":
            return var
   return None

def getDimension(dataset, dimName):
   for i, key in enumerate(dataset.dimensions):
      dimension = dataset.dimensions[key]
      if key == dimName:
         return len(dimension)
   
   return None

def getUnits(variable):
   for name in variable.ncattrs():
      if name == "units":
         return variable.units
      
   return ''


"""
Returns the median value from the provided array.
"""
def getMedian(arr):
   return float(np.ma.median(arr))

"""
Returns the mean value from the provided array.
"""
def getMean(arr):
   return float(np.nanmean(arr))

"""
Returns the std value from the provided array.
"""
def getStd(arr):
   return float(np.std(arr.compressed()))

"""
Returns the minimum value from the provided array. 
"""
def getMin(arr):
   return float(np.min(arr)) # Get the min ignoring nan's, then cast to float

"""
Returns the maximum value from the provided array.
"""
def getMax(arr):
   return float(np.max(arr)) # Get the max ignoring nan's, then cast to float



def getIrregularData(params, poly_type=None):
   # NEVER USED
   polygon = params['bbox'].value
   if poly_type:
      mask, data,_,_,_ = create_mask(polygon, params, poly_type)
   else: 
      mask, data,_,_,_ = create_mask(polygon, params)

   return basic(mask, params, irregular=True, original=data)

trim_sizes = {
   "polygon" : slice(9,-2),
   "line" : slice(11,-2)
}

def find_closest(arr, val, arr_indexes=None, starting=0, time=False, arr_sorted=False):
   """
  Finds the position in the array where the array value matches
  the value specified by the user
   - poached from JAD
  """
   if time:
      current_closest = timedelta.max
   else:
      current_closest = 120310231023

   current_idx = None

   for i in range(starting,len(arr)):
      if abs(arr[i]-val) < current_closest:
         current_closest = abs(arr[i]-val)
         if arr_indexes is None:
            current_idx = i
         else:
            current_idx = arr_indexes[i]
      elif arr_sorted and abs(arr[i]-val) > current_closest:
         break

   return current_idx

def getFillValue(variable):
   if '_FillValue' in variable.ncattrs():
      return variable.getncattr('_FillValue')
   else:
      return np.nan

def create_mask(poly, netcdf_base, variable, poly_type="polygon"):
   '''
   takes a Well Known Text polygon or line
   and produces a masking array for use with numpy
   @param poly - WKT polygon or line
   @param variable - WCS variable to mask off
   @param type - one from [polygon, line]
   '''

   loaded_poly = wkt.loads(poly)
   to_be_masked = netCDF.Dataset(netcdf_base, 'a')

   chl = to_be_masked.variables[variable]
   fillValue = getFillValue(to_be_masked.variables[variable])

   latvals = to_be_masked.variables[str(getCoordinateVariable(to_be_masked, 'Lat').dimensions[0])]
   lonvals = to_be_masked.variables[str(getCoordinateVariable(to_be_masked, 'Lon').dimensions[0])]

   from shapely.geometry import Polygon
   minlat = min(latvals)
   maxlat = max(latvals)
   minlon = min(lonvals)
   maxlon = max(lonvals)

   lonlat_poly = Polygon([[minlon,maxlat],[maxlon,maxlat],[maxlon,minlat],[minlon,minlat],[minlon,maxlat]])
   lonlat_poly = lonlat_poly.buffer(0)
   overlap_poly = loaded_poly.intersection(lonlat_poly)
   poly = poly[trim_sizes[poly_type]]

   poly = poly.split(',')
   poly = [x.split() for x in poly]

   if overlap_poly.type == "MultiPolygon":
      found = []
      for poly in overlap_poly:
         found_lats = [find_closest(latvals, float(x)) for x in poly.exterior.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in poly.exterior.xy[0]]
         found.append(zip(found_lons,found_lats))


   elif overlap_poly.type == "MultiLineString":
      found = []
      for poly in overlap_poly:
         found_lats = [find_closest(latvals, float(x)) for x in poly.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in poly.xy[0]]
         found.append(zip(found_lons,found_lats))

   else:
      if poly_type is 'line':
         found_lats = [find_closest(latvals, float(x)) for x in overlap_poly.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in overlap_poly.xy[0]]
      else:
         found_lats = [find_closest(latvals, float(x)) for x in overlap_poly.exterior.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in overlap_poly.exterior.xy[0]]

      found = zip(found_lons,found_lats)

   img = Image.new('L', (chl.shape[to_be_masked.variables[variable].dimensions.index(str(getCoordinateVariable(to_be_masked, 'Lon').dimensions[0]))],chl.shape[to_be_masked.variables[variable].dimensions.index(str(getCoordinateVariable(to_be_masked, 'Lat').dimensions[0]))]), 0)

   if overlap_poly.type == "MultiPolygon":
      for f in found:
         ImageDraw.Draw(img).polygon(f,  outline=2, fill=2)
   elif overlap_poly.type == "MultiLineString":
      for f in found:
         ImageDraw.Draw(img).polygon(f,  outline=2, fill=2)
   else:
      if poly_type == 'polygon':
         ImageDraw.Draw(img).polygon(found,  outline=2, fill=2)
      if poly_type == 'line':
         ImageDraw.Draw(img).line(found,   fill=2)

   masker = np.array(img)
   for i in range(chl.shape[0]):
      masked_slice = np.ma.masked_array(chl[i,:], mask=[x != 2 for x in masker])
      masked_slice.filled(fill_value=fillValue)
      masked_slice[masked_slice == fillValue] = np.nan

      chl[i] = masked_slice

   to_be_masked.close()


def sizeof_fmt(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)



def hovmoller(dataset, xAxisVar, yAxisVar, dataVar):
   
   xVar = getCoordinateVariable(dataset, xAxisVar)
   xArr = np.array(xVar[:])
   yVar = getCoordinateVariable(dataset, yAxisVar)
   yArr = np.array(yVar[:])
   #print '+'*40
   #print yArr.shape
   zArr = dataset.variables[dataVar][:]
   #print '+'*20
   #print zArr
   zArr = np.ma.masked_array(zArr)
   #print '-'*20
   #print zArr
   #print zArr.shape
   if xVar == None:
      print "could not find %s dimension" % xAxisVar
      return
   if yVar == None:
      print "could not find %s dimension" % yAxisVar
      return
   
   # Create a masked array ignoring nan's
   zMaskedArray = np.ma.masked_invalid(zArr)
   # print zMaskedArray
   # print zMaskedArray.shape
   time = None
   lat = None
   lon = None
   
   if xAxisVar == 'Time':
      times = xArr
      time = xVar
      lat = yArr
   else:        
      lon = xArr
      times = yArr
      time = yVar

   output = {}
   
   timeUnits = getUnits(time)
   start = None
   if timeUnits:
      try:
         start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
      except:
         start = ''.join(times[0])
   else: 
      start = ''.join(times[0])
   
   output['global'] = {'time': start}
   
   output['data'] = []
 
   numDimensions = len(zMaskedArray.shape)
   direction = None 
   if lat != None:
      direction = 'lat'
   elif lon != None:
      direction = 'lon'
      if numDimensions == 4:
         zMaskedArray = zMaskedArray.swapaxes(2,3)
      else:
         zMaskedArray = zMaskedArray.swapaxes(1,2) # Make it use Lon instead of Lat
   

   # If 4 dimensions, assume depth and switch with time
   if numDimensions == 4:
      depth = np.array(getDepth(dataset))
      if len(depth.shape) > 1:
         current_app.logger.debug('WARNING: There are multiple depths.')
      else:
         # Presume 1 depth, set to contents of depth
         # This way, it will enumerate over correct array
         # whether depth or not
         #print "adding dim shinanigans"
         zMaskedArray = zMaskedArray.swapaxes(0,1)[0]
         
         output['depth'] = float(depth[0])
 
   #print len(lon)
   t_store_dates = []
   for i, timelatlon in enumerate(zMaskedArray):
      #print i
      #print times[i]
      date = None   
      if timeUnits:
         try:
            date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
         except:
            date = ''.join(times[i])
      else:     
         date = ''.join(times[i])
      #print date
      if(date  in [ x[0] for x in t_store_dates]):
         #idx = [ x[0] for x in t_store_dates].index(date)
         #print "FOUND DUPLICATE DATE %s" % date
         pass
         #t_store_dates.append((date, i))

         #print "testing row vs row = %b" % (timelatlon == zMaskedArray[t_store_dates[idx][1]])
      else:
         t_store_dates.append((date, i))
         for j, row in enumerate(timelatlon):
            #print len(row)
            if direction == "lat":
               if (j < len(lat)):
                  pos = lat[j]
            elif direction == "lon":
               if (j < len(lon)):
                  pos = lon[j]
               
            #print row
            mean = getMean(row)
            #print mean
            #print mean
            if not np.isnan(mean):
               output['data'].append([date, float(pos), mean])
            else:
               #print "adding nan"
               output['data'].append([date, float(pos), None])
            
   if len(output['data']) < 1:
      g.graphError = "no valid data available to use"
      error_handler.setError('2-07', None, g.user.id, "views/wcs.py:hovmoller - No valid data available to use.")
      return output
      
   
   return output


def are_dupes_the_same():
   pass
def are_time_axis_the_same(filenames):
   #print "inside get times func"
   #print filenames
   times = {}
   for key in filenames:
      #print filenames[key]
      times[key] = getCoordinateVariable(netCDF.Dataset(filenames[key], 'r+'), 'Time')
   
   keys = times.keys()

   #if (len(times[keys[0]]) != len(times[keys[1]]) ):
   #   pass
      #return False

   #else:
   time_range = len(times[keys[0]]) if len(times[keys[0]]) > len(times[keys[1]]) else len(times[keys[1]])
   #print "using range %d" % time_range
   #print len(times[keys[0]])
   #print len(times[keys[1]])
   for x in range(time_range):
      time1 = datetime.strptime(netCDF.num2date(times[keys[0]][x], times[keys[0]].units, calendar='standard').isoformat(), '%Y-%m-%dT%H:%M:%S')
      time2 = datetime.strptime(netCDF.num2date(times[keys[1]][x], times[keys[1]].units, calendar='standard').isoformat(), '%Y-%m-%dT%H:%M:%S')
      #print time1, time2
      #print times[keys[0]][x] , times[keys[1]][x]
      dif = time1 - time2
      #print dif
      if dif > timedelta.min:
         return False
   return True
