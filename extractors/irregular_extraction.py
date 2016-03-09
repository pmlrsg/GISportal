from ..extraction_utils import create_mask
from . import Extractor
from ..extraction_utils import WCSRawHelper, basic
import tempfile
import uuid
from ..analysis_types import BasicStats


class IrregularExtractor(Extractor):
	"""docstring for IrregularExtractor"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None, masking_polygon=None):
		super(IrregularExtractor, self).__init__(wcs_url, extract_dates, extract_area, extract_variable)
		
		self.masking_polygon = masking_polygon

	def getData(self):
		print self.wcs_url
		wcs_extractor = WCSRawHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area)
		data = wcs_extractor.getData()
		fname = self.outdir+str(uuid.uuid4())+".nc"
		with open(fname, 'w') as outfile:
			outfile.write(data.read())
		mask, data,_,_ = create_mask(self.masking_polygon,fname,self.extract_variable)
		#return basic(data, self.extract_variable,  filename=fname)
		return fname


