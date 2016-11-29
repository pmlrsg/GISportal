#!/bin/bash
#
#  This script can be used to clean up an downloaded netCDF files
#  that are created during the process of creating plots or user
#  downloads. The `plottingDownloadDir` setting in config-server.js
#  is the location where these temporary files are kept; if this is 
#  not set then /tmp is used instead
# 
#  The script cleans out files more than 12 hours old if there is 
#  less than 90% disk usage, and files that are more than 1 hour old 
#  if there's more that 90% usage. If more than 90% of available 
#  disk space is used after the cleanup then a warning email is sent
#
#  It is recommended that this script is run frequently, say every
#  15 minutes, as disk space can be consumed quickly if you have 
#  multiple concurrent users all creating plots, and/or have a 
#  relatively small disk.
#
#  Example cron entry:
#
#  MAILTO=youremail@domain.com
#  * */15 * * * /path/to/GISportal/cleanup.sh 
#
#

# Set these values appropriately for your setup:

# The directory configured as the download location:
DOWNLOAD_DIR="/tmp"

# The email address to send alerts to:
MAILTO="rsgweb@pml.ac.uk"


PERCENT_FULL=$(df -h ${DOWNLOAD_DIR} | grep -o '[0-9]*[0-9]'% | sed s/%//)

if [[ $PERCENT_FULL -ge 90 ]]; then
   tmpwatch -q -m 1h ${DOWNLOAD_DIR}
   # check to see if it made any difference
   NEW_PERCENT_FULL=$(df -h ${DOWNLOAD_DIR} | grep -o '[0-9]*[0-9]'% | sed s/%//)
   if [[ $NEW_PERCENT_FULL -ge 90 ]]; then
      echo "The disk on `hostname` is currently at ${NEW_PERCENT_FULL}% even after running tmpwatch for files older that 1 hour. You need to do so something about this now" | mail -s "Diskspace on `hostname`" ${MAILTO}
   fi
fi

if [[ $PERCENT_FULL -lt 90 ]]; then
   tmpwatch -q -m 12h ${DOWNLOAD_DIR}
fi

