from flask import Blueprint, abort, request, jsonify, g, current_app
from opecflask.models.database import db_session
from opecflask.models.user import User
from opecflask.models.state import State
from opecflask.models.errors import Errors
from opecflask.core import error_handler 
import sqlite3 as sqlite

portal_errors = Blueprint('portal_errors', __name__)

@portal_errors.route('/errors', methods = ['POST'])      
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
