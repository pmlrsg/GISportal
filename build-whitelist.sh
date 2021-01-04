#!/bin/bash
#
# This script will find all domains used by configs and append them to the proxy whitelist.
# If the whitelist doesn't exist at server startup, this script is run by the server after copying in the default whitelist

find -L ./config -name "*.json"\
   -not -name "*overview.json"\
   -not -name "*_walkthrough.json"\
   -not -name "*vectorLayers.json"\
   -not -name "*dictionary.json"\
   -not -name "members.json"\
   | sed  "s|-.*$||g"\
   | sed "s|.*/||g"\
   | sed 's|$|/**|'\
   | sort\
   | uniq\
   >> ./config/proxy-whitelist.txt
