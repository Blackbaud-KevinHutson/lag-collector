#!/bin/bash

for group in "$@"
do
    kafka-consumer-groups --bootstrap-server SASL_SSL://cp60.us-east-1.aws.confluent.cloud:9092 --command-config ~/.ccloud/config --describe --group $group
done
