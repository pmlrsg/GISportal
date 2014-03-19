from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from database import Base
from portalflask import app
import datetime

class LayerGroup(Base):
   __tablename__ = 'layer_group'
   id = Column(Integer, index=True, primary_key=True)
   user_id = Column(Integer, ForeignKey('user.id'))
   layer_group = Column(String, unique=False)
   version = Column(Float, unique=False)
   last_used = Column(DateTime, unique=False)

   def __init__(self, user_id=None, layer_group=None):  
      self.user_id = user_id
      self.layer_group = layer_group
      self.version = app.config['API_VERSION']
      self.last_used = datetime.datetime.now()

   def __repr__(self):
      return '<State ID %r>' % (self.id)