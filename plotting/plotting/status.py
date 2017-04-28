import json
import time
from plotting.debug import debug


# Home rolled enums as Python 2.7 does not have them.
class Enum(set):
   def __getattr__(self, name):
      if name in self:
         return name
      raise AttributeError

# Valid plot status values.
Plot_status = Enum(["initialising", "extracting", "plotting", "complete", "failed"])


class StatusHandler(object):
   def __init__(self, dirname, plot_hash):
      self.dirname = dirname
      self.hash = plot_hash

   def read_status(self):
      '''
         Reads a JSON status file whose name is defined by dirname and hash.
      '''

      status = None
      file_path = self.dirname + "/" + self.hash + "-status.json"
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

   def update_status(self, plot_status, message="", percentage=0, traceback="", base_url="", minutes_remaining=-1):
      '''
         Updates a JSON status file whose name is defined by dirname and my_hash.
      '''

      initial_status = dict(
         percentage = 0,
         state = plot_status,
         message = message,
         completed = False,
         traceback= traceback,
         job_id = self.hash,
         minutes_remaining = -1
      )

      # Read status file, create if not there.
      file_path = self.dirname + "/" + self.hash + "-status.json"
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
      if plot_status == Plot_status.complete:
         status["completed"] = True
         status['percentage'] = 100
         status['minutes_remaining'] = 0
         status['filename'] = self.dirname + "/" + self.hash + "-plot.html"
         status['csv'] = self.dirname + "/" + self.hash + ".zip"
         if base_url:
            status['csv_url'] = base_url + "/" + self.hash + ".zip"
      elif plot_status == Plot_status.failed:
         status["completed"] = True
         status['percentage'] = 100
         status['minutes_remaining'] = 0
         status['filename'] = None
         status['csv'] = None
      else:
         status["completed"] = False
         status['percentage'] = percentage
         status['minutes_remaining'] = minutes_remaining
         status['filename'] = None
         status['csv'] = None

      debug(4, u"Status: {}".format(status))

      # Write it back to the file.
      with open(file_path, 'w') as status_file:
         json.dump(status, status_file)

      return status
   # END update_status


class ExtractionProgressTracker(object):
   def __init__(self, status_handler, num_series):
      self.status_handler = status_handler
      self.num_series = num_series
      self.current_series = 0

   def download_progress(self, progress, total_requests):
      starting_percentage = 94.0 / self.num_series * self.current_series + 1
      percentage = int(round(progress / float(total_requests) * 19 / self.num_series + starting_percentage))
      self.status_handler.update_status(Plot_status.extracting, percentage=percentage, message="{}%".format(percentage))
      debug(3, "Overall progress: {}%".format(percentage))

   def start_series_analysis(self, length):
      self.start_time = time.time()
      self.last_time = time.time()
      self.series_length = length

   def analysis_progress(self, progress):
      if time.time() > self.last_time + 5:
         self.last_time = time.time()
         starting_percentage = 94.0 / self.num_series * self.current_series + 1
         percentage = int(round((progress / float(self.series_length) * 75 + 19) / self.num_series + starting_percentage))
         debug(3, "Overall progress: {}%".format(percentage))
         if self.current_series == self.num_series - 1:
            total_seconds_remaining = int(round((time.time() - self.start_time) / progress * (self.series_length - progress)))
            minutes_remaining, seconds_remaining = divmod(total_seconds_remaining, 60)
            # minutes_remaining = int(round((time.time() - self.start_time) / progress * (self.series_length - progress) / 60))
            debug(3, "Remaining: {} mins".format(minutes_remaining))
         else:
            minutes_remaining = -1

         self.status_handler.update_status(Plot_status.extracting, percentage=percentage,
         minutes_remaining=minutes_remaining, message="{}%<br>approx {}m{:0>2d}s remaining".format(percentage, minutes_remaining, seconds_remaining))

      debug(5, "Extracting: {}%".format(round(progress / float(self.series_length) * 100, 3)))
