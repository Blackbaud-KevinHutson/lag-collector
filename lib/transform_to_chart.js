let _ = require('lodash');
let moment = require('moment');
let PropertiesReader = require('properties-reader');
let properties = PropertiesReader('settings.properties');
let chart_type = properties.get('main.chart.time.type');

// FIXME: I hate this. But easiest way right now to track which container index to 
// target when generating the JavaScript charts
let current_chart_index = 1;

// Returns our data grouped by application
function groupDataByApplication(lag_data) {
    let lag_by_group = _.groupBy(lag_data, 'consumer_name');
    // FIXME another undefined issue. fix it by hack for now
    delete lag_by_group.undefined;
    return lag_by_group;    
}

function getContainerId(app, topic) {
    return `ch-${app}-${topic}`;
}

// FIXME need to determine if unix millisecond time is OK or if we should convert to just the day?
// Ideally, you'd do this in the database, but node sqlite3 doesnt seem to support date functions
function formatLagTime(value) {
    return chart_type == 0 ? moment(value).format() : value;
}

// Simplify partitions to just what we want: lag and time
function reducePartitionsToDataPoints(partitions) {
    let reduced_partitions = [];
    let i = 0;
    _.forEach(partitions, (partition_lag_item) => {
        let lag_time = formatLagTime(partition_lag_item['lag_time']);
        let lag_value = parseInt(partition_lag_item['LAG']);
        reduced_partitions.push([lag_time, lag_value]);
    });
    return reduced_partitions;
}

// This takes our date of partitions and transforms it to a group of items in 
// a High Chart compatible "series".
function createSeriesFromTopicPartitions(topic_lag) {
    let lag_grouped_by_partition = _.groupBy(topic_lag, 'PARTITION');
    let items = [];
    _.forEach(lag_grouped_by_partition, (partitions, partition) => {
        let reduced_partitions = reducePartitionsToDataPoints(partitions);
        // Create a series containing with a "data" object that High Chart wants
        let series = {"series": [{data: reduced_partitions}]};
        items.push({
            "PARTITION": partition,
            "series": series
        });    
    });
    return items;
}

// FIXME this is nice, it improves the data for us to tranform.
// but at this point it's still an intermediate format
// it feels like this could be merged into other functions??
// we have application and topic readily handy in a collection of applications
function buildChartsTopics(application, application_lag) {
    let transformed_data = [];
   let lag_by_topic = _.groupBy(application_lag, 'TOPIC');
    // at this point, this is a group of lag items all grouped by topic inside a single application
    _.forEach(lag_by_topic, (topic_lag, topic) => {
        let partitions = createSeriesFromTopicPartitions(topic_lag);
        transformed_data.push({
                "APPLICATION": application,
                "TOPIC": topic,
                "PARTITIONS": partitions
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
    let div_id = getContainerId(application, topic);
    return `
    var myChart${index} = Highcharts.chart('${div_id}', { 
        title: {text: 'Consumer Lag - ${application}'},
        subtitle: {text: 'Topic: ${topic}'}, 
        yAxis: {title: {text: 'Lag amount'}}, 
        series:${JSON.stringify(series)} });`;
}

// This will take our chart data and run it through a template to produce
// a series of JavaScript objects which create a new High Chart for each topic in an application
function transformChartDataToJavaScript(chart_topics) {
    let charts_as_javascript = '';
    _.forEach(chart_topics, function(value) {
        let application = value["APPLICATION"];
        let topic = value["TOPIC"];
        let partitions = value["PARTITIONS"];
        let series = [];
        _.forEach(partitions, function(partition) {
            // FIXME p["series"]["series"][0] <- code smell. we don't seem to need to be nested this deep
            let partition_data = partition["series"]["series"][0];            
            Object.assign(partition_data, {"name": `P${partition["PARTITION"]}`});
            series.push(partition_data);
        });

        charts_as_javascript += chartTemplate(current_chart_index, application, topic, series);
        current_chart_index++;
    });
    return charts_as_javascript;
}

function buildChartForApp(application, lag_by_application) {
    let charts_as_javascript = '';
    let chart_topics = buildChartsTopics(application, lag_by_application[application]);
    charts_as_javascript += transformChartDataToJavaScript(chart_topics);
    return charts_as_javascript;
}

module.exports = { buildChartForApp, groupDataByApplication };
