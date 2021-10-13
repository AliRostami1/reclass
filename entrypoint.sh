#!/bin/bash

# this script is meant to be ran from docker container
# or a linux machine with no gui

# Startup Xvfb
Xvfb -ac :99 -screen 0 1280x1024x16 > /dev/null 2>&1 &

# Export some variables
export DISPLAY=:99.0
export GOOGLE_CHROME_PATH="`which google-chrome`"
export FFMPEG_PATH="$`which ffmpeg`"
export FFPLAY="`which ffplay`"

yarn start
