#!/bin/sh

npm install heapdump

echo "Cleaning up old heapdumps..."
rm ./*.heapsnapshot

echo "Running profiling script..."
node ./profile.js --enable-heap

echo "Open up the *.heapsnapshot files in Chrome Developer Tools to analyze."
