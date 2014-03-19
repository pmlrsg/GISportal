import sys
import os
# This path needs changing according to local server configuration
path = os.path.dirname(__file__)
sys.path.insert(0, path)
from portalflask import app as application
