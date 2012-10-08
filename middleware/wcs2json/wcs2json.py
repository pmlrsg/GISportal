#!/usr/bin/env python

import urllib
import urllib2
import tempfile
import numpy as np
import netCDF4 as netCDF

from flask import Flask, abort, request, jsonify, make_response, g

app = Flask(__name__)

@app.route('/wcs2json')
def root():
   return '/wcs2json/thredds - get thredds catalog - not working,<br> /wcs2json - get WCS data - working'

@app.route('/proxy', methods = ['GET', 'POST'])
def proxy():  
   # Designed to prevent Open Proxy type stuff - white list of allowed hostnames
   allowedHosts = ['localhost','localhost:8080',
                   '127.0.0.1','127.0.0.1:8080','127.0.0.1:5000',
                   'pmpc1313.npm.ac.uk','pmpc1313.npm.ac.uk:8080','pmpc1313.npm.ac.uk:5000',
                   'fedora-mja.npm.ac.uk:5000','fedora-mja:5000'
                   'earthserver.pml.ac.uk','earthserver.pml.ac.uk:8080',
                   'vostok.pml.ac.uk','vostok.pml.ac.uk:8080',
                   'rsg.pml.ac.uk','rsg.pml.ac.uk:8080',
                   'motherlode.ucar.edu','motherlode.ucar.edu:8080',
                   'bbc.co.uk', 'www.openlayers.org']  
   
   url = request.args.get('url', 'http://www.openlayers.org')
   
   try:
      host = url.split("/")[2]
      #print host
      if allowedHosts and not host in allowedHosts:
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
         abort(400)
   
   except Exception, e:
      #print E
      abort(e.code)






@app.route('/wcs2json/thredds')
def getThreddsCatalog():
   datasets = [open_url(url) for url in crawlCatalog(catalog)]
   app.logger.debug(datasets) # DEBUG
   return jsonify(datasets = datasets)

catalog = 'http://rsg.pml.ac.uk/thredds/catalog.xml'
NAMESPACE = 'http://www.unidata.ucar.edu/namespaces/thredds/InvCatalog/v1.0'
   
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






@app.route('/wcs2json/wcs', methods = ['GET'])
def getWcsData():
   import random
    
   params = getParams()
   params = checkParams(params)
   requiredParams = getRequiredParams()
   status, resp = checkRequiredParams(requiredParams)
   
   if(not status):
      return resp
   
   params = dict(params.items() + requiredParams.items())
   urlParams = params.copy()
   urlParams.pop('type')
   params['url'] = createURL(urlParams)
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
      choice = random.randrange(1,6)
      if choice == 1:
         abort(400)
      elif choice == 2:
         abort(401)
      elif choice == 3:
         abort(404)
      elif choice == 4:
         return jsonify(output = "edfwefwrfewf")
      elif choice == 5:
         x = y # Should create a 500 from apache
   else:
      g.error = '"%s" is not a valid option' % type
      return abort(400)
   
   app.logger.debug('before json') # DEBUG
   
   return jsonify(output = output, type = params['type'], coverage = params['coverage'])

def getParams():
   time = request.args.get('time', None)
   bbox = request.args.get('bbox', None)
   return {'time': time,
           'bbox': bbox}

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
   
def checkParams(params):  
   checkedParams = {}
   
   for key in params.iterkeys():
      if params[key] != None:
         checkedParams[key] = params[key]
         
   return checkedParams
         
def checkRequiredParams(params):
   for key in params.iterkeys():
      if params[key] == None:
         g.error = 'required parameter "%s" is missing or is set to an invalid value' % key
         abort(400)
      
   return True, None

def createURL(params):
   baseURL = params.pop('baseURL')
   query = urllib.urlencode(params)
   url = baseURL + query
   app.logger.debug('URL: ' + url) # DEBUG
   if "wcs/wcs2json" in baseURL:
      g.error = 'possible infinite recursion detected, cancelled request'
      abort(400)
   return url

