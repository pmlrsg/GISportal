from flask import Blueprint, abort, request, jsonify, g, current_app
from portalflask.models.database import db_session
from portalflask.models.user import User
from portalflask.models.state import State
from portalflask.models.errors import Errors
from portalflask.core import error_handler, cors 
import sqlite3 as sqlite

portal_errors = Blueprint('portal_errors', __name__)

@portal_errors.route('/error', methods = ['GET'])
@cors.crossdomain(origin='*')
def getErrors():
   output = {}
   
   fromDate = request.args.get('from', None)
   toDate = request.args.get('to', None)
   
   if fromDate is None and toDate is None:
      errors = Errors.query.all()
   else:
      errors = Errors.query.filter(Errors.date_time.between(fromDate, toDate))


   if errors is not None:
      output['errors'] = {}
      for error in errors:
         output['errors'][error.id] = errorToJSON(error)
      output['status'] = '200'
   else:
      output['error'] = 'Failed to find an error matching the id'
      output['status'] = '404'
      error_handler.setError('2-07', None, None, "views/errors.py:getError - Failed to find error matching the id, returning 404 to user.", request)

   try:
      jsonData = jsonify(output = output)
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-05', None, g.user.id, "views/errors.py:getError - Type Error exception, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500

@portal_errors.route('/error/<errorID>', methods = ['GET'])
@cors.crossdomain(origin='*')
def getError(errorID):
   output = {}
   
   if errorID is not None:
      error = Errors.query.filter(errorID == Errors.id).first()
      if error is not None:
         output = errorToJSON(error)
         output['status'] = '200'
      else:
         output['error'] = 'Failed to find an error matching the id'
         output['status'] = '404'
         error_handler.setError('2-07', None, None, "views/errors.py:getError - Failed to find error matching the id, returning 404 to user.", request)

   try:
      jsonData = jsonify(output = output)
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      error_handler.setError('2-05', None, g.user.id, "views/errors.py:getError - Type Error exception, returning 500 to user. Exception %s" % e, request)
      abort(500) # If we fail to jsonify the data return 500


@portal_errors.route('/error', methods = ['POST'])      
def setError():
   error_code = request.values.get('error_code', None)
   state = request.values.get('state', None)
   user_id = -1
   if g.user is not None:
      user_id = g.user.id

   details = request.values.get('details', None)
   
   output = {}
   
   if error_code is None:
      output['message'] = 'failed to store errors, error code was not provided'
      output['status'] = '404'
   else:
      error_handler.setError(error_code, state, user_id, details, request)

      output['message'] = 'error stored'
      output['status'] = '200'
   
   try:
      jsonData = jsonify(output = output)
      return jsonData
   except TypeError as e:
      g.error = "Request aborted, exception encountered: %s" % e
      abort(500) # If we fail to jsonify the data return 500


def errorToJSON(error):
   output = {}
   output['id'] = error.id
   output['error_code'] = error.error_code
   output['state_id'] = error.state_id
   output['user_id'] = error.user_id
   output['date_time'] = str(error.date_time)
   output['ip_address'] = str(error.ip_address)
   output['details'] = error.details
   return output
