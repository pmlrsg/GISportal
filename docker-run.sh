#!/bin/bash
#
#  This script is the ENTRYPOINT for the docker container; it starts a Redis daemon and
#  fires up node.
#
LOG_FILE=/var/portal/GISportal/config/app.log

# Add the plotting and extractor paths to python
export PYTHONPATH="$PYTHONPATH:/var/portal/GISportal/plotting:/var/portal/GISportal/plotting/data_extractor"

# build the app from the source files
cd /var/portal/GISportal

# redis config:
# grab the redis url from the config file; if it's `localhost`, start a local redis server
REDIS_HOST=`grep -E 'redisURL'  config/global-config-server.js | awk -F'//' '{print $2}' | awk -F':' '{print $1}'`
if [ $REDIS_HOST == 'localhost' ]; then
    /usr/bin/redis-server --daemonize yes;
fi 
# Make sure we can talk to redis
sleep 2
/usr/bin/redis-cli -h $REDIS_HOST ping "redis connected at $REDIS_HOST" >> $LOG_FILE
if [ $? -ne 0 ]; then
    echo "Cannot connect to redis server at '$REDIS_HOST'; state sharing and user authentication will not work, so exiting" >> $LOG_FILE
    exit 1
fi

source /var/portal/.nvm/nvm.sh

# start the app
while true
do
    #/usr/bin/node /var/portal/GISportal/app.js > /var/portal/GISportal/config/app.log
    #nvm run v10.24.1 --inspect-brk=0.0.0.0 /var/portal/GISportal/app.js >> $LOG_FILE
    nvm run v10.24.1 /var/portal/GISportal/app.js >> $LOG_FILE
    #nvm run v6.17.1 /var/portal/GISportal/app.js >> $LOG_FILE
    sleep 600
done
