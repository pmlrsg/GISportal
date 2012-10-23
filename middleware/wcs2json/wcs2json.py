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
            'www.gebco.net', 'oos.soest.hawaii.edu:8080', 'oos.soest.hawaii.edu']
   
   """
   Nothing yet. Maybe return info plus admin login page?
   """
   @app.route('/wcs2json/')
   def root():
      return 'Nothing here just yet.'
   
   
   
   
   
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
            #for key in y.headers.dict.iterkeys():
               #resp.headers[key] = y.headers.dict[key]
            
            y.close()
            return resp
         else:
            g.error = "Failed to access url"
            abort(400)
      
      except Exception, e:
         if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
            if e.code == 400:
               g.error = "Failed to access url"
            abort(e.code)
            
         g.error = "Failed to access url, make sure you have entered the correct parameters"
         abort(400) # return 400 if we can't get an exact code
   
   
   
   
   
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
   
   
   
   
   
   """
   Gets wcs data from a specified server, then performs a requested function
   on the received data, before jsonifying the output and returning it.
   """
   @app.route('/wcs2json/wcs', methods = ['GET'])
   def getWcsData():
      import random
      
      params = getParams() # Gets any optional parameters
      params = checkParams(params) # Checks what parameters where entered
      requiredParams = getRequiredParams() # Gets any required parameters
      checkRequiredParams(requiredParams) # Checks to make sure we have all the parameters we need to contact the wcs server
      
      params = dict(params.items() + requiredParams.items())
      #urlParams = params.copy()
      #urlParams.pop('type')
      params['url'] = createURL(params)
      app.logger.debug('before type') # DEBUG
      
      type = params['type']
      if type == 'histogram': # Outputs data needed to create a histogram
         output = openNetCDF(params, histogram)
      elif type == 'basic': # Outputs a set of standard statistics
         output = openNetCDF(params, basic)
      elif type == 'raw': # Outputs the raw values
         output = openNetCDF(params, raw)
      elif type == 'test': # Used to test new code
         output = openNetCDF(params, test)
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
      
      app.logger.debug('before json') # DEBUG
      
      return jsonify(output = output, type = params['type'], coverage = params['coverage'])
   
   """
   Gets any optional parameters.
   """
   def getParams():
      time = request.args.get('time', None)
      bbox = request.args.get('bbox', None)
      return {'time': time,
              'bbox': bbox}
   
   """
   Gets any required parameters.
   """
   def getRequiredParams():
      baseURL = request.args.get('baseurl')
      service = 'WCS'
      requestType = 'GetCoverage'
      version = request.args.get('version', '1.0.0')
      format = 'NetCDF3'
      coverage = request.args.get('coverage')
      crs = 'OGC:CRS84'
      type = request.args.get('type')
      return {'baseURL': baseURL, 
              'service': service, 
              'request': requestType, 
              'version': version, 
              'format': format, 
              'coverage': coverage, 
              'type': type,
              'crs': crs}
   
   """
   Check the optional parameters to see if they are valid.
   """
   def checkParams(params):    
      checkedParams = {}
      
      for key in params.iterkeys():
         if params[key] != None:
            checkedParams[key] = params[key]
            
      return checkedParams
   
   """
   Check the required parameters to see if they are valid.
   """        
   def checkRequiredParams(params):
      for key in params.iterkeys():
         if params[key] == None or len(params[key]) == 0:
            g.error = 'required parameter "%s" is missing or is set to an invalid value' % key
            abort(400)
   
   """
   Create the url that will be used to contact the wcs server.
   """
   def createURL(params):
      baseURL = params.pop('baseURL')
      query = urllib.urlencode(params)
      url = baseURL + query
      app.logger.debug('URL: ' + url) # DEBUG
      if "wcs2json/wcs" in baseURL:
         g.error = 'possible infinite recursion detected, cancelled request'
         abort(400)
      return url
   
   """
   Attempt to open the url, write the response to file and then
   open it as a netcdf dataset, before running the provided method on it.
   """
   def openNetCDF(params, method):   
      import os
      app.logger.debug('before try')
      try:
         resp = urllib2.urlopen(params['url'])
         if resp.code != 200:
            g.error = 'Received %s from %s' % resp.code, params['url']
            abort(400)
         
         # DEBUG used to debug tempfile
         #app.logger.debug('opening file...') # DEBUG
         #file = open((os.path.join(app.instance_path, "pythonopen.nc")), "w")
         #app.logger.debug('writing to file...') # DEBUG
         #file.write(resp.read())
         #app.logger.debug('closing file..') # DEBUG
         #file.close()
         
         app.logger.debug('after code check') # DEBUG
         temp = tempfile.NamedTemporaryFile('w+b', delete=False)
         temp.write(resp.read())
         temp.close()
         resp.close()
         
         # DEBUG used to write out a copy of tempfile
         #file = open(temp.name, 'r')
         #copy = open((os.path.join(app.instance_path, "tempfilecopy.nc")), 'w')
         #copy.write(file.read())
         #copy.close()
         #file.close()
              
         app.logger.debug('before opening netcdf') # DEBUG
         rootgrp = netCDF.Dataset(temp.name, 'r', format='NETCDF3')
         #rootgrp = netCDF.Dataset((os.path.join(app.instance_path, "test.nc")), 'r', format='NETCDF3')
         app.logger.debug('netcdf file open') # DEBUG
         output = method(rootgrp, params)   
         app.logger.debug('method run') # DEBUG
         rootgrp.close()
         os.remove(temp.name)
         #temp.close()
         return output
      except Exception, e:
         g.error = "Request aborted, exception encountered: %s" % e
         abort(400)   
   
   """
   Performs a basic set of statistical functions on the provided data.
   """
   def basic(dataset, params):
      var = np.array(dataset.variables[params['coverage']])
      time = getTimeDimension(dataset)
      times = np.array(time)
      
      mean = getMean(var)
      median = getMedian(var)
      std = getStd(var)
      min = getMin(var)
      max = getMax(var)
      start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
      
      output = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max, 'time': start}
      
      for i,row in enumerate(var):
         date = netCDF.num2date(times[i], time.units, calendar='standard')
         mean = getMean(row)
         median = getMedian(row)
         std = getStd(row)
         min = getMin(row)
         max = getMax(row)
         output[date.isoformat()] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max}
   
      return output
   
   """
   Creates a histogram from the provided data. If no bins are created it creates its own.
   """
   def histogram(dataset, params):
      var = np.array(dataset.variables[params['coverage']]) # Get the coverage as a numpy array
      return {'histogram': getHistogram(var)}
   
   """
   Returns the raw data.
   """
   def raw(dataset, params):
      var = np.array(dataset.variables[params['coverage']]) # Get the coverage as a numpy array
      return {'rawdata': var.tolist()}
   
   """
   Returns the median value from the provided array.
   """
   def getMedian(arr):
      maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr]) # Create a masked array ignoring nan's
      return np.ma.median(maskedarr)
   
   """
   Returns the mean value from the provided array.
   """
   def getMean(arr):
      maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr]) # Create a masked array ignoring nan's
      return np.mean(maskedarr)
   
   """
   Returns the std value from the provided array.
   """
   def getStd(arr):
      maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr]) # Create a masked array ignoring nan's
      return np.std(maskedarr)
   
   """
   Returns the minimum value from the provided array. 
   """
   def getMin(arr):
      return float(np.nanmin(arr)) # Get the min ignoring nan's, then cast to float
   
   """
   Returns the maximum value from the provided array.
   """
   def getMax(arr):
      return float(np.nanmax(arr)) # Get the max ignoring nan's, then cast to float
   
   """
   Returns a histogram created from the provided array. If no bins
   are provided, some are created using the min and max values of the array.
   """
   def getHistogram(arr):
      maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
      bins = request.args.get('bins', None)
      numbers = []
      app.logger.debug('before bins') # DEBUG
      
      if bins == None or not bins:
         max = getMax(arr)
         min = getMin(arr)
         bins = np.linspace(min, max, 10) # Create ten evenly spaced bins 
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
         numbers.append((bins[i] + (bins[i+1] - bins[i])/2, float(N[i]))) # Get a number halfway between this bin and the next
      return {'Numbers': numbers, 'Bins': bins.tolist()}
   
   """
   Utility function to find the time dimension from a netcdf file. Needed as the
   time dimension will not always have the same name or the same attributes.
   """
   def getTimeDimension(dataset):
      for i, key in enumerate(dataset.variables):
         var = dataset.variables[key]
         app.logger.debug("========== key:" + key + " ===========") # DEBUG
         for name in var.ncattrs():
            app.logger.debug(name) # DEBUG
            if name == "_CoordinateAxisType" and var._CoordinateAxisType == 'Time':
               return var
      
      return None
   
   @app.errorhandler(400)
   def badRequest(error):
      resp = make_response(g.error, 400)
      resp.headers['MESSAGE'] = g.error
      return resp
   
   return app

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
   
