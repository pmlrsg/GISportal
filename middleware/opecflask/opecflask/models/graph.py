from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from database import Base
from opecflask import app
import hashlib
import datetime

class Graph(Base):
   __tablename__ = 'graph'
   id = Column(Integer, index=True, primary_key=True)
   user_id = Column(Integer, ForeignKey('user.id'))
   graph = Column(String, unique=False)
   version = Column(Float, unique=False)
   retrievals = Column(Integer, unique=False)
   last_used = Column(DateTime, unique=False)
   checksum = Column(String, unique=False)

   def __init__(self, user_id=None, graph=None):  
      self.user_id = user_id   
      self.graph = graph
      self.version = app.config['API_VERSION']
      self.retrievals = 0
      self.last_used = datetime.datetime.now()
      
      m = hashlib.md5()
      m.update(self.graph + self.version)
      self.checksum = m.hexdigest()

   def __repr__(self):
      return '<State ID %r>' % (self.id)