#!/bin/bash
#
#  This script is the ENTRYPOINT for the docker container; it starts a Redis daemon and
#  fires up node.
#

# Add the plotting and extractor paths to python
export PYTHONPATH="$PYTHONPATH:/app/GISportal/plotting:/app/GISportal/plotting/data_extractor"

# build the app from the source files
cd /app/GISportal
#grunt

#start redis
/usr/bin/redis-server --daemonize yes; 

source /root/.nvm/nvm.sh

# start the app
while true
do
    #/usr/bin/node /app/GISportal/app.js > /app/GISportal/config/app.log
    nvm run v6.17.1 /app/GISportal/app.js >> /app/GISportal/config/app.log
    sleep 600
done
