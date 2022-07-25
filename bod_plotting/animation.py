import multiprocessing
from multiprocessing import Process, Queue
from PIL import Image,ImageFont,ImageDraw,ImageColor
from os import listdir
from os.path import isfile,join,exists
import os
import subprocess

import requests
from requests.models import Response
import shutil
import xmltodict as x2d

from jinja2 import Undefined
# import ffmpeg

import url_utils as uu

import json
from hashlib import sha1
from collections import deque

MAX_WIDTH = 1920
MAX_HEIGHT = 1080

Plot_Status={
   'initialising': 'initialising',
   'resolving size':'resolving size',
   'scaling colours':'scaling colours',
   'extracting': 'extracting',
   'rendering': 'rendering',
   'building html':'building html',
   'complete': 'complete',
   'failed': 'failed'
}

# @TODO Print status of downloading/rendering to the front screen
# @TODO Cleanup function to delete old temp files
# @TODO Check that animation script stops if Polygon Bounding Box built
# @TODO Activate an equivilent logger that is in the app.js
# @TODO Create a -request.json with the information from the page. Search for @TODO below

# Handle the animation when called from the flask app
def hash_response(plot_request):
    """
    This function is called from the dedicated_python_plotting api. 
    This takes in a plot_request, returns the hashed value within a Response object and then fires off the animation function.
    The animation function is run in the background as the hash_response is returned to the api.
    When the -status.json is queried then updates as to the progress can be checked via the api.

    ### Parameters
    plot_request : dict
        - This is the dictionairy giving details of the plot_request

    ### Return
    hash_response : obj
        - This is a Response object containing the sha1 hash of the plot_request
    """
    
    hash_value = sha1(json.dumps(plot_request, sort_keys=True)).hexdigest()
    hash_response=Response()
    hash_response.status_code=200
    hash_response._content={'hash':hash_value}
    
    # with open(hash_value+'-request.json','w') as f:
    #     f.write(str(plot_request).encode('UTF-8'))

    # @TODO Set these as deafult entries to the animation function. Have these as parameters to the hash_response function
    plot_dir=r'./plots/'
    download_dir=r'./tmp/'
    log_dir=r'./log/'

    as1=multiprocessing.Process(target=animation,args=[plot_request,plot_dir,download_dir,log_dir,hash_value])
    as1.start()

    return(hash_response)


