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

CURRENT_PATH = os.path.dirname(os.path.realpath(__file__))
LAYERCACHEPATH = "../../../html/cache/layers/"
SERVERCACHEPATH = "../../../html/cache/"
MASTERCACHEPATH = "../../../html/cache/mastercache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"

WMS_NAMESPACE = '{http://www.opengis.net/wms}'
FEATURE_WMS_NAMESPACE = '{http://www.esri.com/wms}'
WCS_NAMESPACE = '{http://www.opengis.net/wcs}'
GML_NAMESPACE = '{http://www.opengis.net/gml}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'

portal_proxy = Blueprint('portal_proxy', __name__)

         
"""
Proxy Handler
"""
@portal_proxy.route('/proxy')
def proxy():  
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Checking logger")
   current_app.logger.debug(url)
   
   try:
      host = url.split("/")[2]
      current_app.logger.debug(host)
         
      return basic_proxy(url)
   
   except Exception, e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to access url"
         abort(e.code)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, None, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code


def basic_proxy(url):
   try:
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
         
         #resp = y.read()
         resp = make_response(y.read(), y.code)
         if i.has_key("Content-Type"):
            resp.headers.remove('Content-Type')
            resp.headers.add('Content-Type', i['Content-Type'])
            
         #for key in y.headers.dict.iterkeys():
            #resp.headers[key] = y.headers.dict[key]
         
         y.close()
         return resp
      else:
         g.error = 'Missing protocol. Add "http://" or "https://" to the front of your request url.'
         error_handler.setError('2-06', None, None, "views/proxy.py:proxy - The protocol is missing, returning 400 to user.", request)
         abort(400)
   except urllib2.URLError as e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to access url, make sure you have entered the correct parameters."
         if e.code == 500:
            g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
         abort(400)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, None, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code

