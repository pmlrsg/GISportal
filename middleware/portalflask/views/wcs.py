from flask import Blueprint, abort, request, Response, jsonify, g, current_app, send_file
from portalflask.core.param import Param
from portalflask.core import error_handler

import urllib
import urllib2
import tempfile
import numpy as np
import netCDF4 as netCDF
from shapely import wkt
from PIL import Image, ImageDraw
 

portal_wcs = Blueprint('portal_wcs', __name__)

trim_sizes = {
   "polygon" : slice(9,-2),
   "line" : slice(11,-2)
}

"""
Gets wcs data from a specified server, then performs a requested function
on the received data, before jsonifying the output and returning it.
"""
@portal_wcs.route('/wcs', methods = ['GET'])
def getWcsData():
   import random
   
   g.graphError = "";

   params = getParams() # Gets any parameters
   params = checkParams(params) # Checks what parameters where entered
   import pprint
   current_app.logger.debug(pprint.pprint(params))
   params['url'] = createURL(params)
   current_app.logger.debug('Processing request...') # DEBUG
   current_app.logger.debug(params['url'].value)
   type = params['type'].value
   if type == 'histogram': # Outputs data needed to create a histogram
      output = getBboxData(params, histogram)
   elif type == 'timeseries': # Outputs a set of standard statistics  
      if params.get('output_format') is not None:
            if params['output_format']._value == 'csv':
               if 'polygon' in params :
                  data = getIrregularData(params)
               elif 'line' in params:
                  data = getIrregularData(params, poly_type='line') 
               else:
                  data = getBboxData(params, basic)
               output = toCSV(data)
            
      else:
         if 'polygon' in params :
            output = getIrregularData(params)
         elif 'line' in params:
            output = getIrregularData(params, poly_type='line')
         else:
            output = getBboxData(params, basic)
      

   elif type == 'scatter': # Outputs a scatter graph
      output = getBboxData(params, scatter)
   elif type == 'hovmollerLon' or 'hovmollerLat': # outputs a hovmoller graph
      output = getBboxData(params, hovmoller)
   elif type == 'point':
      output = getPointData(params, raw)
   elif type == 'raw': # Outputs the raw values
      output = getBboxData(params, raw)
   elif type == 'test': # Used to test new code
      output = getBboxData(params, test)
   elif type == 'error': # Used to test error handling client-side
      choice = random.randrange(1,7)
      if choice == 1:
         g.error = "test 404"
         abort(400)
      elif choice == 2:
         abort(401)
      elif choice == 3:
         abort(404)
      elif choice == 4:
         return jsonify(output = "edfwefwrfewf")
      elif choice == 5:
         abort(502)
      elif choice == 6:
         x = y # Should create a 500 from apache
   else:
      g.error = '"%s" is not a valid option' % type
      return abort(400)
   
   current_app.logger.debug('Jsonifying response...') # DEBUG
   
   try:
      if params.get('output_format') is not None:
         if params['output_format']._value == 'csv':
            current_app.logger.debug(output)
            outputData = Response(output, mimetype='text/csv')
      else:
         outputData = jsonify(output = output, type = params['type'].value, coverage = params['coverage'].value, error = g.graphError)
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      user = None
      if g.user:
         user = g.user.id
      error_handler.setError('2-06', None, user, "views/wcs.py:getWcsData - Type error, returning 400 to user. Exception %s" % e, request)
      abort(400) # If we fail to jsonify the data return 400
      
   current_app.logger.debug('Request complete, Sending results') # DEBUG
   
   return outputData


@portal_wcs.route('/download_check', methods=["get"])
def download_check():

   ret = {
   "size" : "4GB",
   "format" : "NetCDF"
   }

   return jsonify(ret)

