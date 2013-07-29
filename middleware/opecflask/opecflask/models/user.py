from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship, backref
from database import Base

class User(Base):
   __tablename__ = 'user'
   id = Column(Integer, primary_key=True)
   email = Column(String(120), unique=False)
   states = relationship('State', backref=backref('user', lazy='joined'), lazy='dynamic')

   def __init__(self, email=None):     
      self.email = email

   def __repr__(self):
      return '<State ID %r>' % (self.id)