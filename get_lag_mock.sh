#!/bin/bash

# simulate output from our script by just cat'ing out the files from a test directory
for filename in cron-out3/*.txt; do
    cat $filename
done
