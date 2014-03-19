from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from database import Base
from portalflask import app
import hashlib
import datetime

class State(Base):
   __tablename__ = 'state'
   id = Column(Integer, index=True, primary_key=True)
   user_id = Column(Integer, ForeignKey('user.id'))
   state = Column(String, unique=False)
   version = Column(Float, unique=False)
   views = Column(Integer, unique=False)
   last_used = Column(DateTime, unique=False)
   checksum = Column(String, unique=False)

   def __init__(self, user_id=None, state=None):  
      self.user_id = user_id   
      self.state = state
      self.version = app.config['API_VERSION']
      self.views = 0
      self.last_used = datetime.datetime.now()
      
      m = hashlib.md5()
      m.update(self.state + self.version)
      self.checksum = m.hexdigest()

   def __repr__(self):
      return '<State ID %r>' % (self.id)