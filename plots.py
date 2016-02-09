#! /usr/bin/env python

"""
$Id$
Library to make a variety of plots.
Uses bokeh as the plotting engine.

Available functions
listPlots: Return a list of available plot types.
"""

import __builtin__
import sys

import numpy as np
import pandas as pd
import json

from bokeh.plotting import figure, show, output_notebook, output_file, ColumnDataSource, hplot, vplot
from bokeh.models import LinearColorMapper, NumeralTickFormatter,LinearAxis, Range1d, HoverTool, CrosshairTool

import palettes

def get_palette(palette="rsg_colour"):
   colours = []
   my_palette = palettes.getPalette('rsg_colour')
   
   for i in range(0, len(my_palette), 4):
       colours.append("#%02x%02x%02x" % (my_palette[i], my_palette[i+1], my_palette[i+2]))

   return(colours)

#END get_palette

def datetime(x):
    return np.array(x, dtype=np.datetime64)

#END datetime

def hovmoller_legend(min_val, max_val, colours, var_name, plot_units, log_plot):   
   '''
   Returns a bokeh plot with a kegend based on the colurs provided.

   Here we calculate the slope and intercept from the min and max
   and use that to build an array of colours for the legend.
   We also have to set the height of each block individually to match the scale 
   (particularly for log scales) otherwise we get ugly gaps.
   NOTE - We work in the display scale (log or otherwise) but the values for the axis 
   are calculated in real space regardless.
   '''
   slope = (max_val - min_val) / len(colours)
   intercept = max_val - (slope * 255)
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
   legend.yaxis.axis_label = "%s %s" % (var_name, plot_units)

   legend.xaxis.visible = False
   
   legend.toolbar_location=None
   
   legend.rect(dilate = True, x=0.5, y='value', fill_color='color', 
               line_color='color', height='heights', width=1,  
               source=legend_source)

   return(legend)
#END hovmoller_legend   
   
def hovmoller_plot(values, colours, plot_width, min_x, max_x, min_y, max_y, x_axis_type, y_axis_type, var_name):
   # Create a figure with the dates on the x axis and latitudes on the y.
   plot_width = 1200
   p = figure(width=plot_width, x_range=(min_x, max_x), y_range=(min_y, max_y), 
              x_axis_type=x_axis_type, y_axis_type=y_axis_type, 
              title="Hovmoller - %s" % (var_name))

   p.xaxis.axis_label = x_axis_label
   p.yaxis.axis_label = y_axis_label
   
   # Create an image anchored at (min_x, min_y) and set the color_mapper to map 
   # it with our palette.
   p.image(image=[values],  x=min_x, y=min_y, dw=max_x-min_x, dh=max_y-min_y, 
           color_mapper=LinearColorMapper(palette=colours, low=min_val, high=max_val))
   
   return(p)
#END hovmoller_plot

