#! /usr/bin/env python
  
"""
$Id$
Library to make a variety of plots.
Uses bokeh as the plotting engine.

Available functions
listPlots: Return a list of available plot types.
"""

from __future__ import print_function
import __builtin__
import sys
import traceback
import requests
import urllib2

from scipy import stats
import numpy as np
import pandas as pd
import json
import jinja2
import urllib
import os, hashlib
import time
import zipfile
import shutil

from bokeh.plotting import figure, save, show, output_notebook, output_file, ColumnDataSource, hplot, vplot
from bokeh.models import LinearColorMapper, NumeralTickFormatter,LinearAxis, Range1d, HoverTool, CrosshairTool
from bokeh.resources import CSSResources
from bokeh.embed import components

from shapely import wkt

import palettes

from data_extractor.extractors import BasicExtractor, IrregularExtractor, TransectExtractor, SingleExtractor
from data_extractor.extraction_utils import Debug, get_transect_bounds, get_transect_times
from data_extractor.analysis_types import BasicStats, TransectStats, HovmollerStats, ImageStats, ScatterStats


from math import log

# Set the default logging verbosity to lowest.
verbosity = 0

template = jinja2.Template("""
<!DOCTYPE html>
<html lang="en-US">

<body>
<div id="plot">
    {{ script }}
    
    {{ div }}
</div>
</body>

</html>
""")

hovmoller_template = jinja2.Template("""
<!DOCTYPE html>
<html lang="en-US">

<body>
{{ script }}
    {{ div }}

</body>

</html>
""")



# Just pick some random colours. Probably need to make this configurable.
plot_palette = [['#7570B3', 'blue', 'red', 'red'], ['#A0A0A0', 'green', 'orange', 'orange']]

# Home rolled enums as Python 2.7 does not have them.
class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError

# Valid plot status values.
Plot_status = Enum(["initialising", "extracting", "plotting", "complete", "failed"])

def get_palette(palette="rainbow"):
   def_palette = "rainbow"
   debug(2, "get_palette(palette={})".format(palette))
   colours = []
   try:
      my_palette = palettes.getPalette(palette)
   except KeyError:
      debug(1, "get_palette: Invalid palette name {}, replaced with {}".format(palette, def_palette))
      palette = def_palette
      my_palette = palettes.getPalette(palette)
   
   for i in range(0, len(my_palette), 4):
       colours.append("#{:02x}{:02x}{:02x}".format(my_palette[i], my_palette[i+1], my_palette[i+2]))
   
   debug(3, "get_palette: {})".format(colours))


   return(palette, colours, my_palette)
#END get_palette

