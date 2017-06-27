#!/bin/sh

echo "Cleaning up old profiling logs..."
rm ./isolate-*.log

echo "Running profiling script, this may take a while..."
node --prof ./profile.js

# get the generated profiling log:
PROF_FILE=$(ls -1 | grep isolate-*)

echo "Generating readable output from profiling log..."
node --prof-process $PROF_FILE > ./cpu-processed.log

echo "Open up cpu-processed.log to analyze the result."
