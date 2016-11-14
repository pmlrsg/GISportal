import json
from plotting.debug import debug

# Home rolled enums as Python 2.7 does not have them.
class Enum(set):
   def __getattr__(self, name):
      if name in self:
         return name
      raise AttributeError

# Valid plot status values.
Plot_status = Enum(["initialising", "extracting", "plotting", "complete", "failed"])

def read_status(dirname, my_hash):
   '''
      Reads a JSON status file whose name is defined by dirname and my_hash.
   '''

   status = None
   file_path = dirname + "/" + my_hash + "-status.json"
   try:
      with open(file_path, 'r') as status_file:
         status = json.load(status_file)
   except IOError as err:
      if err.errno == 2:
         debug(2, u"Status file {} not found".format(file_path))
      else:
         raise

   return status
# END read_status


def update_status(dirname, my_hash, plot_status, message="", percentage=0, traceback="", base_url="", minutes_remaining=-1):
   '''
      Updates a JSON status file whose name is defined by dirname and my_hash.
   '''

   initial_status = dict(
      percentage = 0,
      state = plot_status,
      message = message,
      completed = False,
      traceback= traceback,
      job_id = my_hash,
      minutes_remaining = -1
   )

   # Read status file, create if not there.
   file_path = dirname + "/" + my_hash + "-status.json"
   try:
      with open(file_path, 'r') as status_file:
         if plot_status == Plot_status.initialising:
            status = initial_status
         else:
            status = json.load(status_file)
   except IOError as err:
      if err.errno == 2:
         debug(2, u"Status file {} not found".format(file_path))
         # It does not exist yet so create the initial JSON
         status = initial_status
      else:
         raise

   # Update the status information.
   status["message"] = message
   status["traceback"] = traceback
   status["state"] = plot_status
   status['percentage'] = percentage
   status['minutes_remaining'] = minutes_remaining
   if plot_status == Plot_status.complete:
      status["completed"] = True
      status['filename'] = dirname + "/" + my_hash + "-plot.html"
      status['csv'] = dirname + "/" + my_hash + ".zip"
      if base_url:
         status['csv_url'] = base_url + "/" + my_hash + ".zip"
   elif plot_status == Plot_status.failed:
      status["completed"] = True
      status['filename'] = None
      status['csv'] = None
   else:
      status["completed"] = False
      status['filename'] = None
      status['csv'] = None

   debug(4, u"Status: {}".format(status))

   # Write it back to the file.
   with open(file_path, 'w') as status_file:
      json.dump(status, status_file)

   return status
# END update_status
