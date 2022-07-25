import time
import requests
import subprocess

# @TODO Need to adapt this so that the initial payload comes from the request, NOT loaded from json

def fetch_response(hash):
    hash_request=hash+'-request.json'
    url_to_request='http://0.0.0.0:5000/app/plotting/plots/'+hash_request
    try:
        response=requests.get(url_to_request,timeout=10)
        print('Returned Request Response: {}'.format(response.content))

        if response.ok:
            # Start reading the status.json
            hash_status=response.content+'-status.json'
            status_url_to_request='http://0.0.0.0:5000/app/plotting/plots/'+hash_status

            while response.ok:
                try:
                    status_response=requests.get(status_url_to_request,timeout=10)
                    print('Returned Status: {} for hash: {}'.format(status_response.json()['state'],response.content))
                    if status_response.json()['completed']:
                        print('Process has completed for hash: {} so exiting loop'.format(response.content))
                        break
                    time.sleep(1)
                except:
                    time.sleep(0.5) # Wait for half a second before reading -status.json 
        else:
            print('Request returned something that was not a 200 code')

    except Exception as e:
            print('Something went wrong with the request - is the API spinning?')
            
if __name__=='__main__':
    spin_up_flask_api=subprocess.Popen(["python", "app.py"])
    time.sleep(2)
    print('Process ID for flask '.format(spin_up_flask_api.pid))
    print('Continue below code')

    hash='8b702676ea06e0bec796e24738a0f82f2bdcc57f'
    # hash='20b94a96fb083f2d1618cbb2a9138544a6b6c210'
    # hash='754004b7f808b0c555cfa8a0aed2e67e2186cf9b'
    # hash='b31d511d3a63b95850336ab1d48cf6f55c7c21c5'
    fetch_response(hash)
    
    # Wind down the flask app
    spin_up_flask_api.terminate()
    spin_up_flask_api.wait()






    # from pprint import pprint
    # import hashlib
    # import json

    # file_path='./plots/'+hash+'-request.json'
    # with open (file_path,'r') as f:
    #     request=json.load(f)
    # # pprint(request)

    # # with open ('./plots/b31d511python.json','w') as pyjs:
    # #     json.dump(request,pyjs)

    # # hash_value = hashlib.sha1(json.JSONEncoder(request, sort_keys=False)).hexdigest()
    # # hash_value = hashlib.sha1(str(request).encode()).hexdigest()
    # hasher = hashlib.sha1()
    # # Hash the json request, sorting keys to ensure it is always the same hash for the same request
    # hasher.update(json.dumps(request, sort_keys=True))
    # my_hash = "{}".format(hasher.hexdigest())

    # print(my_hash)

    

    # Request Development Here
    # import requests
    # url_to_request='https://www.oceancolour.org/thredds/wcs/CCI_ALL-v3.0-DAILY?Service=WCS&Format=NetCDF3&Request=GetCoverage&version=1.0.0&BBOX=-17.919,24.313,-16.677,25.807&Coverage=chlor_a&Time=2015-04-27%2F2015-12-31'
    # response_tile=requests.get(url_to_request,timeout=60,stream=True)
    # if response_tile.status_code == 200:
    #     response_tile.raw.decode_content=True
    # print(response_tile.content)
    #endregion