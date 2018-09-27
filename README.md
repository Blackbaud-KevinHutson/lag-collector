# lag-collector

A node based application that parses and collects lag results from Apache Kafka's `kafka-consumer-groups` CLI tool and renders the results in a web page with graphs.

## Display 
Using Express and High Charts, we can pull the previously saved lag data and track it's changes over time. 

## Persistence
Stores lag data in sqlite3. This is retrieved for charting later by the server.

## Dependencies
- This application uses node. You can install with `npm install`.
- The lag gathering method is to simply use the `kafka-consumer-groups` CLI tool that comes with Confluent Platform. This was designed to work with our Confluent Cloud deployment. Download it here: https://www.confluent.io/download. Note that if you are using this with Confluent's Cloud offering, you will also need to install their ccloud CLI tool and point `kafka-consumer-groups` at the location of your ccloud config file. You can see an example of this in `get_lag.sh` as `--command-config ~/.ccloud/config`.

## Setup
This application expects a location of lag results. 
Current recommended configration
- First, create a cron job that will run `kafka-consumer-groups` on a schedule and pipe the results to a new file each time. An example is provided in `get_lag.sh`. 
Example execution: `./get_lag.sh consumer1 consumer3 consumer3`.
This script should save the lag to `lag.files.dir`, currently `cron-out`. See `settings.properties` to change configuration options.
- Next, create a second cron job that loads the data and saves into sqlite3 on a schedule by executing `node save_lag.js`. Note that you need to set `lag.files.dir` in `settings.properties` to the directory where files are saved in the previous step.
- Create a job that will start the lag server at `node app.js`. It will pull the latest results from sqlite3 on each request.

Finally, navigate to https://localhost:3000 to see your lag chart.

## Development
If you install `supervisor` globallay, then you can run `supervisor app.js` for hot reloading.