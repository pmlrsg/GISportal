#!/bin/bash

screen -L java -jar lib/plovr/plovr-eba786b34df9.jar build config.js
/lib/nodejs/jsdoc/jsdoc src/. -d ./doc/