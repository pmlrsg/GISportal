class Param:
   def __init__(self, name, optional, neededInUrl, value):
      self._name = name
      self._optional = optional
      self._neededInUrl = neededInUrl
      self._value = value
   
   @property   
   def value(self):
      return self._value
   
   @value.getter
   def value(self):
      return self._value
   
   @value.setter
   def value(self, value):
      self._value = value
      
   def isOptional(self):
      return self._optional
   
   def neededInUrl(self):
      return self._neededInUrl
   
   def getName(self):
      return self._name