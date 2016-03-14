#!/bin/bash
#
#  This runs the initial setup script, so must be run from docker interactively, e.g.
#
#  docker run -it pmlrsg/gisportal /app/GISportal/docker-install.sh
#
export SOURCE="docker"
cd /app/GISportal/
./install.sh

