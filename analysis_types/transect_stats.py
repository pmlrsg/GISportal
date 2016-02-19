import netCDF4 as netCDF
from extraction_utils import basic, getCsvDict
import json
import csv

class TransectStats(object):
	"""docstring for TransectStats"""
	def __init__(self, filename, variable, _csv):
		super(TransectStats, self).__init__()
		self.filename = filename
		self.variable = variable
		self._csv = _csv
		

	def process(self):
		print "running basic processing on %s" % self.filename
		with open(self._csv, "rb") as csvfile:
			data = csv.DictReader(csvfile, delimiter=',')
			for row in data:
				print "getting data from %f %f for %s" % (float(row['Lat']), float(row['Lon']), row['Date'])
		netcdf_file = netCDF.Dataset(self.filename, "r")
		return data


		#netcdf_variable = netcdf_file[variable]





		