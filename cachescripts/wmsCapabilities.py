#!/usr/bin/env python

import os
import utils
import sys
import re
import dateutil.parser
import calendar
import json

sys.path.append(os.path.join(sys.path[0],'..','config'))
sys.path.append(os.path.join(sys.path[0],'..','config/user_layers'))
# server list
import PML_RSG_THREDDS_Data_Server as wmsLayers
from providers import providers
from legendSettings import legendSettings as defaultLegendSettings

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

CACHELIFE = 3600 #3600 # cache time in seconds, 1 hour cache
LAYERCACHEPATH = "../html/cache/layers/"
SERVERCACHEPATH = "../html/cache/"
MASTERCACHEPATH = "../html/cache/mastercache"
FILEEXTENSIONJSON = ".json"
FILEEXTENSIONXML = ".xml"

WMS_NAMESPACE = '{http://www.opengis.net/wms}'
WCS_NAMESPACE = '{http://www.opengis.net/wcs}'
GML_NAMESPACE = '{http://www.opengis.net/gml}'
XLINKNAMESPACE = '{http://www.w3.org/1999/xlink}'

MARKDOWN_DIR = '../markdown'
MARKDOWN_SUFFIX = '.md'

PRODUCTFILTER = "productFilter.csv"
LAYERFILTER = "layerFilter.csv"

dirtyCaches = [] # List of caches that may need recreating
#extraInfo = wmsLayerTags.layers



def findCoverageNode( coverageRoot, name ):
   possibleNodes = coverageRoot.findall('./%sCoverageOffering'  % (WCS_NAMESPACE))
   for node in possibleNodes:
      coverageName = node.find('./%sname' % (WCS_NAMESPACE)).text
      if( coverageName == name ):
         return node
   return None

def removeNonUTF8( text ):
   
   # Horrible way to remove non UTF-8 characters but if you can find a better way please go head
   invalidCharacters = re.sub( '([\x00-\x7F]|[\xC2-\xDF][\x80-\xBF]|\xE0[\xA0-\xBF][\x80-\xBF]|[\xE1-\xEC][\x80-\xBF]{2}|\xED[\x80-\x9F][\x80-\xBF]|[\xEE-\xEF][\x80-\xBF]{2}|\xF0[\x90-\xBF][\x80-\xBF]{2}|[\xF1-\xF3][\x80-\xBF]{3}|\xF4[\x80-\x8F][\x80-\xBF]{2})', '', text )
   if( len( invalidCharacters ) == 0 ):
      return text
   
   invalidCharacters = set( invalidCharacters )
   invalidCharacters = "".join(invalidCharacters)
   invalidRegex = "[" + invalidCharacters + "]"
   return re.sub( invalidRegex, '', text )
   

