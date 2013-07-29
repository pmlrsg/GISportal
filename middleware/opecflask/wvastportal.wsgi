import sys
# This path needs changing according to local server configuration
path = '/var/www/html/rbb/opecvis/middleware/opecflask'
sys.path.insert(0, path)
from opecflask import create_app
application, db = create_app(path)
