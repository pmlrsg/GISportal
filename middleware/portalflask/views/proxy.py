from flask import Blueprint, abort, request, make_response, g, current_app, send_file, Response
from portalflask.core import error_handler
from PIL import Image
import StringIO
import io
import os
import urllib2
from lxml import etree as ET
import json
import dateutil.parser
import calendar

LAYERCACHEPATH = "../../../html/cache/layers/"
SERVERCACHEPATH = "../../../html/cache/"
MASTERCACHEPATH = "../../../html/cache/mastercache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"

WMS_NAMESPACE = '{http://www.opengis.net/wms}'
WCS_NAMESPACE = '{http://www.opengis.net/wcs}'
GML_NAMESPACE = '{http://www.opengis.net/gml}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'

portal_proxy = Blueprint('portal_proxy', __name__)

# Designed to prevent Open Proxy type stuff - white list of allowed hostnames
allowedHosts = ['localhost','localhost:8080','localhost:86','localhost:85',
         '127.0.0.1','127.0.0.1:8080','127.0.0.1:5000',
         'pmpc1313.npm.ac.uk','pmpc1313.npm.ac.uk:8080','pmpc1313.npm.ac.uk:5000',
         'fedora-mja.npm.ac.uk:5000','fedora-mja:5000',
         'earthserver.pml.ac.uk','earthserver.pml.ac.uk:8080',
         'portaldev.marineopec.eu', 'portal.marineopec.eu',
         'vostok.npm.ac.uk','vostok.npm.ac.uk:8080',
         'vostok.pml.ac.uk','vostok.pml.ac.uk:8080',
         'vortices.npm.ac.uk', 'vortices.npm.ac.uk:8080',
         'rsg.pml.ac.uk','rsg.pml.ac.uk:8080',
         'motherlode.ucar.edu','motherlode.ucar.edu:8080',
         'www.openlayers.org', 'wms.jpl.nasa.gov', 'labs.metacarta.com', 
         'www.gebco.net', 'oos.soest.hawaii.edu:8080', 'oos.soest.hawaii.edu',
         'thredds.met.no','thredds.met.no:8080', 'irs.gis-lab.info',
         'demonstrator.vegaspace.com', 'grid.bodc.nerc.ac.uk', 'ogc.hcmr.gr:8080','wci.earth2observe.eu', 
         'map.bgs.ac.uk', 'gis.srh.noaa.gov' ]
         
"""
Standard proxy
"""
@portal_proxy.route('/proxy')
def proxy():  
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Checking logger")
   current_app.logger.debug(url)
   
   try:
      host = url.split("/")[2]
      current_app.logger.debug(host)
      if host and allowedHosts and not host in allowedHosts:
         error_handler.setError('2-01', None, g.user.id, "views/proxy.py:proxy - Host is not in the whitelist, returning 502 to user.", request)
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
         error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - The protocol is missing, returning 400 to user.", request)
         abort(400)
   
   except urllib2.URLError as e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to access url, make sure you have entered the correct parameters."
         if e.code == 500:
            g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
         abort(400)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code
   except Exception, e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to access url"
         abort(e.code)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code


"""
Return a rotated image
"""
@portal_proxy.route('/rotate')
def rotate():     
   
   angle = request.args.get('angle') 
   if( angle == None ):
         error_handler.setError('2-08', None, g.user.id, "views/proxy.py:proxy - Angle not set.", request)
         abort(502)
      
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Rotating image")
   current_app.logger.debug(url)
   try:
      host = url.split("/")[2]
      current_app.logger.debug(host)
      
      # Check if the image is at an allowed server
      if host and allowedHosts and not host in allowedHosts:
         error_handler.setError('2-01', None, g.user.id, "views/proxy.py:proxy - Host is not in the whitelist, returning 502 to user.", request)
         abort(502)
      
      # Abort if the url doesnt start with http
      if not url.startswith("http://") and not url.startswith("https://"):
         g.error = 'Missing protocol. Add "http://" or "https://" to the front of your request url.'
         error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - The protocol is missing, returning 400 to user.", request)
         abort(400)
      
      # Setup the urllib request for POST or GET
      if request.method == "POST":
         contentType = request.environ["CONTENT_TYPE"]
         headers = {"Content-Type": request.environ["CONTENT_TYPE"]}
         body = request
         r = urllib2.Request(url, body, headers)
         y = urllib2.urlopen(r)
      else:
         y = urllib2.urlopen(url)
   
   except urllib2.URLError as e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         g.error = "Failed to access url, server replied with " + str(e.code) + "."
         abort(400)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code
   except Exception, e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         g.error = "Failed to access url, server replied with " + str(e.code) + "."
         abort(e.code)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code
   
   try:
      # Download the orginal image
      image_file = io.BytesIO(y.read())
      y.close()
      originalImage = Image.open( image_file )
      
      # Rotate and store the new image
      newImage = originalImage.rotate( float(angle) )
      output = StringIO.StringIO()
      newImage.save( output, format= originalImage.format )
      
      return Response(output.getvalue(), mimetype=('image/' + originalImage.format))
   except Exception, e:
      g.error = "Failed to rotate image. Error Message: " + str(e)
      abort(400)

