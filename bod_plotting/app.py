from flask import Flask,render_template
from os.path import join
import time
import animation as an
import plots as pl
import json

app = Flask(__name__, static_folder='static')

PLOTTING_DESTINATION=join("./plots/")
PLOT_DOWNLOAD_DIRECTORY=join("./tmp/")

@app.route("/")
@app.route("/home")
def hello_world():
    heading_text='This is the front page'
    return render_template('home.html',heading2=heading_text,title='Front Page')

@app.route("/app/plotting/plots/<path:file_name>") 
def use_original_python_script_api(file_name):  
    file_name=PLOTTING_DESTINATION+file_name
    if file_name.rfind('request')!=-1:
        with open(file_name) as f:
            payload=json.load(f) # @TODO Logic to handle animation or regular plot
            plot_type=payload['plot']['type']
        print('Request JSON Looks like: {}'.format(payload))
        print('Request type is {}'.format(plot_type))
        if plot_type=='animation':
            returned_hash_object=an.hash_response(payload)
            hash_returned=returned_hash_object.content['hash']
        else:
            returned_plot_object=pl.prepare_plot_flask(payload,PLOTTING_DESTINATION)
            hash_returned=returned_plot_object['req_hash']
        return (hash_returned)
    elif file_name.rfind('status')!=-1:
        try:
            with open(file_name) as f:
                read_status=json.load(f)
            return (read_status)
        except:
            print('No -status.json found so returning an empty string')
            return ('')
if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000)



