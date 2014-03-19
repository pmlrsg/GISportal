from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from database import Base
from portalflask import app
import datetime

class Errors(Base):
   __tablename__ = 'errors'
   id = Column(Integer, index=True, primary_key=True)
   error_code = Column(String, unique=False)
   state_id = Column(Integer, ForeignKey('state.id'))
   user_id = Column(Integer, ForeignKey('user.id'))
   date_time = Column(DateTime, unique=False)
   ip_address = Column(String, unique=False)
   details = Column(Text, unique=False)

   def __init__(self, error_code=None, state_id=None, user_id=None, ip_address=None, details=None):  
      self.error_code = error_code
      self.state_id = state_id
      self.user_id = user_id   
      self.date_time = datetime.datetime.now()
      self.ip_address = ip_address
      self.details = details

   def __repr__(self):
      return '<Error ID %r>' % (self.id)
