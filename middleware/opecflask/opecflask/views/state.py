from flask import Blueprint, abort, request, jsonify, g, current_app
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

portal_state = Blueprint('portal_state', __name__)

@portal_state.route('/state/<stateUrl>', methods = ['GET'])     
def getState(stateUrl):
   # Decode url into a number to match to a state
   stateID = short_url.decode_url(stateUrl)
   output = {}
        
   if stateID is not None:      
      state = State.query.filter(stateID == State.id).first()
      if state != None:
         state.views += 1
         state.last_used = datetime.datetime.now()
         db_session.commit()
         
         output = stateToJSON(state)
         output['status'] = '200'
      else:
         output['error'] = 'Failed to find a state matching that url'  
         output['status'] = '404'           
      
   else:
      output['error'] = 'You must enter a valid state url'
      output['status'] = '400'
      
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      abort(400) # If we fail to jsonify the data return 500
      
@portal_state.route('/state', methods = ['GET'])     
def getStates():
   # Check if the user is logged in.
   if g.user is None:
      abort(401)
      
   #TODO: Return available states filtered by email or other provided parameters.
   email = g.user.email
   
   if email is None:   
      return 'You need to enter an email'
      
   user = User.query.filter(User.email == email).first()
   if user is None:
      return 'No user with that email.'
   
   states = user.states.all()
   
   output = {}
   for state in states:
      output[short_url.encode_url(state.id)] = stateToJSON(state)

   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      abort(400) # If we fail to jsonify the data return 500
   
     
@portal_state.route('/state', methods = ['POST'])      
def setState():
   # Check if the user is logged in.
   if g.user is None:
      abort(401)
   
   print g.user
   email = g.user.email
   state = request.values.get('state', None)
   
   output = {}
   
   if email is None or state is None:
      output['status'] = 'failed to store state'
      output['email'] = email
      output['state'] = state
   else:
      user = User.query.filter(User.email == email).first()
      
      if user is None: 
         # Create new user
         user = User(email)
         db_session.add(user)
         db_session.commit()
              
      s = State(user.id, state)
      db_session.add(s)
      db_session.commit()
   
      output['url'] = short_url.encode_url(s.id)
      output['status'] = 'state stored'
   
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      abort(400) # If we fail to jsonify the data return 500
      
def stateToJSON(state):
   output = {}
   output['url'] = short_url.encode_url(state.id)
   output['user_id'] = state.user_id
   output['state'] = state.state
   output['version'] = state.version
   output['views'] = state.views
   output['lastUsed'] = str(state.last_used)
   return output