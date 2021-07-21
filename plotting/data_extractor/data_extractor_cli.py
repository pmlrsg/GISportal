"""	
A data extraction tool.

Designed to work with fetching data from a Web Coverage Service.  It will then extract either :

simple polygon extraction (simple) - extracts data from within a regular polygon per time slice, runs summary stats (min,max,mean,median,std) and returns json object per time step

irregular polygon extraction (irregular) - same as simple polygon but takes a complex user defined polygon

transect latitude extraction (trans-lat) - extracts data from a POLYLINE, then returns stats moving along the latitude axis

transect longitude extraction (trans-long) - extracts data from a POLYLINE, then returns stats moving along the latitude axis

transect time extraction (trans-time) - extracts data from a POLYLINE, then returns stats moving along a time axis

example wcs url : http://rsg.pml.ac.uk/thredds/wcs/CCI_ALL-v2.0-MONTHLY?service=WCS&version=1.0.0&request=GetCapabilities

example calling : python data_extractor.py -t basic -g "POLYGON((-28.125 43.418,-19.512 43.77,-18.809 34.453,-27.07 34.629,-28.125 43.418))" -url http://rsg.pml.ac.uk/thredds/wcs/CCI_ALL-v2.0-MONTHLY -var chlor_a -time 2010-01-01/2011-01-01

example hovmoller : python data_extractor.py -t hovmoller  -29.883,27.334,-23.027,33.486" -url http://rsg.pml.ac.uk/thredds/wcs/CCI_ALL-v2.0-MONTHLY -var chlor_a -xvar Lon -yvar Time -time 2010-01-01/2010-03-01 | python -m json.tool


test extraction where polygon is wholy larger than coverage

https://vortices.npm.ac.uk/thredds/wcs/deltares/aet-pet/MOD16_AET_corr_monthly_2000_2013.nc

AET

166.41782422566678</westBoundLongitude><eastBoundLongitude>178.58449089233343</eastBoundLongitude><southBoundLatitude>-47.296123669666635</southBoundLatitude><northBoundLatitude>-34.12112366966664


"""
import logging
logging.basicConfig(filename='data_extractor.log', level=logging.DEBUG, format='%(asctime)s %(message)s', datefmt='%m/%d/%Y %I:%M:%S %p')

logging.info("test")


from datetime import datetime
import argparse
from extractors.basic_extraction import BasicExtractor 
from extractors.irregular_extraction import IrregularExtractor 
from extractors.transect_extraction import TransectExtractor 
from extractors.single_test_extraction import SingleExtractor 
from extractors.scatter_extraction import ScatterExtractor
from extractors import basic_extraction_wfs
from extraction_utils.debug import Debug 
from extraction_utils.transect_utils import get_transect_bounds, get_transect_times
from analysis_types.basic_stats import BasicStats
from analysis_types.transect_stats import TransectStats
from analysis_types.hovmoller_stats import HovmollerStats 
from analysis_types.scatter_stats import ScatterStats
from shapely import wkt
import json
import time as _time
import ast


