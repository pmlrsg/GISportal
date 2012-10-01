import urllib
import urllib2
import tempfile
import numpy as np
import netCDF4 as netCDF

from flask import Flask, abort, request, jsonify, make_response

app = Flask(__name__)

@app.route('/')
def root():
   return '/wcs/wcs2json/thredds - get thredds catalog - not working,<br> /wcs/wcs2json - get WCS data - working'

#===============================================================================
# @app.route('/wcs/test', methods=['GET'])
# def areaPoint():
#   import urllib2
#   import urllib
#   baseUrl = request.args.get('url')
#   requestType = 'GetCoverage'
#   service = 'WCS'
#   version = request.args.get('version', '1.0.0')
#   format = 'NetCDF3'
#   coverage = request.args.get('coverage')
#   time = request.args.get('time', None)
#   bbox = request.args.get('bbox')
#   query = urllib.urlencode({'service': service, 'request': requestType, 'version': version, 'format': format, 'coverage': coverage, 'bbox': bbox})
#   url = baseUrl + query
#   resp = urllib2.urlopen(url)
#   return resp.read()
#===============================================================================

@app.route('/wcs/wcs2json/thredds')
def getThreddsCatalog():
   datasets = [open_url(url) for url in crawlCatalog(catalog)]
   print datasets
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
   print base
   for dataset in xml.iterfind('.//{%s}dataset[@urlPath]' % NAMESPACE):
      yield urlparse.urljoin(base.attrib['base'], dataset.attrib['urlPath'])
   for subdir in xml.iterfind('.//{%s}catalogRef' % NAMESPACE):
      print subdir
      for url in crawlCatalog(subdir.attrib['{http://www.w3.org/1999/xlink}href']):
         print url
         yield url

@app.route('/wcs/wcs2json', methods=['GET'])
def getWcsData(): 
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
   print 'before type'
   
   type = params['type']
   if type == 'histogram':
      output = openNetCDF(params, histogram)
   elif type == 'basic':
      output = openNetCDF(params, basic)
   elif type == 'raw':
      output = openNetCDF(params, raw)
   elif type == 'test':
      output = openNetCDF(params, test)
   else:
      return abort(400)
   
   print 'before json'
   
   return jsonify(output = output, type = params['type'])

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
         return False, badRequest('required parameter "%s" is missing or is set to an invalid value' % key)
      
   return True, None

def createURL(params):
   baseURL = params.pop('baseURL')
   query = urllib.urlencode(params)
   url = baseURL + query
   print 'URL: ' + url
   if "wcs/wcs2json" in baseURL:
      return 'Error: possible infinite recursion detected, cancelled request'
   return url

def openNetCDF(params, method):   
   try:
     resp = urllib2.urlopen(params['url'])
     temp = tempfile.NamedTemporaryFile()
     temp.seek(0)
     temp.write(resp.read())
     resp.close()
     print 'before opening netcdf'
     rootgrp = netCDF.Dataset(temp.name, 'r', format='NETCDF3')
     print 'netcdf file open'
     output = method(rootgrp, params)
     print 'method run'
     rootgrp.close()
     temp.close()
   except:
     output = 'OpenNetCDF failed'
   finally:
     return output

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
   bins = request.args.get('bins', None)
   numbers = []
   print 'before bins'
   
   if bins == None or not bins:
      #max = getMax(arr)
      #min = getMin(arr)
      #bins = arange(min, max, 10)
      print 'bins generated'
      N,bins = np.histogram(arr, bins=10)
      
   else:
      values = bins.split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i])
      bins = np.array(values)
      print 'bins converted'
      N,bins = np.histogram(arr, bins)
      
   
   print 'histogram created'  
   for i in range(len(bins)-1):
      numbers.append((bins[i] + (bins[i+1] - bins[i])/2, N[i]))
   return {'Numbers': numbers, 'Bins': bins.tolist()}

@app.route('/wcs/wcs2json/dev', methods=['GET'])
def getWcsDataDev(): 
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
   print 'before type'
   
   type = params['type']
   if type == 'histogram':
      output = openNetCDF(params, histogram)
   elif type == 'basic':
      output = openNetCDF(params, basic)
   elif type == 'raw':
      output = openNetCDF(params, raw)
   else:
      return badRequest('required parameter "type" is set to an invalid value')
   
   print 'before json'
   
   return jsonify(output = output)

def test(dataset, params):
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

def getTimeDimension(dataset):
   for i, key in enumerate(dataset.variables):
      var = dataset.variables[key]
      print "========== key:" + key + " ==========="
      for name in var.ncattrs():
         print name
         if name == "_CoordinateAxisType" and var._CoordinateAxisType == 'Time':
            return var
   
   return None

@app.errorhandler(400)
def badRequest(error):
   resp = make_response(error, 400)
   resp.headers['MESSAGE'] = error
   return resp

if __name__ == '__main__':
   app.run(debug = True, host = '0.0.0.0')