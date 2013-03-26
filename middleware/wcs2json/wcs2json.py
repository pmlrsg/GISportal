#!/usr/bin/env python

import urllib
import urllib2
import tempfile
import numpy as np
import netCDF4 as netCDF

from flask import Flask, abort, request, jsonify, make_response, g

def create_app(config='config.yaml'):
   import settings
   app = Flask(__name__, instance_path=settings.PATH)
   
   import yaml
   import os
   
   with app.open_instance_resource(config) as f:
    file = f.read()
   
   config = yaml.load(file)
   app.config.from_object(settings)
   
   try:  
      import logging
      from logging.handlers import RotatingFileHandler
   
      if 'LOG_PATH' in config and len(config['LOG_PATH']) != 0 and os.path.exists(config['LOG_PATH']):
         f_handler = RotatingFileHandler(os.path.join(config['LOG_PATH'], 'python-flask.log'))
      else:
         f_handler = RotatingFileHandler(os.path.join(app.instance_path, 'python-flask.log'))
         
      f_handler.setLevel(logging.DEBUG)
      f_handler.setFormatter(logging.Formatter(
          '[%(asctime)s] [%(levelname)s]: %(message)s '
          '[in %(filename)s:%(lineno)d]'
      ))
      app.logger.addHandler(f_handler)
      app.logger.setLevel(config['LOG_LEVEL'])
      app.logger.debug(app.debug)
   except:
      print 'Failed to setup logging'
   
   # Designed to prevent Open Proxy type stuff - white list of allowed hostnames
   allowedHosts = ['localhost','localhost:8080',
            '127.0.0.1','127.0.0.1:8080','127.0.0.1:5000',
            'pmpc1313.npm.ac.uk','pmpc1313.npm.ac.uk:8080','pmpc1313.npm.ac.uk:5000',
            'fedora-mja.npm.ac.uk:5000','fedora-mja:5000',
            'earthserver.pml.ac.uk','earthserver.pml.ac.uk:8080',
            'vostok.pml.ac.uk','vostok.pml.ac.uk:8080',
            'rsg.pml.ac.uk','rsg.pml.ac.uk:8080',
            'motherlode.ucar.edu','motherlode.ucar.edu:8080',
            'www.openlayers.org', 'wms.jpl.nasa.gov', 'labs.metacarta.com', 
            'www.gebco.net', 'oos.soest.hawaii.edu:8080', 'oos.soest.hawaii.edu',
            'thredds.met.no','thredds.met.no:8080', 'irs.gis-lab.info',
            'demonstrator.vegaspace.com']
   
   graphs = {}
   
   """
   Nothing yet. Maybe return info plus admin login page?
   """
   @app.route('/wcs2json/')
   def root():
      return 'Nothing here just yet.'
   
   
   
   
#############################################################################################################################  
   """
   Standard proxy
   """
   @app.route('/proxy', methods = ['GET', 'POST'])
   def proxy():  
      url = request.args.get('url', 'http://www.openlayers.org')
      
      app.logger.debug(url)
      
      try:
         host = url.split("/")[2]
         app.logger.debug(host)
         if host and allowedHosts and not host in allowedHosts:
            abort(502)
            
         if url.startswith("http://") or url.startswith("https://"):      
            if request.method == "POST":
               contentType = request.environ["CONTENT_TYPE"]
               headers = {"Content-Type": request.environ["CONTENT_TYPE"]}
               body = request
               r = urllib2.Request(url, body, headers)
               y = urllib2.urlopen(r)
            else:
               y = urllib2.urlopen(url)
            
            # print content type header
            i = y.info()
            #if i.has_key("Content-Type"):
            #    print "Content-Type: %s" % (i["Content-Type"])
            #else:
            #    print "Content-Type: text/plain"
            #print
            
            #resp = y.read()
            resp = make_response(y.read(), y.code)
            if i.has_key("Content-Type"):
               resp.headers.add('Content-Type', i['Content-Type'])
               
            #for key in y.headers.dict.iterkeys():
               #resp.headers[key] = y.headers.dict[key]
            
            y.close()
            return resp
         else:
            g.error = 'Missing protocol. Add "http://" or "https://" to the front of your request url.'
            abort(400)
      
      except urllib2.URLError as e:
         if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
            if e.code == 400:
               g.error = "Failed to access url, make sure you have entered the correct parameters."
            if e.code == 500:
               g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
            abort(400)
            
         g.error = "Failed to access url, make sure you have entered the correct parameters"
         abort(400) # return 400 if we can't get an exact code
      except Exception, e:
         if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
            if e.code == 400:
               g.error = "Failed to access url"
            abort(e.code)
            
         g.error = "Failed to access url, make sure you have entered the correct parameters"
         abort(400) # return 400 if we can't get an exact code
   
   
   
   
