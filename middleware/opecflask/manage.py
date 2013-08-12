from flask_script import Command, Manager
from flask_sqlalchemy import SQLAlchemy

import sys
# This path needs changing according to local server configuration
path = '/var/www/html/rbb/opecvis/middleware/opecflask'
sys.path.insert(0, path)
from opecflask import app

manager = Manager(app)
      
class SyncDB(Command):
   def run(self):
      print 'Creating database'
      from opecflask.models.database import init_db
      init_db()
      print 'Database created'
      
      
manager.add_command('syncdb', SyncDB())
manager.run()