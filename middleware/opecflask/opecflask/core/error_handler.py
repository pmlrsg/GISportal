from flask import Blueprint, abort, request, jsonify, g, current_app
from opecflask.models.database import db_session
from opecflask.models.user import User
from opecflask.models.state import State
from opecflask.models.errors import Errors
import opecflask.settings as settings
import sqlite3 as sqlite

def setError(error_code, state, user_id, details, request):

   # These warning codes are errors that may not need to 
   # be added the the database, depending on the error
   # logging level
   warning_codes = ['1-03', '1-04', '2-03', '2-05']

   if settings.ERROR_LEVEL is not "W" and error_code in warning_codes:
      return
      
   state_id = None
   if state is not None:
      s = State(-1, state)
      db_session.add(s)
      db_session.commit()
      state_id = s.id

   ip_address = request.remote_addr

   if error_code is not None:
      e = Errors(error_code, state_id, user_id, ip_address, details)
      db_session.add(e)
      db_session.commit()
