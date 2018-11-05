#!/bin/bash

# Run this as a one time migration of the dataStore if you already had one

# updated JSON field name. replace in old data
echo "started..."
for filename in public/data/*; do
    echo "Replacing consumerName in $filename"
    #linux -> sed -i 's/consumer_name/consumerName/g' $filename
    # max osx
    sed -i '' 's/consumer_name/consumerName/g' $filename
done
echo "Done"
