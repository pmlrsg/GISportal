import argparse



parser = argparse.ArgumentParser()
parser.add_argument("-t", "--type", action="store", dest="extract_type", help="Extraction type to perform", required=True, choices=["basic","irregular","trans-lat","trans-long","trans-time"])
parser.add_argument("-o", "--output", action="store", dest="output", help="Choose the output type (only json is currently available)", required=False, choices=["json"], default="json")
parser.add_argument("-url", "--wcs_url", action="store", dest="wcs_url", help="The URL of the Web Coverage Service to get data from", required=False)
parser.add_argument("-var", "--variable", action="store", dest="wcs_variable", help="The variable/coverage to request from WCS", required=False)
parser.add_argument("-v", "--debug", action="store_true", dest="debug", help="a debug flag - if passed there will be a tonne of log output and all interim files will be saved", required=False)
parser.add_argument("-d", "--depth", action="store", dest="depth", help="an optional depth parameter for sending to WCS", required=False, default=0)
parser.add_argument("-g", "--geom", action="store", dest="geom", help="A string representation of teh polygon to extract", required=False, default="POLYGON((-28.125 43.418,-19.512 43.77,-18.809 34.453,-27.07 34.629,-28.125 43.418))")
parser.add_argument("-time", action="store", dest="time", help="A time string for in the format startdate/enddate or a single date", required=False)
args = parser.parse_args()

print args

print args.extract_type