#######################################################################################################################  
   """
   Attempts to harvest links to datasets from a thredds catalog.
   """
   @app.route('/wcs2json/thredds')
   def getThreddsCatalog():
      datasets = [open_url(url) for url in crawlCatalog(catalog)]
      app.logger.debug(datasets) # DEBUG
      return jsonify(datasets = datasets)
   
   catalog = 'http://rsg.pml.ac.uk/thredds/catalog.xml'
   NAMESPACE = 'http://www.unidata.ucar.edu/namespaces/thredds/InvCatalog/v1.0'
   
   """
   Crawls over a thredds catalog looking for datasets.
   """
   def crawlCatalog(url):
      from lxml import etree
      from httplib2 import Http
      import urlparse
      from pydap.client import open_url
      resp, content = Http().request(catalog)
      xml = etree.fromstring(content)
      base = xml.find('.//{%s}service % NAMESPACE')
      app.logger.debug(base) # DEBUG
      for dataset in xml.iterfind('.//{%s}dataset[@urlPath]' % NAMESPACE):
         yield urlparse.urljoin(base.attrib['base'], dataset.attrib['urlPath'])
      for subdir in xml.iterfind('.//{%s}catalogRef' % NAMESPACE):
         app.logger.debug(subdir) # DEBUG
         for url in crawlCatalog(subdir.attrib['{http://www.w3.org/1999/xlink}href']):
            app.logger.debug(url)
            yield url
   
   
   
   
