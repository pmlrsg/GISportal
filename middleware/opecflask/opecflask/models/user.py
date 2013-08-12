from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship, backref
from database import Base
import datetime

class User(Base):
   __tablename__ = 'user'
   id = Column(Integer, index=True, unique=True)
   email = Column(String(120), primary_key=True)
   openid = Column(String(200), index=True, unique=True)
   last_login = Column(DateTime, unique=False)
   
   states = relationship('State', backref=backref('user'))
   graphs = relationship('Graph', backref=backref('user'))
   quickregions = relationship('QuickRegions', uselist=False, backref=backref('user'))
   roi = relationship('ROI', backref=backref('user'))

   def __init__(self, email=None, openid=None):     
      self.email = email
      self.openid = openid
      self.last_login = datetime.datetime.now()

   def __repr__(self):
      return '<State ID %r>' % (self.id)