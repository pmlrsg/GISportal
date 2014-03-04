#!/usr/bin/env python

import os
import utils
import parse
import sys

sys.path.append(os.path.join(sys.path[0],'..','config'))
print sys.path
# WFS Server list
import wfsServers

# Extra layer info
import wfsLayerTags

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

CACHELIFE = 3600 #3600 # cache time in seconds, 1 hour cache
LAYERCACHEPATH = "../html/cache/layers/"
SERVERCACHEPATH = "../html/cache/"
MASTERCACHEPATH = "../html/cache/wfsMasterCache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"
GET_CAPABILITES_PARAMS = "SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.0.0"
SERVERLIST = "wfsServerList.csv"
NAMESPACE = '{http://www.opengis.net/wfs}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'

dirtyCaches = [] # List of caches that may need recreating if they don't get created the first time
extraInfo = wfsLayerTags.layers


def touch(fname, times=None):
   import os
   with file(fname, 'a'):
      os.utime(fname, times)
      
# Touch master cache so that it doesn't 404 if no data
touch(MASTERCACHEPATH + '.json')

def createCache(server, xml):
   import json
   import urllib
   
   print 'Creating caches...'
   subMasterCache = {}
   subMasterCache['layers'] = []
   tags = None
   
   cleanServerName = server['name'].replace('/', '-')
   cleanLayerName =  server['name']
   
   if server['params'] and server['params']['TypeName']:
      cleanLayerName = utils.replaceAll(server['params']['TypeName'], {':': '-', '\\': '-'})
      
   if server['name'] in extraInfo:
      tags = extraInfo[server['name']]
   
   # Layer iter
   
   if 'passthrough' in server['options'] and server['options']['passthrough']:
      if server['params']:
         encodedParams = urllib.urlencode(server['params'])
         subMasterCache['url'] = server['url'] + encodedParams
      else:
         subMasterCache['url'] = server['url']
      
      layer = {
         'name': cleanLayerName,
         'options': server['options'] 
      }
      
      if tags:
         layer['tags'] = tags
      
      subMasterCache['layers'].append(layer)
      
   elif xml != None:   
      # Save out the xml file for later
      utils.saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONXML, xml)
      times = processTimes(server, xml)
   
      layer = {
         'name': cleanLayerName,
         'options': server['options'],
         'times': times
      }
      
      if tags:
         layer['tags'] = tags
      
      # Save out layer cache
      utils.saveFile(LAYERCACHEPATH + cleanServerName + "_" + cleanLayerName + FILEEXTENSIONJSON, json.dumps(layer))     
      subMasterCache['layers'].append(layer)     
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
