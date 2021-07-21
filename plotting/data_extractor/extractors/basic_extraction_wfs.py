from extraction_utils.wfs_raw_extraction import WFSRawHelper
from extractors import extractor
#from extraction_utils import WFSRawHelper
import tempfile
import uuid

class BasicExtractorWFS(extractor.Extractor):
	"""docstring for BasicExtractor"""
	def __init__(self, wcs_url, extract_area=None, extract_variable=None, feature_variable=None, outdir="/tmp"):
		super(BasicExtractorWFS, self).__init__(wcs_url,  extract_area=extract_area, extract_variable=extract_variable, feature_variable=feature_variable, outdir=outdir)
		
	def getData(self):
		wfs_extractor = WFSRawHelper(self.wcs_url, self.extract_variable, self.feature_variable, self.extract_area)
		print("wfs_extractor", wfs_extractor)
		data = wfs_extractor.getData()
		#print("data from wfs_extractor", data)
		#for line in data:
		#	print(line)
		fname = self.outdir+str(uuid.uuid4())+".json"
		print("fname", fname)
		with open(fname, 'w') as outfile:
			outfile.write(data.read().decode("utf-8"))
		return fname