"""
Return a rotated image
"""
@portal_proxy.route('/rotate')
def rotate():
   angle = request.args.get('angle')
   if angle == "undefined":
      angle = 0
   if( angle == None ):
         error_handler.setError('2-08', None, g.user.id, "views/proxy.py:proxy - Angle not set.", request)
         abort(502)
      
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Rotating image")
   current_app.logger.debug(url)
   try:
      host = url.split("/")[2]
      current_app.logger.debug(host)
      
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
Loads the Data Values
"""
@portal_proxy.route('/load_data_values')
def load_data_values():
   url = request.args.get('url')
   name = request.args.get('name')
   units = request.args.get('units')


   xml_data_values = basic_proxy(url + '&INFO_FORMAT=text/xml')
   content_type = xml_data_values.headers['Content-Type']

   if content_type == 'application/xml;charset=UTF-8':
      doc = xml_data_values.get_data()
      root = ET.fromstring(doc)
      value_elem = root.find('.//value')
      if ET.iselement(value_elem):
         return name + ': ' + value_elem.text + ' ' + units
      else:
         return 'Sorry, could not calculate a value for: ' + name
   else:
      data_values = basic_proxy(url)
      content_type = data_values.headers['Content-Type'].replace(';charset=UTF-8', '')
      if content_type == 'text/xml':
         doc = data_values.get_data()
         root = ET.fromstring(doc)
         fields_elem = root.find('.//%sFIELDS' % (FEATURE_WMS_NAMESPACE))
         if ET.iselement(fields_elem):
            output = "" + name + ":"
            if len(fields_elem.attrib)<=0:
               output = output + "<br/>no data found at this point"
            for key, value in fields_elem.attrib.items():
               output = output + "<br/>" + key + ": " + value
            return output
      elif content_type == 'text/plain':
         return name + ": <br/>" + data_values.get_data().replace('\n', '<br/>')


@portal_proxy.route('/add_wcs_url')
def add_wcs_url():
   url = request.args.get('url').split('?')[0]
   filename = request.args.get('filename')
   name = request.args.get('name')
   sensor = request.args.get('sensor')

   wcs_url = url + "?service=WCS&version=1.0.0&request=GetCapabilities"

   try:
      wcs_data = basic_proxy(wcs_url)
   except Exception, e:
      return e

   content_type = wcs_data.headers['Content-Type'].replace(';charset=UTF-8', '')

   if content_type == 'application/xml' or content_type == 'text/xml':
      try:
         path = os.path.join(CURRENT_PATH, SERVERCACHEPATH, filename + FILEEXTENSIONJSON)
         with open(path, 'r+') as data_file:
            data = json.load(data_file)
            index = 0
            for layer in data['server'][sensor]:
               if str(layer['Name']) == name:
                  break
               index = index + 1
            data['server'][sensor][index]['wcsURL'] = url + "?"
            data_file.seek(0)
            json.dump(data, data_file)
            return url + "?"
      except Exception, e:
         return e

"""
WMS Layer Load
"""
@portal_proxy.route('/load_new_wms_layer')
def load_new_wms_layer():
   url = request.args.get('url')
   refresh = request.args.get('refresh')
   return createCache(url + "?", refresh)

def createCache(url, refresh):
   sub_master_cache = {}
   sub_master_cache['server'] = {}
   clean_url = url.replace('http://', '').replace('https://', '').replace('/', '-').replace('?', '')
   contact_info = {}
   address = ""

   filename = clean_url + FILEEXTENSIONJSON
   path = os.path.join(CURRENT_PATH, SERVERCACHEPATH, filename)

   if not os.path.isfile(path) or refresh == "true":
      doc = urllib2.urlopen(url + "service=WMS&request=GetCapabilities")
      root = ET.parse(doc).getroot()

      contact_person_elem = root.find('./%sService/%sContactInformation//%sContactPerson' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_org_elem = root.find('./%sService/%sContactInformation//%sContactOrganization' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_position_elem = root.find('./%sService/%sContactInformation//%sContactPosition' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_address_elem = root.find('./%sService/%sContactInformation//%sAddress' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_city_elem = root.find('./%sService/%sContactInformation//%sCity' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_state_elem = root.find('./%sService/%sContactInformation//%sStateOrProvince' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_post_code_elem = root.find('./%sService/%sContactInformation//%sPostCode' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_country_elem = root.find('./%sService/%sContactInformation//%sCountry' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_phone_elem = root.find('./%sService/%sContactInformation//%sContactVoiceTelephone' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      contact_email_elem = root.find('./%sService/%sContactInformation//%sContactElectronicMailAddress' % (WMS_NAMESPACE, WMS_NAMESPACE, WMS_NAMESPACE))
      
      if ET.iselement(contact_person_elem):
         contact_info['person'] = contact_person_elem.text
         
      if ET.iselement(contact_org_elem):
         contact_info['organization'] = contact_org_elem.text
         
      if ET.iselement(contact_position_elem):
         contact_info['position'] = contact_position_elem.text
         
      if ET.iselement(contact_address_elem) and contact_address_elem.text:
         address = address + contact_address_elem.text + "<br/>"
         
      if ET.iselement(contact_city_elem) and contact_city_elem.text:
         address = address + contact_city_elem.text + "<br/>"
         
      if ET.iselement(contact_state_elem) and contact_state_elem.text:
         address = address + contact_state_elem.text + "<br/>"
         
      if ET.iselement(contact_post_code_elem) and contact_post_code_elem.text:
         address = address + contact_post_code_elem.text + "<br/>"
         
      if ET.iselement(contact_country_elem) and contact_country_elem.text:
         address = address + contact_country_elem.text + "<br/>"
         
      if ET.iselement(contact_phone_elem):
         contact_info['phone'] = contact_phone_elem.text
         
      if ET.iselement(contact_email_elem):
         contact_info['email'] = contact_email_elem.text

      if len(address) > 0:
         contact_info['address'] = address


      for parent_layer in root.findall('./%sCapability/%sLayer' % (WMS_NAMESPACE, WMS_NAMESPACE)):
         layers = []
         name = None
         sensor_name = None
         title = None
         abstract = None
         bounding_boxes = None
         dimensions = createDimensionsArray(parent_layer)
         style = None

         name_elem = parent_layer.find('./%sName' % (WMS_NAMESPACE))
         title_elem = parent_layer.find('./%sTitle' % (WMS_NAMESPACE))
         abstract_elem = parent_layer.find('./%sAbstract' % (WMS_NAMESPACE))
         ex_bounding_elem = parent_layer.find('./%sEX_GeographicBoundingBox' % (WMS_NAMESPACE))
         bounding_elem = parent_layer.find('./%sBoundingBox' % (WMS_NAMESPACE))
         style_elem = parent_layer.find('./%sStyle' % (WMS_NAMESPACE))

         if ET.iselement(title_elem):
            sensor_name = title_elem.text
            sensor_name = replaceAll(sensor_name, {' ':'_', '(':'_', ')':'_', '/':'_'})

         if ET.iselement(abstract_elem):
            if len(abstract_elem.text) > 0:
               abstract = abstract_elem.text
            else:
               print "No Abstract"

         if ET.iselement(bounding_elem) and ET.iselement(ex_bounding_elem):
            bounding_boxes = createBoundingBoxesArray(parent_layer)

         if ET.iselement(style_elem):
            styles_list = createStylesArray(parent_layer)
            if len(styles_list) > 0:
               style = styles_list


         digForLayers(parent_layer, name, sensor_name, title, abstract, bounding_boxes, style, dimensions, clean_url, layers)
      if len(layers) > 0:
         sub_master_cache['server'][sensor_name] = layers
         sub_master_cache['options'] = {"providerShortTag": "UserDefinedLayer"}
         sub_master_cache['wmsURL'] = url
         sub_master_cache['serverName'] = clean_url
         sub_master_cache['contactInfo'] = contact_info
         
         path = os.path.join(CURRENT_PATH, SERVERCACHEPATH, filename)
         data = json.dumps(sub_master_cache)
         saveFile(path, data)
         return data         
      else:
         return json.dumps({"Error": "Could not find any loadable layers in the <a href='" + url + "service=WMS&request=GetCapabilities'>WMS file</a> you provided"})

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
               #if len(range) == 3:
                  #dateTimeRange = genDateRange(range[0], range[1], range[2])
                  #newDates.pop()
                  #newDates = newDates + dateTimeRange
            
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

def createBoundingBoxesArray(layer):
   bounding_boxes = {}

   exGeographicBoundingBox = {"WestBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%swestBoundLongitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                "EastBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%seastBoundLongitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                "SouthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%ssouthBoundLatitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                "NorthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%snorthBoundLatitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text}
   
   boundingBox = {"CRS": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('CRS'),
                  "MinX": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('minx'),
                  "MaxX": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('maxx'),
                  "MinY": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('miny'),
                  "MaxY": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('maxy')}
   bounding_boxes['exGeographicBoundingBox'] = exGeographicBoundingBox
   bounding_boxes['boundingBox'] = boundingBox
   return bounding_boxes

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
      
      name_elem = style.find('./%sName' % (WMS_NAMESPACE))
      legend_elem = style.find('./%sLegendURL' % (WMS_NAMESPACE))
      
      if ET.iselement(name_elem) and ET.iselement(legend_elem):
           styles.append({"Name": name_elem.text,
                         "LegendURL": legend_elem.find('./%sOnlineResource' % (WMS_NAMESPACE)).get('%shref' % (XLINKNAMESPACE)),
                         "Width": legend_elem.get('width'),
                         "Height": legend_elem.get('height')})
   return styles

def digForLayers(parent_layer, name, sensor_name, title, abstract, bounding_boxes, style, dimensions, clean_url, layers):
   for layer in parent_layer.findall('.%sLayer' % (WMS_NAMESPACE)):
      name_elem = layer.find('./%sName' % (WMS_NAMESPACE))
      title_elem = layer.find('./%sTitle' % (WMS_NAMESPACE))
      abstract_elem = layer.find('./%sAbstract' % (WMS_NAMESPACE))
      ex_bounding_elem = layer.find('./%sEX_GeographicBoundingBox' % (WMS_NAMESPACE))
      bounding_elem = layer.find('./%sBoundingBox' % (WMS_NAMESPACE))
      dimension_elem = layer.find('./%sDimension' % (WMS_NAMESPACE))
      style_elem = layer.find('./%sStyle' % (WMS_NAMESPACE))
        
      if ET.iselement(name_elem):
         name = name_elem.text.replace('/', '_')
            
      if ET.iselement(title_elem):
         title = title_elem.text
            
      if ET.iselement(abstract_elem):
         if abstract_elem.text:
            abstract = abstract_elem.text
            
      if ET.iselement(dimension_elem):
         dimensions = createDimensionsArray(layer)
            
      if ET.iselement(bounding_elem) and ET.iselement(ex_bounding_elem):
         bounding_boxes = createBoundingBoxesArray(layer)
            
      if ET.iselement(style_elem):
         styles_list = createStylesArray(layer)
         if len(styles_list) > 0:
            style = styles_list
        
            
      if name and sensor_name and title and bounding_boxes and style:
         layers.append({"Name": name, "Title": title, "tags":{ "Ecosystem_Element": [ sensor_name.replace("_", " ")],"niceName": title.title()}, "boundingBox": bounding_boxes['boundingBox'], "Abstract": abstract, "FirstDate": dimensions['firstDate'], "LastDate": dimensions['lastDate'], "EX_GeographicBoundingBox": bounding_boxes['exGeographicBoundingBox'], "boundingBox": bounding_boxes['boundingBox'], "MoreIndicatorInfo" : False})
         layer_data = {"FirstDate": dimensions['firstDate'], "LastDate": dimensions['lastDate'], "EX_GeographicBoundingBox": bounding_boxes['exGeographicBoundingBox'], "BoundingBox": bounding_boxes['boundingBox'], "Abstract": abstract, "Dimensions": dimensions['dimensions'], "Styles": style}
         clean_server_name = clean_url
         
         path = os.path.join(CURRENT_PATH, LAYERCACHEPATH, clean_server_name + "_" + name + FILEEXTENSIONJSON)
         saveFile(path, json.dumps(layer_data))
         style = None
      else:
         digForLayers(layer, name, sensor_name, title, abstract, bounding_boxes, style, dimensions, clean_url, layers)
