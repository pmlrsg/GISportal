# from tkinter.tix import Tree
import requests
import urllib
from urlparse import urlparse
import xmltodict as x2d

import random
import string
# import xml.etree.ElementTree as ET


def form_uri_request(url_string,query_dict):
    """
    Takes in the url_string and query dictionary and returns a ready to use query
    This function also removes all empty parameters to prevent dodgey uri requests

    ### Parameters
    url_string : str
        - This is the wms_url from the request.json

    query_dict : dict
        - This is the query dictionairy made up of the wms_params from the request.json

    ### Returns 
    uri : str
        - Ready to use uri which can be used via the requests module
    """
    query_dict_with_no_nones={keys: values for keys, values in query_dict.items() if values is not None}
    query_no_url=urllib.urlencode(query_dict_with_no_nones)
    query=url_string+query_no_url
    return query

def url_split (wms_url):
    """
    Takes in the wms_url and returns its components
    
    ### Parameters
    wms_url : str
        - This is the wms_url from the request.json

    ### Returns
    obj
        - This is an object consisting of components of the `wms_url`.
    """ 
    return (urlparse(wms_url))

def convert_query_from_dict_to_string(query_dict):
    """
    Takes in a query dictionairy and returns a query string
    """
    query_string=urllib.urlencode(query_dict)
    return query_string

def random_name_generator(length):
    """
    Takes in a number and returns a random string of alphanumeric numbers/letters of that size
    This is used to increase the uniqueness of downloaded files to the temporary file
    """
    x = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(length))
    return x


