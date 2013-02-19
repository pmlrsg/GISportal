#!/bin/bash

echo "Building production version"
screen -L java -jar lib/plovr/plovr-eba786b34df9.jar build config.js
lib/jsdoc/jsdoc src/. -d ./doc/