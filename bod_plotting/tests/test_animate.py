import unittest
import json
import math
import ffmpeg
import datetime
import argparse
import sys
from hashlib import sha1
from os.path import join,exists
from pprint import pprint
from PIL import Image

TARGET_DIRECTORY='../plots/'
TMP_DIRECTORY='../tmp/'
OUTPUT_DIRECTORY='../plots/'

class test_animate(unittest.TestCase):

    def test_master(self):

        # Check that all of the data files have downloaded
        def data_download_test(data_url_hash,time_slices):
            file_list=[data_url_hash+'_'+slices.replace(':','-')+'.png' for slices in time_slices]
            
            for i in file_list:
                self.assertTrue(exists(join(TMP_DIRECTORY,i)))

        # Check that the map layer has downloaded        
        def map_layer_test(map_requested,hash):
            if (map_requested):
                self.assertTrue(exists(join(TMP_DIRECTORY,hash,'map.jpg')))
        
        # Check that the borders layer has downloaded        
        def borders_layer_test(borders_requested,hash):
            if (borders_requested):
                self.assertTrue(exists(join(TMP_DIRECTORY,hash,'borders.png')))
        
        # Check that the expected output of two videos and the html exists
        def animation_outputs_exist_test(hash):
            self.assertTrue(exists(join(OUTPUT_DIRECTORY,hash+'-video.mp4')))
            self.assertTrue(exists(join(OUTPUT_DIRECTORY,hash+'-video.webm')))
            self.assertTrue(exists(join(OUTPUT_DIRECTORY,hash+'-plot.html')))

        # Check that the resolution of the videos is the same as the first data file
        def animation_resolution_test(data_url_hash,time_slices,hash):
            first_data_file_raw=time_slices[0]
            first_data_png_raw=data_url_hash+'_'+first_data_file_raw.replace(':','-')+'.png'
            first_data_png_path=TMP_DIRECTORY+first_data_png_raw
            im=Image.open(first_data_png_path)
            im_width,im_height=im.size

            mp4_path=OUTPUT_DIRECTORY+hash+'-video.mp4'
            webm_path=OUTPUT_DIRECTORY+hash+'-video.webm'

            mp4_width=ffmpeg.probe(mp4_path)['streams'][0]['width']
            mp4_height=ffmpeg.probe(mp4_path)['streams'][0]['height']
            webm_width=ffmpeg.probe(webm_path)['streams'][0]['width']
            webm_height=ffmpeg.probe(webm_path)['streams'][0]['height']

            self.assertEqual(im_width,mp4_width)
            self.assertEqual(im_width,webm_width)           
            self.assertEqual(im_height,mp4_height)
            self.assertEqual(im_height,webm_height)

        # Check that the mp4 length is (roughly) correct. It can be slightly lower and therefore we rely on the ceiling function to lift it
        def animation_video_mp4_metadata_test(time_slices,framerate,hash):
            estimated_length_seconds=math.ceil(len(time_slices)/round(framerate))
            rounded_mp4_length_seconds=math.ceil(float(ffmpeg.probe((join(OUTPUT_DIRECTORY,hash+'-video.mp4')))['streams'][0]['duration']))

            self.assertEqual(rounded_mp4_length_seconds,estimated_length_seconds)

        # Check that the webm length is (roughly) correct. It can be slightly lower and therefore we rely on the ceiling function to lift it
        def animation_video_webm_metadata_test(time_slices,framerate,hash):
            estimated_length_seconds=math.ceil(len(time_slices)/round(framerate))
            webm_time_stamp_extra_zeroes=ffmpeg.probe((join(OUTPUT_DIRECTORY,hash+'-video.webm')))['streams'][0]['tags']['DURATION']
            webm_time_stamp=webm_time_stamp_extra_zeroes[:-3]
            webm_time_stamp=datetime.datetime.strptime(webm_time_stamp,'%H:%M:%S.%f')
            rounded_microsecond=math.ceil(float('0.'+str(webm_time_stamp.microsecond)))
            rounded_webm4_length_seconds=((webm_time_stamp.hour*60*60)+(webm_time_stamp.minute*60)+(webm_time_stamp.second)+rounded_microsecond)

            self.assertEqual(rounded_webm4_length_seconds,estimated_length_seconds)

        # Handle Multiple Plots Below
        name_list=['b31d511d3a63b95850336ab1d48cf6f55c7c21c5-request.json',
                    # '01ff2097aa7559aa97b211503d835893303ef052-request.json',
                    # 'be7826f40f5c82a8e754571081c64888ac3e1a77-request.json',
                    # '0e1c8a765d6f12b5a04c529668a67d4aea38a925-request.json',
                    # '62ffed6e5b1a0fb385bfed7a6a36a7d586bcd34e-request.json',
                    # '04e48b02c416b67558bf8b37ed9329dc7c8a821a-request.json',
                    # '2a5b4f4a2e6c9595be5bfd5f427aa509d2aa5fbd-request.json'
                    ]
        
        for i in name_list:
            print(i)
            json_name = i
            json_path=TARGET_DIRECTORY+json_name
            with open (json_path) as f:
                plot_request=json.load(f)

            hash=json_name[0:json_name.find('-')]
            time_slices=plot_request['plot']['data']['series'][0]['data_source']['timesSlices']
            data_url_hash = sha1(str(plot_request['plot']['data']['series'][0]['data_source']).encode()).hexdigest()
            framerate=plot_request['plot']['framerate']

            try:
                plot_request['plot']['baseMap']
                map_requested=True
            except:
                map_requested=False

            try:
                plot_request['plot']['countryBorders']
                borders_requested=True
            except:
                borders_requested=False

            data_download_test(data_url_hash,time_slices)
            map_layer_test(map_requested,hash)
            borders_layer_test(borders_requested,hash)
            animation_outputs_exist_test(hash)
            animation_resolution_test(data_url_hash,time_slices,hash)
            animation_video_mp4_metadata_test(time_slices,framerate,hash)
            animation_video_webm_metadata_test(time_slices,framerate,hash)
            
        
if __name__=='__main__':
    unittest.main()

    #region Development
    # hash='b31d511d3a63b95850336ab1d48cf6f55c7c21c5'
    # mp4_path='./static/'+hash+'-video.webm'
    # output=ffmpeg.probe((mp4_path))
    # video_width=output['streams'][0]['width']
    # video_height=output['streams'][0]['height']

    # print(video_width,video_height)


    # png_name='1751bb35003255161ccf1ee7543a838917cb6f60_2015-10-31T00-00-00.000Z'
    # png_path=TMP_DIRECTORY+png_name+'.png'
    # im=Image.open(png_path)

    # im_width,im_height=im.size

    # print(im_width,im_height)

    #endregion

