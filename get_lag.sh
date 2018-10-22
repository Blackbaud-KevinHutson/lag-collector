#!/bin/bash

for group in "$@"
do
    kafka-consumer-groups --bootstrap-server yourBrokerUrlsHere --command-config ~/.ccloud/config --describe --group $group
done
