from flask import Flask, abort, make_response, g
from flask_sqlalchemy import SQLAlchemy
from models.database import session
import settings as settings

db = SQLAlchemy()

def create_app(path):
   app = Flask(__name__, instance_path=path)
   print path
   
   if settings.LOG_PATH != None:
      if len(settings.LOG_PATH) == 0:
         settings.LOG_PATH = path
           
      try:  
         import logging
         import os
         from logging.handlers import RotatingFileHandler
      
         if settings.LOG_PATH and len(settings.LOG_PATH) != 0 and os.path.exists(settings.LOG_PATH):
            f_handler = RotatingFileHandler(os.path.join(settings.LOG_PATH, 'python-flask.log'))
         else:
            f_handler = RotatingFileHandler(os.path.join(app.instance_path, 'python-flask.log'))
            
         f_handler.setLevel(logging.DEBUG)
         f_handler.setFormatter(logging.Formatter(
             '[%(asctime)s] [%(levelname)s]: %(message)s '
             '[in %(filename)s:%(lineno)d]'
         ))
         app.logger.addHandler(f_handler)
         app.logger.setLevel(settings.LOG_LEVEL)
      except:
         print 'Failed to setup logging'
   
   app.config.from_object(settings)
   app.logger.debug("In debug mode: %s" % app.debug)
   
   # setup database
   app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + path + '/opecflask/states.db'
   db.init_app(app)
   
   # register application views and blueprints  
   from opecflask.urls import routes, setup_routing, setupBlueprints
   #setup_routing(app, routes)
   setupBlueprints(app)
   
   @app.errorhandler(400)
   def badRequest(error):
      if hasattr(g, 'error'):
         resp = make_response(g.error, 400)
         resp.headers['MESSAGE'] = g.error
         return resp
      else:
         resp = make_response("Bad request", 400)
         resp.headers['MESSAGE'] = "Bad request"
         return resp

   @app.teardown_appcontext
   def shutdown_session(exception=None):
       session.remove()
         
   #@app.teardown_appcontext
   #def close_connection(exception):
       #db = getattr(g, '_database', None)
       #if db is not None:
           #db.close()
   
   return app, db          