def animation(plot_request, plot_dir, download_dir, log_dir,hash):
    """
    This takes in the plot_request, plot_dir, download_dir, log_dir and hash and starts off the process of forming an animation.
    Indivdual url requests for each time slice are processed from the plot_request, then downloaded, time stamped and finally rendered into an animation.
    """
    # Replace str below with the original plot_request (i.e. not from __main__ below)
    # str='sausage' # var hash = sha1(JSON.stringify(plotRequest)); @TODO Make Conversion Here
    # sha1 hash of the request object
    # hash = sha1(str.encode()).hexdigest()

    # hash='b31d511d3a63b95850336ab1d48cf6f55c7c21c5' # @TODO This needs to pull hash from the -request.json 
    print('Processing the following job: ',hash)

    retries = {}
    status={}
    save_status_queue=deque()

    try:
        map_options=plot_request['plot']['baseMap']

        # Handle the case when the user selects the GEBCO map. Default to no map if this is selected
        if (map_options['wmsParams']['LAYERS'] == 'gebco_08_grid'): # @TODO Handle GEBCO error better 
            map_options=False
    except:
        map_options=False

    try:
        borders_options=plot_request['plot']['countryBorders']
    except:
        borders_options=False

    try:
        data_options=plot_request['plot']['data']['series'][0]['data_source']
    except:
        data_options=False

    try:
        input_framerate=plot_request['plot']['framerate']
    except:
        input_framerate=1

    data_url_hash = None

    slices=[]

    width=0
    height=0


    def get_autoscale(status,download_dir,hash,width,height):
        """
        This determines the colour scaling that will be applied to all data tiles. 
        It loops over all of the time slices, forms individual url requests and then determines the max and min values present for the chosen layer.
        It determines the ultimate minimum/maximum values across all of these layers which are then used to scale each tile appropriatly. 

        ### Returns
        autoscale : str
            - This is the min and max values found across all tiles in the string format min,max (as per the request.json)   
        """
        list_of_min=[]
        list_of_max=[]

        def make_request_for_autoscaling(queue_element): 
            url_to_request_autoscale=queue_element['uri']
            try:
                response_autoscale=requests.get(url_to_request_autoscale,timeout=10)
                dict_of_data_autoscale=json.loads(response_autoscale.content[response_autoscale.content.find('{'):response_autoscale.content.rfind('}')+1])
                try:
                    json_min=dict_of_data_autoscale['min']
                    json_max=dict_of_data_autoscale['max']
                    return_tuple=json_min,json_max
                    auto_scaling_return_queue.put(return_tuple)

                except:
                    print('Errored when reading json_min_max')

            except Exception as e:
                print ('Error in handle_request_for_autoscaling: ',e)

        if (not data_options['autoScale']):
            # If autoScale was not selected then just return empty string. This will then default to color_bands in the wmsParams
            return "" 
        
        data_url_autoscale={}
        data_url_autoscale['url']=data_options['wmsUrl'] 
        data_url_autoscale['search']=None
        data_url_autoscale['query']={
            'SERVICE':'WMS',
            'VERSION': data_options['wmsParams']['VERSION'], 
            'REQUEST': 'GetMetadata',
            'item':'minmax',
            'LAYERS': data_options['wmsParams']['LAYERS'],
            'SRS': data_options['wmsParams']['SRS'],
            'WIDTH': width,
            'HEIGHT': height,
            'BBOX': data_options['bbox'],
            'ELEVATION':data_options['wmsParams']['ELEVATION']
        }
        # Construct queue from all of the slices 
        autoscale_queue=deque()
        for slice in data_options['timesSlices']:
            data_url_autoscale['query']['TIME']=slice
            autoscale_queue.append({
                'uri':uu.form_uri_request(data_url_autoscale['url'],data_url_autoscale['query']),
            })

        # Make concurrent to send off parallel requests 
        auto_scaling_process=[]
        auto_scaling_return_queue = Queue()
        for count_as, element_as in enumerate(list(autoscale_queue)): #_as is for autoscaling prevent any nasty crossover with the queue_handler
            as1=multiprocessing.Process(target=make_request_for_autoscaling,args=[element_as])
            as1.start()
            auto_scaling_process.append(as1)

        for process_as in auto_scaling_process:
            process_as.join()

        # Loop over the queue that is built during multiprocessing to return values
        while not auto_scaling_return_queue.empty():
            temporary_holder=auto_scaling_return_queue.get()
            list_of_min.append(temporary_holder[0]) if temporary_holder[0] != '' else 1+1
            list_of_max.append(temporary_holder[1]) if temporary_holder[1] != '' else 1+1
        
        return(str(min(list_of_min))+','+str(max(list_of_max)))

    def get_resolution(map_options,borders_options,data_options):
        """
        This determines the resolution that will be applied to all tiles including any maps and borders. 
        The max widths and max heights are determined by the smallest resolution from the data, map or border layers.  
        The aspect ratio of the bounding box (ARBB) is compared with that of the max width and height (ARWH). 
        A calculation then determines the final widths and heights all of tiles used in the animation. 
        """
        
        
        max_width=MAX_WIDTH
        max_height=MAX_HEIGHT
        map_done= False
        borders_done=False
        data_done=False


        def make_request_for_scaling(wms_url,url_query,max_width,max_height):

            url_to_request=wms_url+url_query
            try:
                response=requests.get(url_to_request,timeout=10)
                dict_of_data=x2d.parse(response.content)

                if (dict_of_data) and (dict_of_data['WMS_Capabilities']) and (dict_of_data['WMS_Capabilities']['Service']):
                    if (dict_of_data['WMS_Capabilities']['Service']['MaxWidth']):
                        layer_max_width=dict_of_data['WMS_Capabilities']['Service']['MaxWidth']
                        if (layer_max_width<max_width):
                            max_width=layer_max_width
                    if (dict_of_data['WMS_Capabilities']['Service']['MaxHeight']):
                        layer_max_height=dict_of_data['WMS_Capabilities']['Service']['MaxHeight']
                        if (layer_max_height<max_height):
                            max_height=layer_max_height
                    return max_width, max_height
                else:
                    return max_width, max_height
            except Exception as e:
                return max_width, max_height

        # Getting the map capabilities
        if (map_options):
            map_url_parse=uu.url_split(map_options['wmsUrl'])
            map_url_parse.search=None
            map_query={
                'SERVICE':'WMS',
                'REQUEST':'GetCapabilities'
            }
            map_url_parse=map_url_parse._replace(query=uu.convert_query_from_dict_to_string(map_query))
            max_width, max_height = make_request_for_scaling(map_options['wmsUrl'],map_url_parse.query,max_width, max_height)
            map_done=True
        else:
            map_done=True

        # Getting the borders capabilities
        if (borders_options):
            borders_url_parse=uu.url_split(borders_options['wmsUrl'])
            borders_url_parse.search=None
            borders_query={
                'SERVICE':'WMS',
                'REQUEST':'GetCapabilities'
            }
            borders_url_parse=borders_url_parse._replace(query=uu.convert_query_from_dict_to_string(borders_query))

            max_width,max_height=make_request_for_scaling(borders_options['wmsUrl'],borders_url_parse.query,max_width,max_height)
            borders_done=True
        else:
            borders_done=True

        # Getting the data layer capabilities
        data_url_parse=uu.url_split(data_options['wmsUrl'])
        data_url_parse.search=None
        data_query={
            'SERVICE':'WMS',
            'REQUEST':'GetCapabilities'
        }
        data_url_parse=data_url_parse._replace(query=uu.convert_query_from_dict_to_string(data_query))

        max_width,max_height=make_request_for_scaling(data_options['wmsUrl'],data_url_parse.query,max_width,max_height)
        data_done=True

        if (map_done and borders_done and data_done):
            bbox_arr=data_options['bbox'].split(',')
            bbox_Width = float(bbox_arr[2]) - float(bbox_arr[0])
            bbox_Height = float(bbox_arr[3]) - float(bbox_arr[1])

            if (bbox_Height/bbox_Width) <= (max_height/max_width):
                height=2*round(((bbox_Height/bbox_Width)*max_width)/2)
                width=max_width
            else :
                height=max_height
                width = 2*round(((bbox_Width/bbox_Height)*max_height)/2)

            return width,height


    def read_status(plot_dir,hash):
        """
        Read the status.json
        """
        try:
            status_path = os.path.join(plot_dir,hash +'-status.json')
            with open (status_path) as f:
                status_string=json.load(f) 

            return(status_string)
        except Exception as e:
            print ('Error in read_status: ',e)
            return('')
    
    
    def update_status(status,state, message, percentage, min_remaining, traceback):
        """
        Update the status dictionary with current progress.
        Then call the save_status function to save status dictionary to file.
        """
        
        try:
            status_path = os.path.join(plot_dir,hash +'-status.json')
            if (not status):
                status={'job_id':hash,
                        'completed':False}
            else:
                pass

            status['message']=message or ''
            status['traceback']=traceback or ''
            status['state']=state

            if (state == Plot_Status['complete'] or state == Plot_Status['failed']):
                status['completed']=True
                status['percentage']=100
                status['minutes_remaining']=0
            else:
                status['completed']=False
                status['percentage']=percentage or 0
                status['minutes_remaining']= min_remaining or -1
        
        except Exception as e:
            print('Something went wrong in the update_status - Error1 ',e)  
            
        try:    
            save_status(status)
        except Exception as e:
            print('Something went wrong in the update_status - Error2 ',e) 
            
    def save_status(status):
        """
        Save the status dictionary to the status.json
        """
        json_status_output_path=os.path.join(plot_dir,hash +'-status.json')
        with open(json_status_output_path,'w') as f:
            json.dump(status,f)

    def download_tiles(status,download_dir,hash,width,height,color_scale=''):
        """
        This function builds up the queue for all of the tiles to be downloaded.
        Data is extracted from the request.json 
        """

        download_queue = deque()
        hash_dir = os.path.join(download_dir,hash)

        map_downloaded=False
        borders_downloaded=False
        slices_downloaded=0
        
        # Map Request URL:
        map_url={}

        if(map_options):
            map_url['url']=map_options['wmsUrl'] 
            map_url['search']=None
            map_url['query']={
                'SERVICE':'WMS',
                'VERSION': map_options['wmsParams']['VERSION'], 
                'REQUEST': 'GetMap',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': False, 
                'LAYERS': map_options['wmsParams']['LAYERS'],
                'wrapDateLine': map_options['wmsParams']['wrapDateLine'],
                'SRS': map_options['wmsParams']['SRS'],
                'WIDTH': width,
                'HEIGHT': height,
                'BBOX': data_options['bbox']
            }

        # Borders Request URL:
        borders_url={}

        if(borders_options):
            borders_url['url']=borders_options['wmsUrl'] 
            borders_url['search']=None
            borders_url['query']={
                'SERVICE':'WMS',
                'VERSION': borders_options['wmsParams']['VERSION'], 
                'REQUEST': 'GetMap',
                'FORMAT': 'image/png',
                'TRANSPARENT': True, 
                'LAYERS': borders_options['wmsParams']['LAYERS'],
                'STYLES': borders_options['wmsParams']['STYLES'],
                'SRS': borders_options['wmsParams']['SRS'],
                'WIDTH': width,
                'HEIGHT': height,
                'BBOX': data_options['bbox']
            }
            if (map_options):
                borders_url['query']['wrapDateLine']=map_options['wmsParams']['wrapDateLine']
            
            print('CHECK HERE ',borders_url['query']['WIDTH'])

        # Data Layer Request URL
        data_url={} # @TODO Defined in autoscalein JS version

        data_url['url']=data_options['wmsUrl'] 
        data_url['search']=None
        data_url['query']={
            'SERVICE':'WMS',
            'VERSION': data_options['wmsParams']['VERSION'], 
            'REQUEST': 'GetMap',
            'FORMAT': 'image/png',
            'TRANSPARENT': True,
            'LAYERS': data_options['wmsParams']['LAYERS'],
            'wrapDateLine': data_options['wmsParams']['wrapDateLine'],
            'SRS': data_options['wmsParams']['SRS'],
            'STYLES': data_options['wmsParams']['STYLES'],
            'NUMCOLORBANDS': data_options['wmsParams']['NUMCOLORBANDS'],
            'ABOVEMAXCOLOR': data_options['wmsParams']['ABOVEMAXCOLOR'],
            'BELOWMINCOLOR': data_options['wmsParams']['BELOWMINCOLOR'],
            'colorscalerange': data_options['wmsParams']['colorscalerange'] if color_scale =='' else color_scale,
            'logscale': data_options['wmsParams']['logscale'],
            'WIDTH': width,
            'HEIGHT': height,
            'BBOX': data_options['bbox'],
            'ELEVATION':data_options['wmsParams']['ELEVATION']
        }
        
        data_url_hash = sha1(str(data_options).encode()).hexdigest()

        # update_status(status,Plot_Status['extracting'],'Downloading time slices',"","","")
        # Create the hash directory 
        try:
            os.makedirs(hash_dir)
        except Exception as e:
            print('Directory already exists, doing nothing')
            print('Something went wrong in download tiles #1: ',e)
        
        # Push the map to the queue
        if (map_options):
            download_queue.append({
                'uri':uu.form_uri_request(map_url['url'],map_url['query']),
                'dir':hash_dir,
                'filename':'map.jpg',
                'id':'map',
                'is_data_layer':False
            })
        # Push the borders to the queue
        if (borders_options):
            download_queue.append({
                'uri':uu.form_uri_request(borders_url['url'],borders_url['query']),
                'dir':hash_dir,
                'filename':'borders.png',
                'id':'borders',
                'is_data_layer':False
            })
        # Push all of the data layer slices to the queue
        for value in slices:
            data_url['query']['TIME']=value
            filename=data_url_hash+'_'+value.replace(':','-')+'.png'
            download_queue.append({
                'uri':uu.form_uri_request(data_url['url'],data_url['query']),
                'dir':download_dir,
                'filename':filename,
                'id':value,
                'is_data_layer':True
            })

        return(download_queue)


    def download_decision(options):
        """
        This function decides whether the tile has already been downloaded.
        If it does not exist then a fresh request is sent off to download it.
        Once downloaded, the tiles are sent off to be timestamped.  
        If there are issues downloading a tile, then 3 additional requests are made.  
        """
        def download_retry(options):

            try:
                retry_count=options['retries']
                retry_count+=1
                options['retries']=retry_count
            except Exception as d:
                options['retries']=0

            if options['retries']<4:
                make_request_for_download(options)
            else:
                print('Max Retries Reached - Failed to Download File for: ',options['id'])
        
        def make_request_for_download(options):
            url_to_request=options['uri'] 
            tempory_file_name=options['temp_path']
            
            try:
                response_tile=requests.get(url_to_request,timeout=60,stream=True)
                if response_tile.status_code == 200:
                    response_tile.raw.decode_content=True
                    with open(tempory_file_name,'wb') as f:
                        shutil.copyfileobj(response_tile.raw,f)

                    try:
                        time_stamper(options)
                    except Exception as e:
                        print('Something went wrong trying to send file to the timstamper')
                        print(e)

                else:
                    print('Something went wrong with the download - redirecting to download_retry')
                    download_retry(options)



            except Exception as e:
                print('Errored here in the make_request_for_download: ',e)
        
        
        options['download_path']=join(options['dir'],options['filename'])
        
        if (options['is_data_layer']):
            if (exists(options['download_path'])):
                options['is_existing']=True
                print('Found the file and preventing download')
            else:
                options['is_existing']=False
                options['temp_path']=join(options['dir'],'tmp_'+hash+'_'+uu.random_name_generator(32)+'.png')

                try:
                    make_request_for_download(options)

                except Exception as e:
                    print('Errored sending data layer request: ',e)

        else:

            if (exists(options['download_path'])):
                options['is_existing']=True
                print('Found the map/borders file and preventing download')
            else:
                options['is_existing']=False 

                if (options['id']=='map'):
                    options['temp_path']=join(options['dir'],'tmp_'+hash+'_'+uu.random_name_generator(32)+'.jpg')
                else:
                    options['temp_path']=join(options['dir'],'tmp_'+hash+'_'+uu.random_name_generator(32)+'.png')
                
                print('Map/borders not found so about to make_request')
                make_request_for_download(options)
    


    # Deprecate the imageReady equivilent since -status.json is updated in the queue_handler
    # Deprecate the downloadComplete since retires handled in download_decision  

    def download_complete(options):
        if (options['id'] == 'map'):
            map_downloaded = True
        elif (options['id'] == 'borders'):
            borders_downloaded= True
        else:
            if (options['is_exisiting']):
                # @TODO Need to do hard linking here for simulateous downloads
                pass
            else:
                # @TODO Fork this timestamper into a child process - do we need to?
                # Send the image to the timestamper
                pass

    def queue_handler(download_queue):
        """
        This function handles the concurrent download of all tiles in the download queue

        ### Parameters
        download_queue : queue object
            - This is the download_queue returned from the download_tiles function
        """

        print('Download Queue: ')
        print('Download Queue Length: ',len(list(download_queue)))
        
        processes=[]
        # Bring in concurrency here 
        for count, element in enumerate(list(download_queue)):
            # print (element)
            update_status(status,Plot_Status['extracting'],'Downloading layer '+str(count+1)+' of '+str(len(list(download_queue))),"","","")
            p=multiprocessing.Process(target=download_decision, args=[element])
            p.start()
            processes.append(p)

        for count,process in enumerate(processes):
            process.join() # This method ensures that all processing is done before moving on to script below. 


    def create_animation_from_images(hash,download_queue,map_options,borders_options,data_options,input_framerate):
        """
        This function combines all of the downloaded tiles into an animation. 
        The map and border layers are used as base layers with all of the data layers placed on top.
        """
        def make_subprocess_call(ffmpeg_string):
            p=subprocess.call(ffmpeg_string,shell=True) # @TODO Replace this with list of arguements as per https://www.youtube.com/watch?v=2Fp1N6dof0Y
        
        update_status(status,Plot_Status['rendering'],'Starting render',"","","")

        data_url_hash=download_queue[-1]['filename'][0:download_queue[-1]['filename'].find('_')]
        print(hash,data_url_hash)

        # Define FFMPEG parameters
        if (input_framerate>1):
            input_framerate=round(input_framerate) # Round the framerate to an integer number to prevent issues with FFMPEG 

        # Determine bitrate for WebM based on framerate
        if (input_framerate<=5):
            max_webm_bitrate=' -b:v 12M '
        elif (input_framerate<=10):
            max_webm_bitrate=' -b:v 20M '
        elif (input_framerate<=15):
            max_webm_bitrate=' -b:v 25M '
        elif (input_framerate<=20):
            max_webm_bitrate=' -b:v 30M '
        elif (input_framerate<=25):
            max_webm_bitrate=' -b:v 35M '
        else:
            max_webm_bitrate=' -b:v 45M ' 

        framerate=input_framerate
        map_text=' -i '+join(download_dir,hash+"/map.jpg") if (map_options) else ''
        borders_text=' -i '+join(download_dir,hash+"/borders.png") if (borders_options) else ''
        data_text=' -thread_queue_size 512 -pattern_type glob -framerate '+str(framerate)+' -i '+download_dir+data_url_hash+'"_*.png"'
        output_text_mp4=join(plot_dir,hash+"-video.mp4") # @TODO Change so that outputs go to outputs folder not static
        
        # @TODO Make the webm output function
        webm_string=' -crf 15 -threads 1 -speed 1 -quality good -pix_fmt yuv420p '

        output_text_webm=join(plot_dir,hash+"-video.webm") # @TODO Change so that outputs go to outputs folder not static

        if (map_options and borders_options and data_options): # Map/Borders/Data Case
            filter_text=' -filter_complex "[0][1]overlay=x=0:y=0[v1];[v1][2]overlay=x=0:y=0[v2]" -map "[v2]" '
        
        elif (map_options and data_options): # Map/Data Case
            filter_text=' -filter_complex "[0][1]overlay=x=0:y=0[v1]" -map "[v1]" '

        elif (borders_options and data_options): # Borders/Data Case
            filter_text=' -filter_complex "[0]split=2[bg][fg];[bg]drawbox=c=black@1:replace=1:t=fill[bg];[bg][fg]overlay=format=auto[v1];[v1][1]overlay=x=0:y=0[v2]" -map "[v2]" '    # -c:a -map [v1]
            
        else: # Data only Case
            filter_text=' '
        print('Filter Text: ',filter_text)    
        
        subprocess_string_mp4='ffmpeg -y '+map_text+borders_text+data_text+filter_text+output_text_mp4 # The '-y' flag autooverwrites any exisiting animation (DEV)
        subprocess_string_webm='ffmpeg -y '+map_text+borders_text+data_text+filter_text+webm_string+max_webm_bitrate+output_text_webm # The '-y' flag autooverwrites any exisiting animation (DEV)
        
        try:
            update_status(status,Plot_Status['rendering'],'Rendering animation',"","","")

            # Run these concurrently
            
            c=multiprocessing.Process(target=make_subprocess_call,args=[subprocess_string_mp4])
            c.start()
            c=multiprocessing.Process(target=make_subprocess_call,args=[subprocess_string_webm])
            c.start()
            c.join()
            c.join()

            update_status(status,Plot_Status['rendering'],'Finished rendering',"","","")
        except Exception as e:
            update_status(status,Plot_Status['rendering'],e,"","","")
            print('Errored whilst rendering ',e)

    # region DEVELOPMENT 

    # practise_map={'id': 'map','is_data_layer': False, 'uri': u'https://tiles.maps.eox.at/wms/?LAYERS=terrain-light&wrapDateLine=True&WIDTH=1310&SERVICE=WMS&FORMAT=image%2Fjpeg&REQUEST=GetMap&HEIGHT=1080&SRS=EPSG%3A4326&VERSION=1.1.1&BBOX=-17.463%2C22.808%2C-15.463%2C24.456&TRANSPARENT=False', 'dir': './tmp/b31d511d3a63b95850336ab1d48cf6f55c7c21c5', 'filename': 'map.jpg'}
    # practise_data={'id': u'2015-12-31T00:00:00.000Z', 'is_data_layer': True, 'uri': u'https://www.oceancolour.org/thredds/wms/CCI_ALL-v3.0-DAILY?LAYERS=chlor_a&STYLES=boxfill%2Fcci_main&wrapDateLine=True&SERVICE=WMS&FORMAT=image%2Fpng&logscale=True&REQUEST=GetMap&SRS=EPSG%3A4326&HEIGHT=1080&WIDTH=1310&VERSION=1.1.1&BBOX=-17.463%2C22.808%2C-15.463%2C24.456&NUMCOLORBANDS=255&TIME=2015-12-31T00%3A00%3A00.000Z&colorscalerange=0.01%2C67&TRANSPARENT=True', 'dir': './tmp/b31d511d3a63b95850336ab1d48cf6f55c7c21c5', 'filename': u'aa715ae4869b98ac6bbe9f55bc3e15e1f12683ec_2015-12-31T00-00-00.000Z.png'}
    # practise_data_fault={'id': u'2015-12-31T00:00:00.000Z', 'is_data_layer': True, 'uri': u'https://www.oceancolour.org/thredds/wms/CCI_ALL-v3.0-DAILY?LAY1ERS=chlor_a&STYLES=boxfill%2Fcci_main&wrapDateLine=True&SERVICE=WMS&FORMAT=image%2Fpng&logscale=True&REQUEST=GetMap&SRS=EPSG%3A4326&HEIGHT=1080&WIDTH=1310&VERSION=1.1.1&BBOX=-17.463%2C22.808%2C-15.463%2C24.456&NUMCOLORBANDS=255&TIME=2015-12-31T00%3A00%3A00.000Z&colorscalerange=0.01%2C67&TRANSPARENT=True', 'dir': './tmp/b31d511d3a63b95850336ab1d48cf6f55c7c21c5', 'filename': u'aa715ae4869b98ac6bbe9f55bc3e15e1f12683ec_2015-12-31T00-00-00.000Z.png'}
    # download_decision(practise_data_fault)
    #endregion 

    # region ----------------------------------- PRODUCTION -----------------------------------
    # Code below fires off the defined functions above sequentially in order to produce animation
    
    # @TODO Export errors to update status
     
    # INITIALISATION: Check that the file doesn't already exist and pull out additional parameters


    if (read_status(plot_dir,hash) == Plot_Status['failed']) or (not read_status(plot_dir,hash)):
        print('Request file, not found so making one now')
        # This is a new plot or previously it has failed @TODO When formally used will need to handle this 
        json_request_output_path = os.path.join(plot_dir,hash +'-request.json')
        # with open(json_request_output_path,'w') as f:
            # json.dump(plot_request,f)

    else:
        print('Animation already exists so closing graciously')
        return
        # @TODO End the process graciously without crashing Portal
    
    update_status(status,Plot_Status['initialising'],"","","","")
    slices = sorted(set(data_options['timesSlices'])) # Need to sort here since the set function jumbles the order

    if((data_options['bbox'][0:7])=='POLYGON'):
        print('Unable to make animation for irregular polygons so closing graciously')
        return
        # @TODO End the process graciously without crashing Portal

    
    # RESOLVING SIZE: Calculate the resolution for all tiles

    update_status(status,Plot_Status['resolving size'],"","","","")
    width,height=get_resolution(map_options,borders_options,data_options)
    # width=MAX_WIDTH # DEV purposes
    # height=MAX_HEIGHT # DEV purposes

    # SCALING COLOURS: Determine the colour bands to use for all data tiles

    update_status(status,Plot_Status['scaling colours'],"","","","")
    color_scale=get_autoscale(status,download_dir,hash,int(width),int(height))

    # DOWNLOAD TILES: Determine the download parameters, build a download queue and then make indivdual requests

    update_status(status,Plot_Status['extracting'],'Downloading time slices',"","","")
    download_queue=download_tiles(status,download_dir,hash,int(width),int(height),color_scale)
    queue_handler(download_queue)
    # exampleOptions=[{'download_path': u'./tmp/b31d511d3a63b95850336ab1d48cf6f55c7c21c5/e2077f5176b40d45abd42f9f8983f7e552c9799c_2015-12-31T00-00:00.000Z.png', 'is_data_layer': True, 'uri': u'https://www.oceancolour.org/thredds/wms/CCI_ALL-v3.0-DAILY?LAYERS=chlor_a&STYLES=boxfill%2Fcci_main&wrapDateLine=True&SERVICE=WMS&FORMAT=image%2Fpng&logscale=True&REQUEST=GetMap&SRS=EPSG%3A4326&HEIGHT=1080&WIDTH=1310&VERSION=1.1.1&BBOX=-17.463%2C22.808%2C-15.463%2C24.456&NUMCOLORBANDS=255&TIME=2015-12-31T00%3A00%3A00.000Z&colorscalerange=0.01%2C67&TRANSPARENT=True', 'temp_path': './tmp/b31d511d3a63b95850336ab1d48cf6f55c7c21c5/tmp_b31d511d3a63b95850336ab1d48cf6f55c7c21c5_9enmBTLtGy5gsOT9oH0zzPelfKT9Uczs.png', 'filename': u'aa715ae4869b98ac6bbe9f55bc3e15e1f12683ec_2015-12-31T00-00-00.000Z.png', 'id': u'2015-12-31T00:00:00.000Z', 'dir': './tmp/b31d511d3a63b95850336ab1d48cf6f55c7c21c5', 'is_existing': False},{}]
    
    # RENDER ANIMATION: Collates all of the downloaded files into an animation 
    
    create_animation_from_images(hash,download_queue,map_options,borders_options,data_options,input_framerate)
    
    # BUILD HTML: Create a html which will act to place the exported .webm and .mp4.

    update_status(status,Plot_Status['building html'],"","","","")
    build_html(hash,plot_dir)

    update_status(status,Plot_Status['complete'],"","","","")
    return
    # endregion

