#!/usr/bin/env python

FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"

def updateCaches(createCache, dirtyCaches, serverList, cachePath, masterCachePath, cacheLife):
   import urllib, urllib2
   
   print 'Starting cache generation'
   #servers = csvToList(serverList)
   change = False
   
   # Go through each server
   for key, server in serverList.items():
      
      # Check if we are just passing a layer
      if 'passthrough' in server['options'] and server['options']['passthrough']:
         # Check if cache is valid
         if not checkCacheValid(cachePath + server['name'] + FILEEXTENSIONJSON, cacheLife):        
            createCache(server, None)
            
         continue
      
      # Check if cache is valid
      if not checkCacheValid(cachePath + server['name'] + FILEEXTENSIONXML, cacheLife):        
         oldXML = None
         newXML = None       
         try:
            url = server['url'] + urllib.urlencode(server['params'])          
            # Try to contact the server for the newXML
            resp = urllib2.urlopen(url, timeout=30)
            newXML = resp.read()
         except urllib2.URLError as e:
            print 'Failed to open url to ' + url
            print e
            # If we can't contact the server, skip to the next server
         except IOError as e:
            print 'Failed to open url to ' + url
            print e
            
         # Check that we have the xml file
         if newXML == None:
            dirtyCaches.append(server)
            continue
         
         try:
            oldXML = getFile(cachePath + server['name'] + FILEEXTENSIONXML)
         except IOError as e:
            print 'Failed to open xml file at "' + cachePath + server['name'] + FILEEXTENSIONXML + '"'       
            print e
            # We don't have the oldXML so we want to skip the md5 check
            createCache(server, newXML) 
            change = True
            continue
         
         # This shouldn't be needed   
         if oldXML == None:
            oldXML = "old"
         
         # Check the md5s   
         if checkMD5(oldXML, newXML):
            print 'md5 check failed...'
            # Create the caches for this server
            createCache(server, newXML)
            change = True
            continue
         else: 
            print 'md5 check passed'
   
   dirtyCachesCopy = dirtyCaches[:]
   print "Checking for dirty caches..."        
   for dirtyServer in dirtyCachesCopy:  
      print "server name: " + dirtyServer['name']  
      regenerateCache(dirtyServer, dirtyCaches, createCache)
   print "Dirty caches regenerated"     
         
   if change:
      createMasterCache(serverList, cachePath, masterCachePath)
      
   print 'Finished generating caches'
   
def createMasterCache(servers, cachePath, masterCachePath):
   import json
   masterCache = []
   for key, server in servers.items():
      file = None
      try:
         file = getFile(cachePath + server['name'] + FILEEXTENSIONJSON)
      except IOError as e:
         print 'Failed to open json file at "' + cachePath + server['name'] + FILEEXTENSIONJSON + '"'       
         print e
         
      if file != None:
         masterCache.append(json.loads(file))
   
   print "Saving mastercache..."         
   saveFile(masterCachePath + FILEEXTENSIONJSON, json.dumps(masterCache))
   print "Mastercache saved" 
   
def regenerateCache(dirtyServer, dirtyCaches, createCache):
   import urllib, urllib2, time
   for i in range(10):
      if dirtyServer in dirtyCaches:
         dirtyCaches.remove(dirtyServer)
      if i < 10:
         try:
            url = dirtyServer['url'] + urllib.urlencode(dirtyServer['params'])
            resp = urllib2.urlopen(url, timeout=30)
            newXML = resp.read()
            createCache(dirtyServer, newXML)
            if dirtyServer not in dirtyCaches:
               return
            else:
               time.sleep(30)
         except urllib2.URLError as e:
            print 'Failed to open url to ' + url
            print e
         except IOError as e:
            print 'Failed to open url to ' + url
            print e
            # We don't have the oldXML so we need to skip the md5 check
         
def checkMD5(oldXML, newXML):
   import hashlib
   newMD5 = hashlib.md5(newXML)
   oldMD5 = hashlib.md5(oldXML) 
   
   print 'Checking md5...'
   print newMD5.hexdigest()
   print oldMD5.hexdigest()
   
   return newMD5.hexdigest() != oldMD5.hexdigest()

def csvToList(file):
   import csv
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

def replaceAll(text, dic):
    for i, j in dic.iteritems():
        text = text.replace(i, j)
    return text
 
def blackfilter(stringToTest, filterList):
   if len(filterList) != 0:
      for v in filterList:
         if stringToTest.find(v['name']) != -1:
            return False
      
   return True