@portal_wcs.route('/download', methods=["get"])
def download_netcdf():
   params = getParams() # Gets any parameters
   params = checkParams(params) # Checks what parameters where entered
   import pprint
   current_app.logger.debug(pprint.pprint(params))
   params['url'] = createURL(params)
   polygon = params['bbox'].value
   try:
      if 'line' in params:
         masked, data, mask, tfile, variable  = create_mask(polygon, params, poly_type='line')
      else: 
         masked, data, mask, tfile, variable = create_mask(polygon, params)
   except Exception as e:
      print e
      return abort(400)
   #current_app.logger.debug('------------------------------------------------------------~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-------------------------------');
   #current_app.logger.debug(type(data))
   #current_app.logger.debug(type(mask))

   lat = getCoordinateVariable(data, 'Lat')._name
   lon = getCoordinateVariable(data, 'Lon')._name
   maskVar = data.createVariable('mask', 'i', (lat,lon,), fill_value=0)
   maskVar
   maskVar[:] = mask[:]
   
   for x in range(len(data.variables[variable])):
      #print type(masked_chl[x])
      data.variables[variable][x] = masked[x][::]
   #original_file.variables['chlor_a']= masked_chl[:][::]
   data.close()
   return send_file(tfile, mimetype='application/x-netcdf')

"""
Gets any parameters.
"""
def getParams():
   # Required for url
   nameToParam = {}
   nameToParam["baseURL"] = Param("baseURL", False, False, request.args.get('baseurl'))
   nameToParam["service"] = Param("service", False, True, 'WCS')
   nameToParam["request"] = Param("request", False, True, 'GetCoverage')
   nameToParam["version"] = Param("version", False, True, request.args.get('version', '1.0.0'))
   nameToParam["format"] = Param("format", False, True, request.args.get('format', 'NetCDF3'))
   nameToParam["output_format"] = Param("output_format", True, True, request.args.get('output_format', None))
   nameToParam["coverage"] = Param("coverage", False, True, request.args.get('coverage'))
   nameToParam["crs"] = Param("crs", False, True, 'OGC:CRS84')
   
   # Optional extras
   nameToParam["time"] = Param("time", True, True, request.args.get('time', None))
   nameToParam["vertical"] = Param("vertical", True, True, request.args.get('depth', None))
   nameToParam["polygon"] = Param("polygon", True, True, request.args.get('isPolygon', None))
   nameToParam["line"] = Param("polygon", True, True, request.args.get('isLine', None))
   
   # One Required
   nameToParam["bbox"] = Param("bbox", True, True, request.args.get('bbox', None))
   nameToParam["circle"] = Param("circle", True, True, request.args.get('circle', None))
   #nameToParam["polygon"] = Param("polygon", True, True, request.args.get('polygon', None))
   nameToParam["point"] = Param("point", True, True, request.args.get('point', None))
   
   # Custom
   nameToParam["type"] = Param("type", False, False, request.args.get('type'))
   nameToParam["graphXAxis"] = Param("graphXAxis", True, False, request.args.get('graphXAxis'))
   nameToParam["graphYAxis"] = Param("graphYAxis", True, False, request.args.get('graphYAxis'))
   nameToParam["graphZAxis"] = Param("graphZAxis", True, False, request.args.get('graphZAxis'))
   
   nameToParam["graphXFunc"] = Param("graphXFunc", True, False, request.args.get('graphXFunc'))
   nameToParam["graphYFunc"] = Param("graphYFunc", True, False, request.args.get('graphYFunc'))
   nameToParam["graphZFunc"] = Param("graphZFunc", True, False, request.args.get('graphZFunc'))
   
   return nameToParam

"""
Check the parameters to see if they are valid.
"""
def checkParams(params):    
   checkedParams = {}
   
   for key in params.iterkeys():
      if params[key].value == None or len(params[key].value) == 0:
         if not params[key].isOptional():            
            g.error = 'required parameter "%s" is missing or is set to an invalid value' % key
            user = None
            if g.user:
               user = g.user.id  
            error_handler.setError('2-06', None, user, "views/wcs.py:checkParams - Parameter is missing or invalid, returning 400 to user. Parameter %s" % key, request)
            abort(400)
      else:
         checkedParams[key] = params[key]
         
   return checkedParams

def createMask(params):
   if params["bbox"] != None:
      pass
   
def find_closest(arr, val):
   """
  Finds the position in the array where the array value matches
  the value specified by the user
   - poached from JAD
  """
   current_closest = 120310231023
   current_idx = None
   for i in range(len(arr)):
      if abs(arr[i]-val)<current_closest:
         current_closest = abs(arr[i]-val)
         current_idx=i
   return current_idx

