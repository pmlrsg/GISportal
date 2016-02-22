#!/bin/bash
#
#  This script is the ENTRYPOINT for the docker container; it starts a Redis daemon and
#  fires up node.
#
printf "starting... \n\n"

/usr/bin/redis-server --daemonize yes; 

IP=`awk 'NR==1 {print $1}' /etc/hosts`
GREEN='\033[0;32m'
NC='\033[0m' # No Color
printf "The GISportal application is running at ${GREEN}http://${IP}:6789${NC} \n\n"
printf "To use the application with the domain name you specified at installation time please
refer to the nginx section of the docker-readme.md file; this explains how to configure nginx to
act a proxy for external requests\n\n"

/usr/bin/node /app/GISportal/app.js > /app/GISportal/config/app.log 