def openNetCDF(params, method):   
   app.logger.debug('before try')
   try:
      resp = urllib2.urlopen(params['url'])
      if resp.code != 200:
         g.error = 'Received %s from %s' % resp.code, params['url']
         abort(400)
      
      app.logger.debug('after code check') # DEBUG
      temp = tempfile.NamedTemporaryFile()
      temp.seek(0)
      temp.write(resp.read())
      resp.close()
           
      app.logger.debug('before opening netcdf') # DEBUG
      rootgrp = netCDF.Dataset(temp.name, 'r', format='NETCDF3')
      app.logger.debug('netcdf file open') # DEBUG
      output = method(rootgrp, params)   
      app.logger.debug('method run') # DEBUG
      rootgrp.close()
      temp.close()
      return output
   except Exception, e:
      g.error = "Request aborted, exception encountered: %s" % e
      abort(400)    

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

def histogram(dataset, params):
   var = np.array(dataset.variables[params['coverage']])
   return {'histogram': getHistogram(var)}

def raw(dataset, params):
   var = np.array(dataset.variables[params['coverage']])
   return {'rawdata': var.tolist()}
   
def getMedian(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   return np.ma.median(maskedarr)

def getMean(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   return np.mean(maskedarr)

def getStd(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   return np.std(maskedarr)

def getMin(arr):
   return float(np.nanmin(arr))

def getMax(arr):
   return float(np.nanmax(arr))

def getHistogram(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   bins = request.args.get('bins', None)
   numbers = []
   app.logger.debug('before bins') # DEBUG
   
   if bins == None or not bins:
      max = getMax(arr)
      min = getMin(arr)
      bins = np.linspace(min, max, 10)
      app.logger.debug('bins generated') # DEBUG
      N,bins = np.histogram(maskedarr, bins)    
   else:
      values = bins.split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i])
      bins = np.array(values)
      app.logger.debug('bins converted') # DEBUG
      N,bins = np.histogram(maskedarr, bins)
      
   
   app.logger.debug('histogram created') # DEBUG
   for i in range(len(bins)-1):
      numbers.append((bins[i] + (bins[i+1] - bins[i])/2, N[i]))
   return {'Numbers': numbers, 'Bins': bins.tolist()}

def getTimeDimension(dataset):
   for i, key in enumerate(dataset.variables):
      var = dataset.variables[key]
      app.logger.debug("========== key:" + key + " ===========") # DEBUG
      for name in var.ncattrs():
         app.logger.debug(name) # DEBUG
         if name == "_CoordinateAxisType" and var._CoordinateAxisType == 'Time':
            return var
   
   return None

#===============================================================================
# @app.route('/wcs/wcs2json/dev', methods=['GET'])
# def getWcsDataDev(): 
#   params = getParams()
#   params = checkParams(params)
#   requiredParams = getRequiredParams()
#   status, resp = checkRequiredParams(requiredParams)
#   
#   if(not status):
#      return resp
#   
#   params = dict(params.items() + requiredParams.items())
#   urlParams = params.copy()
#   urlParams.pop('type')
#   params['url'] = createURL(urlParams)
#   app.logger.debug('before type') # DEBUG
#   
#   type = params['type']
#   if type == 'histogram':
#      output = openNetCDF(params, histogram)
#   elif type == 'basic':
#      output = openNetCDF(params, basic)
#   elif type == 'raw':
#      output = openNetCDF(params, raw)
#   else:
#      return badRequest('required parameter "type" is set to an invalid value')
#   
#   app.logger.debug('before json') # DEBUG
#   
#   return jsonify(output = output)
# 
# def test(dataset, params):
#   var = np.array(dataset.variables[params['coverage']])
#   time = getTimeDimension(dataset)
#   times = np.array(time)
#   
#   mean = getMean(var)
#   median = getMedian(var)
#   std = getStd(var)
#   min = getMin(var)
#   max = getMax(var)
#   start = (netCDF.num2date(times[0], time.units, calendar='standard')).isoformat()
#   
#   output = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max, 'time': start}
#   
#   for i,row in enumerate(var):
#      date = netCDF.num2date(times[i], time.units, calendar='standard')
#      mean = getMean(row)
#      median = getMedian(row)
#      std = getStd(row)
#      min = getMin(row)
#      max = getMax(row)
#      output[date.isoformat()] = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max}
# 
# 
#   return output
#===============================================================================

@app.errorhandler(400)
def badRequest(error):
   resp = make_response(g.error, 400)
   resp.headers['MESSAGE'] = g.error
   return resp

if __name__ == '__main__':
   app.run(debug = True, host = '0.0.0.0')