def time_stamper(options):
    """
    Extracts a file location and time_slice from the input and stamps the appropriate image with the date/time stamp
    """
    text_font=ImageFont.truetype('FreeMono.ttf',24)
    label=options['id']
    temp_path=options['temp_path']
    
    if (options['is_data_layer']):
        with Image.open(temp_path) as indexed_image:
            rgb_image=indexed_image.convert('RGBA')
            edit_image=ImageDraw.Draw(rgb_image)
            edit_image.text((10,10),label,'black',font=text_font)
            edit_image.text((11,11),label,'white',font=text_font)
        
        rgb_image.save(temp_path)
    os.rename(temp_path,options['download_path'])

def build_html(hash,plot_dir):
    """
    Writes a -plot.html file to host the webm and mp4 videos 
    """
    html_path=join(plot_dir,hash+'-plot.html')
    # video = '<video controls><source src="plots/' + hash + '-video.mp4" type="video/mp4"/><source src="plots/' + hash + '-video.webm" type="video/webm"></video>'
    video = "<video controls><source src={{ url_for('static', filename='"+hash+"-video.mp4') }} type='video/mp4'><source src={{ url_for('static', filename='"+hash+"-video.webm') }} type='video/webm'>"
    html = '{% extends "layout.html" %}{% block content %} <!DOCTYPE html><html lang="en-US"><body><div id="plot">' + video + '</div></body></html> {% endblock content %} '
    
    # html = '<!DOCTYPE html><html lang="en-US"><body><div id="plot">' + video + '</div></body></html> '
    # html = '{% extends "layout.html" %}<body><div id="plot">' + video + '</div></body>'

    with open(html_path,'w') as f:
        f.write(html.encode('UTF-8'))

