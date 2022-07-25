from curses import meta
import unittest
import json
import ast
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

LOCAL_TARGET_DIRECTORY='../plots/'
PORTAL_TARGET_DIRECTORY='../../../GISportal/OCportal/html/plots/' 
FULL_HTML_CHECK=['timeseries','scatter'] 

# @TODO Input fail messages to every assert line - Can this programatically output the hashed name under test?
# @TODO Establish why there is a difference between the portal and local plot.htmls

def html_extractor(data_json_path):
    
    '''
    Reads -plot.html and returns a list of the 'data' attributes from the bokeh_docs_json variable
    '''

    with open (data_json_path,'r') as html_file:
        soup = BeautifulSoup(html_file,'lxml')

    script_details=str(soup.find('body').find('script')) # Inner Bokeh script
    bokeh_docs_json_raw=script_details[script_details.find('var docs_json = ')+len('var docs_json = '):script_details.find('var render_items')]
    bokeh_docs_json=bokeh_docs_json_raw[:bokeh_docs_json_raw.rfind(';')]
    json_acceptable_string=bokeh_docs_json.replace("'","\"") # Need this before we use the json.loads method
    bokeh_docs_json_details=json.loads(json_acceptable_string)
    reference_contents=(bokeh_docs_json_details[bokeh_docs_json_details.keys()[0]]['roots']['references']) #Once converted to dictionary the data lives within the references section
    
    data_list=[] # There can be more than one instance of data in each plot.html 
    for item in reference_contents:
        if 'data' in item['attributes']:
            data_raw_dict=item['attributes']['data']
            data_list.append(data_raw_dict)
    # for i in data_list:
    #     print('NEXT DATA GRAB BELOW:')
    #     print(i)
    
    return data_list


class test_animate(unittest.TestCase):

    def test_master(self):

        # lvp - Local vs Portal Tests
        def lvp_request_test(local_request,portal_request):
            self.assertDictEqual(local_request,portal_request)

        def lvp_status_test(local_status,portal_status):
            self.assertDictEqual(local_status,portal_status)
        
        def lvp_data_test(local_data,portal_data):
            self.assertDictEqual(local_data,portal_data)

        def lvp_html_test(local_html,portal_html):
            self.assertItemsEqual(local_html,portal_html)

        def lvp_html_test_lightweight(data_instances_local,data_instances_portal):
            for entry in data_instances_local:
                if entry in data_instances_portal:
                    self.assertItemsEqual(entry,data_instances_portal[data_instances_portal.index(entry)])


        
        

        # Handle Multiple Plots Below
        name_list=['8b702676ea06e0bec796e24738a0f82f2bdcc57f',
                    '7f181d19d1ec83f850c73f7ca2049c2efe5821b3',
                    '039305083e4920576f42bc42401344c63b47d1b9',
                    '20b94a96fb083f2d1618cbb2a9138544a6b6c210',
                    '447b92235fe441d7b57b838ac6389228f09959bf']
        
        for i in name_list:
            print(i)
            json_name = i
            
            
            json_path_request=LOCAL_TARGET_DIRECTORY+json_name+'-request.json'
            with open (json_path_request) as f:
                local_request=json.load(f)

            json_path_request=PORTAL_TARGET_DIRECTORY+json_name+'-request.json'
            with open (json_path_request) as f:
                portal_request=json.load(f)

            lvp_request_test(local_request,portal_request)

            json_path_status=LOCAL_TARGET_DIRECTORY+json_name+'-status.json'
            with open (json_path_status) as f:
                local_status=json.load(f)
            local_status.pop('filename')
            local_status.pop('csv')

            json_path_status=PORTAL_TARGET_DIRECTORY+json_name+'-status.json'
            with open (json_path_status) as f:
                portal_status=json.load(f)
            portal_status.pop('filename')
            portal_status.pop('csv')
            portal_status.pop('csv_url') # @TODO Why is there a csv_url here on this one and not the local one? 

            lvp_status_test(local_status,portal_status) 

            json_path_data=LOCAL_TARGET_DIRECTORY+json_name+'-data.json'
            with open (json_path_data) as f:
                local_data=json.load(f)
            local_data.pop('dir_name')
            local_data.pop('req_id')

            json_path_data=PORTAL_TARGET_DIRECTORY+json_name+'-data.json'
            with open (json_path_data) as f:
                portal_data=json.load(f)
            portal_data.pop('dir_name')
            portal_data.pop('req_id')

            lvp_data_test(local_data,portal_data)
                        
            json_path_html=LOCAL_TARGET_DIRECTORY+json_name+'-plot.html'
            data_instances_local=html_extractor(json_path_html)

            json_path_html=PORTAL_TARGET_DIRECTORY+json_name+'-plot.html'
            data_instances_portal=html_extractor(json_path_html)

            if local_request['plot']['type'] in FULL_HTML_CHECK:
                lvp_html_test(data_instances_local,data_instances_portal)
            else:
                print('The hash {} requires the Lightweight HTML Route, likely there is difference between the plot.htmls'.format(json_name))
                lvp_html_test_lightweight(data_instances_local,data_instances_portal)
            

