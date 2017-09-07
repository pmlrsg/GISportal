from . import Extractor
from extraction_utils import WCSHelper, WCSRawHelper
import tempfile
import uuid
import time
import os
import json
from extraction_utils import sizeof_fmt


class SingleExtractor(Extractor):
	"""docstring for BasicExtractor"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None, extract_depth=None, outdir="/tmp/"):
		super(SingleExtractor, self).__init__(wcs_url, extract_dates,  extract_area=extract_area, extract_variable=extract_variable, extract_depth=extract_depth, outdir=outdir)
		


	def getData(self):
		#print "="*20
		#print self.extract_dates
		start_time = time.time()
		wcs_extractor = WCSRawHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area, self.extract_depth,single=True)
		data = wcs_extractor.getData()
		fname = self.outdir+str(uuid.uuid4())+".nc"
		with open(fname, 'w') as outfile:
			outfile.write(data.read())
		stop_time = time.time()
		ret = {}
		ret['time_diff'] = stop_time - start_time
		ret['file_size'] = os.stat(fname).st_size
		return json.dumps(ret)