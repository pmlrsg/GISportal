import sys
import os
path = os.path.dirname(__file__)
sys.path.insert(0, path)
from portalflask import app as application
