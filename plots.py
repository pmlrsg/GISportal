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

import numpy as np
import pandas as pd
import json
import jinja2
import urllib
import os, hashlib

from bokeh.plotting import figure, save, show, output_notebook, output_file, ColumnDataSource, hplot, vplot
from bokeh.models import LinearColorMapper, NumeralTickFormatter,LinearAxis, Range1d, HoverTool, CrosshairTool
from bokeh.resources import CSSResources
from bokeh.embed import components

import palettes

from data_extractor.extractors import BasicExtractor
from data_extractor.analysis_types import BasicStats, HovmollerStats

# Set the default logging verbosity to lowest.
verbosity = 0



template = jinja2.Template("""
<!DOCTYPE html>
<html lang="en-US">

<link
    href="http://cdn.pydata.org/bokeh/release/bokeh-0.11.0.css"
    rel="stylesheet" type="text/css"
>
<script 
    src="http://cdn.pydata.org/bokeh/release/bokeh-0.11.0.js"
></script>

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

def get_palette(palette="rsg_colour"):
   colours = []
   my_palette = palettes.getPalette('rsg_colour')
   
   for i in range(0, len(my_palette), 4):
       colours.append("#{:02x}{:02x}{:02x}".format(my_palette[i], my_palette[i+1], my_palette[i+2]))

   return(colours)
#END get_palette

def datetime(x):
   return np.array(pd.to_datetime(x).astype(np.int64) // 10**6)
   #return np.array(x, dtype=np.datetime64)
#END datetime

def hovmoller_legend(min_val, max_val, colours, var_name, plot_units, log_plot):   
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
   legend.yaxis[0].formatter = NumeralTickFormatter(format="0.00")
   legend.yaxis.axis_label = "{} {}".format(var_name, plot_units)

   legend.xaxis.visible = False
   
   legend.toolbar_location=None
   
   legend.rect(dilate = True, x=0.5, y='value', fill_color='color', 
               line_color='color', height='heights', width=1,  
               source=legend_source)

   return(legend)
#END hovmoller_legend   
   
def hovmoller(plot, outfile="image.html"):
       
   plot_type = plot['type']
   plot_title = plot['title']
   plot_units = plot['y1Axis']['label']

   df = plot['data'][0]
   plot_type = df['type']
   var_name = df['coverage']
   plot_scale = df['scale']

   varindex = {j: i for i, j in enumerate(df['vars'])}

   assert plot_type in ("hovmollerLat", "hovmollerLon")
   
   data = np.transpose(df['data'])

   # Format date to integer values
   #date = np.array(pd.to_datetime(df['Date']).astype(np.int64) // 10**6)
   date = datetime(data[varindex['date']])
   
   # Format latlon to float. Otherwise we can not do the mins etc.
   #latlon = np.array(df["LatLon"]).astype(np.float)
   latlon = np.array(data[varindex['latlon']]).astype(np.float)
   
   # Guess the size of each axis from the number of unique values in it.
   x_size = len(set(date))
   y_size = len(set(latlon))

   # Make our array of values the right shape.
   # If the data list does not match the x and y sizes then bomb out.
   assert x_size * y_size == len(data[varindex['value']])
   
   # We want a 2d array with latlon as x axis and date as y.
   values = np.reshape(np.array(data[varindex['value']]),(-1,y_size))

   # Easiest if we force float here but is that always true?
   # We also have problems with how the data gets stored as JSON (very big!).
   values = values.astype(np.float)
   
   if plot_scale == "log":
       log_plot = True
       values = np.log10(values)
   else:
       log_plot = False
       
   # If it has got this far without breaking the array must be regular (all rows same length) so
   # the next date value will be y_size elements along the array.
   date_step = date[y_size] - date[0]
   
   # Arrange the x and y's to suit the plot.
   if plot_type == 'hovmollerLat':
       # Swap the values around so that the date is on the x axis
       values = np.transpose(values)
       x_size, y_size = y_size, x_size

       # I think the coords refer to pixel centres so scale by half a pixel.
       min_x = date[0] - date_step / 2
       max_x = date[-1] + date_step / 2
       min_y = latlon[0] - (latlon[1] - latlon[0]) / 2
       max_y = latlon[-1] + (latlon[1] - latlon[0]) / 2
       x_axis_type = "datetime"
       y_axis_type = plot_scale
       x_axis_label = "Date"
       y_axis_label = "Latitude"
   else:
       # I think the coords refer to pixel centres so scale by half a pixel.
       min_x = latlon[0] - (latlon[1] - latlon[0]) / 2
       max_x = latlon[-1] + (latlon[1] - latlon[0]) / 2
       min_y = date[0] - date_step / 2
       max_y = date[-1] + date_step / 2
       x_axis_type = plot_scale
       y_axis_type = "datetime"
       x_axis_label = "Longitude"
       y_axis_label = "Date"
 
   # We are working in the plotting space here, log or linear. Use this to set our
   # default scales.
   min_val = np.amin(values)
   max_val = np.amax(values)

   colours = get_palette()
   legend = hovmoller_legend(min_val, max_val, colours, var_name, plot_units, log_plot)

   # Create an RGBA array to show the Hovmoller. We do this rather than using the Bokeh image glyph
   # as that passes the actual data into bokeh.js as float resulting in huge files.   
   
   # First create an empty array of 32 bit ints.
   img = np.empty((x_size, y_size), dtype=np.uint32)

   # Create a view of the same array as an array of RGBA values.
   view = img.view(dtype=np.uint8).reshape((x_size, y_size, 4))

   # We are going to set the RGBA based on our chosen palette. The RSG library returns a flat list of values.
   my_palette = palettes.getPalette('rsg_colour')
   slope = (max_val - min_val) / (len(colours) - 1)
   intercept = min_val
   for i in range(x_size):
      for j in range(y_size):
        p_index = int((values[i,j] - intercept) / slope) * 4
        view[i, j, 0] = my_palette[p_index]
        view[i, j, 1] = my_palette[p_index+1]
        view[i, j, 2] = my_palette[p_index+2]
        view[i, j, 3] = 255

   plot_width = 1200
   p = figure(width=plot_width, x_range=(min_x, max_x), y_range=(min_y, max_y), 
              x_axis_type=x_axis_type, y_axis_type=y_axis_type, 
              title="Hovmoller - {}".format(plot_title), responsive=True)

   p.xaxis.axis_label = x_axis_label
   p.yaxis.axis_label = y_axis_label
   
   # Create an RGBA image anchored at (min_x, min_y).
   p.image_rgba(image=[img], x=[min_x], y=[min_y], dw=[max_x-min_x], dh=[max_y-min_y])
   
   p.add_tools(CrosshairTool())

   #TODO This should be in the wrapper
   output_file(outfile, title="Hovmoller example")
   layout = hplot(legend, p)
   save(layout)
   return(layout)
#END hovmoller

def timeseries(plot, outfile="time.html"):

   # Just pick some random colours. Probably need to make this configurable.
   plot_palette = [['#7570B3', 'blue', 'red', 'red'], ['#A0A0A0', 'green', 'orange', 'orange']]

   plot_data = plot['data']
   plot_type = plot['type']
   plot_title = plot['title']

   sources = []
   var_meta = dict()
   var_name = plot_data[0]['coverage']
   plot_scale = plot['scale']

   ymin = []
   ymax = []

   for df in plot_data:
          
      # Build the numerical indices into our data based on the variable list supplied.
      varindex = {j: i for i, j in enumerate(df['vars'])}

      debug(4, "timeseries: varindex = {}".format(varindex))

      # Grab the data as a numpy array.
      dfarray = np.array(df['data'])

      # Flip it so we have columns for each variable ordered by time.
      data = np.transpose(dfarray[np.argsort(dfarray[:,0])])

      debug(4, data[varindex['mean']]) 
      ymin.append(np.amin(data[varindex['mean']].astype(np.float64)))
      ymax.append(np.amax(data[varindex['mean']].astype(np.float64)))
      date = datetime(data[varindex['date']])
      
      datasource = dict(date=date,
                        sdate=data[varindex['date']],
                        mean=data[varindex['mean']])

      if 'std' in df['vars']:
         # Set the errorbars
         err_xs = []
         err_ys = []
         for x, y, std in zip(date, data[varindex['mean']].astype(np.float), data[varindex['std']].astype(np.float)):
            if plot_scale == "linear":
               err_xs.append((x, x))
               err_ys.append((y - std, y + std))
            else:
               # Calculate the errors in log space. Not sure if this is what is wanted but the other looks silly.
               err_xs.append((x, x))
               err_ys.append((np.power(10, np.log10(y) - np.log10(std)), np.power(10, np.log10(y) + np.log10(std)))) 

         datasource['err_xs'] = err_xs
         datasource['err_ys'] = err_ys
         datasource['stderr'] = data[varindex['std']]
      
      if 'max' in df['vars'] and 'min' in df['vars']:
         # Set the min/max envelope. 
         # We create a list of coords starting with the max for the first date then join up all
         # the maxes in date order before moving down to the min for the last date and coming
         # back to the first date.
         band_y = np.append(data[varindex['max']],data[varindex['min']][::-1])
         band_x = np.append(date,date[::-1])
         datasource['min'] = data[varindex['min']]
         datasource['max'] = data[varindex['max']]

      sources.append(ColumnDataSource(data=datasource))
      
   ts_plot = figure(title=plot_title, x_axis_type="datetime", y_axis_type = plot_scale, width=1200, 
              height=400, responsive=True
   )
   
   tooltips = [("Date", "@sdate")]
   tooltips.append(("Mean", "@mean"))
   tooltips.append(("Max ", "@max"))
   tooltips.append(("Min ", "@min"))
   tooltips.append(("Std ", "@stderr"))

   ts_plot.add_tools(CrosshairTool())

   ts_plot.xaxis.axis_label = 'Date'
   
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   debug(2,"timeseries: y1Axis = {}".format(plot['y1Axis']['label']))
   ts_plot.yaxis.axis_label = plot['y1Axis']['label']
   #ts_plot.extra_y_ranges = {"y1": Range1d(start=ymin[0], end=ymax[0])}
   ts_plot.y_range = Range1d(start=ymin[0], end=ymax[0])
   yrange = [None, None]

   # Adding the second axis to the plot.  
   #ts_plot.add_layout(LinearAxis(y_range_name="y1", axis_label=plot['y1Axis']['label']), 'left')
   
   for i, source in enumerate(sources):
      # If we want 2 Y axes then the lines below do this
      if plot_data[i]['yaxis'] == 2 and len(ymin) > 1 and 'y2Axis' in plot.keys(): 
         debug(2, "Plotting y2Axis, {}".format(plot['y2Axis']['label']))
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


   # We have 2 sets of values we want to plot as a scatter. I think the extracter will bring these back together 
   # in the future.
   df1 = plot_data[0]
   df2 = plot_data[1]
          
   # Create a dict to hold index into the array for each item
   varindex = {j: i for i, j in enumerate(df1['vars'])}
   dfarray1 = np.array(df1['data'])
   data1 = np.transpose(dfarray1[np.argsort(dfarray1[:,0])])
      
   date = datetime(data1[varindex['date']])

   dfarray2 = np.array(df2['data'])
   data2 = np.transpose(dfarray2[np.argsort(dfarray2[:,0])])
      
   datasource = dict(date=date,
                     sdate=data1[varindex['date']],
                     x=data1[varindex['mean']],
                     y=data2[varindex['mean']])

   source = ColumnDataSource(data=datasource)
      
   scatter_plot = figure(
      title=plot_title, 
      x_axis_type=plot['xAxis']['scale'], 
      y_axis_type=plot['y1Axis']['scale'], 
      width=800,
      height=300,
      responsive=True)

   hover = HoverTool(
      tooltips=[
         ("Date", "@sdate"),
         (df1['coverage'], "@x"),
         (df2['coverage'], "@y")
      ]
   )

   scatter_plot.add_tools(hover)

   scatter_plot.xaxis.axis_label = plot['xAxis']['label']
   
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   scatter_plot.yaxis.axis_label = plot['y1Axis']['label']
   
   scatter_plot.circle('x', 'y', color=plot_palette[0][2], size=10, fill_alpha=.5, line_alpha=0, source=source)
      
   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   scatter_plot.legend.location = "top_left"
   
   # plot the points
   output_file(outfile, 'Scatter Plot')
   
   save(scatter_plot)
   return(scatter_plot)
#END scatter


def get_plot_data(json_request, request_type='data'):
   debug(2, "get_plot_data: Started")

   # Common data for all plots. 
   series = json_request['plot']['data']['series']
   plot_type = json_request['plot']['type']
   plot_title = json_request['plot']['title']
   scale = json_request['plot']['y1Axis']['scale']
   units = json_request['plot']['y1Axis']['label']
   y1Axis = json_request['plot']['y1Axis']
   xAxis = json_request['plot']['xAxis']

   # We will hold the actual data extracted in plot_data. We may get multiple returns so hold it
   # as a list.
   plot_data = []

   plot = dict(
      scale=scale, type=plot_type, units=units, title=plot_title,
      vars=['date', 'min', 'max', 'mean', 'std'], xAxis=xAxis, y1Axis=y1Axis,
      data=[])
   if 'y2Axis' in json_request['plot'].keys(): 
      y2Axis = json_request['plot']['y2Axis']
      plot['y2Axis']=y2Axis

   if plot_type in ("hovmollerLat", "hovmollerLon"):
      # Extract the description of the data required from the request.
      # Hovmoller should only have one data series to plot.
      if len(series) > 1:
         debug(0, "Error: Attempting to plot {} data series".format(len(series)))

      ds = series[0]['data_source']
      coverage = ds['coverage']
      time_bounds = urllib.quote_plus(ds['t_bounds'][0] + "/" + ds['t_bounds'][1])
      debug(3,"Time bounds: {}".format(time_bounds))

      coverage = ds['coverage']
      wcs_url = ds['threddsUrl']
      bbox = ["{}".format(ds['bbox'])]
      time_bounds = [ds['t_bounds'][0] + "/" + ds['t_bounds'][1]]

      debug(3, "Requesting data: BasicExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage))
      try:
         extractor = BasicExtractor(ds['threddsUrl'], time_bounds, extract_area=bbox, extract_variable=coverage)
         extract = extractor.getData()
         if plot_type == "hovmollerLat":
            hov_stats = HovmollerStats(extract, "Time", "Lat", coverage)
         else:
            hov_stats = HovmollerStats(extract, "Lon",  "Time", coverage)
         
         response = json.loads(hov_stats.process())
      except ValueError:
         debug(2, "Data request, {}, failed".format(data_request))
         return dict(data=[])
         
      # TODO - Old style extractor response. So pull the data out.
      data = response['data']

      # And convert it to a nice simple dict the plotter understands.
      plot_data.append(dict(scale=scale, coverage=coverage, type=plot_type, units=units, title=plot_title,
                      vars=['date', 'latlon', 'value'], data=data))

   elif plot_type in ("timeseries", "scatter"):
      #TODO Can have more than 1 series so need a loop.
      for s in series:
         ds = s['data_source']
         yaxis = s['yAxis']

         coverage = ds['coverage']
         wcs_url = ds['threddsUrl']
         bbox = ["{}".format(ds['bbox'])]
         time_bounds = [ds['t_bounds'][0] + "/" + ds['t_bounds'][1]]

         debug(3, "Requesting data: BasicExtractor('{}',{},extract_area={},extract_variable={})".format(ds['threddsUrl'], time_bounds, bbox, coverage))
         try:
            extractor = BasicExtractor(ds['threddsUrl'], time_bounds, extract_area=bbox, extract_variable=coverage)
            extract = extractor.getData()
            ts_stats = BasicStats(extract, coverage)
            response = json.loads(ts_stats.process())
         except ValueError:
            debug(2, "Data request, {}, failed".format(data_request))
            return dict(data=[])
         
         debug(4, "Response: {}".format(response))

         #TODO LEGACY - this reformats the response to the new format.
         data = response['data']
         df = []
         for date, details in data.items():
             line = [date]
             [line.append(details[i]) for i in ['min', 'max', 'mean', 'std']]
             df.append(line)
    
         plot_data.append(dict(coverage=coverage, yaxis=yaxis,  vars=['date', 'min', 'max', 'mean', 'std'], data=df))

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
   # TODO How to handle multiple versions of the same request simultaneously.

   hasher = hashlib.sha1()
   hasher.update(json.dumps(request))
   my_hash = hasher.hexdigest()
   update_status(opts.dirname, my_hash, request, Plot_status.initialising, "Preparing")
   return my_hash
#END prepare_plot

def execute_plot(request, outfile):
   update_status(opts.dirname, my_hash, request, Plot_status.extracting, "Extracting")
   plot = get_plot_data(request, 'data')
   plot_data = plot['data']

   if len(plot_data) == 0:
      debug(0, "Data request failed")
      update_status(opts.dirname, my_hash, request, Plot_status.failed, "Extract failed")
      return False

   if plot['type'] == 'timeseries':
      update_status(opts.dirname, my_hash, request, Plot_status.plotting, "Plotting")
      plot_file = timeseries(plot, outfile)
   elif plot['type'] == 'scatter':
      update_status(opts.dirname, my_hash, request, Plot_status.plotting, "Plotting")
      plot_file = scatter(plot, outfile)
   else:
      update_status(opts.dirname, my_hash, request, Plot_status.plotting, "Plotting")
      plot_file = hovmoller(plot, outfile)

   return True
#END execute_plot
   
def update_status(dirname, my_hash, request, plot_status, message):
   '''
      Updates a JSON status file whose name is defined by dirname and my_hash.
   '''

   # Read status file, create if not there.
   file_path = opts.dirname + "/" + my_hash + "-status.json"
   try:
      with open(file_path, 'r') as status_file:
         status = json.load(status_file)
   except IOError as err:
      if err.errno == 2:
         debug(2, "Status file {} not found".format(file_path))
         # It does not exist yet so create the initial JSON
         status = dict(
            percentage = 0,
            state = plot_status,
            message = message,
            completed = False,
            job_id = my_hash
         )
      else:
         raise

   # Update the status information.
   status["message"] = message
   status["state"] = plot_status
   if plot_status == Plot_status.complete:
      status["completed"] = True
      status['filename'] = opts.dirname + "/" + my_hash + "-plot.html"
   else:
      status["completed"] = False
      status['filename'] = None

   debug(3, "Status: {}".format(status))

   # Write it back to the file.
   with open(file_path, 'w') as status_file:
      json.dump(status, status_file)

   return True
#END update_status

def debug(level, msg):
   if verbosity >= level: print(msg, file=sys.stderr)
#END debug


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
   cmdParser.add_argument("-v", "--verbose", action="count", dest="verbose", help="Enable verbose output")
   cmdParser.add_argument("-d", "--dir", action="store", dest="dirname", default="", help="Output directory")
   cmdParser.add_argument("-H", "--hash", action="store", dest="hash", default="", help="Hash of prepared command")

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
      debug(3, "Received request: {}".format(request))

      my_hash = prepare_plot(request, opts.dirname)

      file_path = opts.dirname + "/" + my_hash + "-request.json"
      debug(2, "File: {}".format(file_path))

      # Store the request for possible caching in the future.
      with open(file_path, 'w') as outfile:
         json.dump(request, outfile)

      # Output the identifier for the plot on stdout. This is used by the frontend
      # to monitor the status of the plot. We must not do this before we have written the 
      # status file.
      print(my_hash)

      debug(3, "Request: {}".format(request['plot']))

      file_path = opts.dirname + "/" + my_hash + "-plot.html"
      
      if execute_plot(request, file_path):
         debug(1,file_path)
         update_status(opts.dirname, my_hash, request, Plot_status.complete, "Complete")
      else:
         debug(0, "Failed to complete plot")
         sys.exit(2)

   else:
      # We should not be here
      sys.exit(2)
