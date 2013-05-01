#!/usr/bin/env python

import os
import utils
import wmsServers

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

CACHELIFE = 3600 #3600 # cache time in seconds, 1 hour cache
LAYERCACHEPATH = "./html/static/cache/layers/"
SERVERCACHEPATH = "./html/static/cache/"
MASTERCACHEPATH = "./html/static/cache/mastercache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"
GET_CAPABILITES_PARAMS = "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0"
SERVERLIST = "serverlist.csv"
NAMESPACE = '{http://www.opengis.net/wms}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'

PRODUCTFILTER = "productFilter.csv"
LAYERFILTER = "layerFilter.csv"
dirtyCaches = [] # List of caches that may need recreating
   
def createCache(server, xml):
   import xml.etree.ElementTree as ET
   import json
   
   # Save out the xml file for later
   utils.saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, xml)
   
   print 'Creating caches...'
   subMasterCache = {}
   subMasterCache['server'] = {}
   
   #ET.register_namespace(NAMESPACE, NAMESPACE)
   root = ET.fromstring(xml)
   
   if root.find('./%sCapability/%sLayer/%sLayer' % (NAMESPACE,NAMESPACE,NAMESPACE)) == None:
      dirtyCaches.append(server)
      return
   
   for service in root.findall('./%sService' % (NAMESPACE)):
      serverTitle = service.find('./%sTitle' % (NAMESPACE)).text
      serverAbstract = service.find('./%sAbstract' % (NAMESPACE)).text if service.find('./%sAbstract' % (NAMESPACE)) is not None else None
   
   for product in root.findall('./%sCapability/%sLayer/%sLayer' % (NAMESPACE,NAMESPACE,NAMESPACE)):
      sensorName = product.find('./%sTitle' % (NAMESPACE)).text
      
      if utils.blackfilter(sensorName, productBlackList):
         sensorName = utils.replaceAll(sensorName, {' ':'_', '(':'_', ')':'_', '/':'_'})
         print sensorName
         layers = []
         
         for layer in product.findall('./%sLayer' % (NAMESPACE)):
            name = layer.find('./%sName' % (NAMESPACE)).text
            title = layer.find('./%sTitle' % (NAMESPACE)).text
            abstract = layer.find('./%sAbstract' % (NAMESPACE)).text
            temporal = False
            
            exGeographicBoundingBox = {"WestBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%swestBoundLongitude' % (NAMESPACE,NAMESPACE)).text,
                                       "EastBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%seastBoundLongitude' % (NAMESPACE,NAMESPACE)).text,
                                       "SouthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%ssouthBoundLatitude' % (NAMESPACE,NAMESPACE)).text,
                                       "NorthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%snorthBoundLatitude' % (NAMESPACE,NAMESPACE)).text}
            
            boundingBox = {"CRS": layer.find('./%sBoundingBox' % (NAMESPACE)).get('CRS'),
                           "MinX": layer.find('./%sBoundingBox' % (NAMESPACE)).get('minx'),
                           "MaxX": layer.find('./%sBoundingBox' % (NAMESPACE)).get('maxx'),
                           "MinY": layer.find('./%sBoundingBox' % (NAMESPACE)).get('miny'),
                           "MaxY": layer.find('./%sBoundingBox' % (NAMESPACE)).get('maxy')}
            
            dimensions = createDimensionsArray(layer, server)
            temporal = dimensions['temporal']
            styles = createStylesArray(layer)
            
            if utils.blackfilter(name, layerBlackList):
               # Data to be sent in the mastercache
               layers.append({"Name": name,
                              "Title": title,
                              "Abstract": abstract,
                              #"FirstDate": dimensions['firstDate'],
                              #"LastDate": dimensions['lastDate'],
                              "EX_GeographicBoundingBox": exGeographicBoundingBox})
               
               # Data to be saved out
               layer = {#"Name": name,
                        #"wmsURL": server['wmsURL'],
                        #"wcsURL": server['wcsURL'],
                        #"Title": title,
                        #"Abstract": abstract,
                        "FirstDate": dimensions['firstDate'],
                        "LastDate": dimensions['lastDate'],
                        #"EX_GeographicBoundingBox": exGeographicBoundingBox,
                        "BoundingBox": boundingBox,
                        "Dimensions": dimensions['dimensions'],
                        "Styles": styles }
               
               cleanServerName = server['name'].replace('/', '-')
               cleanLayerName = name.replace('/', '-')
               
               # Save out layer cache
               utils.saveFile(LAYERCACHEPATH + cleanServerName + "_" + cleanLayerName + FILEEXTENSIONJSON, json.dumps(layer))
               
         subMasterCache['server'][sensorName] = layers
   
   subMasterCache['options'] = server['options']
   subMasterCache['wmsURL'] = server['url']
   subMasterCache['wcsURL'] = server['wcsurl']
   subMasterCache['serverName'] = server['name']
   
   print 'Cache creation complete...'
      
   # Return and save out the cache for this server
   return utils.saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON, json.dumps(subMasterCache))
                     
def createDimensionsArray(layer, server):
   import string
   dimensions = {}
   dimensions['dimensions'] = []
   dimensions['temporal'] = False
   dimensions['firstDate'] = None
   dimensions['lastDate'] = None
   
   # Iterate over each dimension
   for dimension in layer.findall('./%sDimension' % (NAMESPACE)):
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
               debugString = "Date range found [" + dateTime + "]  for layer " + server['name']
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
                     
def createStylesArray(layer):
   styles = []
   
   for style in layer.findall('./%sStyle' % (NAMESPACE)):      
      styles.append({"Name": style.find('./%sName' % (NAMESPACE)).text,
                         "Abstract": style.find('./%sAbstract' % (NAMESPACE)).text,
                         "LegendURL": style.find('./%sLegendURL/%sOnlineResource' % (NAMESPACE,NAMESPACE)).get('%shref' % (XLINKNAMESPACE)),
                         "Width": style.find('./%sLegendURL' % (NAMESPACE)).get('width'),
                         "Height": style.find('./%sLegendURL' % (NAMESPACE)).get('height')})
      
   return styles
 
def genDateRange(startDate, endDate, interval):
   import isodate # https://github.com/gweis/isodate
   
   dates = []
   dateFrom = isodate.parse_datetime(startDate)
   dateTo = isodate.parse_datetime(endDate)
   dateInterval = isodate.parse_duration(interval)
   currentDate = dateFrom
   
   while currentDate <= dateTo:
      datetime = isodate.datetime_isoformat(currentDate)
      dates.append(datetime)
      currentDate = currentDate + dateInterval
      
   return dates

layerBlackList = utils.csvToList(LAYERFILTER)
productBlackList = utils.csvToList(PRODUCTFILTER)
utils.updateCaches(createCache, dirtyCaches,  wmsServers.servers, SERVERCACHEPATH, MASTERCACHEPATH, CACHELIFE)