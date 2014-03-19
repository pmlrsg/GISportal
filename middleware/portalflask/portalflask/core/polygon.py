class Polygon(Mask):
   def __init__(self, points = None, commaSeparatedPoints = None):
      if points != None:
         self._poly = points
      
      if commaSeparatedPoints != None:
         points = []
         values = commaSeparatedPoints.value.split(',')
         [points.append(Point(values[i], values[i+1])) for i in range(0, len(values), 2)]
         self._poly = points
      
      if points == None and commaSeparatedPoints == None:
         #TODO: Throw developer error
         pass
      
      super(Polygon, self).__init__(createBbox(self._poly))
   
   def getPolygonAsTupleList(self):
      listToReturn = []
      for point in self._poly:
         listToReturn.append((point.getLon(), point.getLat()))
         
      return listToReturn
   
   def createBbox(self, points):
      minLon = None
      maxLon = None
      minLat = None
      maxLat = None
      
      for point in point:
         if minLon == None:
            minLon = point.getLon()
         elif point.getLon() < minLon:
            minLon = point.getLon()
            
         if maxLon == None:
            maxLon = point.getLon()
         elif point.getLon() > maxLon:
            maxLon = point.getLon()
            
         if minLat == None:
            minLat = point.getLat()
         elif point.getLat() < minLat:
            minLat = point.getLat()
            
         if maxLat == None:
            maxLat = point.getLat()
         elif point.getLat() > maxLat:
            maxLat = point.getLat()
            
      return Bbox(minLon, minLat, maxLon, maxLat)
           
   def pointInMask(self, point, poly=None):
      if poly == None:
         poly = self.getPolygonAsTupleList()
      
      x = point.getLon()
      y = point.getLat()
      
      # check if point is a vertex
      if (x,y) in poly: return True
   
      # check if point is on a boundary
      for i in range(len(poly)):
         p1 = None
         p2 = None
         if i == 0:
            p1 = poly[0]
            p2 = poly[1]
         else:
            p1 = poly[i - 1]
            p2 = poly[i]
         if p1[1] == p2[1] and p1[1] == y and x > min(p1[0], p2[0]) and x < max(p1[0], p2[0]):
            return "True"
         
      n = len(poly)
      inside = False
   
      p1x,p1y = poly[0]
      for i in range(n+1):
         p2x,p2y = poly[i % n]
         if y > min(p1y,p2y):
            if y <= max(p1y,p2y):
               if x <= max(p1x,p2x):
                  if p1y != p2y:
                     xints = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
                  if p1x == p2x or x <= xints:
                     inside = not inside
         p1x,p1y = p2x,p2y
         
      return inside