from curses import meta
import unittest
import json
import time
# import xmltojson
import math
# import ffmpeg
import requests
import datetime
import argparse
import sys
from bs4 import BeautifulSoup
from hashlib import sha1
from os.path import join,exists
from os import path

TARGET_DIRECTORY='../plots/'
SKIP_HTML_CHECK=['hovmollerLat','hovmollerLon','extract'] 

# @TODO Input fail messages to every assert line - Can this programatically output the hashed name under test?
# @TODO Remove the test looking for the actual time_slice_values - or are the plots failing as per scatter 

class test_animate(unittest.TestCase):

    def test_master(self):

        # Generic Tests: 
        # 1 - Data.json 
        def data_json_exists_test():
            self.assertTrue(False) # This will always fail - it is called if the data.json path was not found

        def data_status_test(data_status):
            self.assertEqual(data_status,'success')

        def data_type_test(plot_type,data_type):
            self.assertEqual(plot_type,data_type)

        def data_title_test(plot_title,data_title):
            self.assertEqual(plot_title,data_title)

        def data_matchup_log_test(plot_matchup_log,data_matchup_log):
            self.assertEqual(plot_matchup_log,data_matchup_log)

        def data_time_slices_test(plot_time_slices,data_time_stamps,data_type):
            plot_initial_date=plot_time_slices[0]
            plot_final_date=plot_time_slices[1]
            data_initial_date=data_time_stamps[0][:data_time_stamps[0].rfind('T')]
            date_final_date=data_time_stamps[-1][:data_time_stamps[-1].rfind('T')]

            self.assertEqual(plot_initial_date,data_initial_date)
            self.assertEqual(plot_final_date,date_final_date)
        

        # 2 - Plot.html
        def html_exists_test(plot_hash):
            self.assertTrue(False) # This will always fail - it is called if the data.html path was not found

        def html_bokeh_script_not_returned():
            self.assertTrue(False) # This will always fail - it is called if the data.html returns no body/script tags for bokeh
            print('No Body/Script tags found in html')

        def html_time_slices_test(plot_time_slices,docs_json):
            plot_initial_date=plot_time_slices[0]
            plot_final_date=plot_time_slices[1]
            self.assertTrue(docs_json.find(plot_initial_date)!=-1)
            # self.assertTrue(docs_json.find(plot_final_date)!=-1) # @TODO Initial date is picked up in bokeh html for scatter but not final date.
            
        # TimeSeries Specific Tests


        # Handle Multiple Plots Below
        name_list=['8b702676ea06e0bec796e24738a0f82f2bdcc57f-request.json',
                    '7f181d19d1ec83f850c73f7ca2049c2efe5821b3-request.json',
                    '039305083e4920576f42bc42401344c63b47d1b9-request.json',
                    '20b94a96fb083f2d1618cbb2a9138544a6b6c210-request.json',
                    '447b92235fe441d7b57b838ac6389228f09959bf-request.json']
        
        for i in name_list:
            print(i)
            json_name = i
            json_path=TARGET_DIRECTORY+json_name
            with open (json_path) as f:
                plot_request=json.load(f)

            plot_hash=json_name[0:json_name.find('-')]
            plot_time_slices=plot_request['plot']['data']['series'][0]['data_source']['t_bounds']
            plot_meta=plot_request['plot']['data']['series'][0]['meta']
            plot_type=plot_request['plot']['type']
            plot_title=plot_request['plot']['title']
            # plot_user_label=plot_request['plot']['data']['series'][0]['userLabel']
            plot_matchup_log=plot_request['plot']['matchup_log']

            # Tests that relate to the data.json only
            if path.exists(TARGET_DIRECTORY+plot_hash+'-data.json'):
                with open (TARGET_DIRECTORY+plot_hash+'-data.json','r') as f:
                    data_json=json.load(f)
                data_status=data_json['status']
                data_title=data_json['title']
                data_type=data_json['type']
                data_data=data_json['data'][0]['data']
                if data_type=='scatter':
                    date_time_index=2
                else:
                    date_time_index=0
                    # data_user_label=
                data_time_stamps=sorted([i[date_time_index] for i in sorted(data_data)])
                data_matchup_log=data_json['matchup_log']
                
                data_status_test(data_status)
                if ((plot_meta.find('Interval: Daily')!=-1) and (plot_type!='extract') and (plot_type!='scatter')):data_time_slices_test(plot_time_slices,data_time_stamps,data_type) # This tests only suitable if the interval is daily and there is time_slice_data in the exported data.json
                data_type_test(plot_title,data_title)
                data_title_test(plot_title,data_title)
                data_matchup_log_test(plot_matchup_log,data_matchup_log)
            else:
                data_json_exists_test() # This test will fail if there is no data-json
            
            # Tests that relate to the plot.html only
            if path.exists(TARGET_DIRECTORY+plot_hash+'-plot.html'):
                with open (TARGET_DIRECTORY+plot_hash+'-plot.html','r') as html_file:
                    soup = BeautifulSoup(html_file,'lxml')
                    try:
                        bokeh_details=str((soup.find('body')).find('script'))
                    except:
                        html_bokeh_script_not_returned()
                docs_json_raw=bokeh_details[bokeh_details.find('var docs_json = ')+len('var docs_json = '):bokeh_details.find('var render_items')]
                docs_json=docs_json_raw[:docs_json_raw.rfind(';')]

                if plot_type not in SKIP_HTML_CHECK: html_time_slices_test(plot_time_slices,docs_json) # HTML returned from these plots are in bytes
            else: 
                html_exists_test(plot_hash)


if __name__=='__main__':
    unittest.main() # Currently this runs the test script for 