def main():

	logging.info("main started running")

	usage = "a usage string" 

	parser = argparse.ArgumentParser(description=usage)
	parser.add_argument("-t", "--type", action="store", dest="extract_type", help="Extraction type to perform", required=True, choices=["file","scatter","single","basic","irregular","trans-lat","trans-long","trans-time", "hovmoller","WFS"])
	parser.add_argument("-o", "--output", action="store", dest="output", help="Choose the output type (only json is currently available)", required=False, choices=["json"], default="json")
	parser.add_argument("-url", "--wcs_url", action="store", nargs="+",dest="wcs_url", help="The URL of the Web Coverage Service to get data from", required=True)
	parser.add_argument("-var", "--variable", action="store", nargs="+",dest="wcs_variable", help="The variable/coverage to request from WCS", required=True)
	parser.add_argument("-v", "--debug", action="store_true", dest="debug", help="a debug flag - if passed there will be a tonne of log output and all interim files will be saved", required=False)
	parser.add_argument("-d", "--depth", action="store", dest="depth", help="an optional depth parameter for sending to WCS", required=False, default=None)
	parser.add_argument("-g", "--geom", action="store", dest="geom", help="A string representation of teh polygon to extract", required=False)#, default="POLYGON((-28.125 43.418,-19.512 43.77,-18.809 34.453,-27.07 34.629,-28.125 43.418))")
	parser.add_argument("-b", "--bbox", action="store", dest="bbox", help="A string representation of teh polygon to extract", required=False)
	parser.add_argument("-time", action="store", dest="time", help="A time string for in the format startdate/enddate or a single date", required=False)
	parser.add_argument("-mask", action="store", dest="mask", help="a polygon representing teh irregular area", required=False)
	parser.add_argument("-csv", action="store", dest="csv", help="a csv file with lat,lon,date for use in transect extraction", required=False)
	parser.add_argument("-xvar", action="store", dest="xvar", help="x axis variable for hovmoller plot")
	parser.add_argument("-yvar", action="store", dest="yvar", help="y axis vairable for hovmoller plot")
	parser.add_argument("-dest" , action="store", dest="dest", help="location to save an extracted file in")

	args = parser.parse_args()

	#print args.debug
	#print args.wcs_variable
	debug = Debug(args.debug)
	debug.log("a message to test debugging")
	irregular = False
	if(args.geom):
		#print "geom found - generating bbox"
		bbox = wkt.loads(args.geom).bounds
		irregular = True
		#print bbox
	if(args.bbox):
		bbox = [args.bbox]



	if (args.extract_type == "basic"):
		if irregular:
			extractor = IrregularExtractor(str(args.wcs_url[0]), [args.time], extract_area=bbox, extract_variable=str(args.wcs_variable[0]), masking_polygon=args.geom)
			filename = extractor.getData() 
		else:
			extractor = BasicExtractor(args.wcs_url[0], [args.time], extract_area=bbox, extract_variable=args.wcs_variable[0])
			filename = extractor.getData()
		stats = BasicStats(filename, args.wcs_variable[0])
		output_data = stats.process()
	elif (args.extract_type=="file"):
		extractor = IrregularExtractor(str(args.wcs_url[0]), [args.time], extract_area=bbox, extract_variable=str(args.wcs_variable[0]), extract_depth=args.depth,masking_polygon=args.geom)
		filename = extractor.getData(dest=args.dest)
		output_data = filename
	elif (args.extract_type == "image"):
		extractor = BasicExtractor(args.wcs_url, [args.time], extract_area=bbox, extract_variable=args.wcs_variable[0])
		filename = extractor.getData()
		image_data = ImageStats(filename, args.wcs_variable[0])
		output_data = image_data.process()
		pass
	elif (args.extract_type == 'scatter'):
		# scatter extractor returns a dict {var : netcdf, var2: netcdf2}
		extractor = ScatterExtractor(args.wcs_url[0],args.wcs_url[1], [args.time], extract_area=bbox, extract_variable=args.wcs_variable[0], extract_variable_2=args.wcs_variable[1] )
		filenames = extractor.getData()
		stats = ScatterStats(filenames)
		output_data =  json.dumps(stats.process())
		#are_times_same = are_time_axis_the_same(filenames)
		#print are_times_same
		#print filenames
	elif (args.extract_type == "irregular"):
		extractor = IrregularExtractor(str(args.wcs_url[0]), [args.time], extract_area=bbox, extract_variable=str(args.wcs_variable[0]), masking_polygon=args.geom)
		filename = output_data = extractor.getData()
		stats = filename
	elif (args.extract_type == "trans-lat"):
		extractor = TransectExtractor(args.wcs_url, [args.time], "latitude",  extract_area=bbox, extract_variable=str(args.wcs_variable[0]))
		filename = extractor.getData()
		#print filename
	elif (args.extract_type == "trans-long"):
		extractor = TransectExtractor(args.wcs_url, ["2011-01-01", "2012-01-01"], "longitude", extract_area=bbox, extract_variable=str(args.wcs_variable[0]))
		filename = extractor.getData()
	elif (args.extract_type == "trans-time"):
		# we will accept csv here so we need to grab teh lat lons and dates for use within teh extractor below
		#csv = open(args.csv, "r").read()
		start_time = _time.time()

		bbox = get_transect_bounds(args.csv)
		time = get_transect_times(args.csv)
		extractor = TransectExtractor(args.wcs_url[0], [time], "time", extract_area=bbox, extract_variable=str(args.wcs_variable[0]))
		filename = extractor.getData()
		middle_time = _time.time()

		stats = TransectStats(filename, args.wcs_variable[0], args.csv)
		output_data = stats.process()
		output_metadata = extractor.metadataBlock()
		output = {}
		output['metadata'] = output_metadata
		output['data'] = output_data
		output_data = json.dumps(output)

		after_stats = _time.time()
	elif (args.extract_type == "single"):
		extractor = SingleExtractor(args.wcs_url[0], args.time, extract_area=bbox, extract_variable=str(args.wcs_variable[0]), extract_depth=args.depth)
		output_data = extractor.getData()
	elif (args.extract_type == "hovmoller"):
		extractor = BasicExtractor(args.wcs_url, [args.time], extract_area=bbox, extract_variable=str(args.wcs_variable[0]))
		filename = extractor.getData()
		stats = HovmollerStats(filename, args.xvar, args.yvar, args.wcs_variable)
		output_data = stats.process()

	elif (args.extract_type == "WFS"):
		#we could just get the variable name like args.wcs_variable[0][1] or something, if we're passing two things
		wfs_url = args.wcs_url[0]
		bbox = args.bbox
		print(args.wcs_variable)
		extract_feature = args.wcs_variable[0].replace(",", "")
		feature_variable = args.wcs_variable[2].replace(",", "")
		datetime_property = args.wcs_variable[1]
		extractor = basic_extraction_wfs.BasicExtractorWFS(wfs_url, extract_area=bbox, extract_variable=extract_feature, feature_variable=feature_variable)
		print("extractor", extractor)
		filename = extractor.getData()
		print("filename", filename)
		stats = BasicStats(filename, extract_feature, feature_variable, datetime_property)
		output_data = stats.processWFS()
		print(output_data)

	else :
		raise ValueError('extract type not recognised! must be one of ["basic","irregular","trans-lat","trans-long","trans-time"]')

	#print "finished"
	#print output_data
	#print middle_time - start_time
	#print after_stats - middle_time









if __name__ == '__main__':
	main()