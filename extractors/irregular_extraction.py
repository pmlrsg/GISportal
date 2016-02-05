from extraction_utils import create_mask
from . import Extractor
from extraction_utils import WCSHelper, basic
import tempfile
import uuid
from analysis_types import BasicStats


class IrregularExtractor(Extractor):
	"""docstring for IrregularExtractor"""
	def __init__(self, wcs_url, extract_dates, extract_area=None, extract_variable=None, masking_polygon=None):
		super(IrregularExtractor, self).__init__(wcs_url, extract_dates, extract_area, extract_variable)
		
		self.masking_polygon = masking_polygon

	def getData(self):
		wcs_extractor = WCSHelper(self.wcs_url, self.extract_dates, self.extract_variable, self.extract_area)
		data = wcs_extractor.getData()
		fname = self.outdir+str(uuid.uuid4())+".nc"
		with open(fname, 'w') as outfile:
			outfile.write(data.read())
		mask, data,_,_ = create_mask(self.masking_polygon,fname,self.extract_variable)
		return basic(mask, self.extract_variable, irregular=True, original=data, filename=fname)