#########################################################################################################################
   """
   Gets wcs data from a specified server, then performs a requested function
   on the received data, before jsonifying the output and returning it.
   """
   @app.route('/wcs2json/wcs', methods = ['GET'])
   def getWcsData():
      import random
      
      g.graphError = "";

      params = getParams() # Gets any parameters
      params = checkParams(params) # Checks what parameters where entered
      
      params['url'] = createURL(params)
      app.logger.debug('Processing request...') # DEBUG
      
      type = params['type'].getValue()
      if type == 'histogram': # Outputs data needed to create a histogram
         output = getBboxData(params, histogram)
      elif type == 'basic': # Outputs a set of standard statistics
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
            return jsonify(outpu = "edfwefwrfewf")
         elif choice == 5:
            abort(502)
         elif choice == 6:
            x = y # Should create a 500 from apache
      else:
         g.error = '"%s" is not a valid option' % type
         return abort(400)
      
      app.logger.debug('Jsonifying response...') # DEBUG
      
      try:
         jsonData = jsonify(output = output, type = params['type'].getValue(), coverage = params['coverage'].getValue(), error = g.graphError)
      except TypeError as e:
         g.error = "Request aborted, exception encountered: %s" % e
         abort(400) # If we fail to jsonify the data return 500
         
      app.logger.debug('Request complete, Sending results') # DEBUG
      
      return jsonData
   
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
      nameToParam["coverage"] = Param("coverage", False, True, request.args.get('coverage'))
      nameToParam["crs"] = Param("crs", False, True, 'OGC:CRS84')
      
      # Optional extras
      nameToParam["time"] = Param("time", True, True, request.args.get('time', None))
      
      # One Required
      nameToParam["bbox"] = Param("bbox", True, True, request.args.get('bbox', None))
      nameToParam["circle"] = Param("circle", True, True, request.args.get('circle', None))
      nameToParam["polygon"] = Param("polygon", True, True, request.args.get('polygon', None))
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
         if params[key].getValue() == None or len(params[key].getValue()) == 0:
            if not params[key].isOptional():            
               g.error = 'required parameter "%s" is missing or is set to an invalid value' % key
               abort(400)
         else:
            checkedParams[key] = params[key]
            
      return checkedParams
   
   def createMask(params):
      if params["bbox"] != None:
         pass
      
      
   
   """
   Create the url that will be used to contact the wcs server.
   """
   def createURL(params):
      urlParams = {}
      for param in params.itervalues():
         if param.neededInUrl():
            urlParams[param.getName()] = param.getValue()
      
      query = urllib.urlencode(urlParams)
      url = params['baseURL'].getValue() + query
      app.logger.debug('URL: ' + url) # DEBUG
      if "wcs2json/wcs" in params['baseURL'].getValue():
         g.error = 'possible infinite recursion detected, cancelled request'
         abort(400)
      return Param("url", False, False, url)
         
   def contactWCSServer(url):
      app.logger.debug('Contacting WCS Server with request...')
      resp = urllib2.urlopen(url)     
      app.logger.debug('Request successful')
      return resp
         
   def saveOutTempFile(resp):
      app.logger.debug('Saving out temporary file...')
      temp = tempfile.NamedTemporaryFile('w+b', delete=False)
      temp.write(resp.read())
      temp.close()
      resp.close()
      app.logger.debug('Temporary file saved successfully')
      return temp.name
       
   def openNetCDFFile(fileName, params):
      app.logger.debug('Opening netCDF file...')
      rootgrp = netCDF.Dataset(fileName, 'r', format=params['format'].getValue())
      app.logger.debug('NetCDF file opened')
      return rootgrp
   
   def expandBbox(params):
      # TODO: try except for malformed bbox
      app.logger.debug('Expanding Bbox...')
      increment = 0.1
      values = params['bbox'].getValue().split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i]) # Cast string to float
         if i == 0 or i == 1:
            values[i] -= increment
         elif i == 2 or i == 3:
            values[i] += increment
         values[i] = str(values[i])
      params['bbox'].setValue(','.join(values))
      app.logger.debug(','.join(values))
      app.logger.debug('New Bbox %s' % params['bbox'].getValue())
      app.logger.debug('Bbox Expanded')
      # Recreate the url
      app.logger.debug('Recreating the url...')
      params['url'] = createURL(params)
      app.logger.debug('Url recreated')
      return params
   
   """
   Generic method for getting data from a wcs server
   """
   def getData(params, method, checkdata=None):
      import os
      resp = contactWCSServer(params['url'].getValue())
      fileName = saveOutTempFile(resp)
      rootgrp = openNetCDFFile(fileName, params)
      app.logger.debug('Checking data...')
      # Check data
      # Run passed in method
      app.logger.debug('Data checked, beginning requested process...')
      output = method(rootgrp, params)
      rootgrp.close()
      os.remove(fileName)
      app.logger.debug('Process complete, returning data for transmission...')
      return output
   
   """
   Tries to get a single point of data to return
   """      
   def getPointData(params, method):
      import os
      app.logger.debug('Beginning try to get point data...')
      for x in range(10) :
         app.logger.debug('Attempt %s' % (x + 1))
         #expand box
         params = expandBbox(params)
         try:
            return getData(params, method)
         except urllib2.URLError as e:
            if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
               app.logger.debug(e.code)
               if e.code != 400:
                  g.graphError = "Failed to make a valid connection with the WCS server"
                  return {}
               else:
                  app.logger.debug('Made a bad request to the WCS server')
      
      # If we get here, then no point found
      g.graphError = "Could not retrieve a data point for that area"
      return {}
   
   def getBboxData(params, method):
      import os, errno
      try:
         return getData(params, method)
      except urllib2.URLError as e:
         if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
            if e.code == 400:
               g.error = "Failed to access url, make sure you have entered the correct parameters."
            if e.code == 500:
               g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
            abort(400)
            
         g.error = "Failed to access url, make sure you have entered the correct parameters"
         abort(400) # return 400 if we can't get an exact code
      #except IOError as e:
         #if e[0] == 2:
            #g.error = "Unable to save file"
            #abort(400)
              
   """
   Performs a basic set of statistical functions on the provided data.
   """
   def basic(dataset, params):
      arr = np.array(dataset.variables[params['coverage'].getValue()])
      # Create a masked array ignoring nan's
      maskedArray = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
      time = getCoordinateVariable(dataset, 'Time')
         
      if time == None:
         g.graphError = "could not find time dimension"
         return
      
      times = np.array(time)
      output = {}
      
      units = getUnits(dataset.variables[params['coverage'].getValue()])
      output['units'] = units
      
      app.logger.debug('starting basic calc') # DEBUG
      
      #mean = getMean(maskedArray)
      #median = getMedian(maskedArray)
      #std = getStd(maskedArray)
      #min = getMin(maskedArray)
      #max = getMax(maskedArray)
      start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
      
      #=========================================================================
      # if np.isnan(max) or np.isnan(min) or np.isnan(std) or np.isnan(mean) or np.isnan(median):
      #   output = {}
      #   g.graphError = "no valid data available to use"
      # else:
      #   output['global'] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max, 'time': start}
      #=========================================================================
      
      output['global'] = {'time': start}
      app.logger.debug('starting iter of dates') # DEBUG
      
      output['data'] = {}
      
      for i, row in enumerate(maskedArray):
         #app.logger.debug(row)
         date = netCDF.num2date(times[i], time.units, calendar='standard')
         mean = getMean(row)
         median = getMedian(row)
         std = getStd(row)
         min = getMin(row)
         max = getMax(row)
         
         if np.isnan(max) or np.isnan(min) or np.isnan(std) or np.isnan(mean) or np.isnan(median):
            pass
         else:
            output['data'][date.isoformat()] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max}
      
      if len(output['data']) < 1:
         g.graphError = "no valid data available to use"
         return output
         
      app.logger.debug('Finished basic') # DEBUG
      
      return output
   
   def hovmoller(dataset, params):
      xAxisVar = params['graphXAxis'].getValue()
      yAxisVar = params['graphYAxis'].getValue()
      zAxisVar = params['graphZAxis'].getValue()
      
      print xAxisVar, yAxisVar, zAxisVar
          
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
      zMaskedArray = np.ma.masked_array(zArr, [np.isnan(x) for x in zArr])
      
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
         
      #for debug
      #if lat == None:
         #var = getCoordinateVariable(dataset, 'Lat')
         #lat = np.array(var)
      #elif lon == None:
         #var = getCoordinateVariable(dataset, 'Lon')
         #lon = np.array(var)
      

      output = {}
      
      units = getUnits(dataset.variables[params['coverage'].getValue()])
      output['units'] = units
      
      app.logger.debug('starting basic calc') # DEBUG
      
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
      
      output['global'] = {'time': start}
      app.logger.debug('starting iter of dates') # DEBUG
      
      output['data'] = []
      
      # Temp code dup
      if lat != None:     
         for i, timelatlon in enumerate(zMaskedArray):
            
            date = None    
            if timeUnits:
               date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
            else:     
               date = ''.join(times[i])
            #output['data'][date.isoformat()] = []
            
            for j, latRow in enumerate(timelatlon):            
               latitude = lat[j]
               #output['data'][date.isoformat()].append([float(latitude), getMean(latRow)])              
               mean = getMean(latRow)
               
               if np.isnan(mean):
                  output['data'].append([date, float(latitude), 0])
               else:               
                  output['data'].append([date, float(latitude), mean])
                  
      elif lon != None:
         zMaskedArray = zMaskedArray.swapaxes(1,2)
         
         for i, timelonlat in enumerate(zMaskedArray):    
            date = None
            if timeUnits:  
               date = netCDF.num2date(time[i], time.units, calendar='standard').isoformat()
            else:    
               date = ''.join(times[i])  
            #output['data'][date.isoformat()] = []
                           
            for j, lonRow in enumerate(timelonlat):
               longitude = lon[j]            
               #lonArr = []                                  
               #for k, latRow in enumerate(lonRow):
                  #lonArr.append(lon[k])                 
               #lonArr = np.array(lonArr)
               #output['data'][date.isoformat()].append([float(longitude), getMean(lonRow)])
               
               mean = getMean(lonRow)
               
               if np.isnan(mean):
                  pass
               else:
                  output['data'].append([date, float(longitude), mean])          
            
         #app.logger.debug(time)
         
      if len(output['data']) < 1:
         g.graphError = "no valid data available to use"
         return output
         
      app.logger.debug('Finished basic') # DEBUG
      
      return output
      
   """
   Creates a histogram from the provided data. If no bins are created it creates its own.
   """
   def histogram(dataset, params):
      var = np.array(dataset.variables[params['coverage'].getValue()]) # Get the coverage as a numpy array
      return {'histogram': getHistogram(var)}
   
   """
   Creates a scatter from the provided data.
   """
   def scatter(dataset, params):
      var = np.array(dataset.variables[params['coverage'].getValue()])
      return {'scatter': getScatter(var)}
   
   """
   Returns the raw data.
   """
   def raw(dataset, params):
      var = np.array(dataset.variables[params['coverage'].getValue()]) # Get the coverage as a numpy array
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
      return float(np.std(arr))
   
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
      app.logger.debug('before bins') # DEBUG
      
      if bins == None or not bins:
         max = getMax(maskedarr)
         min = getMin(maskedarr)
         bins = np.linspace(min, max, 11) # Create ten evenly spaced bins 
         app.logger.debug('bins generated') # DEBUG
         N,bins = np.histogram(maskedarr, bins) # Create the histogram
      else:
         values = bins.split(',')
         for i,v in enumerate(values):
            values[i] = float(values[i]) # Cast string to float
         bins = np.array(values)
         app.logger.debug('bins converted') # DEBUG
         N,bins = np.histogram(maskedarr, bins) # Create the histogram
      
      app.logger.debug('histogram created') # DEBUG
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
         app.logger.debug("========== key:" + key + " ===========") # DEBUG
         for name in var.ncattrs():
            app.logger.debug(name) # DEBUG
            if name == "_CoordinateAxisType" and var._CoordinateAxisType == axis:
               return var
      
      return None
   
   def getDimension(dataset, dimName):
      for i, key in enumerate(dataset.dimensions):
         app.logger.debug(key)
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
   
   @app.errorhandler(400)
   def badRequest(error):
      if hasattr(g, 'error'):
         resp = make_response(g.error, 400)
         resp.headers['MESSAGE'] = g.error
         return resp
      else:
         resp = make_response("Bad request", 400)
         resp.headers['MESSAGE'] = "Bad request"
         return resp
   
   return app