def create_mask(poly, params, poly_type="polygon"):
   '''
   takes a Well Known Text polygon or line 
   and produces a masking array for use with numpy
   @param poly - WKT polygon or line
   @param variable - WCS variable to mask off
   @param type - one from [polygon, line]
   '''
   current_app.logger.debug('##########')
   current_app.logger.debug(poly)
   loaded_poly = wkt.loads(poly)
   wcs_envelope = loaded_poly.envelope
   bounds =  wcs_envelope.bounds
   bb = ','.join(map(str,bounds))
   current_app.logger.debug('testing polygon for strangeness')
   current_app.logger.debug('bound = %s' % bb)
   params['bbox']._value = bb
   params['url'] = createURL(params)
   variable = params['coverage'].value
   #wcs_url = wcs_base_url % (bounds[0],bounds[1],bounds[2],bounds[3])
   wcs_url = params['url'].value
   current_app.logger.debug(wcs_url)
   #testfile=urllib.URLopener()
   #testfile.retrieve(wcs_url,"%s.nc" % variable)
   try:
      resp = contactWCSServer(wcs_url)
   except urllib2.HTTPError:
      params["vertical"]._value = params["vertical"].value[1:]
      params['url'] = createURL(params)
      wcs_url = params['url'].value
      resp = contactWCSServer(wcs_url)
   tfile = saveOutTempFile(resp)
   to_be_masked = netCDF.Dataset(tfile, 'r+')

   chl = to_be_masked.variables[variable][:]

   latvals = to_be_masked.variables[str(getCoordinateVariable(to_be_masked, 'Lat').dimensions[0])][:]
   lonvals = to_be_masked.variables[str(getCoordinateVariable(to_be_masked, 'Lon').dimensions[0])][:]

   from shapely.geometry import Polygon
   minlat = min(latvals)
   maxlat = max(latvals)
   minlon = min(lonvals)
   maxlon = max(lonvals)

   lonlat_poly = Polygon([[minlon,maxlat],[maxlon,maxlat],[maxlon,minlat],[minlon,minlat],[minlon,maxlat]])
   print '#'*50
   print lonlat_poly
   overlap_poly = loaded_poly.intersection(lonlat_poly)
   poly = poly[trim_sizes[poly_type]]
   
   poly = poly.split(',')
   poly = [x.split() for x in poly]



   #found_lats = [find_closest(latvals, float(x[1])) for x in poly]
   #found_lons = [find_closest(lonvals, float(x[0])) for x in poly]
   if overlap_poly.type == "MultiPolygon":
      found = []
      for poly in overlap_poly:
         found_lats = [find_closest(latvals, float(x)) for x in poly.exterior.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in poly.exterior.xy[0]]
         found.append(zip(found_lons,found_lats))


   else:
      if poly_type is 'line':
         found_lats = [find_closest(latvals, float(x)) for x in overlap_poly.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in overlap_poly.xy[0]]
      else:
         found_lats = [find_closest(latvals, float(x)) for x in overlap_poly.exterior.xy[1]]
         found_lons = [find_closest(lonvals, float(x)) for x in overlap_poly.exterior.xy[0]]

      #found = zip(overlap_poly.exterior.xy[0],overlap_poly.exterior.xy[1])
      found = zip(found_lons,found_lats)
   current_app.logger.debug('#'*40)
   current_app.logger.debug(found)

   # img = Image.new('L', (chl.shape[2],chl.shape[1]), 0)
   img = Image.new('L', (chl.shape[to_be_masked.variables[variable].dimensions.index(str(getCoordinateVariable(to_be_masked, 'Lon').dimensions[0]))],chl.shape[to_be_masked.variables[variable].dimensions.index(str(getCoordinateVariable(to_be_masked, 'Lat').dimensions[0]))]), 0)

   if overlap_poly.type == "MultiPolygon":
      for f in found:
         ImageDraw.Draw(img).polygon(f,  outline=2, fill=2)
   else:
      if poly_type == 'polygon':
         ImageDraw.Draw(img).polygon(found,  outline=2, fill=2)
      if poly_type == 'line':
         ImageDraw.Draw(img).line(found,   fill=2)

   masker = np.array(img)

   #fig = plt.figure()
   masked_variable = []
   for i in range(chl.shape[0]):
      #print i
      masked_variable.append(np.ma.masked_array(chl[i,:], mask=[x != 2 for x in masker]))
      masked_variable[i].filled(-999)
    
   #    a = fig.add_subplot(1,5,i+1)
   #    imgplot = plt.imshow(masked_variable)

   # plt.show()
   return masked_variable, to_be_masked, masker, tfile, variable




