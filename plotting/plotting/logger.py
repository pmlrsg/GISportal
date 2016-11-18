from datetime import datetime, date
import os
import errno

log_dir = ""
plot_hash = ""
plot_type = ""

num_points = 0

def log_complete(successful):
   if log_dir:
      make_sure_path_exists(log_dir)
      _datetime = datetime.now().isoformat()
      _date = date.today().isoformat()
      if successful:
         status = "complete"
      else:
         status = "failed"
      line = ",".join(map(str, [_datetime, plot_hash, status, num_points])) + "\n"
      with open (log_dir + "/" + _date + ".csv", "a") as f:
         f.write(line)

def make_sure_path_exists(path):
   try:
      os.makedirs(path)
   except OSError as exception:
      if exception.errno != errno.EEXIST:
         raise