if (__name__=="__main__"):
    
    # Development Down Here

    # @TODO Import filename as a argV

    # region Single JSON
    json_name='b31d511d3a63b95850336ab1d48cf6f55c7c21c5-request.json'
    # # json_name='01ff2097aa7559aa97b211503d835893303ef052-request.json'
    # # json_name='45d54d03d2f786fe3a723d9939b0ba80bcb2b825-request.json'
    # # json_name='be7826f40f5c82a8e754571081c64888ac3e1a77-request.json'
    # # json_name='0e1c8a765d6f12b5a04c529668a67d4aea38a925-request.json'
    # # json_name='62ffed6e5b1a0fb385bfed7a6a36a7d586bcd34e-request.json'
    # # json_name='04e48b02c416b67558bf8b37ed9329dc7c8a821a-request.json'
    # # json_name='2a5b4f4a2e6c9595be5bfd5f427aa509d2aa5fbd-request.json'

    # # json_name='e7edd534744bff721d487d601110bba8ba9564f4-request.json'

    json_path='./plots/'+json_name
    hash=json_name[0:json_name.find('-')]

    with open (json_path) as f:
        plot_request=json.load(f)

    plot_dir=r'./plots/'
    download_dir=r'./tmp/'
    log_dir=r'./log/'

    animation(plot_request,plot_dir,download_dir,log_dir,hash)
    #endregion 

    # response=hash_response('random_string')
    # print(response.content)

    # region Multiple JSONs
    # json_list=['b31d511d3a63b95850336ab1d48cf6f55c7c21c5-request.json',
    #             '01ff2097aa7559aa97b211503d835893303ef052-request.json',
    #             'be7826f40f5c82a8e754571081c64888ac3e1a77-request.json',
    #             '0e1c8a765d6f12b5a04c529668a67d4aea38a925-request.json',
    #             '62ffed6e5b1a0fb385bfed7a6a36a7d586bcd34e-request.json']

    # for json_name in json_list:
    #     json_path='./plots/'+json_name
    #     hash=json_name[0:json_name.find('-')]

    #     with open (json_path) as f:
    #         plot_request=json.load(f)

    #     plot_dir=r'./plots/'
    #     download_dir=r'./tmp/'
    #     log_dir=r'./log/'

    #     animation(plot_request,plot_dir,download_dir,log_dir,hash)
    #endregion 
    