if (__name__=="__main__"):
    
    # Development Down Here

    f = { 'fn' : 'aaa', 'ts' : "2015-06-15T14:45:21.982600+00:00"}
    g=urllib.urlencode(f)
    # print(g)

    MAXWIDTH = 1152 # Need to put in getresolution function to calculate
    MAXHEIGHT = 1080 # Need to put in getresolution function to calculate

    map_url_to_match='https://tiles.maps.eox.at/wms/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fjpeg&TRANSPARENT=false&LAYERS=terrain-light&wrapDateLine=true&SRS=EPSG%3A4326&WIDTH=1152&HEIGHT=1080&BBOX=-16.436%2C23.379%2C-15.546%2C24.214'
    
    map_options={'wmsUrl':'https://tiles.maps.eox.at/wms/?', 'wmsParams': {'LAYERS': 'terrain-light', 'SRS': 'EPSG:4326', 'wrapDateLine': True, 'VERSION': '1.1.1'}}

    
    map_url={}
    map_url['url']=map_options['wmsUrl'] # @TODO Need to parse url properly
    map_url['search']=None
    map_url['query']={
        'SERVICE':'WMS',
        'VERSION': map_options['wmsParams']['VERSION'], 
        'REQUEST': 'GetMap',
        'FORMAT': 'image/jpeg',
        'TRANSPARENT': False, # false lower caps before 
        'LAYERS': map_options['wmsParams']['LAYERS'],
        'wrapDateLine': map_options['wmsParams']['wrapDateLine'],
        'SRS': map_options['wmsParams']['SRS'],
        'WIDTH': MAXWIDTH,
        'HEIGHT': MAXHEIGHT,
        'BBOX': '-16.436,23.379,-15.546,24.214'
    }

    data_url_to_match='https://www.oceancolour.org/thredds/wms/CCI_ALL-v3.0-DAILY?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=chlor_a&wrapDateLine=true&SRS=EPSG%3A4326&STYLES=boxfill%2Fcci_main&NUMCOLORBANDS=255&colorscalerange=0.01%2C67&logscale=true&WIDTH=1152&HEIGHT=1080&BBOX=-16.436%2C23.379%2C-15.546%2C24.214&TIME=2015-12-31T00%3A00%3A00.000Z'


    data_options={u'wmsUrl': u'https://www.oceancolour.org/thredds/wms/CCI_ALL-v3.0-DAILY?', u'wmsParams': {u'LAYERS': u'chlor_a', u'STYLES': u'boxfill/cci_main', u'wrapDateLine': True, u'ELEVATION': None, u'NUMCOLORBANDS': 255, u'logscale': True, u'ABOVEMAXCOLOR': None, u'BELOWMINCOLOR': None, u'SRS': u'EPSG:4326', u'VERSION': u'1.1.1', u'numcolorbands': 255, u'time': u'2015-12-31T00:00:00.000Z', u'colorscalerange': u'0.01,67', u'TRANSPARENT': True}, u'layer_id': u'chlor_a__Plymouth_Marine_Laboratory1', u'threddsUrl': u'https://www.oceancolour.org/thredds/wcs/CCI_ALL-v3.0-DAILY', u't_bounds': [u'2015-10-30', u'2015-12-31'], u'bbox': u'-17.463,22.808,-15.463,24.456', u'coverage': u'chlor_a', u'autoScale': False, u'timesSlices': [u'2015-10-31T00:00:00.000Z', u'2015-11-01T00:00:00.000Z', u'2015-11-02T00:00:00.000Z', u'2015-11-03T00:00:00.000Z', u'2015-11-04T00:00:00.000Z', u'2015-11-05T00:00:00.000Z', u'2015-11-06T00:00:00.000Z', u'2015-11-07T00:00:00.000Z', u'2015-11-08T00:00:00.000Z', u'2015-11-09T00:00:00.000Z', u'2015-11-10T00:00:00.000Z', u'2015-11-11T00:00:00.000Z', u'2015-11-12T00:00:00.000Z', u'2015-11-13T00:00:00.000Z', u'2015-11-14T00:00:00.000Z', u'2015-11-15T00:00:00.000Z', u'2015-11-16T00:00:00.000Z', u'2015-11-17T00:00:00.000Z', u'2015-11-18T00:00:00.000Z', u'2015-11-19T00:00:00.000Z', u'2015-11-20T00:00:00.000Z', u'2015-11-21T00:00:00.000Z', u'2015-11-22T00:00:00.000Z', u'2015-11-23T00:00:00.000Z', u'2015-11-24T00:00:00.000Z', u'2015-11-25T00:00:00.000Z', u'2015-11-26T00:00:00.000Z', u'2015-11-27T00:00:00.000Z', u'2015-11-28T00:00:00.000Z', u'2015-11-29T00:00:00.000Z', u'2015-11-30T00:00:00.000Z', u'2015-12-01T00:00:00.000Z', u'2015-12-02T00:00:00.000Z', u'2015-12-03T00:00:00.000Z', u'2015-12-04T00:00:00.000Z', u'2015-12-05T00:00:00.000Z', u'2015-12-06T00:00:00.000Z', u'2015-12-07T00:00:00.000Z', u'2015-12-08T00:00:00.000Z', u'2015-12-09T00:00:00.000Z', u'2015-12-10T00:00:00.000Z', u'2015-12-11T00:00:00.000Z', u'2015-12-12T00:00:00.000Z', u'2015-12-13T00:00:00.000Z', u'2015-12-14T00:00:00.000Z', u'2015-12-15T00:00:00.000Z', u'2015-12-16T00:00:00.000Z', u'2015-12-17T00:00:00.000Z', u'2015-12-18T00:00:00.000Z', u'2015-12-19T00:00:00.000Z', u'2015-12-20T00:00:00.000Z', u'2015-12-21T00:00:00.000Z', u'2015-12-22T00:00:00.000Z', u'2015-12-23T00:00:00.000Z', u'2015-12-24T00:00:00.000Z', u'2015-12-25T00:00:00.000Z', u'2015-12-26T00:00:00.000Z', u'2015-12-27T00:00:00.000Z', u'2015-12-28T00:00:00.000Z', u'2015-12-29T00:00:00.000Z', u'2015-12-30T00:00:00.000Z', u'2015-12-31T00:00:00.000Z']}

    data_url={}
    data_url['url']=data_options['wmsUrl'] 
    data_url['query']={
        'SERVICE':'WMS',
        'VERSION': data_options['wmsParams']['VERSION'], 
        'REQUEST': 'GetMap',
        'FORMAT': 'image/png',
        'TRANSPARENT': True, # true lower caps before 
        'LAYERS': data_options['wmsParams']['LAYERS'],
        'wrapDateLine': data_options['wmsParams']['wrapDateLine'],
        'SRS': data_options['wmsParams']['SRS'],
        'STYLES': data_options['wmsParams']['STYLES'],
        'NUMCOLORBANDS': data_options['wmsParams']['NUMCOLORBANDS'],
        'ABOVEMAXCOLOR': data_options['wmsParams']['ABOVEMAXCOLOR'],
        'BELOWMINCOLOR': data_options['wmsParams']['BELOWMINCOLOR'],
        'colorscalerange': data_options['wmsParams']['colorscalerange'],
        'logscale': data_options['wmsParams']['logscale'],
        'WIDTH': MAXWIDTH,
        'HEIGHT': MAXHEIGHT,
        'BBOX': '-16.436,23.379,-15.546,24.214',
        'ELEVATION':data_options['wmsParams']['ELEVATION'],
        'TIME':'2015-12-31T00:00:00.000Z'
    }

    # b3hashBB='-17.463,22.808,-15.463,24.456"'

    map_query=urllib.urlencode(map_url['query'])
    # print(map_query)
    # print(map_url['url']+map_query)

    # if (map_url_to_match.lower()==(map_url['url']+map_query).lower()):
    #     # print('Exact match')
    # else:
    #     pass
        # print('Not match')
        # print(map_url_to_match)
        # print((map_url['url']+map_query).lower())


    # a=form_uri_request(data_url['url'],data_url['query'])
    # b=form_uri_request(map_url['url'],map_url['query'])

    # print(a)
    # print(b)

    # data_query=urllib.urlencode(data_url['query'])
    # print(data_url['url']+data_query)
    # print(data_url_to_match)
    # print(dir(urllib))


    a=(url_split(data_options['wmsUrl']))
    b={'SERVICE': 'WMS','REQUEST': 'GetCapabilities'}
    c=convert_query_from_dict_to_string(b)
    a=a._replace(query=c)
    d=data_options['wmsUrl']+c
    print(data_options['wmsUrl'])
    print(a.query)


    



    # tree=ET.parse(response.content.WMS_Capabilities)
    # root=tree.getroot()
    # print(root.attrib)


    # response=requests.get(d)
    # dict_of_data=x2d.parse(response.content)
    # print(dict_of_data['WMS_Capabilities']['Service']['MaxWidth'])



    