def createCache(server, capabilitiesXML, coverageXML):

   #import xml.etree.ElementTree as ET
   #from xml.etree.ElementTree import XMLParser
   from lxml import etree as ET
   
   import json
   
   # Save out the xml file for later
   utils.saveFile(SERVERCACHEPATH + server['name'] + '-GetCapabilities' + FILEEXTENSIONXML, capabilitiesXML)
   utils.saveFile(SERVERCACHEPATH + server['name'] + '-DescribeCoverage' + FILEEXTENSIONXML, coverageXML)
   
   print 'Creating caches...'
   subMasterCache = {}
   subMasterCache['server'] = {}
   
   #parse =  XMLParser( encoding="UTF-8" )
   
   # Parse the GetCapabilities XML
   #root = ET.XML(capabilitiesXML, parser=parse)
   root = ET.fromstring( removeNonUTF8(capabilitiesXML) )
   
   # Parse the DescribeCoverage XML
   coverageRoot = ET.fromstring(  removeNonUTF8(coverageXML) )
    
   if root.find('./%sCapability/%sLayer/%sLayer' % (WMS_NAMESPACE,WMS_NAMESPACE,WMS_NAMESPACE)) == None:
      dirtyCaches.append(server)
      return
   
   for service in root.findall('./%sService' % (WMS_NAMESPACE)):
      serverTitle = service.find('./%sTitle' % (WMS_NAMESPACE)).text
      serverAbstract = service.find('./%sAbstract' % (WMS_NAMESPACE)).text if service.find('./%sAbstract' % (WMS_NAMESPACE)) is not None else None
   
   for product in root.findall('./%sCapability/%sLayer/%sLayer' % (WMS_NAMESPACE,WMS_NAMESPACE,WMS_NAMESPACE)):
      sensorName = product.find('./%sTitle' % (WMS_NAMESPACE)).text
      
      if utils.blackfilter(sensorName, productBlackList):
         sensorName = utils.replaceAll(sensorName, {' ':'_', '(':'_', ')':'_', '/':'_'})
         print sensorName
         layers = []
         
         for layer in product.findall('./%sLayer' % (WMS_NAMESPACE)):
            name = layer.find('./%sName' % (WMS_NAMESPACE)).text
            title = layer.find('./%sTitle' % (WMS_NAMESPACE)).text
            abstract = layer.find('./%sAbstract' % (WMS_NAMESPACE)).text
            temporal = False
            

            if name not in server['indicators']:
               print "NOTICE: Indicator '" + name + "' found on WMS server but not in local config file, ignoring."
               continue

            #Find the CoverageOffering from DescribeCoverage
            
            
            coverage = findCoverageNode( coverageRoot, name )
            if coverage == None:
               print serverTitle + "  " + name + " could not be found in DescribeCoverage. Not including."
               continue
            
            offsetVectorsArray = coverage.findall( './/%soffsetVector' % (GML_NAMESPACE) )
            offsetVectors = []
            for i in range( 0 , len( offsetVectorsArray )):
               offsetVectors.append(float(offsetVectorsArray[i].text.split(" ")[i]))
            
            exGeographicBoundingBox = {"WestBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%swestBoundLongitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                       "EastBoundLongitude": layer.find('./%sEX_GeographicBoundingBox/%seastBoundLongitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                       "SouthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%ssouthBoundLatitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text,
                                       "NorthBoundLatitude": layer.find('./%sEX_GeographicBoundingBox/%snorthBoundLatitude' % (WMS_NAMESPACE,WMS_NAMESPACE)).text}
            
            boundingBox = {"CRS": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('CRS'),
                           "MinX": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('minx'),
                           "MaxX": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('maxx'),
                           "MinY": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('miny'),
                           "MaxY": layer.find('./%sBoundingBox' % (WMS_NAMESPACE)).get('maxy')}
            
            dimensions = createDimensionsArray(layer, server)
            temporal = dimensions['temporal']
            styles = createStylesArray(layer)

            if server['options']['providerShortTag'] not in providers:
               raise Exception("Provider shortTag " + server['options']['providerShortTag'] + " was not in the 'providers.py' file")

            # Get the default details for the provider
            providerDetails =  providers[ server['options']['providerShortTag'] ]
            if (layerHasMoreInfo(server['options']['providerShortTag'])):
               moreProviderInfo = True
            else:
               moreProviderInfo = False

            if 'providerDetails' in server['indicators'][name]:
               # Overwrite any details with the indicator specific details
               for i in server['indicators'][name]['providerDetails']:
                  providerDetails[ i ] = server['indicators'][name]['providerDetails'][ i ]

            if 'LegendSettings' in server['indicators'][name]:
               legendSettings = server['indicators'][name]['LegendSettings']
            else:
               legendSettings = defaultLegendSettings

            #import pprint
            #pprint.pprint(server['indicators'][name])
            #print '-'*40

            if utils.blackfilter(name, layerBlackList):
               if layerHasMoreInfo(server['indicators'][name]['niceName']):
                  moreIndicatorInfo = True
               else:
                  moreIndicatorInfo = False
               masterLayer = {"Name": name,
                              "Title": title,
                              "Abstract": abstract,
                              "FirstDate": dimensions['firstDate'],
                              "LastDate": dimensions['lastDate'],
                              "OffsetVectors": offsetVectors,
                              "ProviderDetails": providerDetails,
                              "EX_GeographicBoundingBox": exGeographicBoundingBox,
                              "MoreIndicatorInfo" : moreIndicatorInfo,
                              "MoreProviderInfo" : moreProviderInfo,
                              "LegendSettings": legendSettings }
                              
               if name in server['indicators']:
                  masterLayer['tags'] = server['indicators'][name]
               
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
                        "OffsetVectors": offsetVectors,
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
   subMasterCache['wmsURL'] = server['services']['wms']['url']
   if set(('wcs')).issubset(server['services']): # Confirms that the WCS information has been given.
      subMasterCache['wcsURL'] = server['services']['wcs']['url']
   subMasterCache['serverName'] = server['name']
   
   print 'Cache creation complete...'
      
   # Return and save out the cache for this server
   return utils.saveFile(SERVERCACHEPATH + server['name'] + FILEEXTENSIONJSON, json.dumps(subMasterCache))

def layerHasMoreInfo( layerNiceName ):
   print os.getcwd()
   print "testing %s for more info" % layerNiceName
   for root, dirs, files in os.walk(MARKDOWN_DIR):
      for _file in files:
         #print _file
         if _file.lower() == '%s%s' % (layerNiceName.lower(), MARKDOWN_SUFFIX):
            print 'found %s file' % layerNiceName
            return True
   return False


def isoToTimestamp( strDate ):
   dt = dateutil.parser.parse(strDate)
   return calendar.timegm(dt.utctimetuple())


def compareDateStrings( a, b ):
   if isoToTimestamp(a) > isoToTimestamp(b):
      return 1
   else:
      return -1

def createDimensionsArray(layer, server):
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
         
         newDates.sort( compareDateStrings )

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
   
   for style in layer.findall('./%sStyle' % (WMS_NAMESPACE)):      
      styles.append({"Name": style.find('./%sName' % (WMS_NAMESPACE)).text,
                         "Abstract": style.find('./%sAbstract' % (WMS_NAMESPACE)).text,
                         "LegendURL": style.find('./%sLegendURL/%sOnlineResource' % (WMS_NAMESPACE,WMS_NAMESPACE)).get('%shref' % (XLINKNAMESPACE)),
                         "Width": style.find('./%sLegendURL' % (WMS_NAMESPACE)).get('width'),
                         "Height": style.find('./%sLegendURL' % (WMS_NAMESPACE)).get('height')})
      
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
utils.updateCaches(createCache, dirtyCaches,  wmsLayers.layers, SERVERCACHEPATH, MASTERCACHEPATH, CACHELIFE)
