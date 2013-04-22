#!/usr/bin/env python

import os
import utils
import parse
import wfsServers

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

CACHELIFE = 3600 #3600 # cache time in seconds, 1 hour cache
LAYERCACHEPATH = "./html/static/cache/layers/"
SERVERCACHEPATH = "./html/static/cache/"
MASTERCACHEPATH = "./html/static/cache/wfsMasterCache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"
GET_CAPABILITES_PARAMS = "SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.0.0"
SERVERLIST = "wfsServerList.csv"
NAMESPACE = '{http://www.opengis.net/wfs}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'
dirtyCaches = [] # List of caches that may need recreating if they don't get created the first time

def createCache(server, xml):
   import json
   import urllib
   
   print 'Creating caches...'
   subMasterCache = {}
   subMasterCache['layers'] = {}
   subMasterCache['layers'][server['name']] = {}
   
   cleanServerName = server['name'].replace('/', '-')
   cleanLayerName = utils.replaceAll(server['params']['TypeName'], {':': '-', '\\': '-'})
   
   subMasterCache['layers'][server['name']]['name'] = cleanLayerName;
   
   if 'passthrough' in server['options'] and server['options']['passthrough']:
      subMasterCache['url'] = server['url'] + urllib.urlencode(server['params'])
   elif xml != None:   
      # Save out the xml file for later
      utils.saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, xml)
      times = processTimes(server, xml)
   
      layer = {
         'times': times
      }
      
      # Save out layer cache
      utils.saveFile(LAYERCACHEPATH + cleanServerName + "_" + cleanLayerName + FILEEXTENSIONJSON, json.dumps(layer))     
      subMasterCache['layers'][server['name']]['times'] = times;
      subMasterCache['url'] = server['url']
     
   
   subMasterCache['serverName'] = server['name']
   
   print 'Cache creation complete...'
      
   # Return and save out the cache for this server
   return utils.saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON, json.dumps(subMasterCache))

def processTimes(server, xml):
   from time import mktime, strptime
   data = parse.process(xml,tag=server['options']['tag'])

   if (len(data) == 0):
      return None
   
   sname = server['params']['propertyName']

   data = data[0][data[0].keys()[0]]
   [int(mktime(strptime(x[sname.lower()].split('T')[0],"%Y-%m-%d"))) for x in data] 
   
   return data

utils.updateCaches(createCache, dirtyCaches,  wfsServers.servers, SERVERCACHEPATH, MASTERCACHEPATH, CACHELIFE)