class Point:
   def __init__(self, lon, lat):
      self._lat = lat
      self._lon = lon
      
   def getLat(self):
      return self._lat
   
   def getLon(self):
      return self._lon
   
   def getTuple(self):
      return (self.getLon(), self.getLat())