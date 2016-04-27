import json
import numpy as np
import pandas as pd

# Temp hack to read data from CSV as the JSON is a really bad format

def convert_timeseries(infile, outfile, scale="linear", units="(degrees C)", coverage="SST"):
   
   df= pd.read_csv(infile)
   
   jdata = { 'type': 'timeseries',
             'coverage': coverage,
             'units': units,
             'scale': scale,

             'Date': df.Date.values.tolist(),
             'Min': df.Min.values.tolist(),
             'Max': df.Max.values.tolist(),
             'Mean': df.Mean.values.tolist(),
             'Median': df.Median.values.tolist(),
             'Standard Deviation': df['Standard Deviation'].values.tolist()
            }
   
   with open(outfile, 'w') as outfile:
       json.dump(jdata, outfile)

   outfile.close()
   
#END convert_timeseries

# Convert an old JSON file to the new format
def convert_hovmoller(infile, outfile, scale="linear", units="mgm^-3"):
   with open(infile) as json_file:
       json_data = json.load(json_file)
    
   # Flip the data around so it is right way up.
   data = np.transpose(json_data['output']['data'])
   latlon = np.array(data[1]).astype(np.float).tolist()
   values = np.array(data[2]).astype(np.float).tolist()

   jdata = {'type': json_data['type'],
            'coverage': json_data['coverage'],
            'units': units,
            'scale': scale,
            'Date': data[0].tolist(),
            'LatLon': latlon,
            'Value': values
           }

   with open(outfile, 'w') as outfile:
      json.dump(jdata, outfile)
  
   json_file.close()
   outfile.close()

#END convert_hovmoller
