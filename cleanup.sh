#!/bin/bash
#
#  This script can be used to clean up downloaded netCDF files
#  that are created during the process of creating plots or user
#  downloads. The `plottingDownloadDir` setting in config-server.js
#  is the location where these temporary files are kept; if this is
#  not set then /tmp is used instead.
#
#  This script can also clean up old plot output files that are stored
#  in html/plots.
#
#  The script cleans out netCDF files more than 12 hours old and plot
#  output files more than 7 days old if there is less than 90% disk
#  usage, and files that are more than 1 hour old if there's more
#  than 90% usage. If more than 90% of available disk space is used
#  after the cleanup then a warning email is sent.
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
# The directory of the portal installation (required for deleting old plots):
PORTAL_DIR=""
# Plots older than this will be deleted:
MAX_PLOT_AGE="7d"

# The email address to send alerts to:
MAILTO="rsgweb@pml.ac.uk"


PERCENT_FULL=$(df -h ${DOWNLOAD_DIR} | grep -o '[0-9]*[0-9]'% | sed s/%//)

if [[ $PERCENT_FULL -ge 90 ]]; then
   tmpwatch -q -m 1h ${DOWNLOAD_DIR}
   # check to see if it made any difference
   NEW_PERCENT_FULL=$(df -h ${DOWNLOAD_DIR} | grep -o '[0-9]*[0-9]'% | sed s/%//)
   if [[ $NEW_PERCENT_FULL -ge 90 ]]; then
      echo "${DOWNLOAD_DIR} on `hostname` is currently at ${NEW_PERCENT_FULL}% even after running tmpwatch for files older that 1 hour. You need to do so something about this now" | mail -s "Diskspace on `hostname`" ${MAILTO}
   fi
fi

if [[ $PERCENT_FULL -lt 90 ]]; then
   tmpwatch -q -m 12h ${DOWNLOAD_DIR}
fi

if [[ ! -z $PORTAL_DIR ]]; then
   PLOT_DIR="${PORTAL_DIR}/html/plots"
   PERCENT_FULL=$(df -h ${PLOT_DIR} | grep -o '[0-9]*[0-9]'% | sed s/%//)

   if [[ $PERCENT_FULL -ge 90 ]]; then
      tmpwatch -q -m -x "${PLOT_DIR}/.gitkeep" 1h ${PLOT_DIR}
      # check to see if it made any difference
      NEW_PERCENT_FULL=$(df -h ${PLOT_DIR} | grep -o '[0-9]*[0-9]'% | sed s/%//)
      if [[ $NEW_PERCENT_FULL -ge 90 ]]; then
         echo "${PLOT_DIR} on `hostname` is currently at ${NEW_PERCENT_FULL}% even after running tmpwatch for files older that 1 hour. You need to do so something about this now" | mail -s "Diskspace on `hostname`" ${MAILTO}
      fi
   fi

   if [[ $PERCENT_FULL -lt 90 ]]; then
      tmpwatch -q -m -x "${PLOT_DIR}/.gitkeep" ${MAX_PLOT_AGE} ${PLOT_DIR}
   fi
fi