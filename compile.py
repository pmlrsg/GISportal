#!/usr/bin/python2.7

import httplib, urllib, sys, os

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

def saveFile(path, data):
   with open(path, 'wb') as file:
      file.write(data)
   
   return data

directory = sys.argv[1]
filesToCompile = {}
for root, dirs, files in os.walk(directory):
   for file in files:
      if file.endswith(".js"):
         f = open(directory + "/" + file, 'r')
         filesToCompile[file] = f.read()
         f.close()

# Define the parameters for the POST request and encode them in
# a URL-safe format.

toBeEncoded = []

toBeEncoded.append(('compilation_level', 'SIMPLE_OPTIMIZATIONS'))
toBeEncoded.append(('output_format', 'text'))
toBeEncoded.append(('output_info', 'compiled_code'))

for fileContent in filesToCompile.itervalues():
   toBeEncoded.append(('js_code', fileContent))

params = urllib.urlencode(toBeEncoded)

# Always use the following value for the Content-type header.
headers = { "Content-type": "application/x-www-form-urlencoded" }
conn = httplib.HTTPConnection('closure-compiler.appspot.com')
conn.request('POST', '/compile', params, headers)
response = conn.getresponse()
data = response.read()
saveFile(sys.argv[2], data)
conn.close