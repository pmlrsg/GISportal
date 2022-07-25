import csv
import datetime


def get_transect_bounds(_csv):
	#print _csv
	with open(_csv, "rb") as csvfile:
		data = csv.DictReader(csvfile, delimiter=',')
		lats = []
		lons = []
		for row in data:
			lats.append(float(row['Latitude']))
			lons.append(float(row['Longitude']))
	#print (min(lons),min(lats),max(lons),max(lats))
	return (min(lons),min(lats),max(lons),max(lats))


def get_transect_times(_csv):
	with open(_csv, "rb") as csvfile:
		data = csv.DictReader(csvfile, delimiter=',')
		dates = []
		for row in data:
			date = row['Date']
			try:
				dates.append(datetime.datetime.strptime(date, '%d/%m/%Y %H:%M:%S'))
			except ValueError:
				try:
					dates.append(datetime.datetime.strptime(date, '%d/%m/%Y %H:%M'))
				except ValueError:
					dates.append(datetime.datetime.strptime(date, "%d/%m/%Y"))
	return "%s/%s" % (min(dates), max(dates))

def getCsvDict(_csv):
	ret = {}
	ret['Lat'] = []
	ret['Lon'] = []
	ret['Date'] = []
	with open(_csv, "rb") as csvfile:
		data = csv.DictReader(csvfile, delimiter=',')
		for row in data:
			for key in row:
				
				ret[key].append(row[key])
	#print ret
	return ret