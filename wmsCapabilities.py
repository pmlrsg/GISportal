#!/usr/bin/env python

import urllib
import urllib2
import csv
import xml.etree.ElementTree as ET
import hashlib
import json
import string
import os

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

CACHELIFE = 1 #3600 # cache time in seconds, 1 hour cache
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

def updateCaches():
   servers = csvToList(SERVERLIST)
   change = False
   
   # Go through each server
   for server in servers:
      # Check if the cache is valid
      if not checkCacheValid(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, CACHELIFE):
         oldXML = None
         newXML = None       
         try:
            # Try to contact the server for the newXML
            resp = urllib2.urlopen(server['wmsURL'] + GET_CAPABILITES_PARAMS, timeout=30)
            newXML = resp.read()
         except urllib2.URLError as e:
            print 'Failed to open url to ' + server['wmsURL']
            print e
            # If we can't contact the server, skip to the next server
         except IOError as e:
            print 'Failed to open url to ' + server['wmsURL']
            print e
         try:
            oldXML = getFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML)
         except IOError as e:
            print 'Failed to open xml file at "' + SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML + '"'       
            print e
            # We don't have the oldXML so we need to skip the md5 check
            createCache(server, newXML) 
            change = True
            
         if oldXML == None:
            oldXML = "old"
            
         if checkMD5(oldXML, newXML):
            print 'md5 check failed...'
            # Create the caches for this server
            createCache(server, newXML)
            change = True   
   
   dirtyCachesCopy = dirtyCaches[:]
   print "Checking for dirty caches..."        
   for dirtyServer in dirtyCachesCopy:  
      print "server name: " + dirtyServer['name']  
      regenerateCache(dirtyServer)
   print "Dirty caches regenerated"     
         
   if change:
      createMasterCache(servers)
      
def createMasterCache(servers):
   masterCache = []
   for server in servers:
      file = None
      try:
         file = getFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON)
      except IOError as e:
         print 'Failed to open json file at "' + SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON + '"'       
         print e
         
      if file != None:
         masterCache.append(json.loads(file))
   
   print "Saving mastercache..."         
   saveFile(MASTERCACHEPATH + FILEEXTENSIONJSON, json.dumps(masterCache))
   print "mastercache saved" 
         
def checkMD5(oldXML, newXML):
   newMD5 = hashlib.md5(newXML)
   oldMD5 = hashlib.md5(oldXML) 
   
   print 'Checking md5...'
   print newMD5.hexdigest()
   print oldMD5.hexdigest()
   
   return newMD5.hexdigest() != oldMD5.hexdigest()
   
def createCache(server, xml):
   
   # Check that we have the xml file
   if xml == None:
      dirtyCaches.append(server)
      return
   
   # Save out the xml file for later
   saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, xml)
   
   print 'Creating caches...'
   subMasterCache = {}
   subMasterCache['server'] = {}
   
   #ET.register_namespace(NAMESPACE, NAMESPACE)
   root = ET.fromstring(xml)
   
   if root.find('./%sCapability/%sLayer/%sLayer' % (NAMESPACE,NAMESPACE,NAMESPACE)) == None:
      dirtyCaches.append(server)
      return
   
   for service in root.iterfind('./%sService' % (NAMESPACE)):
      serverTitle = service.find('./%sTitle' % (NAMESPACE)).text
      serverAbstract = service.find('./%sAbstract' % (NAMESPACE)).text if service.find('./%sAbstract' % (NAMESPACE)) is not None else None
   
   for product in root.iterfind('./%sCapability/%sLayer/%sLayer' % (NAMESPACE,NAMESPACE,NAMESPACE)):
      sensorName = product.find('./%sTitle' % (NAMESPACE)).text
      
      if blackfilter(sensorName, productBlackList):
         sensorName = replace_all(sensorName, {' ':'_', '(':'_', ')':'_', '/':'_'})
         print sensorName
         layers = []
         
         for layer in product.iterfind('./%sLayer' % (NAMESPACE)):
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
            
            if blackfilter(name, layerBlackList):
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
               saveFile(LAYERCACHEPATH + cleanServerName + "_" + cleanLayerName + FILEEXTENSIONJSON, json.dumps(layer))
               
         subMasterCache['server'][sensorName] = layers
         
   subMasterCache['wmsURL'] = server['wmsURL']
   subMasterCache['wcsURL'] = server['wcsURL']
   subMasterCache['serverName'] = server['name']
   
   print 'Finished creating caches...'
      
   # Return and save out the cache for this server
   return saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON, json.dumps(subMasterCache))
                     
def createDimensionsArray(layer, server):
   dimensions = {}
   dimensions['dimensions'] = []
   dimensions['temporal'] = False
   dimensions['firstDate'] = None
   dimensions['lastDate'] = None
   
   # Iterate over each dimension
   for dimension in layer.iterfind('./%sDimension' % (NAMESPACE)):
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
   
   for style in layer.iterfind('./%sStyle' % (NAMESPACE)):      
      styles.append({"Name": style.find('./%sName' % (NAMESPACE)).text,
                         "Abstract": style.find('./%sAbstract' % (NAMESPACE)).text,
                         "LegendURL": style.find('./%sLegendURL/%sOnlineResource' % (NAMESPACE,NAMESPACE)).get('%shref' % (XLINKNAMESPACE)),
                         "Width": style.find('./%sLegendURL' % (NAMESPACE)).get('width'),
                         "Height": style.find('./%sLegendURL' % (NAMESPACE)).get('height')})
      
   return styles    
          
def csvToList(file):
   data = []
   try:
      with open(file, 'rb') as csvfile:
         reader = csv.reader(csvfile, delimiter=",")
         titles = reader.next()
         reader = csv.DictReader(csvfile, titles)
         for row in reader:
            data.append(row)
   except IOError as e:
      print 'Could not open csv file at "' + file + '"'
      print e
      return []
         
   return data

def checkCacheValid(file, life):
   import os.path, time
   try:
      cDate = os.path.getctime(file)
      if time.time() - cDate < life:
         print '%s valid' % file
         return True
      else:
         print '%s expired' % file
         return False
   except OSError as e:
      print 'Failed to open %s' % file
      print e
      return False
   
def getFile(filepath):
   data = None
   with open(filepath) as file:
      data = file.read()

   return data
   
def saveFile(path, data):
   with open(path, 'wb') as file:
      file.write(data)
   
   return data

def replace_all(text, dic):
    for i, j in dic.iteritems():
        text = text.replace(i, j)
    return text
 
def genDateRange(startDate, endDate, interval):
   import datetime
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

def blackfilter(stringToTest, filterList):
   if len(filterList) != 0:
      for v in filterList:
         if stringToTest.find(v['name']) != -1:
            return False
      
   return True

def regenerateCache(dirtyServer):
   import time
   for i in range(10):
      if dirtyServer in dirtyCaches:
         dirtyCaches.remove(dirtyServer)
      if i < 10:
         try:
            resp = urllib2.urlopen(dirtyServer['wmsURL'] + GET_CAPABILITES_PARAMS, timeout=30)
            newXML = resp.read()
            createCache(dirtyServer, newXML)
            if dirtyServer not in dirtyCaches:
               return
            else:
               time.sleep(30)
         except urllib2.URLError as e:
            print 'Failed to open url to ' + dirtyServer['wmsURL']
            print e
         except IOError as e:
            print 'Failed to open url to ' + dirtyServer['wmsURL']   
            print e
            # We don't have the oldXML so we need to skip the md5 check

layerBlackList = csvToList(LAYERFILTER)
productBlackList = csvToList(PRODUCTFILTER)
updateCaches()