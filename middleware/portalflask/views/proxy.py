from flask import Blueprint, abort, request, make_response, g, current_app, send_file, Response, jsonify
from portalflask.core import error_handler
from PIL import Image
import StringIO
import io
import os
import json

portal_proxy = Blueprint('portal_proxy', __name__)

# Designed to prevent Open Proxy type stuff - white list of allowed hostnames
allowedHosts = ['localhost','localhost:8080','localhost:86','localhost:85',
         '127.0.0.1','127.0.0.1:8080','127.0.0.1:5000',
         'pmpc1313.npm.ac.uk','pmpc1313.npm.ac.uk:8080','pmpc1313.npm.ac.uk:5000',
         'fedora-mja.npm.ac.uk:5000','fedora-mja:5000',
         'earthserver.pml.ac.uk','earthserver.pml.ac.uk:8080',
         'portaldev.marineopec.eu', 'portal.marineopec.eu',
         'vostok.npm.ac.uk','vostok.npm.ac.uk:8080',
         'vostok.pml.ac.uk','vostok.pml.ac.uk:8080',
         'vortices.npm.ac.uk', 'vortices.npm.ac.uk:8080',
         'rsg.pml.ac.uk','rsg.pml.ac.uk:8080',
         'motherlode.ucar.edu','motherlode.ucar.edu:8080',
         'www.openlayers.org', 'wms.jpl.nasa.gov', 'labs.metacarta.com', 
         'www.gebco.net', 'oos.soest.hawaii.edu:8080', 'oos.soest.hawaii.edu',
         'thredds.met.no','thredds.met.no:8080', 'irs.gis-lab.info',
         'demonstrator.vegaspace.com', 'grid.bodc.nerc.ac.uk', 'ogc.hcmr.gr:8080','wci.earth2observe.eu' ]
         
"""
Standard proxy
"""
@portal_proxy.route('/proxy')
def proxy():  
   import urllib2
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Checking logger")
   current_app.logger.debug(url)
   
   try:
      host = url.split("/")[2]
      current_app.logger.debug(host)
      if host and allowedHosts and not host in allowedHosts:
         error_handler.setError('2-01', None, g.user.id, "views/proxy.py:proxy - Host is not in the whitelist, returning 502 to user.", request)
         abort(502)
         
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
         #if i.has_key("Content-Type"):
         #    print "Content-Type: %s" % (i["Content-Type"])
         #else:
         #    print "Content-Type: text/plain"
         #print
         
         #resp = y.read()
         resp = make_response(y.read(), y.code)
         if i.has_key("Content-Type"):
            resp.headers.add('Content-Type', i['Content-Type'])
            
         #for key in y.headers.dict.iterkeys():
            #resp.headers[key] = y.headers.dict[key]
         
         y.close()
         return resp
      else:
         g.error = 'Missing protocol. Add "http://" or "https://" to the front of your request url.'
         error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - The protocol is missing, returning 400 to user.", request)
         abort(400)
   
   except urllib2.URLError as e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to access url, make sure you have entered the correct parameters."
         if e.code == 500:
            g.error = "Sorry, looks like one of the servers you requested data from is having trouble at the moment. It returned a 500."
         abort(400)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code
   except Exception, e:
      if hasattr(e, 'code'): # check for the code attribute from urllib2.urlopen
         if e.code == 400:
            g.error = "Failed to access url"
         abort(e.code)
         
      g.error = "Failed to access url, make sure you have entered the correct parameters"
      error_handler.setError('2-06', None, g.user.id, "views/proxy.py:proxy - URL error, returning 400 to user. Exception %s" % e, request)
      abort(400) # return 400 if we can't get an exact code


"""
Return a rotated image
"""
@portal_proxy.route('/rotate')
def rotate():  

   import urllib2
   
   
   angle = request.args.get('angle') 
   if( angle == None ):
         error_handler.setError('2-08', None, g.user.id, "views/proxy.py:proxy - Angle not set.", request)
         abort(502)
      
   
   url = request.args.get('url', 'http://www.openlayers.org')  
   current_app.logger.debug("Rotating image")
   current_app.logger.debug(url)
   try:
      host = url.split("/")[2]
      current_app.logger.debug(host)
      
      # Check if the image is at an allowed server
      if host and allowedHosts and not host in allowedHosts:
         error_handler.setError('2-01', None, g.user.id, "views/proxy.py:proxy - Host is not in the whitelist, returning 502 to user.", request)
         abort(502)
      
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
Return a list of template files
"""
@portal_proxy.route('/templates')
def templates(): 
   this_dir = os.path.dirname(os.path.realpath(__file__))
   template_dir = this_dir.replace('middleware/portalflask/views', 'html/templates')
   templates_list = []

   files_in_dir = os.listdir(template_dir)
   for file_in_dir in files_in_dir:
      templates_list.append(file_in_dir)

   response = make_response(json.dumps(templates_list), 200)
   return response