"""
Create the url that will be used to contact the wcs server.
"""
def createURL(params):
   urlParams = {}
   for param in params.itervalues():
      if param.neededInUrl():
         urlParams[param.getName()] = param.value
   
   query = urllib.urlencode(urlParams)
   url = params['baseURL'].value + query
   current_app.logger.debug('URL: ' + url) # DEBUG
   if "wcs2json/wcs" in params['baseURL'].value:
      g.error = 'possible infinite recursion detected, cancelled request'
      error_handler.setError('2-06', None, g.user.id, "views/wcs.py:createURL - Possible recursion detected, returning 400 to user.", request)
      abort(400)
   return Param("url", False, False, url)
      
def contactWCSServer(url):
   current_app.logger.debug('Contacting WCS Server with request...' + url)
   resp = urllib2.urlopen(url)     
   current_app.logger.debug(url)
   current_app.logger.debug('Request successful')
   return resp
      
def saveOutTempFile(resp):
   current_app.logger.debug('Saving out temporary file...')
   temp = tempfile.NamedTemporaryFile('w+b', delete=False, dir='/tmp')
   temp.write(resp.read())
   temp.close()
   resp.close()
   current_app.logger.debug('Temporary file saved successfully')
   return temp.name
    
def openNetCDFFile(fileName, params):
   current_app.logger.debug('Opening netCDF file...')
   rootgrp = netCDF.Dataset(fileName, 'r', format=params['format'].value)
   current_app.logger.debug('NetCDF file opened')
   return rootgrp

def expandBbox(params):
   # TODO: try except for malformed bbox
   current_app.logger.debug('Expanding Bbox...')
   increment = 0.1
   values = params['bbox'].value.split(',')
   for i,v in enumerate(values):
      values[i] = float(values[i]) # Cast string to float
      if i == 0 or i == 1:
         values[i] -= increment
      elif i == 2 or i == 3:
         values[i] += increment
      values[i] = str(values[i])
   params['bbox'].value = ','.join(values)
   current_app.logger.debug(','.join(values))
   current_app.logger.debug('New Bbox %s' % params['bbox'].value)
   current_app.logger.debug('Bbox Expanded')
   # Recreate the url
   current_app.logger.debug('Recreating the url...')
   params['url'] = createURL(params)
   current_app.logger.debug('Url recreated')
   return params

"""
Generic method for getting data from a wcs server
"""
def getData(params, method, checkdata=None):
   import os
   resp = contactWCSServer(params['url'].value)
   fileName = saveOutTempFile(resp)
   rootgrp = openNetCDFFile(fileName, params)
   current_app.logger.debug('Checking data...')
   # Check data
   # Run passed in method
   current_app.logger.debug('Data checked, beginning requested process...')
   output = method(rootgrp, params)
   rootgrp.close()
   os.remove(fileName)
   current_app.logger.debug('Process complete, returning data for transmission...')
   return output

"""
Tries to get a single point of data to return
"""      
def getPointData(params, method):
   import os
   current_app.logger.debug('Beginning try to get point data...')
   for x in range(10) :
      current_app.logger.debug('Attempt %s' % (x + 1))
      #expand box
      params = expandBbox(params)
      try:
         return getData(params, method)
      except urllib2.URLError as e:
         if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
            current_app.logger.debug(e.code)
            if e.code != 400:
               g.graphError = "Failed to make a valid connection with the WCS server"
               return {}
            else:
               current_app.logger.debug('Made a bad request to the WCS server')
   
   # If we get here, then no point found
   g.graphError = "Could not retrieve a data point for that area"
   return {}

