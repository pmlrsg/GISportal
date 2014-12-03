#!/usr/bin/env python

from flask_script import Command, Manager
from flask_sqlalchemy import SQLAlchemy

import sys
import os
# This path needs changing according to local server configuration
path = os.path.dirname(__file__)
sys.path.insert(0, path)
from portalflask import app

manager = Manager(app)
      
class SyncDB(Command):
   def run(self):
      print 'Creating database'
      from portalflask.models.database import init_db
      init_db()
      print 'Database created'
      
      
manager.add_command('syncdb', SyncDB())
manager.run()
