from flask import Blueprint, abort, request, jsonify, g, current_app
from sqlalchemy import desc
from opecflask.models.database import db_session
from opecflask.models.state import State
from opecflask.models.graph import Graph
from opecflask.models.quickregions import QuickRegions
from opecflask.models.roi import ROI
from opecflask.models.layergroup import LayerGroup
from opecflask.models.user import User
from opecflask.core import short_url
import datetime
import sqlite3 as sqlite

try:
   from collections import OrderedDict
except:
   from opecflask.core.ordered_dict import OrderedDict

portal_graph = Blueprint('portal_graph', __name__)

@portal_graph.route('/graph/<graphUrl>', methods = ['GET'])
def getGraph(graphUrl):
   # Decode url into a number to match to a state
   graphID = short_url.decode_url(graphUrl)
   print graphID
   output = {}
   
   if graphID is not None:
      graph = Graph.query.filter(graphID == Graph.id).first()
      if graph != None:
         print graph
         graph.retrievals += 1
         graph.last_used = datetime.datetime.now()
         db_session.commit()
         
         output = graphToJSON(graph)
         output['status'] = '200'
      else:
         output['error'] = "Failed to find a graph matching that id"
         output['status'] = '404'
         error_handler.setError('2-07', state, g.user.id, "views/graph.py:getGraph - There was no graph found matching the id given, returning 404 to user.", request)
   else:
      output['error'] = "You must enter a valid graph id"
      output['status'] = '400'
      error_handler.setError('2-06', state, g.user.id, "views/graph.py:getGraph - The graph id is invalid, returning 400 to user.", request)
      
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e 
      error_handler.setError('2-06', state, g.user.id, "views/graph.py:getGraph - Type Error exception, returning 400 to user. Exception %s" % e, request)
      abort(400) # If we fail to jsonify the data return 500
   
@portal_graph.route('/graph', methods = ['GET'])
def getGraphs():
   # Check if the user is logged in.
   if g.user is None:
      error_handler.setError('2-01', state, g.user.id, "views/graphs.py:getGraphs - The user is no t logged in, returning 401 to user.", request)
      abort(401)
      
   #TODO: Return available states filtered by email or other provided parameters.
   email = g.user.email
   
   if email is None:   
      return 'You need to enter an email'
      
   user = User.query.filter(User.email == email).first()
   if user is None:
      return 'No user with that email.'
   
   graphs = user.graphs.order_by(Graph.id.desc()).all()
   
   output = OrderedDict()
   for graph in graphs:
      output[short_url.encode_url(graph.id)] = graphToJSON(graph)
      #output[graph.id] = graphToJSON(graph)

   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-06', state, g.user.id, "views/graph.py:getGraphs - Type Error exception, returning 400 to user. Exception %s" % e, request)
      abort(400) # If we fail to jsonify the data return 400
   
@portal_graph.route('/graph', methods = ['POST'])
def setGraph():
   # Check if the user is logged in.
   if g.user is None:
      error_handler.setError('2-01', state, g.user.id, "views/graphs.py:setGraph - The user is no t logged in, returning 401 to user.", request)
      abort(401)
   
   email = g.user.email
   graphJSON = request.values.get('graph', None)
   
   output = {}
   
   if email is None or graphJSON is None:
      output['message'] = 'failed to store graph'
      output['email'] = email
      output['graph'] = graphJSON
      output['status'] = '404'
      error_handler.setError('2-04', state, g.user.id, "views/graphs.py:setGraph - Failed to store the graph, email or graphJSON were empty, returning 404 to user.", request)
   else:
      user = User.query.filter(User.email == email).first()
      
      if user is None: 
         # Create new user
         user = User(email)
         db_session.add(user)
         db_session.commit()
              
      graph = Graph(user.id, graphJSON)
      db_session.add(graph)
      db_session.commit()
   
      output['url'] = short_url.encode_url(graph.id)
      output['status'] = 'graph stored'
   
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-06', state, g.user.id, "views/graph.py:setGraph - Type Error exception, returning 400 to user. Exception %s" % e, request)
      abort(400) # If we fail to jsonify the data return 500
   
def graphToJSON(graph):
   output = {}
   output['user_id'] = graph.user_id
   output['graph'] = graph.graph
   output['version'] = graph.version
   output['retrievals'] = graph.retrievals
   output['lastUsed'] = str(graph.last_used)
   return output
