#!/bin/bash
#
#  This script is the ENTRYPOINT for the docker container; it starts a Redis daemon and
#  fires up node inspector for debugging.
#

# Add the plotting and extractor paths to python
export PYTHONPATH="$PYTHONPATH:/app/GISportal/plotting:/app/GISportal/plotting/data_extractor"

# build the app from the source files
cd /app/GISportal
grunt

npm -g install node-inspector

#start redis
/usr/bin/redis-server --daemonize yes;

# start the app
node-debug --web-host 0.0.0.0 /app/GISportal/app.js