class Mask(object):
   def __init__(self, bbox):
      self._bbox = bbox
      
   def getBbox(self):
      return self._bbox
   
#===============================================================================
# class Ellipse(Mask):
#   def __init__(self, centre, height, width):
#      self._lat = centre.getLat()
#      self._lon = centre.getLon()
#      self._height = height
#      self._width = width
#      
#   def getCentre(self):
#      return Point(self._lat, self._lon)
#      
#   def createBbox(self, lat, lon, height, width):
#      hRadius = height / 2
#      wRadius = width / 2
#      
#      return Bbox(self._lon - wRadius, self._lat - hRadius, self._lon + wRadius, self._lat + hRadius)
#   
#   def pointInMask(self, point):
#      x = (math.pow(point.getLon() - getCentre().getLon(), 2)) / self._width
#      y = (math.pow(point.getLat() - getCentre().getLat(), 2)) / self._height
#      
#      return x + y <= 1
#===============================================================================
      
class Polygon(Mask):
   def __init__(self, points = None, commaSeparatedPoints = None):
      if points != None:
         self._poly = points
      
      if commaSeparatedPoints != None:
         points = []
         values = commaSeparatedPoints.getValue().split(',')
         [points.append(Point(values[i], values[i+1])) for i in range(0, len(values), 2)]
         self._poly = points
      
      if points == None and commaSeparatedPoints == None:
         #TODO: Throw developer error
         pass
      
      super(Polygon, self).__init__(createBbox(self._poly))
   
   def getPolygonAsTupleList(self):
      listToReturn = []
      for point in self._poly:
         listToReturn.append((point.getLon(), point.getLat()))
         
      return listToReturn
   
   def createBbox(self, points):
      minLon = None
      maxLon = None
      minLat = None
      maxLat = None
      
      for point in point:
         if minLon == None:
            minLon = point.getLon()
         elif point.getLon() < minLon:
            minLon = point.getLon()
            
         if maxLon == None:
            maxLon = point.getLon()
         elif point.getLon() > maxLon:
            maxLon = point.getLon()
            
         if minLat == None:
            minLat = point.getLat()
         elif point.getLat() < minLat:
            minLat = point.getLat()
            
         if maxLat == None:
            maxLat = point.getLat()
         elif point.getLat() > maxLat:
            maxLat = point.getLat()
            
      return Bbox(minLon, minLat, maxLon, maxLat)
           
   def pointInMask(self, point, poly=None):
      if poly == None:
         poly = self.getPolygonAsTupleList()
      
      x = point.getLon()
      y = point.getLat()
      
      # check if point is a vertex
      if (x,y) in poly: return True
   
      # check if point is on a boundary
      for i in range(len(poly)):
         p1 = None
         p2 = None
         if i == 0:
            p1 = poly[0]
            p2 = poly[1]
         else:
            p1 = poly[i - 1]
            p2 = poly[i]
         if p1[1] == p2[1] and p1[1] == y and x > min(p1[0], p2[0]) and x < max(p1[0], p2[0]):
            return "True"
         
      n = len(poly)
      inside = False
   
      p1x,p1y = poly[0]
      for i in range(n+1):
         p2x,p2y = poly[i % n]
         if y > min(p1y,p2y):
            if y <= max(p1y,p2y):
               if x <= max(p1x,p2x):
                  if p1y != p2y:
                     xints = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
                  if p1x == p2x or x <= xints:
                     inside = not inside
         p1x,p1y = p2x,p2y
         
      return inside

