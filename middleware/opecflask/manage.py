from flask_script import Command, Manager
from flask_sqlalchemy import SQLAlchemy
from opecflask import create_app
app, db = create_app(path='/var/www/html/rbb/opecvis/middleware/opecflask/opecflask')

manager = Manager(app)
      
class SyncDB(Command):
   def run(self):
      print 'Creating database'
      from opecflask.models.database import init_db
      print 'Database created'
      init_db()
      
manager.add_command('syncdb', SyncDB())
manager.run()