"""
WMS Layer Load
"""
@portal_proxy.route('/load_new_wms_layer')
def load_new_wms_layer():
   url = request.args.get('url') + "?service=WMS&request=GetCapabilities"
   doc = urllib2.urlopen(url)
   root = ET.parse(doc).getroot()
   return createCache(root, request.args.get('url') + "?")


def createCache(root, url):
   subMasterCache = {}
   subMasterCache['server'] = {}
   currentPath = os.path.dirname(os.path.realpath(__file__))
   clean_url = url.replace('http://', '').replace('https://', '').replace('/', '-').replace('?', '')
   layer_found = False

   filename = clean_url + FILEEXTENSIONJSON
   path = os.path.join(currentPath, SERVERCACHEPATH, filename)

   layers = []

   if not os.path.isfile(path):
      for product in root.findall('./%sCapability//%sLayer' % (WMS_NAMESPACE, WMS_NAMESPACE)): 
         sensorName = product.find('./%sTitle' % (WMS_NAMESPACE)).text
         sensorName = replaceAll(sensorName, {' ':'_', '(':'_', ')':'_', '/':'_'})
         for layer in product.findall('./%sLayer' % (WMS_NAMESPACE)):
            if ET.iselement(layer.find('./%sName' % (WMS_NAMESPACE))) and ET.iselement(layer.find('./%sTitle' % (WMS_NAMESPACE))) and ET.iselement(layer.find('./%sAbstract' % (WMS_NAMESPACE))) and ET.iselement(layer.find('./%sEX_GeographicBoundingBox' % (WMS_NAMESPACE))) and ET.iselement(layer.find('./%sStyle' % (WMS_NAMESPACE))):
               layer_found = True
               name = layer.find('./%sName' % (WMS_NAMESPACE)).text
               title = layer.find('./%sTitle' % (WMS_NAMESPACE)).text
               abstract = layer.find('./%sAbstract' % (WMS_NAMESPACE)).text
               niceName = title.title()
               temporal = False
               
               
               exGeographicBoundingBox = {"WestBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%swestBoundLongitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                          "EastBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%seastBoundLongitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                          "SouthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%ssouthBoundLatitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                          "NorthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%snorthBoundLatitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text}
               
               boundingBox = {"CRS": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('CRS'),
                              "MinX": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('minx'),
                              "MaxX": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('maxx'),
                              "MinY": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('miny'),
                              "MaxY": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('maxy')}
               
               dimensions = createDimensionsArray(layer)
               temporal = dimensions['temporal']
               styles = createStylesArray(layer)

               moreIndicatorInfo = False
               masterLayer = {"Name": name,
                              "Title": title,
                              "tags":{
                                 "indicator_type": [
                                    sensorName
                                 ],
                                 "niceName": niceName
                              },
                              "FirstDate": dimensions['firstDate'],
                              "LastDate": dimensions['lastDate'],
                              "EX_GeographicBoundingBox": exGeographicBoundingBox,
                              "MoreIndicatorInfo" : moreIndicatorInfo}
                              
               
               # Data to be sent in the mastercache
               layers.append(masterLayer)
               
               # Data to be saved out
               layer = {#"Name": name,
                        #"wmsURL": server['wmsURL'],
                        #"wcsURL": server['wcsURL'],
                        #"Title": title,
                        #"Abstract": abstract,
                        "FirstDate": dimensions['firstDate'],
                        "LastDate": dimensions['lastDate'],
                        "EX_GeographicBoundingBox": exGeographicBoundingBox,
                        "BoundingBox": boundingBox,
                        "Dimensions": dimensions['dimensions'] ,
                        "Styles": styles }
               
               cleanServerName = clean_url
               cleanLayerName = name.replace('/', '-')
               
               # Save out layer cache
               path = os.path.join(currentPath, LAYERCACHEPATH, cleanServerName + "_" + cleanLayerName + FILEEXTENSIONJSON)
               saveFile(path, json.dumps(layer))

      if layer_found:      
         subMasterCache['server'][sensorName] = layers
         
         subMasterCache['options'] = {"providerShortTag": "TemporaryLayer"}
         subMasterCache['wmsURL'] = url
         subMasterCache['wcsURL'] = "wcs_url_temp"
         subMasterCache['serverName'] = clean_url
         
         # Return and save out the cache for this server
         path = os.path.join(currentPath, SERVERCACHEPATH, filename)
         data = json.dumps(subMasterCache)
         saveFile(path, data)
         return data
      else:
         return json.dumps({"Error": "Could not find any loadable layers in this WMS: " + url})
   json_file = open(path, 'r')
   layer_return = json_file.read()
   return layer_return

   