def toCSV(data):
   import csv
   import json
   import collections
   #current_app.logger.debug(data)
   temp = tempfile.NamedTemporaryFile('w+b', delete=False, dir='/tmp')

   data = data['data'] # To get the actual data, with the dates

   csv_data = csv.writer(open(temp.name, "wb+"))
   

   csv_data.writerow(['date','std','max','min','median','mean'])

   ordered = collections.OrderedDict(sorted(data.items())) 

   for row in ordered.iterkeys():
      row_data = [row] # First column should be date (the row key)
      for col in ordered[row].iterkeys():
         row_data.append(ordered[row][col])
      csv_data.writerow(row_data)
   
   current_app.logger.debug(csv_data)
   current_app.logger.debug("return tempfile")
   current_app.logger.debug(temp)

   return temp

def getIrregularData(params, poly_type=None):
   current_app.logger.debug("in my new irregular function")
   polygon = params['bbox'].value
   if poly_type:
      mask, data,_,_,_ = create_mask(polygon, params, poly_type)
   else: 
      mask, data,_,_,_ = create_mask(polygon, params)

   return basic(mask, params, irregular=True, original=data)



def getBboxData(params, method):
   import os, errno
   print '5'*40
   try:
      return getData(params, method)
   except urllib2.URLError as e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            ## THIS IS BAD BAD CODE PLEASE DO NOT KILL ME. HOWEVER, DO DELETE ASAP 
            ## On the first attempt, it may return a 400 due to vertical attribute in data
            ## The second try removes the negative to attempt to fix.
            try:
               if "vertical" in params:
                  current_app.logger.debug(params["vertical"].value)
                  params["vertical"]._value = params["vertical"].value[1:]
                  params['url'] = createURL(params)
                  datavar = getData(params, method)
                  current_app.logger.debug(datavar)
                  return datavar


            except urllib2.URLError as e:
               if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
                  if e.code == 400:
                     g.error = "Failed to access url, make sure you have entered the correct parameters."
                  if e.code == 500:
                     g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
                  abort(400)
            ## / BAD CODE
            g.error = "Failed to access url, make sure you have entered the correct parameters."
         if e.code == 500:
            g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
         abort(400)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/wcs.py:getBboxData - Failed to access url, returning 400 to user. Exception %s" % e, request)
   #except IOError as e:
      #if e[0] == 2:
         #g.error = "Unable to save file"
         #abort(400)
           
"""
Performs a basic set of statistical functions on the provided data.
"""
def basic(dataset, params, irregular=False, original=None):
   if irregular:
      arr = np.ma.concatenate(dataset)
   else:
      print "i shoudl not ever get here !!!!!!!!!!!!!!!!!!!!!!"
      arr = np.array(dataset.variables[params['coverage'].value])
   #current_app.logger.debug(arr)
   # Create a masked array ignoring nan's
   if original is not None:
      dataset = original
   
   maskedArray = np.ma.masked_invalid(arr)
   #maskedArray = arr
   
   time = getCoordinateVariable(dataset, 'Time')
      
   if time == None:
      g.graphError = "could not find time dimension"
      return
   
   times = np.array(time)
   output = {}
   
   units = getUnits(dataset.variables[params['coverage'].value])
   output['units'] = units
   
   current_app.logger.debug('starting basic calc') # DEBUG
   
   #mean = getMean(maskedArray)
   #median = getMedian(maskedArray)
   #std = getStd(maskedArray)
   #min = getMin(maskedArray)
   #max = getMax(maskedArray)
   timeUnits = getUnits(time)
   start = None
   if timeUnits:
      start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
   else: 
      start = ''.join(times[0])
   
   #=========================================================================
   # if np.isnan(max) or np.isnan(min) or np.isnan(std) or np.isnan(mean) or np.isnan(median):
   #   output = {}
   #   g.graphError = "no valid data available to use"
   # else:
   #   output['global'] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max, 'time': start}
   #=========================================================================
   
   output['global'] = {'time': start}
   current_app.logger.debug('starting iter of dates') # DEBUG
   
   output['data'] = {}
   
   for i, row in enumerate(maskedArray):
      #current_app.logger.debug(np.max(row))
      import pprint
     
      pprint.pprint(row)
      if timeUnits:
         date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
      else:     
         date = ''.join(times[i])
      mean = getMean(row)
      median = getMedian(row)
      std = getStd(row)
      min = getMin(row)
      max = getMax(row)
      
      if np.isnan(max) or np.isnan(min) or np.isnan(std) or np.isnan(mean) or np.isnan(median):
         pass
      else:
         output['data'][date] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max}
   
   if len(output['data']) < 1:
      g.graphError = "no valid data available to use"
      return output
      
   current_app.logger.debug('Finished basic') # DEBUG
   
   return output


