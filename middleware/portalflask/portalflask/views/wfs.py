from flask import Blueprint, abort, request, jsonify, g, current_app
from portalflask.core.param import Param
from portalflask.core import error_handler

portal_wfs = Blueprint('portal_wfs', __name__)

"""
WFS
"""
@portal_wfs.route('/wfs', methods = ['GET'])
def getWFSData():
   from owslib.wfs import WebFeatureService   
   import string
   
   params = getWFSParams() # Get parameters     
   params = checkParams(params) # Check parameters
   
   wfs = WebFeatureService(params['baseURL'].value, version=params['version'].value)
   response = wfs.getfeature(typename=str(params['typeName'].value), featureid=[params['featureID'].value]) # Contact server
   
   if string.find(params['baseURL'].value, 'bodc', 0): 
      response = processBODCResponse(response.read(), params) # Get data from response
   else:
      pass
   
   current_app.logger.debug('Jsonifying response...') # DEBUG
   
   # Convert to json
   try:
      jsonData = jsonify(output = response)
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-06', None, g.user.id, "views/wfs.py:getWFSData - Type error, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500
      
   current_app.logger.debug('Request complete, Sending results') # DEBUG
   
   return jsonData # return json
   
"""
Process data from a normalish wfs server
"""
def processBODCResponse(response, params):
   import parse
   import string
   import operator
   
   output = {}
   
   typename = string.split(str(params['typeName'].value).lower(), ':', 1)[1]
   data = parse.process(response, tag=None)[0]     
   feature = data['featuremembers'][typename]
   sortedFeature = sorted(feature.iteritems(), key = operator.itemgetter(0))
         
   if 'shref' in feature:
      output['shref'] = feature['shref']         
   if 'datacat' in feature:
      output['datacat'] = feature['datacat']        
   if 'instrument' in feature:
      output['instrument'] = feature['instrument']        
   if 'country' in feature:
      output['country'] = feature['country']
   if 'org' in feature:
      output['org'] = feature['org']
   if 'startdate' in feature:
      output['startdate'] = feature['startdate']
   if 'projectnam' in feature:
      output['projectnam'] = feature['projectnam']
   if 'theme' in feature:
      output['theme'] = feature['theme']
   if 'paramgroup' in feature:
      output['paramgroup'] = feature['paramgroup']
   if 'paramdisp' in feature:
      output['paramdisp'] = feature['paramdisp']
   if 'metadata' in feature:
      output['metadata'] = feature['metadata']
   if 'dataqxf' in feature:
      output['dataqxf'] = feature['dataqxf']
   if 'dataodv' in feature:
      output['dataodv'] = feature['dataodv']
   if 'databodcreq' in feature:
      output['databodcreq'] = feature['databodcreq']
   if 'dataplot1' in feature:
      output['dataplot1'] = feature['dataplot1']
   if 'dataplot2' in feature:
      output['dataplot2'] = feature['dataplot2']
   if 'dataplot3' in feature:
      output['dataplot3'] = feature['dataplot3']
   if 'dataplot4' in feature:
      output['dataplot4'] = feature['dataplot4']
   if 'dataplot5' in feature:
      output['dataplot5'] = feature['dataplot5']
   if 'dataplot6' in feature:
      output['dataplot6'] = feature['dataplot6']
   if 'dataplot7' in feature:
      output['dataplot7'] = feature['dataplot7']
   if 'dataplot8' in feature:
      output['dataplot8'] = feature['dataplot8']
   if 'dataplot9' in feature:
      output['dataplot9'] = feature['dataplot9']
   if 'dataplot10' in feature:
      output['dataplot10'] = feature['dataplot10']
   if 'dataplot11' in feature:
      output['dataplot11'] = feature['dataplot11']
   
   if 'shape' in feature:
      shape = feature['shape']
      if 'point' in shape:
         point = shape['point']
         if 'pos' in point:
            output['position'] = point['pos']
   
   content = ""
            
   for item in sortedFeature:
      if item[0] != 'shape':
         # See if it contains a url
         temp = '<div><br> %s: %s </div>' % (item[0], replaceAll(item[1], {'&lt;': '<', '&gt;': '>'}))
         if '<a' in temp and "'>" in temp:
            content += replaceAll(temp, {"'>": "' target='_blank'>"})
         else:
            content += temp
      
   output['content'] = content;
                   
   return output
           
"""
Gets any parameters.
"""
def getWFSParams():
   # Required for url
   nameToParam = {}
   nameToParam["baseURL"] = Param("baseURL", False, False, request.args.get('baseurl', None))
   nameToParam["request"] = Param("request", False, False, request.args.get('request', None))
   nameToParam["version"] = Param("request", False, False, request.args.get('version', '1.0.0'))
   nameToParam["typeName"] = Param("typeName", False, False, request.args.get('typeName', None))
   nameToParam["featureID"] = Param("featureID", False, False, request.args.get('featureID', None))
   
   return nameToParam
   
def replaceAll(text, dic):
    for i, j in dic.iteritems():
        text = text.replace(i, j)
    return text
