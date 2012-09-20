import urllib2
import tempfile
import numpy as np

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def hello_world():
   baseUrl = ''
   return 'Something'

@app.route('/wcs/test', methods=['GET'])
def area_point():
   import urllib2
   import urllib
   baseUrl = request.args.get('url')
   requestType = 'GetCoverage'
   service = 'WCS'
   version = request.args.get('version', '1.0.0')
   format = 'NetCDF3'
   coverage = request.args.get('coverage')
   time = request.args.get('time', None)
   bbox = request.args.get('bbox')
   query = urllib.urlencode({'service': service, 'request': requestType, 'version': version, 'format': format, 'coverage': coverage, 'bbox': bbox})
   url = baseUrl + query
   resp = urllib2.urlopen(url)
   return resp.read()

@app.route('/wcs/wcs2json', methods=['GET'])
def get_area():
   from netCDF4 import Dataset
   url = request.args.get('url', None)
   coverage = request.args.get('coverage', None)
   type = request.args.get('type', None)
   if url == None or coverage == None or type == None:
      return 'Error: param missing'
   
   resp = urllib2.urlopen(url)
   temp = tempfile.NamedTemporaryFile()
   temp.seek(0)
   temp.write(resp.read())
   
   rootgrp = Dataset(temp.name, 'r', format='NETCDF3')
   var = np.array(rootgrp.variables[coverage])
   
   if type == 'mean':
      output = get_mean(var)
   elif type == 'histogram':
      output = get_histogram(var)
   elif type == 'basic':
      mean = get_mean(var)
      median = get_median(var)
      std = get_std(var)
      min = get_min(var)
      max = get_max(var)
      output = {'mean': mean, 'median': median,'std': std, 'min': min, 'max': max}
   else:
      return 'type not valid'
     
   rootgrp.close()
   temp.close()
   
   return jsonify(data = var.tolist(),                
                  output = output)

def get_median(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   return np.ma.median(maskedarr)

def get_mean(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   return np.mean(maskedarr)

def get_std(arr):
   maskedarr = np.ma.masked_array(arr, [np.isnan(x) for x in arr])
   return np.std(maskedarr)

def get_min(arr):
   return float(np.nanmin(arr))

def get_max(arr):
   return float(np.nanmax(arr))

def get_histogram(arr):
   bins = request.args.get('bins', None)
   if bins == None:
      return 'Error: missing bins param'
   else:
      values = bins.split(',')
      for i,v in enumerate(values):
         values[i] = float(values[i])
      bins = np.array(values)
   
   N,bins = np.histogram(arr, bins)
   return {'Numbers': N.tolist(), 'Bins': bins.tolist()}

if __name__ == '__main__':
   app.run(debug=True)