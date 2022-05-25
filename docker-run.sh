#!/bin/bash
#
#  This script is the ENTRYPOINT for the docker container; it starts a Redis daemon and
#  fires up node.
#

# Add the plotting and extractor paths to python
export PYTHONPATH="$PYTHONPATH:/var/portal/GISportal/plotting:/var/portal/GISportal/plotting/data_extractor"

# build the app from the source files
cd /var/portal/GISportal
#grunt

#start redis
/usr/bin/redis-server --daemonize yes; 

source /var/portal/.nvm/nvm.sh

# start the app
while true
do
    #/usr/bin/node /var/portal/GISportal/app.js > /var/portal/GISportal/config/app.log
    #nvm run v10.24.1 --inspect-brk=0.0.0.0 /var/portal/GISportal/app.js >> /var/portal/GISportal/config/app.log
    nvm run v10.24.1 /var/portal/GISportal/app.js >> /var/portal/GISportal/config/app.log
    nvm run v6.17.1 /var/portal/GISportal/app.js >> /var/portal/GISportal/config/app.log
    sleep 600
done