def hovmoller(infile, outfile="image.html"):
   with open(infile) as json_file:
      df = json.load(json_file)
   
   json_file.close()
       
   plot_type = df['type']
   var_name = df['coverage']
   plot_units = df['units']
   plot_scale = df['scale']

   assert plot_type in ("hovmollerLat", "hovmollerLon")
   
   # Format date to integer values
   date = np.array(pd.to_datetime(df['Date']).astype(np.int64) // 10**6)
   
   # Format latlon to float. Otherwise we can not do the mins etc.
   latlon = np.array(df["LatLon"]).astype(np.float)
   
   # Guess the size of each axis from the number of unique values in it.
   x_size = len(set(date))
   y_size = len(set(latlon))

   # Make our array of values the right shape.
   # If the data list does not match the x and y sizes then bomb out.
   assert x_size * y_size == len(df["Value"])
   
   # We want a 2d array with latlon as x axis and date as y.
   values = np.reshape(np.array(df["Value"]),(-1,y_size))

   # Easiest if we force float here but is that always true?
   # We also have problems with how the data gets stored as JSON (very big!).
   values = values.astype(np.float)
   
   if plot_scale == "log":
       log_plot = True
       values = np.log10(values)
   else:
       log_plot = False
       
   # Round to try and make the JSON smaller. Seems to have no effect.
   values=np.round(values,1)
   
   # If it has got this far without breaking the array must be regular (all rows same length) so
   # the next date value will be y_size elements along the array.
   date_step = date[y_size] - date[0]
   
   # Arrange the x and y's to suit the plot.
   if plot_type == 'hovmollerLat':
       # Swap the values around so that the date is on the x axis
       values = np.transpose(values)

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
   
   #plot = hovmoller_plot(values, colours, 1200, min_x, max_x, min_y, max_y, x_axis_type, y_axis_type, var_name)
   plot_width = 1200
   p = figure(width=plot_width, x_range=(min_x, max_x), y_range=(min_y, max_y), 
              x_axis_type=x_axis_type, y_axis_type=y_axis_type, 
              title="Hovmoller - %s" % (var_name))

   p.xaxis.axis_label = x_axis_label
   p.yaxis.axis_label = y_axis_label
   
   # Create an image anchored at (min_x, min_y) and set the color_mapper to map 
   # it with our palette.
   p.image(image=[values],  x=min_x, y=min_y, dw=max_x-min_x, dh=max_y-min_y, 
           color_mapper=LinearColorMapper(palette=colours, low=min_val, high=max_val))
   

   output_file(outfile, title="Hovmoller example")
   layout = hplot(legend, p)
   show(layout)
   
#END hovmoller

def timeseries(infile, outfile="time.html"):
   with open(infile) as json_file:
       df = json.load(json_file)
   json_file.close()
       
   plot_type = df['type']
   var_name = df['coverage']
   plot_units = df['units']
   plot_scale = df['scale']
   
   #date = np.array(pd.to_datetime(df['Date']).astype(np.int64) // 10**6)
   date = datetime(df['Date'])
   
   datasource = dict(date=date,
                     sdate=df['Date'],
                     mean=df['Mean'])

   if 'Standard Deviation' in df:
      # Set the errorbars
      err_xs = []
      err_ys = []
      for x, y, std in zip(date, df['Mean'], df['Standard Deviation']):
         err_xs.append((x, x))
         err_ys.append((y - std, y + std))

      datasource['err_xs'] = err_xs
      datasource['err_ys'] = err_ys
      datasource['stderr'] = df['Standard Deviation']
   
   if 'Max' in df and 'Min' in df:
      # Set the min/max envelope. 
      # We create a list of coords starting with the max for the first date then join up all
      # the maxes in date order before moving down to the min for the last date and coming
      # back to the first date.
      band_y = np.append(df['Max'],df['Min'][::-1])
      band_x = np.append(date,date[::-1])
      datasource['min'] = df['Min']
      datasource['max'] = df['Max']

   source = ColumnDataSource(data=datasource)
   
   p = figure(title="Time Series - %s" % (var_name), x_axis_type="datetime", width=1200, 
              height=400
   )
   
   # Use some custom HTML to draw our tooltip. Just put the @var placeholders where you want them.
   p.add_tools(HoverTool(tooltips="""
           <div>
               <div>
                   <span style="font-size: 12px; font-weight: bold;">Date:</span>
                   <span style="font-size: 12px; color: #966;">@sdate</span>
               </div>
               <div>
                   <span style="font-size: 12px; font-weight: bold;">Mean:</span>
                   <span style="font-size: 12px; color: #966;">@mean</span>
               </div>
               <div>
                   <span style="font-size: 12px; font-weight: bold;">Max:</span>
                   <span style="font-size: 12px; color: #966;">@max</span>
               </div>
               <div>
                   <span style="font-size: 12px; font-weight: bold;">Min:</span>
                   <span style="font-size: 12px; color: #966;">@min</span>
               </div>
               <div>
                   <span style="font-size: 12px; font-weight: bold;">Stderr:</span>
                   <span style="font-size: 12px; color: #966;">@stderr</span>
               </div>
           </div>
           """
           ))

   p.add_tools(CrosshairTool())

   p.xaxis.axis_label = 'Date'
   
   # Set up the axis label here as it writes to all y axes so overwrites the right hand one
   # if we run it later.
   p.yaxis.axis_label = "%s %s" % (var_name, plot_units)
   
   # If we want 2 Y axes then the lines below do this
   
   # Setting the second y axis range name and range
   #p.extra_y_ranges = {"foo": Range1d(start=-100, end=200)}
   # Adding the second axis to the plot.  
   #p.add_layout(LinearAxis(y_range_name="foo", axis_label='Temp.'), 'right')
   
   if 'min' in datasource:
      # Plot the max and min as a shaded band.
      # Cannot use this dataframe because we have twice as many band variables as the rest of the 
      # dataframe.
      #p.patch('band_x', 'band_y', color='#7570B3', fill_alpha=0.05, line_alpha=0, source=source)
      # So use this.
      p.patch(band_x, band_y, color='#7570B3', fill_alpha=0.05, line_alpha=0)
   
   
   # Plot the mean as line
   p.line('date', 'mean', color='blue', legend='Mean %s' % (var_name), source=source)

   # as a point
   p.circle('date', 'mean', color='red', size=3, line_alpha=0, source=source)
   
   if 'err_xs' in datasource:
      # Plot error bars
      p.multi_line('err_xs', 'err_ys', color='red', line_alpha=0.5, source=source)
   
   # Legend placement needs to be after the first glyph set up.
   # Cannot place legend outside plot.
   p.legend.location = "top_left"
   layout = vplot(p)
   
   # Example code to display the data in a table
   #columns = [
   #        TableColumn(field="date", title="Date", formatter=DateFormatter()),
   #        TableColumn(field="mean", title="Mean"),
   #    ]
   #data_table = DataTable(source=source, columns=columns, width=400, height=280)

   #layout = vplot(p, data_table)
   
   # plot the points
   output_file(outfile, 'Time Series')
   
   show(layout)
#END timeseries   

if __name__ == "__main__":
   hovmoller("testing/data/hovmoller.json")
   timeseries("testing/data/temperature.json")

