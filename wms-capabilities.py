#!/usr/bin/env python

import urllib
import urllib2
import csv
import xml.etree.ElementTree as ET
import hashlib
import json

CACHELIFE = 86400
LAYERCACHEPATH = "./cache/layers/"
SERVERCACHEPATH = "./cache/"
MASTERCACHEPATH = "./cache/mastercache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"
GET_CAPABILITES_PARAMS = "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0"
GET_SERVERLIST_PATH = "serverlist.csv"
SERVERLIST = "serverlist.csv"
NAMESPACE = '{http://www.opengis.net/wms}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'


def updateCaches():
   servers = csvToList(SERVERLIST)
   masterCache = []
   change = False
   
   for server in servers:
      if not checkCacheValid(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, CACHELIFE):
         try:
            resp = urllib2.urlopen(server['url'] + GET_CAPABILITES_PARAMS, timeout=30)
            newXML = resp.read()
            oldXML = getFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML)
            if oldXML == None:
               oldXML = "old"
            
            newMD5 = hashlib.md5(newXML)
            oldMD5 = hashlib.md5(oldXML) 
            
            if newMD5.hexdigest() != oldMD5.hexdigest():
               saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, newXML)
               createCache(server, newXML) 
               change = True       
         except Exception as e:
            print e
            print "error on url open"
         
   if change:
      for server in servers:
         masterCache.append(json.loads(getFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON)))
      saveFile(MASTERCACHEPATH + FILEEXTENSIONJSON, json.dumps(masterCache))
         
def createCache(server, xml):
   subMasterCache = []
   ET.register_namespace(NAMESPACE, NAMESPACE)
   root = ET.fromstring(xml)
   
   for service in root.iterfind('./%sService' % (NAMESPACE)):
      serverTitle = service.find('./%sTitle' % (NAMESPACE)).text
      serverAbstract = service.find('./%sAbstract' % (NAMESPACE)).text
   
   for product in root.iterfind('./%sCapability/%sLayer/%sLayer' % (NAMESPACE,NAMESPACE,NAMESPACE)):
      sensorName = product.find('./%sTitle' % (NAMESPACE)).text
      
      if True:
         sensorName = replace_all(sensorName, {' ':'_', '(':'_', ')':'_', '/':'_'})
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
            
            print exGeographicBoundingBox
            
            boundingBox = {"CRS": layer.find('./%sBoundingBox' % (NAMESPACE)).get('CRS'),
                           "MinX": layer.find('./%sBoundingBox' % (NAMESPACE)).get('minx'),
                           "MaxX": layer.find('./%sBoundingBox' % (NAMESPACE)).get('maxx'),
                           "MinY": layer.find('./%sBoundingBox' % (NAMESPACE)).get('miny'),
                           "MaxY": layer.find('./%sBoundingBox' % (NAMESPACE)).get('maxy')}
            
            print boundingBox
            
            temp = createDimensionsArray(layer)
            styles = createStylesArray(layer)
            print styles
            
def createDimensionsArray(layer):
   dimensions = {}
   dimensions['dimensions'] = []
   dimensions['temporal'] = False
   dimensions['firstDate'] = None
   dimensions['lastDate'] = None
   
   for dimension in layer.iterfind('./%sDimension' % (NAMESPACE)):
      dimensionDict = dimension.split(',')
      #dimensionValue = 
      
      if dimension.get('name') == 'time':
         print 'worked'
            
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
   with open(file, 'rb') as csvfile:
      reader = csv.reader(csvfile, delimiter=",")
      titles = reader.next()
      reader = csv.DictReader(csvfile, titles)
      for row in reader:
         data.append(row)
         
   return data

def checkCacheValid(file, life):
   import os.path, time
   try:
      expireDate = time.time() - life
      cDate = os.path.getctime(file)
      if cDate < expireDate:
         print '%s valid' % file
         return True
      else:
         print '%s expired' % file
         return False
   except OSError as e:
      print 'Failed to open %s' % file
      return False
   
def getFile(filepath):
   try:
      with open(filepath) as file:
         return file.read()
   except IOError as e:
      return None
   
def saveFile(path, data):
   pass

def replace_all(text, dic):
    for i, j in dic.iteritems():
        text = text.replace(i, j)
    return text
   
updateCaches()