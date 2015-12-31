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
import datetime
import calendar


CURRENT_PATH = os.path.dirname(os.path.realpath(__file__))
LAYERCACHEPATH = "../../../html/cache/layers/"
SERVERCACHEPATH = "../../../html/cache/temporary_cache"
USERCACHEPREFIX = "user_" #DO NOT CHANGE YET, USE CONFIG IN THE END!
MASTERCACHEPATH = "../../../html/cache"
BASEUSERCACHEPATH = MASTERCACHEPATH +"/" + USERCACHEPREFIX
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
         
      return basic_proxy(url)
   
   except Exception, e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to permission url"
         abort(e.code)
         
      g.error = "Failed to permission url, make sure you have entered the correct parameters"
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
            g.error = "Failed to permission url, make sure you have entered the correct parameters."
         if e.code == 500:
            g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
         abort(400)
         
      g.error = "Failed to permission url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, None, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code

"""
Return a rotated image
"""
@portal_proxy.route('/rotate')
def rotate():
   angle = request.args.get('angle')
   if angle == "undefined" or angle == "":
      angle = 0
   if( angle == None ):
         error_handler.setError('2-08', None, g.user.id, "views/proxy.py:proxy - Angle not set.", request)
         abort(502)
      
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Rotating image")
   try:
      host = url.split("/")[2]
      
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
         g.error = "Failed to permission url, server replied with " + str(e.code) + "."
         abort(400)
         
      g.error = "Failed to permission url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code
   except Exception, e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         g.error = "Failed to permission url, server replied with " + str(e.code) + "."
         abort(e.code)
         
      g.error = "Failed to permission url, make sure you have entered the correct parameters"
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
Loads the cache
"""
@portal_proxy.route('/get_cache')
def get_cache():
   usernames = [request.args.get('username')] # Gets the given username.
   permission = request.args.get('permission') # Gets the given permission.
   domain = request.args.get('domain') # Gets the given domain.

   cache = [] # The list to store all of the layers in.
   master_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain)
   for filename in os.listdir(master_path): # Loops through all of the files in the cache folder
      file_path = os.path.join(master_path, filename)
      if os.path.isfile(file_path) and filename != "providers.json":
         with open(file_path, 'r+') as layer_file:
            json_data = json.load(layer_file)
            json_data['owner'] = domain
            cache.extend([json_data]) # Adds the information in each file to the cache list to be returned.


   if permission != "guest":
      if permission == "admin":
         for folder in os.listdir(master_path):
            dir_path = os.path.join(master_path, folder)
            if os.path.isdir(dir_path):
               if folder.startswith(USERCACHEPREFIX):
                  usernames.append(folder.replace(USERCACHEPREFIX, "", 1))
      # Make the list unique
      usernames = list(set(usernames))
      for username in usernames:
         user_cache_path = os.path.join(master_path,USERCACHEPREFIX + username)
         if not os.path.isdir(user_cache_path):
            os.makedirs(user_cache_path)  #if the user_cache path does not exist it is created.

         for filename in os.listdir(user_cache_path): # Loops through all of the files in the cache folder
            file_path = os.path.join(user_cache_path, filename)
            if os.path.isfile(file_path):
               with open(file_path, 'r+') as layer_file:
                  json_data = json.load(layer_file)
                  json_data['owner'] = username
                  cache.extend([json_data]) # Adds the information in each file to the cache list to be returned.

   return json.dumps(cache) # Returns the cache to the portal for loading the layers.


"""
Add a user defined layer to the portal
"""
@portal_proxy.route('/add_user_layer', methods=['POST'])
def add_user_layer():
   # Retrieves the given information from the form the user completed.
   layers_list = json.loads(request.form['layers_list'])
   server_info = json.loads(request.form['server_info'])
   domain = request.form['domain'] # Gets the given domain.
   username = server_info['owner'] # Gets the given username.
   

   if set(('unique_name', 'provider', 'server_name')).issubset(server_info): # Verifies that the necessary server information is provided

      filename = server_info['server_name'] + FILEEXTENSIONJSON
      if domain == username:
         cache_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain, filename)
         save_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain, filename)
      else:
         cache_path = os.path.join(CURRENT_PATH, SERVERCACHEPATH, filename)
         save_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain, USERCACHEPREFIX + username, filename)

      with open(cache_path, 'r+') as data_file:
         data = json.load(data_file) # Extracts the data from the global cache file

      new_data = []

      for new_layer in layers_list: #Loops through each new layer (user provided)
         this_new_layer = layers_list[new_layer]
         # This checks that the layer data passed is valid
         if set(('abstract', 'id', 'list_id', 'nice_name', 'tags')).issubset(this_new_layer) and set(('indicator_type', 'region', 'interval', 'model_name')).issubset(this_new_layer['tags']):
            for old_layer in data['server'][server_info['unique_name']]: # Loops through the old layers to find a match.
               if old_layer['Name'] == this_new_layer['original_name']:
                  if this_new_layer['include']: # Only add the information if the user asked for the layer to be included.
                     # This block adds the information provided by the user to the new_data variable
                     new_data_layer = old_layer
                     new_data_layer['Title'] = this_new_layer['nice_name'].title()
                     new_data_layer['Abstract'] = this_new_layer['abstract']
                     for key in this_new_layer['tags']:
                        val = this_new_layer['tags'][key]
                        if len(val) > 0:
                           new_data_layer['tags'][key] = val
                        if len(server_info['provider']) > 0:
                           new_data_layer['tags']['data_provider'] = server_info['provider']
                     new_data_layer['tags']['niceName'] = this_new_layer['nice_name']
                     new_data_layer['LegendSettings'] = this_new_layer['legendSettings']
                     new_data.append(new_data_layer)
      # The new data is then put back into the data file to replace the previous information

      data['server'][server_info['unique_name']] = new_data

      # This adds all of the server information to the data file
      if len(server_info['address']) > 0:
         data['contactInfo']['address']= server_info['address'].replace('\n', '<br/>')
      
      if len(server_info['email']) > 0:
         data['contactInfo']['email']= server_info['email']
      
      if len(server_info['person']) > 0:
         data['contactInfo']['person']= server_info['person']
      
      if len(server_info['phone']) > 0:
         data['contactInfo']['phone']= server_info['phone']

      clean_provider = replaceAll(server_info['provider'], {"&amp":"and", " ":"_", "\\":'_', "/":'_', ".":'_', ",":'_', "(":'_', ")":'_', ":":'_', ";":'_'})

      if len(server_info['provider']) > 0:
         data['options']['providerShortTag'] = clean_provider
      
      if len(server_info['position']) > 0:
         data['contactInfo']['position']= server_info['position']
      
      saveFile(save_path, json.dumps(data)) # The data file is then added to the user_cache folder.
      return "" # Return of an empty string so that the portal knows the data transfer was successfull.
   return "Error"


"""
WMS Layer Load
"""
@portal_proxy.route('/load_new_wms_layer')
def load_new_wms_layer():
   url = request.args.get('url') # Gets the given URL.
   refresh = request.args.get('refresh') # Gets the given refresh boolean.
   username = request.args.get('username') # Gets the given username.
   permission = request.args.get('permission') # Gets the given permission.
   domain = request.args.get('domain') # Gets the given domain.

   return createCache(url + "?", refresh, username, permission, domain)

# This method creates the cache and adds it to the global_cache folder
def createCache(url, refresh, username, permission, domain):
   sub_master_cache = {}
   sub_master_cache['server'] = {}
   clean_url = replaceAll(url, {'http://': '', 'https://': '', '/': '-', '?': ''})
   contact_info = {}
   address = ""

   filename = clean_url + FILEEXTENSIONJSON
   directory = os.path.join(CURRENT_PATH, SERVERCACHEPATH)
   if not os.path.exists(directory):
      os.makedirs(directory) # If the global_cache folder does not already exist it is created.
   path = os.path.join(directory, filename)
   if not os.path.isfile(path) or refresh == "true": # As long as the file does not exist or is to be refreshed the cache will be created.
      
      doc = urllib2.urlopen(url + "service=WMS&request=GetCapabilities")
      root = ET.parse(doc).getroot()# Gets the XML root from the url.

      # Gets all of the contact information available from the WMS
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
      
      # As long as each element exists it is added to the contact_info dict.
      if ET.iselement(contact_person_elem):
         contact_info['person'] = contact_person_elem.text
         
      if ET.iselement(contact_org_elem):
         provider = contact_org_elem.text
         
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


      for parent_layer in root.findall('./%sCapability/%sLayer' % (WMS_NAMESPACE, WMS_NAMESPACE)): # Loops through each highest level layer tag in the WMS
         layers = []
         name = None
         sensor_name = None
         title = None
         abstract = None
         bounding_boxes = None
         dimensions = createDimensionsArray(parent_layer)
         style = None

         # Gets all of the required layer information available from the WMS
         name_elem = parent_layer.find('./%sName' % (WMS_NAMESPACE))
         title_elem = parent_layer.find('./%sTitle' % (WMS_NAMESPACE))
         abstract_elem = parent_layer.find('./%sAbstract' % (WMS_NAMESPACE))
         ex_bounding_elem = parent_layer.find('./%sEX_GeographicBoundingBox' % (WMS_NAMESPACE))
         bounding_elem = parent_layer.find('./%sBoundingBox' % (WMS_NAMESPACE))
         style_elem = parent_layer.find('./%sStyle' % (WMS_NAMESPACE))

         # As long as each element exists it is added to the corresponding variable. 
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


         # Passes the information to the digForLayers function.
         digForLayers(parent_layer, name, sensor_name, title, abstract, bounding_boxes, style, dimensions, clean_url, layers, provider)
      if len(layers) > 0: # As long as layers have been found it adds all of the info to the json cache file
         sub_master_cache['server'][sensor_name] = layers
         sub_master_cache['options'] = {"providerShortTag": "UserDefinedLayer"}
         sub_master_cache['wmsURL'] = url
         sub_master_cache['serverName'] = clean_url
         sub_master_cache['contactInfo'] = contact_info
         sub_master_cache['provider'] = provider.replace('&amp;', '&')
         sub_master_cache['timeStamp'] = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
         
         path = os.path.join(CURRENT_PATH, SERVERCACHEPATH, filename)
         data = json.dumps(sub_master_cache)
         saveFile(path, data)
         return data         
      else:
         return json.dumps({"Error": "Could not find any loadable layers in the <a href='" + url + "service=WMS&request=GetCapabilities'>WMS file</a> you provided"})

   json_file = open(path, 'r') # If the file does not need to be refreshed, it goes off and gets te information that is already there.
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

# Retrieves the bounding box information from a layer XML
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

# Saves a file taking the path and data.
def saveFile(path, data):
   with open(path, 'wb') as file:
      file.write(data)

# Replaces a set of string values using a dictionary
def replaceAll(text, dic):
    for i, j in dic.iteritems():
        text = text.replace(i, j)
    return text

# This loops throught the Styles Tag of a layer, and creates an array in the correct format for the portal to understand.
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

# This function is used to scrape an XML file to exract all of the layers. It is a self calling method and keeps running until it finds a layer that is compatible with the portal.
def digForLayers(parent_layer, name, sensor_name, title, abstract, bounding_boxes, style, dimensions, clean_url, layers, provider):
   # This loops through layers that are inside other layer tags.
   for layer in parent_layer.findall('.%sLayer' % (WMS_NAMESPACE)):
      # Gets the tags that are needed.
      name_elem = layer.find('./%sName' % (WMS_NAMESPACE))
      title_elem = layer.find('./%sTitle' % (WMS_NAMESPACE))
      abstract_elem = layer.find('./%sAbstract' % (WMS_NAMESPACE))
      ex_bounding_elem = layer.find('./%sEX_GeographicBoundingBox' % (WMS_NAMESPACE))
      bounding_elem = layer.find('./%sBoundingBox' % (WMS_NAMESPACE))
      dimension_elem = layer.find('./%sDimension' % (WMS_NAMESPACE))
      style_elem = layer.find('./%sStyle' % (WMS_NAMESPACE))
      
      # Adds any tag data to the variables.
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
        
      # If all of the required elements have been found then the layer is added to the layers list.
      if name and sensor_name and title and bounding_boxes and style:
         layers.append({"Name": name, "Title": title, "tags":{ "indicator_type": [ sensor_name.replace("_", " ")],"niceName": title.title(), "data_provider" : provider}, "boundingBox": bounding_boxes['boundingBox'], "Abstract": abstract, "FirstDate": dimensions['firstDate'], "LastDate": dimensions['lastDate'], "EX_GeographicBoundingBox": bounding_boxes['exGeographicBoundingBox'], "boundingBox": bounding_boxes['boundingBox'], "MoreIndicatorInfo" : False})
         layer_data = {"FirstDate": dimensions['firstDate'], "LastDate": dimensions['lastDate'], "EX_GeographicBoundingBox": bounding_boxes['exGeographicBoundingBox'], "BoundingBox": bounding_boxes['boundingBox'], "Dimensions": dimensions['dimensions'], "Styles": style}
         clean_server_name = clean_url
         
         path = os.path.join(CURRENT_PATH, LAYERCACHEPATH, clean_server_name + "_" + name + FILEEXTENSIONJSON)
         saveFile(path, json.dumps(layer_data))
         style = None
      else: # Otherwise the function will run again (dig down one more layer).
            # Variables are passed on because some apply to multiple layers and therefore can be stored in parental tags.
            # Some information about the parent tag is also useful so this is one simple way to save it.
         digForLayers(layer, name, sensor_name, title, abstract, bounding_boxes, style, dimensions, clean_url, layers, provider)

"""
Moves the given server's cache to the deleted folder.
"""
@portal_proxy.route('/remove_server_cache')
def remove_server_cache():
   username = request.args.get('username') # Gets the given username.
   permission = request.args.get('permission') # Gets the given permission.
   domain = request.args.get('domain') # Gets the given domain.

   filename = request.args.get('filename')
   clean_filename = filename + FILEEXTENSIONJSON
   base_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain, USERCACHEPREFIX + username)
   for filename in os.listdir(os.path.join(CURRENT_PATH, MASTERCACHEPATH)):
      if filename == username:
         base_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain)
         continue
   original_path = os.path.join(base_path, clean_filename)
   deleted_cache_path =os.path.join(base_path + "/deleted_cache")
   new_path = os.path.join(deleted_cache_path, clean_filename)

   if not os.path.isdir(deleted_cache_path):
      os.makedirs(deleted_cache_path)  #if the user_deleted_cache path does not exist it is created.

   os.rename(original_path, new_path)
   return filename


"""
Puts the updated data back into the file
"""
@portal_proxy.route('/update_layer', methods=['POST'])
def update_layer():
   username = request.args.get('username') # Gets the given username.
   permission = request.args.get('permission') # Gets the given permission.
   domain = request.args.get('domain') # Gets the given domain.

   data = json.loads(request.form['data'])
   filename =  data['serverName']

   base_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain, USERCACHEPREFIX + username)
   for filename in os.listdir(os.path.join(CURRENT_PATH, MASTERCACHEPATH)):
      if filename == username:
         base_path = os.path.join(CURRENT_PATH, MASTERCACHEPATH, domain)
         continue

   path = os.path.join(base_path, data['serverName'] + FILEEXTENSIONJSON)
   saveFile(path, json.dumps(data))

   return ""