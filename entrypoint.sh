#!/bin/bash

# this script is meant to be ran from docker container
# or a linux machine with no gui

# Startup Xvfb
Xvfb -ac :99 -screen 0 1920x1080x24 1> /dev/null 2>&1 &

# Export some variables
export DISPLAY=:99.0

# check if out directory exists
if [ ! -d out ]; then 
    mkdir out
fi

# check if we're running inside a docker container
# if we are then set the envs
if [ -f /.dockerenv ]; then
    export GOOGLE_CHROME_PATH="`which google-chrome`"
    export FFMPEG_PATH="$`which ffmpeg`"
    export FFPLAY="`which ffplay`"
fi

yarn run $1
