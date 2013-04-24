import sys
# This path needs changing according to local server configuration
path = '/var/www/html/rbb/opecvis/middleware/wcs2json'
sys.path.insert(0, path)
from wcs2json import create_app
application = create_app(path)
