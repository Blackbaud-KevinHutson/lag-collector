#!/bin/bash

echo "start collecting lag "
for group in "$@"
do
    echo "getting lag for $group"
    #echo "foo" > "cron-out/$group-`date +%s`".txt
    kafka-consumer-groups --bootstrap-server SASL_SSL://r0.cp60.us-east-1.aws.confluent.cloud:9092,r1.cp60.us-east-1.aws.confluent.cloud:9093,r2.cp60.us-east-1.aws.confluent.cloud:9094 --command-config ~/.ccloud/config --describe --group $group > "cron-out/$group~`date +%s`".txt

done

echo "done"