def datetime(x):
   return np.array(pd.to_datetime(x).astype(np.int64) // 10**6)
   #return np.array(x, dtype=np.datetime64)
#END datetime

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
         debug(2, "Status file {} not found".format(file_path))
      else:
         raise

   return status
#END read_status

def update_status(dirname, my_hash, plot_status, message="", percentage=0, traceback=""):
   '''
      Updates a JSON status file whose name is defined by dirname and my_hash.
   '''

   initial_status = dict(
      percentage = 0,
      state = plot_status,
      message = message,
      completed = False,
      traceback= traceback,
      job_id = my_hash
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
         debug(2, "Status file {} not found".format(file_path))
         # It does not exist yet so create the initial JSON
         status = initial_status
      else:
         raise

   # Update the status information.
   status["message"] = message
   status["traceback"] = traceback
   status["state"] = plot_status
   status['percentage'] = percentage
   if plot_status == Plot_status.complete:
      status["completed"] = True
      status['filename'] = dirname + "/" + my_hash + "-plot.html"
      status['csv'] = dirname + "/" + my_hash + ".zip"
   elif plot_status == Plot_status.failed:
      status["completed"] = True
      status['filename'] = None
      status['csv'] = None
   else:
      status["completed"] = False
      status['filename'] = None
      status['csv'] = None

   debug(3, "Status: {}".format(status))

   # Write it back to the file.
   with open(file_path, 'w') as status_file:
      json.dump(status, status_file)

   return status
#END update_status

def read_cached_request(dirname, my_hash):
   '''
   Looks for a file named <dirname>/<my_hash>-request.json.
   If the file exists the contents are returned otherwise None.
   '''
   request = None
   request_path = dirname + "/" + my_hash + "-request.json"
   try:
      with open(request_path, 'r') as request_file:
         request = json.load(request_file)
   except IOError as err:
      if err.errno == 2:
         debug(2, "Request file {} not found".format(request_path))
      else:
         raise

   return request
#END read_cached_request

def read_cached_data(dirname, my_hash, my_id):
   plot = None
   data_path = dirname + "/" + my_hash + "-data.json"
   try:
      with open(data_path, 'r') as outfile:
         plot = json.load(outfile)
   except IOError as err:
      if err.errno == 2:
         debug(2, "Cache file {} not found".format(data_path))
      else:
         raise

   return plot 
#END read_cached_data

def debug(level, msg):
   if verbosity >= level: print(msg, file=sys.stderr)
#END debug

#############################################################################################################
   
def plot_legend(min_val, max_val, colours, var_name, plot_units, log_plot):   
   '''
   Returns a bokeh plot with a legend based on the colours provided.

   Here we calculate the slope and intercept from the min and max
   and use that to build an array of colours for the legend.
   We also have to set the height of each block individually to match the scale 
   (particularly for log scales) otherwise we get ugly gaps.
   NOTE - We work in the display scale (log or otherwise) but the values for the axis 
   are calculated in real space regardless.
   '''
   slope = (max_val - min_val) / (len(colours) - 1)
   intercept = min_val 

   legend_values = []
   legend_heights = []
   if log_plot:
      for i in range(len(colours)):
         legend_values.append(np.power(10,(slope * i) + intercept))
         legend_heights.append(legend_values[i] - legend_values[i-1])
   else:
      for i in range(len(colours)):
         legend_values.append((slope * i) + intercept)
         legend_heights.append(legend_values[i] - legend_values[i-1])
   
   legend_source = ColumnDataSource(data=dict(value=legend_values, 
                                              color=colours, 
                                              heights=legend_heights))
   
   if log_plot:
      # Remember to use the actual values not the logs for the y range
      legend_y_range=(np.power(10, min_val), np.power(10, max_val))
      legend_y_axis_type="log"
   else:
      legend_y_range=(min_val, max_val)
      legend_y_axis_type="linear"
   
   legend = figure(width=150, y_axis_type=legend_y_axis_type, y_range=legend_y_range)
                   
   # Set the y axis format so it does not default to scientific notation.
   legend.yaxis[0].formatter = NumeralTickFormatter(format="0.000")
   legend.yaxis.axis_label = u"{} {}".format(var_name, plot_units)

   legend.xaxis.visible = False
   
   legend.toolbar_location=None
   
   legend.rect(dilate = True, x=0.5, y='value', fill_color='color', 
               line_color='color', height='heights', width=1,  
               source=legend_source)

   return(legend)
#END plot_legend   
   
def extract(plot, outfile="image.html"):
       
   plot_type = plot['type']
   plot_title = plot['title']
   plot_units = plot['y1Axis']['label']
   palette = plot['palette']

   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']
   #print(plot)
   df = plot['data'][0]
   #print(df)
   plot_type = df['type']
   var_name = df['coverage']
   plot_scale = df['scale']

   debug(4, "extract: plot={}".format(df['data']))

   varindex = {j: i for i, j in enumerate(df['vars'])}
   #print(varindex)
   #data = np.transpose(df['data'])
   data = df['data']
   #print(data)
   # Save the CSV files
   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   csv_file = csv_dir + "/" + df['coverage'] + ".csv"
   #np.savetxt(csv_file, np.transpose(data), comments='', header=','.join(df['vars']), fmt="%s",delimiter=",")

   #with zipfile.ZipFile(csv_dir+".zip", mode='w') as zf:
      #zf.write(csv_file)

   #shutil.rmtree(csv_dir)

   # Format latlon to float. Otherwise we can not do the mins etc.
   #latlon = np.array(df["LatLon"]).astype(np.float)
   lat = np.array(data[varindex['Latitudes']]).astype(np.float64)
   lon = np.array(data[varindex['Longitudes']]).astype(np.float64)
   
   # Guess the size of each axis from the number of unique values in it.
   x_size = len(lon)
   y_size = len(lat)

   debug(3, "x_size {}, y_size {}, {} {}".format(x_size, y_size, len(data[varindex['Data']][0]), len(data[varindex['Data']])))
   # Make our array of values the right shape.
   # If the data list does not match the x and y sizes then bomb out.
   #assert x_size * y_size == len(data[varindex['value']])
   
   # We want a 2d array with latlon as x axis and date as y.
   #values = np.reshape(np.array(data[varindex['value']]),(-1,y_size))

   # Assume we have a nested list of values ordered in lat, lon order.
   values = np.flipud(np.array(data[varindex['Data']]))

   # Easiest if we force float here but is that always true?
   # We also have problems with how the data gets stored as JSON (very big!).
   values = values.astype(np.float64)
   debug(3, "values shape: {}".format(values.shape))
   debug(3, "\nrow:{} \ncol:{}\n".format(values[0], values[:,0])) 
   debug(3, "Bounds: {} {}".format(values[0,0], values[y_size-1,x_size-1]))
   debug(4, values)
   if plot_scale == "log":
       log_plot = True
       values = np.log10(values)
   else:
       log_plot = False
       
   #min_x = lon[0]
   #max_x = lon[-1]
   #min_y = lat[-1]
   #max_y = lat[0]
   min_x = np.nanmin(lon)
   max_x = np.nanmax(lon)
   min_y = np.nanmin(lat)
   max_y = np.nanmax(lat)
   #print(min_x,max_x,min_y,max_y)
   x_axis_type = "linear"
   y_axis_type = "linear"
   x_axis_label = "Longitude"
   y_axis_label = "Latitude"
 
   debug(3, "min_x {}, max_x {}, min_y {}, max_y {}".format(min_x,max_x,min_y,max_y))
 
   # We are working in the plotting space here, log or linear. Use this to set our
   # default scales.
   min_val = np.nanmin(values)
   max_val = np.nanmax(values)
   debug(3, "min_val {}, max_val {}".format(min_val,max_val))

   palette, colours, my_palette = get_palette(palette)
   legend = plot_legend(min_val, max_val, colours, var_name, plot_units, log_plot)

   # Create an RGBA array to show the Hovmoller. We do this rather than using the Bokeh image glyph
   # as that passes the actual data into bokeh.js as float resulting in huge files.   
   
   # First create an empty array of 32 bit ints.
   img = np.empty((y_size, x_size), dtype=np.uint32)

   # Create a view of the same array as an array of RGBA values.
   view = img.view(dtype=np.uint8).reshape((y_size, x_size, 4))
   debug(3, "RGBA shape: {}".format(view.shape))
   # We are going to set the RGBA based on our chosen palette. The RSG library returns a flat list of values.
   slope = (max_val - min_val) / (len(colours) - 1)
   intercept = min_val
   debug(3, "Slope: {}, intercept: {}".format(slope, intercept))
   # test here the order of lat lon maybe
   lat_order_reversed = lat[1] > lat[0]
   for j in range(x_size):

      #print(j)
      for i in reversed(range(y_size)):
         if lat_order_reversed:
            _i = (y_size - 1) - i
         else:
            _i = i
         if np.isnan(values[i,j]):
            view[_i, j, 0] = 0
            view[_i, j, 1] = 0
            view[_i, j, 2] = 0
            view[_i, j, 3] = 0
         else:
            p_index = int((values[i,j] - intercept) / slope) * 4
            view[_i, j, 0] = my_palette[p_index]
            view[_i, j, 1] = my_palette[p_index+1]
            view[_i, j, 2] = my_palette[p_index+2]
            view[_i, j, 3] = 255



    
   plot_width = 800
   plot_height = plot_width * y_size / x_size
   p = figure(width=plot_width, height=plot_height, x_range=(min_x, max_x), y_range=(min_y, max_y), 
              x_axis_type=x_axis_type, y_axis_type=y_axis_type, logo=None,
              title="Image extract - {}".format(plot_title))
   p.title_text_font_size = "14pt"
   p.xaxis.axis_label_text_font_size = "10pt"
   p.yaxis.axis_label_text_font_size = "10pt"
   p.xaxis.axis_label = x_axis_label
   p.yaxis.axis_label = y_axis_label
   
   # Create an RGBA image anchored at (min_x, min_y).
   p.image_rgba(image=[img], x=[min_x], y=[min_y], dw=[max_x-min_x], dh=[max_y-min_y])
   
   p.add_tools(CrosshairTool())

   #TODO This should be in the wrapper
   
   output_file(outfile, title="Image Extract")
   layout = hplot(legend, p)
   save(layout)
   return(p)
#END extract

def hovmoller(plot, outfile="image.html"):
   plot_type = plot['type']
   plot_title = plot['title']
   plot_units = plot['y1Axis']['label']
   palette = plot['palette']

   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']

   df = plot['data'][0]
   plot_type = df['type']
   var_name = df['coverage']
   plot_scale = df['scale']

   varindex = {j: i for i, j in enumerate(df['vars'])}

   assert plot_type in ("hovmollerLat", "hovmollerLon")
   #print(df['data'])
   data = np.transpose(df['data'])

   # Save the CSV files
   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   csv_file = csv_dir + "/" + df['coverage'] + ".csv"
   np.savetxt(csv_file, np.transpose(data), comments='', header=','.join(df['vars']), fmt="%s",delimiter=",")

   with zipfile.ZipFile(csv_dir+".zip", mode='w') as zf:
      zf.write(csv_file, arcname=df['coverage'] + ".csv")

   shutil.rmtree(csv_dir, df['coverage'] + ".csv")

   # Format date to integer values
   #date = np.array(pd.to_datetime(df['Date']).astype(np.int64) // 10**6)
   date = datetime(data[varindex['date']])
   
   # Format latlon to float. Otherwise we can not do the mins etc.
   #latlon = np.array(df["LatLon"]).astype(np.float)
   latlon = np.array(data[varindex['latlon']]).astype(np.float64)

   # Guess the size of each axis from the number of unique values in it.
   x_size = len(set(date))
   y_size = len(set(latlon))

   debug(2, "x_size {}, y_size {}, data {}".format(x_size, y_size, len(data[varindex['value']])))

   # Make our array of values the right shape.
   # If the data list does not match the x and y sizes then bomb out.
   assert x_size * y_size == len(data[varindex['value']])
   #print(np.array(data[varindex['value']]))
   # We want a 2d array with latlon as x axis and date as y.
   
   values = np.reshape(np.ma.masked_array(data[varindex['value']]),(-1,y_size))

   # Easiest if we force float here but is that always true?
   # We also have problems with how the data gets stored as JSON (very big!).
   values = values.astype(np.float64)
   #print(values.shape)
   if plot_scale == "log":
       log_plot = True
       values = np.log10(values)
   else:
       log_plot = False
       
   # If it has got this far without breaking the array must be regular (all rows same length) so
   # the next date value will be y_size elements along the array.
   date_step = date[y_size] - date[0]
   min_latlon = np.nanmin(latlon)
   max_latlon = np.nanmax(latlon)
   # Arrange the x and y's to suit the plot.
   if plot_type == 'hovmollerLat':
       # Swap the values around so that the date is on the x axis
       values = np.transpose(values)
       x_size, y_size = y_size, x_size

       # I think the coords refer to pixel centres so scale by half a pixel.
       
       min_ll_index = latlon.tolist().index(min_latlon)
       max_ll_index = latlon.tolist().index(max_latlon)
       min_x = date[0] - date_step / 2
       max_x = date[-1] + date_step / 2
       #min_y = latlon[0] - (latlon[1] - latlon[0]) / 2
       #max_y = latlon[-1] + (latlon[1] - latlon[0]) / 2
       min_y = min_latlon - (latlon[1] - latlon[0]) / 2
       max_y = max_latlon + (latlon[1] - latlon[0]) / 2
       x_axis_type = "datetime"
       y_axis_type = plot_scale
       x_axis_label = "Date"
       y_axis_label = "Latitude"
   else:
       # I think the coords refer to pixel centres so scale by half a pixel.
       min_x = min_latlon - (latlon[1] - latlon[0]) / 2
       max_x = max_latlon + (latlon[1] - latlon[0]) / 2
       min_y = date[0] - date_step / 2
       max_y = date[-1] + date_step / 2
       x_axis_type = plot_scale
       y_axis_type = "datetime"
       x_axis_label = "Longitude"
       y_axis_label = "Date"
 
   # We are working in the plotting space here, log or linear. Use this to set our
   # default scales.

   min_val = np.nanmin(values)
   max_val = np.nanmax(values)
   #print(min_val, max_val)
   #print(values[:])
   palette, colours, my_palette = get_palette(palette)
   legend = plot_legend(min_val, max_val, colours, var_name, plot_units, log_plot)

   # Create an RGBA array to show the Hovmoller. We do this rather than using the Bokeh image glyph
   # as that passes the actual data into bokeh.js as float resulting in huge files.   
   
   # First create an empty array of 32 bit ints.
   img = np.empty((x_size, y_size), dtype=np.uint32)

   # Create a view of the same array as an array of RGBA values.
   view = img.view(dtype=np.uint8).reshape((x_size, y_size, 4))

   # We are going to set the RGBA based on our chosen palette. The RSG library returns a flat list of values.
   slope = (max_val - min_val) / (len(colours) - 1)
   intercept = min_val
   lat_order_reversed = latlon[0] > latlon[1]
   #print(latlon)
   #print(lat_order_reversed)
   for i in reversed(range(x_size)):
      if lat_order_reversed:
         _i = (x_size - 1) - i
      else:
         _i = i
      for j in range(y_size):
         #print(i,j,intercept,slope,values[i,j] )
        
         if(np.isnan(values[i,j])):
            view[_i, j, 0] = 0
            view[_i, j, 1] = 0
            view[_i, j, 2] = 0
            view[_i, j, 3] = 0
         else:
            p_index = int((values[i,j] - intercept) / slope) * 4
            view[_i, j, 0] = my_palette[p_index]
            view[_i, j, 1] = my_palette[p_index+1]
            view[_i, j, 2] = my_palette[p_index+2]
            view[_i, j, 3] = 255

   plot_width = 800
   p = figure(width=plot_width, x_range=(min_x, max_x), y_range=(min_y, max_y), 
              x_axis_type=x_axis_type, y_axis_type=y_axis_type, logo=None,
              title="Hovmoller - {}".format(plot_title), responsive=True)
   p.title_text_font_size = "14pt"
   p.xaxis.axis_label_text_font_size = "10pt"
   p.yaxis.axis_label_text_font_size = "10pt"
   p.xaxis.axis_label = x_axis_label
   p.yaxis.axis_label = y_axis_label
   
   # Create an RGBA image anchored at (min_x, min_y).
   p.image_rgba(image=[img], x=[min_x], y=[min_y], dw=[max_x-min_x], dh=[max_y-min_y])
   
   p.add_tools(CrosshairTool())

   #TODO This should be in the wrapper
   script, div = components({'hovmoller':p, 'legend': legend})
   #with open(outfile, 'w') as output_file:
      #print(hovmoller_template.render(script=script, div=div), file=output_file)
   
   output_file(outfile, title="Hovmoller example")
   layout = hplot(legend, p)
   save(layout)
   return(p)
#END hovmoller

def transect(plot, outfile="transect.html"):

   plot_data = plot['data']
   plot_type = plot['type']
   plot_title = plot['title']
 
   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']

   sources = []

   ymin = []
   ymax = []

   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   zf = zipfile.ZipFile(csv_dir+".zip", mode='w')

   for df in plot_data:
          
      # Build the numerical indices into our data based on the variable list supplied.
      varindex = {j: i for i, j in enumerate(df['vars'])}

      plot_scale= df['scale']

      debug(4, "timeseries: varindex = {}".format(varindex))

      # Grab the data as a numpy array.
      dfarray = np.array(df['data'])
      dfarray[dfarray == 'null'] = "NaN"

      debug(4, dfarray)

      # Flip it so we have columns for each variable ordered by time.
      data = np.transpose(dfarray[np.argsort(dfarray[:,2])])

      debug(4,data)
      # Write out the CSV of the data.
      # TODO Should we put this in a function
 
      csv_file = csv_dir + "/" + df['coverage'] + ".csv"
      np.savetxt(csv_file, np.transpose(data), comments='', header=','.join(df['vars']), fmt="%s",delimiter=",")
      zf.write(csv_file, arcname=df['coverage'] + ".csv")

      min_value = np.amin(data[varindex['data_value']].astype(np.float64))
      max_value = np.amax(data[varindex['data_value']].astype(np.float64))
      buffer_value = (max_value - min_value) /20
      ymin.append(min_value-buffer_value)
      ymax.append(max_value+buffer_value)
      date = datetime(data[varindex['track_date']])
      
      datasource = dict(date=date,
                        sdate=data[varindex['track_date']],
                        lat=data[varindex['track_lat']],
                        lon=data[varindex['track_lon']],
                        value=data[varindex['data_value']])

      sources.append(ColumnDataSource(data=datasource))
      
   zf.close()
   shutil.rmtree(csv_dir)

   ts_plot = figure(title=plot_title, x_axis_type="datetime", y_axis_type = plot_scale, width=1200, logo=None,
              height=400, responsive=True
   )
   
   tooltips = [("Date", "@sdate")]
   tooltips.append(("Value", "@value{0.000}"))
   tooltips.append(("Latitude", "@lat{1.1}"))
   tooltips.append(("Longitude", "@lon{1.1}"))

   ts_plot.add_tools(CrosshairTool())

   ts_plot.xaxis.axis_label = 'Date'
   ts_plot.title_text_font_size = "14pt"
   ts_plot.xaxis.axis_label_text_font_size = "10pt"
   ts_plot.yaxis.axis_label_text_font_size = "10pt"
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   debug(2,u"timeseries: y1Axis = {}".format(plot['y1Axis']['label']))
   ts_plot.yaxis[0].formatter = NumeralTickFormatter(format="0.000")
   ts_plot.yaxis.axis_label = plot['y1Axis']['label']
   ts_plot.y_range = Range1d(start=ymin[0], end=ymax[0])
   yrange = [None, None]

   for i, source in enumerate(sources):
      # If we want 2 Y axes then the lines below do this
      if plot_data[i]['yaxis'] == 2 and len(ymin) > 1 and 'y2Axis' in plot.keys(): 
         debug(2, "Plotting y2Axis, {}".format(plot['y2Axis']['label']))
         # Setting the second y axis range name and range
         yrange[1] = "y2"
         ts_plot.extra_y_ranges = {yrange[1]: Range1d(start=ymin[1], end=ymax[1])}
   
         # Adding the second axis to the plot.  
         ts_plot.add_layout(LinearAxis(y_range_name=yrange[1], axis_label=plot['y2Axis']['label']), 'right')
   
      y_range_name = yrange[plot_data[i]['yaxis'] - 1]
      # Plot the mean as line
      debug(2, "Plotting line for {}".format(plot_data[i]['coverage']))
      ts_plot.line('date', 'value', y_range_name=y_range_name, color=plot_palette[i][1], legend='Value {}'.format(plot_data[i]['coverage']), source=source)

      # as a point
      debug(2, "Plotting points for {}".format(plot_data[i]['coverage']))
      ts_plot.circle('date', 'value', y_range_name=y_range_name, color=plot_palette[i][2], size=5, alpha=0.5, line_alpha=0, source=source)
      
   hover = HoverTool(tooltips=tooltips)
   ts_plot.add_tools(hover)

   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   ts_plot.legend.location = "top_left"
   
   script, div = components(ts_plot)

   # plot the points
   #output_file(outfile, 'Time Series')
   with open(outfile, 'w') as output_file:
      print(template.render(script=script, div=div), file=output_file)
   
   #save(ts_plot)
   return(ts_plot)
#END transect

def matchup(plot, outfile="transect.html"):

   plot_data = plot['data']
   plot_type = plot['type']
   plot_title = plot['title']
 
   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']

   sources = []

   ymin = []
   ymax = []

   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   zf = zipfile.ZipFile(csv_dir+".zip", mode='w')

   for df in plot_data:
          
      # Build the numerical indices into our data based on the variable list supplied.
      varindex = {j: i for i, j in enumerate(df['vars'])}

      plot_scale= df['scale']

      debug(4, "timeseries: varindex = {}".format(varindex))

      # Grab the data as a numpy array.
      dfarray = np.array(df['data'])
      dfarray[dfarray == 'null'] = "NaN"

      debug(4, dfarray)

      # Flip it so we have columns for each variable ordered by time.
      data = np.transpose(dfarray[np.argsort(dfarray[:,2])])

      debug(4,data)
      # Write out the CSV of the data.
      # TODO Should we put this in a function
 
      csv_file = csv_dir + "/" + df['coverage'] + ".csv"
      np.savetxt(csv_file, np.transpose(data), comments='', header=','.join(df['vars']), fmt="%s",delimiter=",")
      zf.write(csv_file, arcname=df['coverage'] + ".csv")

      min_value = np.amin(data[varindex['data_value']].astype(np.float64))
      max_value = np.amax(data[varindex['data_value']].astype(np.float64))
      #min_match_value = np.amin(data[varindex['match_value']].astype(np.float64))
      #max_match_value = np.amax(data[varindex['match_value']].astype(np.float64))
      #min_value = min(min_found_value, min_match_value)
      #max_value = max(max_found_value, max_match_value)
      buffer_value = (max_value - min_value) /20
      if(len(ymin)>0):
         ymin[0] = (min(ymin[0],min_value-buffer_value))
         ymax[0] = (max(ymax[0],max_value+buffer_value))
      else:
         ymin.append(min_value-buffer_value)
         ymax.append(max_value+buffer_value)
      date = datetime(data[varindex['track_date']])

      datasource = dict(date=date,
                           sdate=data[varindex['track_date']],
                           lat=data[varindex['track_lat']],
                           lon=data[varindex['track_lon']],
                           value=data[varindex['data_value']])

      # datasource_match = dict(date=date,
      #                      sdate=data[varindex['track_date']],
      #                      lat=data[varindex['track_lat']],
      #                      lon=data[varindex['track_lon']],
      #                      value=data[varindex['match_value']])



      sources.append(ColumnDataSource(data=datasource))
      # sources.append(ColumnDataSource(data=datasource_match))
      
   zf.close()
   shutil.rmtree(csv_dir)

   ts_plot = figure(title=plot_title, x_axis_type="datetime", y_axis_type = plot_scale, width=1200, logo=None,
              height=400, responsive=True
   )
   
   tooltips = [("Date", "@sdate")]
   tooltips.append(("Value", "@value{0.000}"))
   tooltips.append(("Latitude", "@lat{1.1}"))
   tooltips.append(("Longitude", "@lon{1.1}"))

   ts_plot.add_tools(CrosshairTool())

   ts_plot.xaxis.axis_label = 'Date'
   ts_plot.title_text_font_size = "14pt"
   ts_plot.xaxis.axis_label_text_font_size = "10pt"
   ts_plot.yaxis.axis_label_text_font_size = "10pt"
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   debug(2,"timeseries: y1Axis = {}".format(plot['y1Axis']['label']))
   ts_plot.yaxis[0].formatter = NumeralTickFormatter(format="0.000")
   ts_plot.yaxis.axis_label = plot['y1Axis']['label']
   ts_plot.y_range = Range1d(start=ymin[0], end=ymax[0])
   yrange = [None, None]

   for i, source in enumerate(sources):
      # If we want 2 Y axes then the lines below do this
      if plot_data[i]['yaxis'] == 2 and len(ymin) > 1 and 'y2Axis' in plot.keys(): 
         debug(2, "Plotting y2Axis, {}".format(plot['y2Axis']['label']))
         # Setting the second y axis range name and range
         yrange[1] = "y2"
         ts_plot.extra_y_ranges = {yrange[1]: Range1d(start=ymin[1], end=ymax[1])}
   
         # Adding the second axis to the plot.  
         ts_plot.add_layout(LinearAxis(y_range_name=yrange[1], axis_label=plot['y2Axis']['label']), 'right')
   
      y_range_name = yrange[plot_data[i]['yaxis'] - 1]
      # Plot the mean as line
      debug(2, "Plotting line for {}".format(plot_data[i]['coverage']))
      ts_plot.line('date', 'value', y_range_name=y_range_name, color=plot_palette[i][1], legend='Value {}'.format(plot_data[i]['coverage']), source=source)

      # as a point
      debug(2, "Plotting points for {}".format(plot_data[i]['coverage']))
      ts_plot.circle('date', 'value', y_range_name=y_range_name, color=plot_palette[i][2], size=5, alpha=0.5, line_alpha=0, source=source)
      
   hover = HoverTool(tooltips=tooltips)
   ts_plot.add_tools(hover)

   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   ts_plot.legend.location = "top_left"
   
   script, div = components(ts_plot)

   # plot the points
   #output_file(outfile, 'Time Series')
   with open(outfile, 'w') as output_file:
      print(template.render(script=script, div=div), file=output_file)
   
   #save(ts_plot)
   return(ts_plot)
#END matchup

def timeseries(plot, outfile="time.html"):

   plot_data = plot['data']
   plot_type = plot['type']
   plot_title = plot['title']
 
   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']

   sources = []

   ymin = []
   ymax = []

   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   zf = zipfile.ZipFile(csv_dir+".zip", mode='w')

   for df in plot_data:
          
      # Build the numerical indices into our data based on the variable list supplied.
      varindex = {j: i for i, j in enumerate(df['vars'])}

      plot_scale= df['scale']

      debug(4, "timeseries: varindex = {}".format(varindex))

      # Grab the data as a numpy array.
      dfarray = np.array(df['data'])
      debug(4, dfarray)

      # Flip it so we have columns for each variable ordered by time.
      data = np.transpose(dfarray[np.argsort(dfarray[:,0])])

      # Write out the CSV of the data.
      # TODO Should we put this in a function
 
      csv_file = csv_dir + "/" + df['coverage'] + ".csv"
      np.savetxt(csv_file, np.transpose(data), comments='', header=','.join(df['vars']), fmt="%s",delimiter=",")
      zf.write(csv_file, arcname=df['coverage'] + ".csv")

      debug(4, data[varindex['mean']]) 
      min_value = np.amin(data[varindex['mean']].astype(np.float64))
      max_value = np.amax(data[varindex['mean']].astype(np.float64))
      buffer_value = (max_value - min_value) /20
      ymin.append(min_value - buffer_value)
      ymax.append(max_value + buffer_value)
      debug(4, "ymin: {}, ymax:{}".format(ymin[-1],ymax[-1]))

      date = datetime(data[varindex['date']])
      
      datasource = dict(date=date,
                        sdate=data[varindex['date']],
                        mean=data[varindex['mean']])

      if 'std' in df['vars']:
         # Set the errorbars
         err_xs = []
         err_ys = []
         for x, y, std in zip(date, data[varindex['mean']].astype(np.float64), data[varindex['std']].astype(np.float64)):
            if plot_scale == "linear":
               err_xs.append((x, x))
               err_ys.append((y - std, y + std))
            else:
               # Calculate the errors in log space. Not sure if this is what is wanted but the other looks silly.
               err_xs.append((x, x))
               err_ys.append((np.power(10, np.log10(y) - np.log10(std)), np.power(10, np.log10(y) + np.log10(std)))) 

         min_value = np.amin(np.array(err_ys).astype(np.float64))
         max_value = np.amax(np.array(err_ys).astype(np.float64))
         buffer_value = (max_value - min_value) /20
         ymin[-1] = min_value - buffer_value
         ymax[-1] = max_value + buffer_value
         debug(4, "ymin: {}, ymax:{}".format(ymin[-1],ymax[-1]))
         datasource['err_xs'] = err_xs
         datasource['err_ys'] = err_ys
         datasource['stderr'] = data[varindex['std']]
      
      if 'max' in df['vars'] and 'min' in df['vars']:
         # Set the min/max envelope. 
         # We create a list of coords starting with the max for the first date then join up all
         # the maxes in date order before moving down to the min for the last date and coming
         # back to the first date.
         band_y = np.append(data[varindex['max']].astype(np.float64),data[varindex['min']].astype(np.float64)[::-1])
         band_x = np.append(date,date[::-1])
         datasource['min'] = data[varindex['min']]
         datasource['max'] = data[varindex['max']]

      sources.append(ColumnDataSource(data=datasource))
      
   zf.close()
   shutil.rmtree(csv_dir)

   ts_plot = figure(title=plot_title, x_axis_type="datetime", y_axis_type = plot_scale, width=1200, logo=None,
              height=400, responsive=True
   )
   ts_plot.title_text_font_size = "14pt"
   ts_plot.xaxis.axis_label_text_font_size = "10pt"
   ts_plot.yaxis.axis_label_text_font_size = "10pt"
   
   tooltips = [("Date", "@sdate")]
   tooltips.append(("Mean", "@mean{0.000}"))
   tooltips.append(("Max ", "@max{0.000}"))
   tooltips.append(("Min ", "@min{0.000}"))
   tooltips.append(("Std ", "@stderr{0.000}"))

   ts_plot.add_tools(CrosshairTool())

   ts_plot.xaxis.axis_label = 'Date'
   
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   debug(3,u"timeseries: y1Axis = {}".format(plot['y1Axis']['label']))
   ts_plot.yaxis[0].formatter = NumeralTickFormatter(format="0.000")
   ts_plot.yaxis.axis_label = plot['y1Axis']['label']
   #ts_plot.extra_y_ranges = {"y1": Range1d(start=ymin[0], end=ymax[0])}
   ts_plot.y_range = Range1d(start=ymin[0], end=ymax[0])
   yrange = [None, None]

   # Adding the second axis to the plot.  
   #ts_plot.add_layout(LinearAxis(y_range_name="y1", axis_label=plot['y1Axis']['label']), 'left')
   
   for i, source in enumerate(sources):
      # If we want 2 Y axes then the lines below do this
      if plot_data[i]['yaxis'] == 2 and len(ymin) > 1 and 'y2Axis' in plot.keys(): 
         debug(2, u"Plotting y2Axis, {}".format(plot['y2Axis']['label']))
         # Setting the second y axis range name and range
         yrange[1] = "y2"
         ts_plot.extra_y_ranges = {yrange[1]: Range1d(start=ymin[1], end=ymax[1])}
   
         # Adding the second axis to the plot.  
         ts_plot.add_layout(LinearAxis(y_range_name=yrange[1], axis_label=plot['y2Axis']['label']), 'right')
   
      if 'min' in datasource and len(sources) == 1:
         debug(2, "Plotting min/max for {}".format(plot_data[i]['coverage']))
         # Plot the max and min as a shaded band.
         # Cannot use this dataframe because we have twice as many band variables as the rest of the 
         # dataframe.
         # So use this.
         ts_plot.patch(band_x, band_y, color=plot_palette[i][0], fill_alpha=0.05, line_alpha=0)
      
      
      y_range_name = yrange[plot_data[i]['yaxis'] - 1]
      # Plot the mean as line
      debug(2, "Plotting mean line for {}".format(plot_data[i]['coverage']))
      ts_plot.line('date', 'mean', y_range_name=y_range_name, color=plot_palette[i][1], legend='Mean {}'.format(plot_data[i]['coverage']), source=source)

      # as a point
      debug(2, "Plotting mean points for {}".format(plot_data[i]['coverage']))
      ts_plot.circle('date', 'mean', y_range_name=y_range_name, color=plot_palette[i][2], size=5, alpha=0.5, line_alpha=0, source=source)
      
      if 'err_xs' in datasource:
         # Plot error bars
         debug(2, "Plotting error bars for {}".format(plot_data[i]['coverage']))
         ts_plot.multi_line('err_xs', 'err_ys', y_range_name=y_range_name, color=plot_palette[i][3], line_alpha=0.5, source=source)
      
   hover = HoverTool(tooltips=tooltips)
   ts_plot.add_tools(hover)

   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   ts_plot.legend.location = "top_left"
   
   script, div = components(ts_plot)

   # plot the points
   #output_file(outfile, 'Time Series')
   with open(outfile, 'w') as output_file:
      print(template.render(script=script, div=div), file=output_file)
   
   #save(ts_plot)
   return(ts_plot)
#END timeseries   

def scatter(plot, outfile='/tmp/scatter.html'):

   plot_data = plot['data']
   plot_type = plot['type']
   plot_title = plot['title']

   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']
   varindex = {j: i for i, j in enumerate(plot_data[0]['order'])}


   # We have 2 sets of values we want to plot as a scatter. I think the extracter will bring these back together 
   # in the future.
   df = plot_data[0]['data']
   cov_meta = plot_data[0]['cov_meta']
   xVar = cov_meta['x']['coverage']
   yVar = cov_meta['y']['coverage']

   xData = [x[varindex[xVar]] for x in df]
   yData = [x[varindex[yVar]] for x in df]
   dateData = [x[varindex['Time']] for x in df]

   #df1 = plot_data[0]
   #df2 = plot_data[1]
          
   # Create a dict to hold index into the array for each item
   # df1 = x df2 = y
   data1 = np.array(xData)
   #data1 = np.transpose(dfarray1[np.argsort(dfarray1[:,0])])
      
   date = datetime(dateData)

   data2 = np.array(yData)
   #data2 = np.transpose(dfarray2[np.argsort(dfarray2[:,0])])
      
   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   csv_file1 = csv_dir + "/" + cov_meta['x']['coverage'] + ".csv"
   np.savetxt(csv_file1, np.transpose(data1), comments='', header="data", fmt="%s",delimiter=",")
   csv_file2 = csv_dir + "/" + cov_meta['y']['coverage'] + ".csv"
   np.savetxt(csv_file2, np.transpose(data2), comments='', header="data", fmt="%s",delimiter=",")
   with zipfile.ZipFile(csv_dir+".zip", mode='w') as zf:
      zf.write(csv_file1, arcname=cov_meta['x']['coverage'] + ".csv")
      zf.write(csv_file2, arcname=cov_meta['x']['coverage'] + ".csv")
      debug(3, "ZIP: {}".format(zf.namelist()))

   shutil.rmtree(csv_dir)

   # Calculate the linear regression line
   slope, intercept, r_value, p_value, std_err = stats.linregress(data1, data2)
   regr_f = np.poly1d([slope, intercept])

   # Use the slope and intercept to create some points for bokeh to plot.
   # Not sure how long the line should be. As a first stab just extend the x up and down
   # by the full x range.
   regression_x = [data1.min()-(data1.max()-data1.min()), data1.max()+(data1.max()-data1.min())]
   regression_y = [regr_f(regression_x[0]), regr_f(regression_x[1])]

   debug(3,"r:{}, p:{}, std:{}".format(r_value, p_value, std_err))

   datasource = dict(date=date,
                     sdate=dateData,
                     x=data1,
                     y=data2)

   source = ColumnDataSource(data=datasource)
   #print(source)
   scatter_plot = figure(
      title=plot_title, logo=None,
      x_axis_type=plot['xAxis']['scale'], 
      y_axis_type=plot['y1Axis']['scale'], 
      width=800,
      height=400,
      responsive=True)
   scatter_plot.title_text_font_size = "14pt"
   scatter_plot.xaxis.axis_label_text_font_size = "10pt"
   scatter_plot.yaxis.axis_label_text_font_size = "10pt"

   # If we had bokeh version 0.12 we could do this
   #mytext = Label(x=70, y=70, text='r-value: {}'.format(r_value))
   #scatter_plot.add_layout(mytext)

   # Plot the points of the scatter.
   points = scatter_plot.circle('x','y', color=plot_palette[0][2], size=10, fill_alpha=.5, line_alpha=0, source=source)
   
   # Plot the regression line using default style.
   reg_line = scatter_plot.line(x=regression_x, y=regression_y)
      
   # Set up the hover tooltips for the points and lines.
   point_hover = HoverTool(
      tooltips=[
         ("Date", "@sdate"),
         (cov_meta['x']['coverage'], "@x{0.000}"),
         (cov_meta['y']['coverage'], "@y{0.000}")
      ],
         renderers=[points]
   )

   line_hover = HoverTool(
      tooltips=("Slope: {:04.3f}<br>Intercept: {:04.3f}<br>R<sup>2</sup>: {:04.3f}".format(slope, intercept, r_value**2)),
      renderers=[reg_line],
      line_policy='interp'
   )

   # Set up the hover tools in this order so the point hover is on top of the line.
   scatter_plot.add_tools(line_hover)
   scatter_plot.add_tools(point_hover)

   scatter_plot.xaxis.axis_label = plot['xAxis']['label']
   
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   scatter_plot.yaxis.axis_label = plot['y1Axis']['label']
   
   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   scatter_plot.legend.location = "top_left"
   
   # plot the points
   output_file(outfile, 'Scatter Plot')
   
   save(scatter_plot)
   return(scatter_plot)
#END scatter


def scatter_matchup(plot, outfile='/tmp/scatter.html'):
   import pprint
   pprint.pprint('-'*20)
   print(plot)
   plot_data = plot['data']

   plot_type = plot['type']
   plot_title = plot['title']
   log_data = plot['matchup_log']
   df = plot_data[0]['data']

   my_hash = plot['req_hash']
   my_id = plot['req_id']
   dir_name = plot['dir_name']
   varindex = {j: i for i, j in enumerate(plot['data'][0]['vars'])}
   cov_name = plot['data'][0]['coverage']

   xVar = 'match_value'
   yVar = 'data_value'
   tVar = 'track_date'
   mVar = 'data_date'
   logText = ''

   print(log_data)

   xData_raw = [float(x[varindex[xVar]]) for x in df]
   yData_raw = [float(x[varindex[yVar]]) for x in df]


   if (log_data):
      logText = 'Log of '
      xData = [log(float(x[varindex[xVar]])) for x in df]
      yData = [log(float(x[varindex[yVar]])) for x in df]
   else:
      xData = [float(x[varindex[xVar]]) for x in df]
      yData = [float(x[varindex[yVar]]) for x in df]
   tData = [x[varindex[tVar]] for x in df]
   mData = [x[varindex[mVar]] for x in df]

   data1 = np.array(xData)
   #data1 = np.transpose(dfarray1[np.argsort(dfarray1[:,0])])
   var_headers = plot['data'][0]['vars']
   var_headers[var_headers.index('track_lat')] = "Latitude"
   var_headers[var_headers.index('track_lon')] = "Longitude"
   var_headers[var_headers.index('match_value')] = "Provided Value"
   var_headers[var_headers.index('track_date')] = "Provided Date"
   var_headers[var_headers.index('data_date')] = "Matched Date"
   var_headers[var_headers.index('data_value')] = "Matched Value"



   data2 = np.array(yData)

   csv_dir = dir_name + "/" + my_hash

   try:
      os.mkdir(csv_dir)
   except OSError as err:
      if err.errno == 17: #[Errno 17] File exists:
         pass
      else:
         raise

   csv_file1 = csv_dir + "/" + cov_name + ".csv"
   np.savetxt(csv_file1, df, comments='', header=",".join(var_headers), fmt="%s",delimiter=",")
   with zipfile.ZipFile(csv_dir+".zip", mode='w') as zf:
      zf.write(csv_file1, arcname=cov_name + ".csv")
      debug(3, "ZIP: {}".format(zf.namelist()))

   shutil.rmtree(csv_dir)


   slope, intercept, r_value, p_value, std_err = stats.linregress(data1, data2)
   regr_f = np.poly1d([slope, intercept])

   # Use the slope and intercept to create some points for bokeh to plot.
   # Not sure how long the line should be. As a first stab just extend the x up and down
   # by the full x range.
   regression_x = [data1.min(), data1.max()+((data1.max()/100)*5)]
   regression_y = [regr_f(regression_x[0]), regr_f(regression_x[1])]
   
   datasource = dict(date=tData,
                     sdate=mData,
                     x_raw=xData_raw,
                     y_raw=yData_raw,
                     x=xData,
                     y=yData)

   source = ColumnDataSource(data=datasource)
   #print(source)
   scatter_plot = figure(
      title=plot_title, logo=None,
      x_axis_type=plot['xAxis']['scale'], 
      y_axis_type=plot['xAxis']['scale'], 
      width=800,
      height=400,
      responsive=True)
   scatter_plot.title_text_font_size = "14pt"
   scatter_plot.xaxis.axis_label_text_font_size = "14pt"
   scatter_plot.yaxis.axis_label_text_font_size = "14pt"

   # If we had bokeh version 0.12 we could do this
   #mytext = Label(x=70, y=70, text='r-value: {}'.format(r_value))
   #scatter_plot.add_layout(mytext)

   # Plot the points of the scatter.
   points = scatter_plot.circle('x','y', color=plot_palette[0][2], size=10, fill_alpha=.5, line_alpha=0, source=source)
   
   # Plot the regression line using default style.
   reg_line = scatter_plot.line(x=regression_x, y=regression_y, line_color="blue", legend=logText + cov_name)



   _slope, _intercept, _, _, _ = stats.linregress(data1, data1)
   _regr_f = np.poly1d([_slope, _intercept])
   

   _regression_x = [data1.min(), data1.max()+((data1.max()/100)*5)]
   _regression_y = [_regr_f(_regression_x[0]), _regr_f(_regression_x[1])]

   reg_line_1_1 = scatter_plot.line(x=_regression_x, y=_regression_y, line_color="black",line_dash=[4, 4], legend="1:1 line")


   # Set up the hover tooltips for the points and lines.
   point_hover = HoverTool(
      tooltips=[
         ("Date", "@sdate"),
         ('matchup value', "@x_raw{0.000}"),
         (cov_name, "@y_raw{0.000}")
      ],
         renderers=[points]
   )

   line_hover = HoverTool(
      tooltips=("Slope: {:04.3f}<br>Intercept: {:04.3f}<br>R<sup>2</sup>: {:04.3f}".format(slope, intercept, r_value**2)),
      renderers=[reg_line],
      line_policy='interp'
   )

   # Set up the hover tools in this order so the point hover is on top of the line.
   scatter_plot.add_tools(line_hover)
   scatter_plot.add_tools(point_hover)

   scatter_plot.xaxis.axis_label = logText+"values provided in matchup CSV"
   
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   scatter_plot.yaxis.axis_label = logText+plot['y1Axis']['label']
   
   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   scatter_plot.legend.location = "top_left"
   
   # plot the points
   output_file(outfile, 'Scatter Plot')
   
   save(scatter_plot)
   return(scatter_plot)

#END scatter_matchup



#############################################################################################################
   

def get_plot_data(json_request, plot=dict()):

   debug(2, "get_plot_data: Started")
   irregular = False
   matchup_log = False
   # Common data for all plots. 
   series = json_request['plot']['data']['series']
   plot_type = json_request['plot']['type']
   plot_title = json_request['plot']['title']
   scale = json_request['plot']['y1Axis']['scale']
   style = json_request['plot']['style']
   units = json_request['plot']['y1Axis']['label']
   y1Axis = json_request['plot']['y1Axis']
   xAxis = json_request['plot']['xAxis']
   dirname = plot['dir_name']
   my_hash = plot['req_hash']
  
   if 'isIrregular' in json_request['plot']:
      irregular = True

   if 'matchup_log' in json_request['plot']:
      matchup_log = json_request['plot']['matchup_log']
   # We will hold the actual data extracted in plot_data. We may get multiple returns so hold it
   # as a list.
   plot_data = []

   plot['type'] = plot_type
   plot['title'] = plot_title
   plot['xAxis'] = xAxis
   plot['y1Axis'] = y1Axis
   plot['data'] = plot_data
   plot['palette'] = style.split("/")[1]
   plot['matchup_log'] = matchup_log

   debug(3, plot)

   # Only try and set the 2nd Y axis if we have info. in the request.
   if 'y2Axis' in json_request['plot'].keys(): 
      y2Axis = json_request['plot']['y2Axis']
      plot['y2Axis']=y2Axis

   update_status(dirname, my_hash, Plot_status.extracting, percentage=5)

   if plot_type in ("hovmollerLat", "hovmollerLon"):
      # Extract the description of the data required from the request.
      # Hovmoller should only have one data series to plot.
      if len(series) > 1:
         debug(0, "Error: Attempting to plot {} data series".format(len(series)))
         return plot

      ds = series[0]['data_source']
      coverage = ds['coverage']
      time_bounds = urllib.quote_plus(ds['t_bounds'][0] + "/" + ds['t_bounds'][1])
      debug(3,"Time bounds: {}".format(time_bounds))
      depth = None
      if 'depth' in ds:
         depth = ds['depth']
      coverage = ds['coverage']
      wcs_url = ds['threddsUrl']
      bbox = ["{}".format(ds['bbox'])]
      bbox = ds['bbox']
      time_bounds = [ds['t_bounds'][0] + "/" + ds['t_bounds'][1]]

      try:
         if irregular:
            bounds = wkt.loads(bbox).bounds
            data_request = "IrregularExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage)
            debug(3, "Requesting data: {}".format(data_request))
            extractor = IrregularExtractor(ds['threddsUrl'], time_bounds, extract_area=bounds, extract_variable=coverage, extract_depth=depth, masking_polygon=bbox)
         else:
            data_request = "BasicExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage)
            debug(3, "Requesting data: {}".format(data_request))
            extractor = BasicExtractor(ds['threddsUrl'], time_bounds, extract_area=bbox, extract_variable=coverage, extract_depth=depth)
         extract = extractor.getData()

         if plot_type == "hovmollerLat":
            hov_stats = HovmollerStats(extract, "Time", "Lat", coverage)
         else:
            hov_stats = HovmollerStats(extract, "Lon",  "Time", coverage)
         
         response = json.loads(hov_stats.process())
      except ValueError:
         debug(2, "Data request, {}, failed".format(data_request))
         return plot
         
      # TODO - Old style extractor response. If we change it we need to match the change here.
      data = response['data']
      debug(4, "Data: {}".format(data))

      # And convert it to a nice simple dict the plotter understands.
      plot_data.append(dict(scale=scale, coverage=coverage, type=plot_type, units=units, title=plot_title,
                      vars=['date', 'latlon', 'value'], data=data))
      update_status(dirname, my_hash, Plot_status.extracting, percentage=90)

   elif plot_type in ("extract"):
      if len(series) > 1:
         debug(0, "Error: Attempting to plot {} data series".format(len(series)))
         return plot

      ds = series[0]['data_source']
      coverage = ds['coverage']
      time_bounds = urllib.quote_plus(ds['t_bounds'][0] + "/" + ds['t_bounds'][1])
      debug(3,"Time bounds: {}".format(time_bounds))

      coverage = ds['coverage']
      #my_vars = ['data', 'latitudes', 'longitudes']
      if "filename" in ds.keys():
         # TODO - For testing we use the file specified. Need to build a call to the extractor.
         testdata = ds['filename']
         debug(3, "Loading test from {}".format(testdata))
         with open(testdata, 'r') as datafile:
            json_data = json.load(datafile)
         debug(4, "Data: {}".format(json_data.keys()))

         data = []
         my_vars = json_data['vars']
         [data.append(json_data[i]) for i in my_vars]
      else:
         wcs_url = ds['threddsUrl']
         if 'depth' in ds:
           depth = ds['depth']
         else:
           depth=None
         bbox = ["{}".format(ds['bbox'])]
         bbox = ds['bbox']
         time_bounds = [ds['t_bounds'][0] + "/" + ds['t_bounds'][1]]

         debug(3, "Requesting data: BasicExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage))
         try:
            if irregular:
               bounds = wkt.loads(bbox).bounds
               data_request = "IrregularExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage)
               debug(3, "Requesting data: {}".format(data_request))
               extractor = IrregularExtractor(ds['threddsUrl'], time_bounds, extract_area=bounds, extract_variable=coverage, extract_depth=depth, masking_polygon=bbox) 
            else:
               data_request = "BasicExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage)
               debug(3, "Requesting data: {}".format(data_request))
               extractor = BasicExtractor(ds['threddsUrl'], time_bounds, extract_area=bbox, extract_variable=coverage, extract_depth=depth)
            extract = extractor.getData()
            map_stats = ImageStats(extract,  coverage)
            response = json.loads(map_stats.process())
            #with open('/tmp/dfile.json', 'w') as outfile:
               #json.dump(response, outfile)
            data = response['data']
            my_vars = response['vars']
         except ValueError:
            debug(2, "Data request, {}, failed".format(data_request))
            return plot
            
      # And convert it to a nice simple dict the plotter understands.
      plot_data.append(dict(scale=scale, coverage=coverage, type=plot_type, units=units, title=plot_title,
                      vars=my_vars, data=data))
      update_status(dirname, my_hash, Plot_status.extracting, percentage=90)

   elif plot_type in ("timeseries"):
      #Can have more than 1 series so need a loop.
      for s in series:
         ds = s['data_source']
         yaxis = s['yAxis']
         if yaxis == 1:
            scale = json_request['plot']['y1Axis']['scale']
         else:
            scale = json_request['plot']['y2Axis']['scale']
         depth = None
         if 'depth' in ds:
            depth = ds['depth']
         coverage = ds['coverage']
         wcs_url = ds['threddsUrl']
         bbox = ds['bbox']
         time_bounds = [ds['t_bounds'][0] + "/" + ds['t_bounds'][1]]

         data_request = "BasicExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage)
         debug(3, "Requesting data: {}".format(data_request))
         try:
            if irregular:
               bounds = wkt.loads(bbox).bounds
               extractor = IrregularExtractor(ds['threddsUrl'], time_bounds, extract_area=bounds, extract_variable=coverage, extract_depth=depth,masking_polygon=bbox)
            else:
               extractor = BasicExtractor(ds['threddsUrl'], time_bounds, extract_area=bbox, extract_variable=coverage, extract_depth=depth)
            extract = extractor.getData()
            ts_stats = BasicStats(extract, coverage)
            response = json.loads(ts_stats.process())
         except ValueError:
            debug(2, "Data request, {}, failed".format(data_request))
            return dict(data=[])
         #except urllib2.HTTPError:
            #debug(2, "Data request, {}, failed".format(data_request))
            #return dict(data=[])
         except requests.exceptions.ReadTimeout:
            debug(2, "Data request, {}, failed".format(data_request))
            return dict(data=[])
         
         debug(4, "Response: {}".format(response))

         #TODO LEGACY - Change if the format is altered.
         data = response['data']
         df = []
         for date, details in data.items():
             line = [date]
             [line.append(details[i]) for i in ['min', 'max', 'mean', 'std']]
             df.append(line)
    
         plot_data.append(dict(scale=scale, coverage=coverage, yaxis=yaxis,  vars=['date', 'min', 'max', 'mean', 'std'], data=df))
         update_status(dirname, my_hash, Plot_status.extracting, percentage=90/len(series))
   elif plot_type == "scatter":
      t_holder = {}
      scatter_stats_holder = {}
      series_count = 0
      for s in series:
         ds = s['data_source']
         if s['yAxis'] == 1:
            scale = json_request['plot']['y1Axis']['scale']
            actual_axis = "y"
         else:
            scale = json_request['plot']['xAxis']['scale']
            actual_axis = "x"
         coverage = ds['coverage']
         wcs_url = ds['threddsUrl']
         bbox = ds['bbox']
         depth = None
         if 'depth' in ds:
            depth = ds['depth']
         time_bounds = [ds['t_bounds'][0] + "/" + ds['t_bounds'][1]]
         t_holder[actual_axis] = {}
         t_holder[actual_axis]['coverage'] = coverage
         t_holder[actual_axis]['wcs_url'] = wcs_url
         t_holder[actual_axis]['bbox'] = bbox
         t_holder[actual_axis]['time_bounds'] = time_bounds
         #print(t_holder)
         try:
            if irregular:
               bounds = wkt.loads(bbox).bounds
               extractor = IrregularExtractor(ds['threddsUrl'], time_bounds, extract_area=bounds, extract_variable=coverage, extract_depth=depth, masking_polygon=bbox)
            else:
               extractor = BasicExtractor(ds['threddsUrl'], time_bounds, extract_area=bbox, extract_variable=coverage, extract_depth=depth)
            extract = extractor.getData()
            scatter_stats_holder[coverage] = extract
         except ValueError:
            debug(2, "Data request, {}, failed".format(data_request))
            return dict(data=[])
         #except urllib2.HTTPError:
            #debug(2, "Data request, {}, failed".format(data_request))
            #return dict(data=[])
         except requests.exceptions.ReadTimeout:
            debug(2, "Data request, {}, failed".format(data_request))
            return dict(data=[])
      stats = ScatterStats(scatter_stats_holder)
      response = json.loads(stats.process())
      data = response['data']
      data_order = response['order']
      plot_data.append(dict(cov_meta=t_holder, order=data_order, data=data))
      update_status(dirname, my_hash, Plot_status.extracting, percentage=90)

   elif plot_type == "scatter_matchup":

      for s in series:
         ds = s['data_source']
         yaxis = s['yAxis']
         if yaxis == 1:
            scale = json_request['plot']['y1Axis']['scale']
         else:
            scale = json_request['plot']['y2Axis']['scale']

         coverage = ds['coverage']
         csv_file = json_request['plot']['transectFile']
         wcs_url = ds['threddsUrl']
         bbox = get_transect_bounds(csv_file)
         time = get_transect_times(csv_file)
         data_request = "TransectExtractor('{}',{},extract_area={},extract_variable={})".format(wcs_url, time, bbox, coverage)
         debug(3, "Requesting data: {}".format(data_request))
         extractor = TransectExtractor(wcs_url, [time], "time", extract_area=bbox, extract_variable=coverage)
         filename = extractor.getData()
         debug(4, "Extracted to {}".format(filename))
         stats = TransectStats(filename, coverage, csv_file, matchup=True)
         output_data = stats.process()
         debug(4, "Scatter Matchup extract: {}".format(output_data))

         #TODO LEGACY - Change if the format is altered.
         df = []
         for details in output_data:
            line = []
            [line.append(details[i]) for i in ["data_date", "data_value","track_date", "track_lat", "track_lon", "match_value"]]
            #TODO This strips out nulls as they break the plotting at the moment.
            if line[1] != 'null': df.append(line)
         
         # m_df = []
         # for details in output_data:
         #    line = []
         #    [line.append(details[i]) for i in ["track_date", "match_value", "track_date","track_lat", "track_lon"]]
         #    #TODO This strips out nulls as they break the plotting at the moment.
         #    if line[1] != 'null': m_df.append(line)
         # #TODO This was in the extractor command line butnot sure we need it at the moment.
         # #output_metadata = extractor.metadataBlock()
         #output = {}
         #output['metadata'] = output_metadata
         #output['data'] = output_data

         # And convert it to a nice simple dict the plotter understands.
         plot_data.append(dict(scale=scale, coverage=coverage, yaxis=yaxis, vars=["data_date", "data_value", "track_date", "track_lat", "track_lon", "match_value"], data=df))
         # plot_data.append(dict(scale=scale, coverage='matchup values', yaxis=yaxis, vars=["track_date","data_value","track_date", "track_lat", "track_lon"], data=m_df))
         update_status(dirname, my_hash, Plot_status.extracting, percentage=90/len(series))


   elif plot_type == "transect":
      for s in series:
         ds = s['data_source']
         yaxis = s['yAxis']
         if yaxis == 1:
            scale = json_request['plot']['y1Axis']['scale']
         else:
            scale = json_request['plot']['y2Axis']['scale']

         coverage = ds['coverage']
         csv_file = json_request['plot']['transectFile']
         wcs_url = ds['threddsUrl']
         bbox = get_transect_bounds(csv_file)
         time = get_transect_times(csv_file)
         data_request = "TransectExtractor('{}',{},extract_area={},extract_variable={})".format(wcs_url, time, bbox, coverage)
         debug(3, "Requesting data: {}".format(data_request))
         extractor = TransectExtractor(wcs_url, [time], "time", extract_area=bbox, extract_variable=coverage)
         filename = extractor.getData()
         debug(4, "Extracted to {}".format(filename))
         stats = TransectStats(filename, coverage, csv_file)
         output_data = stats.process()
         debug(4, "Transect extract: {}".format(output_data))

         #TODO LEGACY - Change if the format is altered.
         df = []
         for details in output_data:
            line = []
            [line.append(details[i]) for i in ["data_date", "data_value", "track_date", "track_lat", "track_lon"]]
            #TODO This strips out nulls as they break the plotting at the moment.
            if line[1] != 'null': df.append(line)
    
         #TODO This was in the extractor command line butnot sure we need it at the moment.
         #output_metadata = extractor.metadataBlock()
         #output = {}
         #output['metadata'] = output_metadata
         #output['data'] = output_data

         # And convert it to a nice simple dict the plotter understands.
         plot_data.append(dict(scale=scale, coverage=coverage, yaxis=yaxis, vars=["data_date", "data_value", "track_date", "track_lat", "track_lon"], data=df))
         update_status(dirname, my_hash, Plot_status.extracting, percentage=90/len(series))

   elif plot_type == "matchup":
      # add matchup series here then loop through normal series

      for s in series:
         ds = s['data_source']
         yaxis = s['yAxis']
         if yaxis == 1:
            scale = json_request['plot']['y1Axis']['scale']
         else:
            scale = json_request['plot']['y2Axis']['scale']

         coverage = ds['coverage']
         csv_file = json_request['plot']['transectFile']
         wcs_url = ds['threddsUrl']
         bbox = get_transect_bounds(csv_file)
         time = get_transect_times(csv_file)
         data_request = "TransectExtractor('{}',{},extract_area={},extract_variable={})".format(wcs_url, time, bbox, coverage)
         debug(3, "Requesting data: {}".format(data_request))
         extractor = TransectExtractor(wcs_url, [time], "time", extract_area=bbox, extract_variable=coverage)
         filename = extractor.getData()
         debug(4, "Extracted to {}".format(filename))
         stats = TransectStats(filename, coverage, csv_file, matchup=True)
         output_data = stats.process()
         debug(4, "Matchup extract: {}".format(output_data))

         #TODO LEGACY - Change if the format is altered.
         df = []
         for details in output_data:
            line = []
            [line.append(details[i]) for i in ["data_date", "data_value","track_date", "track_lat", "track_lon", "match_value"]]
            #TODO This strips out nulls as they break the plotting at the moment.
            if line[1] != 'null': df.append(line)
         
         m_df = []
         for details in output_data:
            line = []
            [line.append(details[i]) for i in ["track_date", "match_value", "track_date","track_lat", "track_lon"]]
            #TODO This strips out nulls as they break the plotting at the moment.
            if line[1] != 'null': m_df.append(line)
         #TODO This was in the extractor command line butnot sure we need it at the moment.
         #output_metadata = extractor.metadataBlock()
         #output = {}
         #output['metadata'] = output_metadata
         #output['data'] = output_data

         # And convert it to a nice simple dict the plotter understands.
         plot_data.append(dict(scale=scale, coverage=coverage, yaxis=yaxis, vars=["data_date", "data_value", "track_date", "track_lat", "track_lon", "match_value"], data=df))
         plot_data.append(dict(scale=scale, coverage='matchup values', yaxis=yaxis, vars=["track_date","data_value","track_date", "track_lat", "track_lon"], data=m_df))
         update_status(dirname, my_hash, Plot_status.extracting, percentage=90/len(series))


   else:
      # We should not be here!
      debug(0, "Unrecognised data request, {}.".format(data_request))
      return dict(data=[])

   plot['status'] = "success"
   plot['data'] = plot_data
   return plot
#END get_plot_data

def prepare_plot(request, outdir):
   '''
   Prepare_plot takes a plot request and hashes it to produce a key for future use.
   It then parses the request to build the calls to the extract service and submits them
   as single result tests to get the timing information.
   If all looks OK it returns the hash to the caller, otherwise it returns an error.
   '''

   # TODO Currently get issues as the JSON is not always in the same order so hash is different.

   hasher = hashlib.sha1()
   hasher.update(json.dumps(request))
   my_hash = "{}".format(hasher.hexdigest())
   my_id = "{}{}".format(int(time.time()), os.getpid())
   plot = dict(
      req_hash= my_hash, 
      req_id= my_id,
      status= dict(status= Plot_status.initialising), 
      dir_name=outdir)
   return plot
#END prepare_plot

def execute_plot(dirname, plot, request):
   debug(3, "Received request: {}".format(request))

   my_hash = plot['req_hash']
   dirname = plot['dir_name']
   my_id = plot['req_id']
   my_fullid = my_hash + "_" + my_id

   status = read_status(dirname, my_hash)
   if status == None or status['state'] == Plot_status.failed:
      
      update_status(dirname, my_hash, Plot_status.initialising, "Preparing")

      # Output the identifier for the plot on stdout. This is used by the frontend
      # to monitor the status of the plot. We must not do this before we have written the 
      # status file.
      print(my_hash)

      # Store the request for possible caching in the future.
      request_path = dirname + "/" + my_hash + "-request.json"
      debug(2, "File: {}".format(request_path))
      with open(request_path, 'w') as outfile:
         json.dump(request, outfile)
      
      # Call the extractor.
      update_status(dirname, my_hash, Plot_status.extracting, "Extracting")
      plot = get_plot_data(request, plot)

      # Only cache the data if we think it is OK.
      if plot['status'] == "success":
         data_path = dirname + "/" + my_hash + "-data.json"
         debug(2, "File: {}".format(data_path))
         with open(data_path, 'w') as outfile:
            json.dump(plot, outfile)

   else:
      # This request has already been made by someone so just point the middleware at the existing status
      # file. The request may be complete, in which case the middleware can pull back the plot, or still
      # in progress. We don't care so just send back the hash so the middleware can monitor it.
      # Do not mess with the status!
      print(my_hash)
      return True
      
   # We are making a plot so decide where to store it.
   file_path = dirname + "/" + my_hash + "-plot.html"

   plot_data = plot['data']

   if len(plot_data) == 0:
      debug(0, "Data request failed")
      update_status(dirname, my_hash, Plot_status.failed, "Extract failed")
      return False

   plot['req_hash'] = my_hash
   plot['req_id'] = my_id
   plot['dir_name'] = dirname

   update_status(dirname, my_hash, Plot_status.plotting, "Plotting")
   if plot['type'] == 'timeseries':
      plot_file = timeseries(plot, file_path)
   elif plot['type'] == 'scatter':
      plot_file = scatter(plot, file_path)
   elif plot['type'] in ("hovmollerLat", "hovmollerLon"):
      plot_file = hovmoller(plot, file_path)
   elif plot['type'] == 'transect':
      plot_file = transect(plot, file_path)
   elif plot['type'] == 'matchup' :
      plot_file = matchup(plot, file_path)
   elif plot['type'] == 'extract':
      plot_file = extract(plot, file_path)
   elif plot['type'] == 'scatter_matchup':
      plot_file = scatter_matchup(plot, file_path)
   else:
      # We should not be here.
      debug(0, "Unknown plot type, {}.".format(plot['type']))
      return False

   update_status(opts.dirname, my_hash, Plot_status.complete, "Complete")
   return True
#END execute_plot

#############################################################################################################

if __name__ == "__main__":
   from argparse import ArgumentParser, RawTextHelpFormatter
   import os

   usage_text = """Usage: %prog [options]
"""
   description_text = """Plotting functions

Examples:

To execute a plot
./plots.py -c execute -d /tmp < testing/data/testscatter1.json

"""

   valid_commands = ('execute')
   cmdParser = ArgumentParser(formatter_class=RawTextHelpFormatter, epilog=description_text)
   cmdParser.add_argument("-c", "--command", action="store", dest="command", default="status", help="Plot command to execute {}.".format(valid_commands))
   cmdParser.add_argument("-v", "--verbose", action="count", dest="verbose", help="Enable verbose output, more v's, more verbose.")
   cmdParser.add_argument("-d", "--dir", action="store", dest="dirname", default="", help="Output directory.")
   cmdParser.add_argument("-H", "--hash", action="store", dest="hash", default="", help="Id of prepared command.")

   opts = cmdParser.parse_args()

   if hasattr(opts, 'verbose') and opts.verbose > 0: verbosity = opts.verbose 

   debug(1, "Verbosity is {}".format(opts.verbose))
   if not os.path.isdir(opts.dirname):
      debug(0,"'{}' is not a directory".format(opts.dirname))
      sys.exit(1)
   
   if opts.command not in valid_commands:
      debug(0,"Command must be one of {}".format(valid_commands))
      sys.exit(1)

   if opts.command == "execute":
      request = json.load(sys.stdin)

      plot = prepare_plot(request, opts.dirname)
      my_hash = plot['req_hash']
      # Now try and make the plot.
      try:
         if execute_plot(opts.dirname, plot, request):
            debug(1, "Plot complete")
         else:
            debug(0, "Error executing. Failed to complete plot")
            sys.exit(2)
      except:
         trace_message = traceback.format_exc()
         debug(0, "Uncaught Exception. Failed to complete plot - {}".format(trace_message))
         update_status(opts.dirname, my_hash, Plot_status.failed, "Extract failed", traceback=trace_message)
         raise

   else:
      # We should not be here
      sys.exit(2)
