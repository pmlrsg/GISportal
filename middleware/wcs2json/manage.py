import urllib
import urllib2
import tempfile
import numpy as np

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def root():
   return 'Something'

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

@app.route('/wcs/wcs2json', methods=['GET'])
def getWcsData():
   from netCDF4 import Dataset
   
   params = getParams()
   status, resp = checkRequiredParams(params)
   
   if(not status):
      return resp
   
   urlParams = params.copy()
   urlParams.pop('type')
   params['url'] = createURL(urlParams)
   
   type = params['type']
   if type == 'histogram':
      output = openNetCDF(params, histogram)
   elif type == 'basic':
      output = openNetCDF(params, basic)
   else:
      return badRequest('required parameter "type" is set to an invalid value')
   
   return jsonify(output = output)

def getParams():
   baseURL = request.args.get('baseurl', None)
   service = 'WCS'
   requestType = 'GetCoverage'
   version = request.args.get('version', '1.0.0')
   format = 'NetCDF3'
   coverage = request.args.get('coverage', None)
   type = request.args.get('type', None)
   return {'baseURL': baseURL, 
           'service': service, 
           'request': requestType, 
           'version': version, 
           'format': format, 
           'coverage': coverage, 
           'type': type}
   
def checkRequiredParams(params):
   for key in params.iterkeys():
      if(params[key] == None):
         return False, badRequest('required parameter "%s" is missing or is not set to a invalid value' % key)
      
   return True, None

def createURL(params):
   baseURL = params.pop('baseURL')
   query = urllib.urlencode(params)
   url = baseURL + query
   return url

def openNetCDF(params, method):
   from netCDF4 import Dataset
   resp = urllib2.urlopen(params['url'])
   temp = tempfile.NamedTemporaryFile()
   temp.seek(0)
   temp.write(resp.read())
   resp.close()
   rootgrp = Dataset(temp.name, 'r', format='NETCDF3')
   output = method(rootgrp, params)
   rootgrp.close()
   temp.close()
   return output

def basic(dataset, params):
   var = np.array(dataset.variables[params['coverage']])
   mean = getMean(var)
   median = getMedian(var)
   std = getStd(var)
   min = getMin(var)
   max = getMax(var)
   return {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max}

def histogram(dataset, params):
   var = np.array(dataset.variables[params['coverage']])
   return {'histogram': getHistogram(var)}
   
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
   if bins == None:
      return 'Error: missing bins param'
   else:
      values = bins.split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i])
      bins = np.array(values)
   
   numbers = []
   N,bins = np.histogram(arr, bins)
   for i in range(len(bins)-1):
      numbers.append((bins[i] + (bins[i+1] - bins[i])/2, N[i]))
   return {'Numbers': numbers, 'Bins': bins.tolist()}

@app.errorhandler(400)
def badRequest(error):
   return error, 400

#def close_netcdf(dataset):
#   from netCDF4 import Dataset
#   dataset.close()

if __name__ == '__main__':
   app.run(debug=True)