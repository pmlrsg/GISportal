from extraction_utils import create_mask
from . import Extractor
from extraction_utils import WCSRawHelper, basic
import tempfile
import uuid
from analysis_types import BasicStats


class IrregularExtractor(Extractor):
	"""docstring for IrregularExtractor"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None, extract_depth=None, masking_polygon=None, outdir="/tmp"):
		super(IrregularExtractor, self).__init__(wcs_url, extract_dates, extract_area=extract_area, extract_variable=extract_variable,extract_depth=extract_depth, outdir=outdir)
		
		self.masking_polygon = masking_polygon

	def getData(self, dest=None):
		#print self.wcs_url
		wcs_extractor = WCSRawHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area, self.extract_depth)
		data = wcs_extractor.getData()
		uuid_filename = str(uuid.uuid4())+".nc"
		if dest:
			fname = dest+uuid_filename
		else:
			fname = self.outdir+uuid_filename
		with open(fname, 'w') as outfile:
			outfile.write(data.read())
		mask, data,_,_ = create_mask(self.masking_polygon,fname,self.extract_variable)
		#return basic(data, self.extract_variable,  filename=fname)
		if dest:
			return uuid_filename
		return fname