def hovmoller(dataset, params):
   xAxisVar = params['graphXAxis'].value
   yAxisVar = params['graphYAxis'].value
   zAxisVar = params['graphZAxis'].value

   xVar = getCoordinateVariable(dataset, xAxisVar)
   xArr = np.array(xVar)
   yVar = getCoordinateVariable(dataset, yAxisVar)
   yArr = np.array(yVar)
   zArr = np.array(dataset.variables[zAxisVar])
   
   if xVar == None:
      g.graphError = "could not find %s dimension" % xAxisVar
      return
   if yVar == None:
      g.graphError = "could not find %s dimension" % yAxisVar
      return
   
   # Create a masked array ignoring nan's
   zMaskedArray = np.ma.masked_invalid(zArr)
      
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
      start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
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
         zMaskedArray = zMaskedArray.swapaxes(0,1)[0]
         
         output['depth'] = float(depth[0])
 

   for i, timelatlon in enumerate(zMaskedArray):
      date = None    
      if timeUnits:
         date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
      else:     
         date = ''.join(times[i])
      
      for j, row in enumerate(timelatlon):
         
         if direction == "lat":
            pos = lat[j]
         elif direction == "lon":
            pos = lon[j]
         
         mean = getMean(row)
         
         if np.isnan(mean):
            mean = 0

         output['data'].append([date, float(pos), mean])
            
   if len(output['data']) < 1:
      g.graphError = "no valid data available to use"
      error_handler.setError('2-07', None, g.user.id, "views/wcs.py:hovmoller - No valid data available to use.")
      return output
      
   
   return output



  
"""
Creates a histogram from the provided data. If no bins are created it creates its own.
"""
def histogram(dataset, params):
   var = np.array(dataset.variables[params['coverage'].value]) # Get the coverage as a numpy array
   return {'histogram': getHistogram(var)}

"""
Creates a scatter from the provided data.
"""
def scatter(dataset, params):
   var = np.array(dataset.variables[params['coverage'].value])
   return {'scatter': getScatter(var)}

"""
Returns the raw data.
"""
def raw(dataset, params):
   var = np.array(dataset.variables[params['coverage'].value]) # Get the coverage as a numpy array
   return {'rawdata': var.tolist()}

"""
Returns the median value from the provided array.
"""
def getMedian(arr):
   return float(np.ma.median(arr))

"""
Returns the mean value from the provided array.
"""
def getMean(arr):
   return float(np.mean(arr))

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

"""
Returns a histogram created from the provided array. If no bins
are provided, some are created using the min and max values of the array.
"""
def getHistogram(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   bins = request.args.get('bins', None) # TODO move to get params
   numbers = []
   current_app.logger.debug('before bins') # DEBUG
   
   if bins == None or not bins:
      max = getMax(maskedarr)
      min = getMin(maskedarr)
      bins = np.linspace(min, max, 11) # Create ten evenly spaced bins 
      current_app.logger.debug('bins generated') # DEBUG
      N,bins = np.histogram(maskedarr, bins) # Create the histogram
   else:
      values = bins.split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i]) # Cast string to float
      bins = np.array(values)
      current_app.logger.debug('bins converted') # DEBUG
      N,bins = np.histogram(maskedarr, bins) # Create the histogram
   
   current_app.logger.debug('histogram created') # DEBUG
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
      current_app.logger.debug(key)
      dimension = dataset.dimensions[key]
      if key == dimName:
         return len(dimension)
   
   return None

def getXDimension(dataset):
   pass

def getYDimension(dataset):
   pass

def getUnits(variable):
   for name in variable.ncattrs():
      if name == "units":
         return variable.units
      
   return ''
