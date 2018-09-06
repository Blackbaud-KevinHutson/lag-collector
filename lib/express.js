var express = require('express');
var _ = require('lodash');
var moment = require('moment');
let PropertiesReader = require('properties-reader');
let properties = PropertiesReader('settings.properties');
let chart_type = properties.get('main.chart.time.type');

// FIXME: I hate this. But easiest way right now to track which container index to 
// target when generating the JavaScript charts
let current_chart_index = 1;

// Returns our data grouped by application
function groupDataByApplication(lag_data) {
    let lag_by_group = _.groupBy(lag_data, 'consumer_name');
    let number_apps = Object.keys(lag_by_group).length;
    console.log('>> Number of total apps to process = ' + number_apps);
    return lag_by_group;    
}

// Given our data grouped by application, count all topics across all applications.
function numberTotalTopics(lag_by_group) {
    let topic_count = 0;
    _.forEach(lag_by_group, function(app_data, application) {
        let grouped_topics = _.groupBy(app_data, 'topic');
        let num_topics_in_app = Object.keys(grouped_topics).length;
        topic_count += num_topics_in_app;        
    });
    console.log('>> numberTotalTopics=' + topic_count);
    return topic_count;    
}

// Build the required number of DIV containers, one to hold each chart
function buildDivContainers(num_containers) {
    let c = '';
    for (i = 1; i <= num_containers; i++) {
        c += `<div id="container${i}" style="width:100%; height:400px;"></div>`;        
    }
    return c;
}

// FIXME need to determine if unix milisecond time is OK or if we should convert to just the day?
// Ideally, you'd do this in the database, but node sqlite3 doesnt seem to support date functions
function formatLagTime(value) {
    return chart_type == 0 ? moment(value).format("DD-MMM-YYYY") : value;
}

// Simplify partitions to just what we want: lag and time
function reducePartitionsToDataPoints(partitions, partition) {
    let reduced_partitions = [];
    _.forEach(partitions, (partition_lag_item) => {
        let lag_time = formatLagTime(partition_lag_item['lag_time']);
        reduced_partitions.push([lag_time, partition_lag_item['lag']]);
    });
    return reduced_partitions;
}

// This takes a topic and a list of partitions and transforms it to a group of items in 
// a High Chart compatible "series".
function buildChartsTopicsPartitions(topic, all_partitions_lag) {
    console.log('   >> buildChartsTopicsPartitions topic=' + JSON.stringify(topic));
    //console.log('buildChartsTopicsPartitions all_partitions_lag=' + JSON.stringify(all_partitions_lag));
    let lag_grouped_by_partition = _.groupBy(all_partitions_lag, 'partition');
    let items = [];
    _.forEach(lag_grouped_by_partition, (partitions, partition) => {
        let reduced_partitions = reducePartitionsToDataPoints(partitions, partition);
        // Create a series containing with a "data" object that High Chart wants
        let series = {"series": [{data: reduced_partitions}]};
        items.push({
            "partition": partition,
            "series": series
        });    
    });
    return items;
}

// FIXME this is nice, it improves the data for us to tranform.
// but at this point it's still an intermediate format
// it feels like this could be merged into other functions??
// we have application and topic readily handy in a collection of applications
function buildChartsTopics(application, values) {
    let transformed_data = [];
    // console.log('>> values before grouping=' + JSON.stringify(values));
    let lag_by_topic = _.groupBy(values, 'topic');
    // at this point, this is a group of lag items all grouped by topic inside a single application
    // console.log('    lag_by_topic=' + JSON.stringify(lag_by_topic));
    _.forEach(lag_by_topic, (all_partitions_lag, topic) => {
        let partitions = buildChartsTopicsPartitions(topic, all_partitions_lag);
        transformed_data.push({
                "application": application,
                "topic": topic,
                "partitions": partitions
            });
    });
    return transformed_data;
}

// Given an index to target the DOM node, populate template literal with data for our chart
// index - number
// application - string
// topic - string
// series - an array of lag data points. See https://www.highcharts.com/docs/chart-concepts/series
function chartTemplate(index, application, topic, series) {
return `var myChart${index} = Highcharts.chart('container${index}', { 
    title: {text: 'Consumer Lag - ${application}'},
    subtitle: {text: 'Topic: ${topic}'}, 
    yAxis: {title: {text: 'Lag amount'}}, 
    series:${JSON.stringify(series)} });`;
}

// This will take our chart data and run it through a template to produce
// a series of JavaScript objects which create a new High Chart for each topic in an application
function transformChartDataToJavaScript(chart_topics) {
    //console.log('>> transformChartDataToJavaScript chart_topics=' + JSON.stringify(chart_topics));
    let charts_as_javascript = '';
    _.forEach(chart_topics, function(value) {
        let application = value["application"];
        let topic = value["topic"];
        let partitions = value["partitions"];
        // console.log('>> transformChartDataToJavaScript application=' + application + ' / topic=' + topic);
        let series = [];
        _.forEach(partitions, function(partition) {
            // FIXME p["series"]["series"][0] <- code smell. we don't seem to need to be nested this deep
            let partition_data = partition["series"]["series"][0];            
            Object.assign(partition_data, {"name": `P${partition["partition"]}`});
            series.push(partition_data);
        });

        charts_as_javascript += chartTemplate(current_chart_index, application, topic, series);
        current_chart_index++;
    });
    return charts_as_javascript;
}

// Takes our data grouped by application and transforms into a series of High Charts
function buildChartsAsJavaScript(lag_by_application) {
    let charts_as_javascript = '';
    // console.log('buildCharts lag_by_application=' + JSON.stringify(lag_by_application));
    _.forEach(lag_by_application, function(value, application) {
        console.log('>> building chart for application=' + JSON.stringify(application));
        // NOTE: at this level, we are in an app. it contains an array of lag numbers, one per partition
        let chart_topics = buildChartsTopics(application, value);
        charts_as_javascript += transformChartDataToJavaScript(chart_topics);;
    });
    return charts_as_javascript;
}

function start(lag_data) {
    let lag_by_application = groupDataByApplication(lag_data);
    
    // We will be building one chart per topic for each application.
    let topic_count = numberTotalTopics(lag_by_application);

    let containers = buildDivContainers(topic_count);

    // Tranform our data into a series of HighCharts
    let charts = buildChartsAsJavaScript(lag_by_application);

    var app = express();
    
    app.get('/', function (req, res) {
      let html = `
      <html>
      <head>
      <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
      <script src="https://code.highcharts.com/highcharts.js"></script>
      <script src="https://code.highcharts.com/modules/series-label.js"></script>
      <script src="https://code.highcharts.com/modules/exporting.js"></script>
      <script src="https://code.highcharts.com/modules/export-data.js"></script>
      <script type="text/javascript">
      $(function () { 
          ${charts}
    });
    </script>
    </head>
    <body>
    ${containers}
    </body>
    </html>
    `;
      res.send(html);
    })
    app.listen(3000);
}

module.exports = { start };