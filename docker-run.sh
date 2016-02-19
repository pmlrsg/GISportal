#!/bin/bash
#
#  This script is the ENTRYPOINT for the docker container; it starts a Redis daemon and
#  fires up node.
#

/usr/bin/redis-server --daemonize yes; 
/usr/bin/node /app/GISportal/app.js
