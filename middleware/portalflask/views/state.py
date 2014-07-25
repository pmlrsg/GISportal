from flask import Blueprint, abort, request, jsonify, g, current_app
from portalflask.models.database import db_session
from portalflask.models.state import State
from portalflask.models.graph import Graph
from portalflask.models.quickregions import QuickRegions
from portalflask.models.roi import ROI
from portalflask.models.layergroup import LayerGroup
from portalflask.models.user import User
from portalflask.core import short_url
from portalflask.core import error_handler
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
      if state is not None:
         state.views += 1
         state.last_used = datetime.datetime.now()
         db_session.commit()
         
         output = stateToJSON(state)
         output['status'] = '200'
      else:
         output['error'] = 'Failed to find a state matching that url'  
         output['status'] = '404'           
         error_handler.setError('2-07', None, None, "views/state.py:getState - Failed to find state matching the url, returning 404 to user.", request)
      
      
   else:
      output['error'] = 'You must enter a valid state url'
      output['status'] = '400'
      error_handler.setError('2-04', None, None, "views/state.py:getStates - Failed to find state, no state url was provided, returning 400 to user.", request)
      
      
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-0', None, g.user.id, "views/state.py:getState - Type Error exception, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500
      
@portal_state.route('/state/<stateUrl>', methods = ['DELETE'])
def removeState(stateUrl):
   # Check if the user is logged in.
   if g.user is None:
      error_handler.setError('2-04', None, None, "views/state.py:removeState - Failed to remove state data because the user is not logged in, returning 401 to user.", request)  
      abort(401)
  
   email = g.user.email
   # Decode url into a number to match to a state
   stateID = short_url.decode_url(stateUrl)
   
   output = {}
   
   if email is None or stateID is None:
      output['status'] = '404'
      output['message'] = 'Failed to remove state'
      output['email'] = email
      output['stateID'] = stateID
      error_handler.setError('2-04', None, g.user.id, "views/state.py:removeState - Failed to remove state data, not enough data provided, returning 404 to user.", request)  
   else:
      # Might be able to use 'g.user' instead. Only reason I havn't is I'm not 
      # sure on the reliability of it.
      user = User.query.filter(User.email == email).first()
      
      if user is None: 
         # Create new user
         user = User(email)
         db_session.add(user)
         db_session.commit()
      
      state = user.states.filter(State.id == stateID).first()
      
      if state != None:
         db_session.delete(state)
         db_session.commit()
         
         output['message'] = 'Successfully removed state.'
         output['status'] = '200'
         
      else:
         output['message'] = 'Failed to remove state as no state with that ID could be found.'
         output['status'] = '404'
         error_handler.setError('2-04', None, None, "views/state.py:removeStates - Failed to remove state because the state id could not be found, returning 404 to user.", request)
      
         
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-05', None, g.user.id, "views/state.py:removeStates - Type Error exception, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500
      
@portal_state.route('/state', methods = ['GET'])     
def getStates():
   # Check if the user is logged in.
   if g.user is None:
      error_handler.setError('2-04', None, None, "views/state.py:getStates - Failed to store state data because the user is not logged in, returning 401 to user.", request)
      abort(401)
      
   #TODO: Return available states filtered by email or other provided parameters.
   email = g.user.email
   
   output = {}
   
   if email is None:  
      output['message'] = 'You need to enter an email'
      output['status'] = '400'
      error_handler.setError('2-04', None, g.user.id, "views/state.py:getStates - Email address is missing, returning 400 to user.", request)
   else: 
      user = User.query.filter(User.email == email).first()
      if user is None:
         output['message'] = 'No user with that email.'
         output['status'] = '400'
         error_handler.setError('2-06', None, g.user.id, "views/state.py:getStates - There is no user with the email address provided, returning 400 to user.", request)
      else:
         states = user.states.all()
    
         for state in states:
            output[short_url.encode_url(state.id)] = stateToJSON(state)

   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-05', None, g.user.id, "views/state.py:getStates - Type Error exception, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500
   
     
@portal_state.route('/state', methods = ['POST'])      
def setState():
   # Check if the user is logged in.
   email = None
   if g.user is not None:
      email = g.user.email
   state = request.values.get('state', None)
   
   output = {}
   
   if state is None:
      output['message'] = 'failed to store state'
      output['email'] = email
      output['state'] = state
      output['status'] = '404'

      error_handler.setError('2-04', state, g.user.id, "views/state.py:setState - Failed to store state data, returning 404 to user.", request)
   else:
      # Might be able to use 'g.user' instead. Only reason I havn't is I'm not 
      # sure on the reliability of it.
      user = User.query.filter(User.email == email).first() 
      
      if user is None and email is not None: 
         # Create new user
         user = User(email)
         db_session.add(user)
         db_session.commit()
      
      if user is None:
         user_id = -1
      else:
         user_id = user.id
         
      s = State(user_id, state)
      checksumMatch = State.query.filter(State.checksum == s.checksum).first()
      if checksumMatch == None:
         db_session.add(s)
         db_session.commit()
          
         output['url'] = short_url.encode_url(s.id)
         output['message'] = 'state stored'
         output['status'] = '200'
      else:
         output['url'] = short_url.encode_url(checksumMatch.id)
         output['message'] = 'Failed to add state as state already exists'
         output['status'] = '400'
         error_handler.setError('2-05', state, user_id, "views/state.py:setState - The state already exists in the database, returning 400 to the user.", request)
   
   try:
      jsonData = jsonify(output = output)
      #current_app.logger.debug('Request complete, Sending results') # DEBUG
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-06', state, user_id, "views/state.py:setState - Type Error exception, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500
   
def compareChecksum(hexdigest1, hexdigest2):
   return hexdigest1 == hexdigest2
   
      
def stateToJSON(state):
   output = {}
   output['url'] = short_url.encode_url(state.id)
   output['user_id'] = state.user_id
   output['state'] = state.state
   output['version'] = state.version
   output['views'] = state.views
   output['lastUsed'] = str(state.last_used)
   return output
