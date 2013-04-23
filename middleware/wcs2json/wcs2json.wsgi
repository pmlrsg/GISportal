import sys
# This path needs changing according to local server configuration
sys.path.insert(0, '/home/rsgadmin/portal.marineopec.eu/opecvisalpha/middleware/wcs2json')
from wcs2json import create_app
application = create_app()