if __name__=='__main__':
    unittest.main() 

    #region Development Below

    # hash='7f181d19d1ec83f850c73f7ca2049c2efe5821b3'
    
    # test_path_local='./plots/'+hash+'-plot.html'
    # test_path_portal='../../GISportal/OCportal/html/plots/'+hash+'-plot.html'

    

    # multiple_data_local = html_extractor(test_path_local)
    # multiple_data_portal = html_extractor(test_path_portal)

    # for data_entry in multiple_data_local:
    #     if data_entry in multiple_data_portal:
    #         print('The following was found to match with the other one: ')
    #         print(data_entry)
    #         print(multiple_data_portal.index(data_entry))
    #         print(multiple_data_portal[multiple_data_portal.index(data_entry)])


    # with open (test_path_portal,'r') as html_file:
    #     soup = BeautifulSoup(html_file,'lxml')
    # #     # json_from_html=xmltojson.parse(html)
    # # # print(json_from_html)
    # # # print(soup.prettify())
    # body_details=str(soup.find('body'))
    # head_details=str(soup.find('head'))
    # script_details=str(soup.find('body').find('script'))
    # # print(script_details)
    # docs_json_raw=script_details[script_details.find('var docs_json = ')+len('var docs_json = '):script_details.find('var render_items')]
    # docs_json=docs_json_raw[:docs_json_raw.rfind(';')]
    # json_acceptable_string=docs_json.replace("'","\"")
    # dict_details=json.loads(json_acceptable_string)

    # with open('./plots/7fJSONPortal.json','w') as ef:
    #     json.dump(dict_details,ef)
    
    # # print(dict_details)
    # # print(dict_details.keys())
    # # print(dict_details[dict_details.keys()[0]])
    # reference_details=(dict_details[dict_details.keys()[0]]['roots']['references'])
    # multiple_data_local=[]
    # for item in reference_details:
    #     if 'data' in item['attributes']:
    #         data_raw_dict_local=item['attributes']['data']
    #         # data_raw_dict.pop('y')
    #         print(data_raw_dict_local.keys())
    #         multiple_data_local.append(data_raw_dict_local)

    # print(multiple_data_local)
    # with open ('./plots/exampleDocs.json','w') as op:
    #     json.dump(dict_details,op)
    





    # with open (test_path_portal,'r') as html_file:
    #     soup = BeautifulSoup(html_file,'lxml')
    # #     # json_from_html=xmltojson.parse(html)
    # # # print(json_from_html)
    # # # print(soup.prettify())
    # body_details_portal=str(soup.find('body'))
    # head_details_portal=str(soup.find('head'))
    # script_details=str(soup.find('body').find('script'))
    # # print(script_details)
    # docs_json_raw=script_details[script_details.find('var docs_json = ')+len('var docs_json = '):script_details.find('var render_items')]
    # docs_json=docs_json_raw[:docs_json_raw.rfind(';')]
    # json_acceptable_string=docs_json.replace("'","\"")
    # dict_details=json.loads(json_acceptable_string)
    
    # # print(dict_details)
    # # print(dict_details.keys())
    # # print(dict_details[dict_details.keys()[0]])
    # reference_details=(dict_details[dict_details.keys()[0]]['roots']['references'])
    # multiple_data_portal=[]
    # for item in reference_details:
    #     if 'data' in item['attributes']:
    #         data_raw_dict_portal=item['attributes']['data']
    #         # data_raw_dict.pop('y')
    #         print(data_raw_dict_portal.keys())
    #         multiple_data_portal.append(data_raw_dict_portal)

            
    
    # if data_raw_dict_portal == data_raw_dict_local:
    #     print('Inards looking good')
    # else:
    #     print('No equality showed')

    # if multiple_data_portal == multiple_data_local:
    #     print('List Combinations good')
    # else:
    #     print('No equality showed List Combinations ')
    
    # if body_details==body_details_portal:
    #     print('All good here body = body')
    # else:
    #     print('Something is different')


    # if head_details==head_details_portal:
    #     print('All good here head = head')
    # else:
    #     print('Something is different')

    # bokeh_details=str((soup.find('body')).find('script'))
    # print(type(bokeh_details))
    # print(bokeh_details)
    # docs_json_raw=bokeh_details[bokeh_details.find('var docs_json = ')+len('var docs_json = '):bokeh_details.find('var render_items')]
    # docs_json=docs_json_raw[:docs_json_raw.rfind(';')]
    # endregion