class Point:
   def __init__(self, lon, lat):
      self._lat = lat
      self._lon = lon
      
   def getLat(self):
      return self._lat
   
   def getLon(self):
      return self._lon
   
   def getTuple(self):
      return (self.getLon(), self.getLat())
   
class Bbox:
   def __init__(self, lon1, lat1, lon2, lat2):
      self._bottomLeft = Point(lon1, lat1)
      self._topRight = Point(lon2, lat2)
      self._topLeft = Point(lon1, lat2)
      self._bottomRight = Point(lon2, lat1)
      
   def getBottomLeft(self):
      return self._bottomLeft
   
   def getTopLeft(self):
      return self._topLeft
   
   def getBottomRight(self):
      return self._bottomRight
   
   def getTopRight(self):
      return self._topRight

class Graph:
   def __init__(self, name, numAxis, params, funcs):
      self._name = name
      self._numAxis = numAxis
      self._params = params
      self._funcs = funcs
      
   def hasX(self):
      return self._numAxis >= 1
   
   def hasY(self):
      return self._numAxis >= 2
   
   def hasZ(self):
      return self._numAxis >= 3
     
   # what axis
   # allowed/not allowed funcs
   # custom params
   # special funcs
   
class Param:
   def __init__(self, name, optional, neededInUrl, value):
      self._name = name
      self._optional = optional
      self._neededInUrl = neededInUrl
      self._value = value
      
   def isOptional(self):
      return self._optional
   
   def neededInUrl(self):
      return self._neededInUrl
   
   def getName(self):
      return self._name
   
   def getValue(self):
      return self._value
   
   def setValue(self, value):
      self._value = value

if __name__ == '__main__':
   app = create_app(config="config.yaml")
   
   if app.debug: use_debugger = True
   try:
      use_debugger = not(app.config.get('DEBUG_WITH_APTANA'))
   except:
      pass
   app.logger.debug(app.debug)
   app.run(use_debugger=use_debugger, debug=app.debug,
           use_reloader=use_debugger, host='0.0.0.0')
   
