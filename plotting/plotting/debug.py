from __future__ import print_function
import sys

# Set the default logging verbosity to lowest.
verbosity = 0

def debug(level, msg):
   if verbosity >= level:
      print(msg, file=sys.stderr)
#END debug
