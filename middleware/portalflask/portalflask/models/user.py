from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref
from database import Base
import datetime

class User(Base):
   __tablename__ = 'user'
   id = Column(Integer, index=True, primary_key=True)
   email = Column(String(120), index=True, unique=True)
   openid = Column(String(200), index=True, unique=True)
   last_login = Column(DateTime, unique=False)
   
   states = relationship('State', backref=backref('user', lazy='joined'), lazy='dynamic')
   graphs = relationship('Graph', backref=backref('user', lazy='joined'), lazy='dynamic')
   quickregions = relationship('QuickRegions', uselist=False, backref=backref('user', lazy='joined'))
   roi = relationship('ROI', backref=backref('user', lazy='joined'), lazy='dynamic')
   layergroups = relationship('LayerGroup', backref=backref('user', lazy='joined'), lazy='dynamic')

   def __init__(self, email=None, openid=None):     
      self.email = email
      self.openid = openid
      self.last_login = datetime.datetime.now()

   def __repr__(self):
      return '<State ID %r>' % (self.id)