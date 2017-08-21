from __future__ import print_function
import sys

# Set the default logging verbosity to lowest.
verbosity = 0
plot_hash = None

def debug(level, msg):
   if verbosity >= level:
      if plot_hash:
         print("{}: {}".format(plot_hash[:8], msg), file=sys.stderr)
      else:
         print(msg, file=sys.stderr)
#END debug
