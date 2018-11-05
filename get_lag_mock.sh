#!/bin/bash

# simulate output from our script by just cat'ing out the files from a test directory
for filename in samples/samples-appname/*; do
    cat $filename
done