def createDimensionsArray(layer):
   import string
   dimensions = {}
   dimensions['dimensions'] = []
   dimensions['temporal'] = False
   dimensions['firstDate'] = None
   dimensions['lastDate'] = None
   
   # Iterate over each dimension
   for dimension in layer.findall('./%sDimension' % (WMS_NAMESPACE)):
      dimensionList = dimension.text.split(',')
      dimensionValue = dimension.text.strip()
      
      # Tidy up temporal layer date-time values
      if dimension.get('name') == 'time':
         dimensions['temporal'] = True
         # The following array will be built up with modified values as needed
         newDates = []
         # Iterate through the date-time dimension array looking for errors and/or ISO8601 date ranges
         for v in dimensionList:
            dateTime = v.strip()
            newDates.append(dateTime)
            # Is there a date range present? - usually datetime/datetime/interval
            if dateTime.find('/'):
               range = dateTime.split('/')
               # Check for corrupted or unexpected data range format and remove it if found
               if len(range) == 3:
                  dateTimeRange = genDateRange(range[0], range[1], range[2])
                  newDates.pop()
                  newDates = newDates + dateTimeRange
            
            # Is there a corrupted date present - if so, remove it
            if dateTime.find('-') != 4:
               newDates.pop()

         if len(newDates) > 0:
            dimensions['firstDate'] = newDates[0].strip()[:10]
            dimensions['lastDate'] = newDates[len(newDates) - 1].strip()[:10]
         dimensionValue = string.join(newDates, ',').strip()
         
      dimensions['dimensions'].append({'Name': dimension.get('name'),
                                       'Units': dimension.get('units'),
                                       'Default': dimension.get('default'),
                                       'Value': dimensionValue})
   return dimensions
def saveFile(path, data):
   with open(path, 'wb') as file:
      file.write(data)

def replaceAll(text, dic):
    for i, j in dic.iteritems():
        text = text.replace(i, j)
    return text

def createStylesArray(layer):
   styles = []
   for style in layer.findall('./%sStyle' % (WMS_NAMESPACE)):
      styles.append({"Name": style.find('./%sName' % (WMS_NAMESPACE)).text,
                         #"Abstract": style.find('./%sAbstract' % (WMS_NAMESPACE)).text,
                         "LegendURL": style.find('./%sLegendURL/%sOnlineResource' % (WMS_NAMESPACE,WMS_NAMESPACE)).get('%shref' % (XLINKNAMESPACE)),
                         "Width": style.find('./%sLegendURL' % (WMS_NAMESPACE)).get('width'),
                         "Height": style.find('./%sLegendURL' % (WMS_NAMESPACE)).get('height')})
      
   return styles