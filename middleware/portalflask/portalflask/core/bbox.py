class Bbox:
   def __init__(self, lon1, lat1, lon2, lat2):
      self._bottomLeft = Point(lon1, lat1)
      self._topRight = Point(lon2, lat2)
      self._topLeft = Point(lon1, lat2)
      self._bottomRight = Point(lon2, lat1)
      
   def getBottomLeft(self):
      return self._bottomLeft
   
   def getTopLeft(self):
      return self._topLeft
   
   def getBottomRight(self):
      return self._bottomRight
   
   def getTopRight(self):
      return self._topRight