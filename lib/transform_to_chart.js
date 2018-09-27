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

// Given our data grouped by application, summarizes the applications and their topics
function appsAndTopicCount(lag_by_group) {
    let result = {apps: {}};
    _.forEach(lag_by_group, function(app_data, application) {
        let grouped_topics = _.groupBy(app_data, 'topic');
        result.apps[application] = Object.keys(grouped_topics);
    });
    return result;
}

function getContainerId(app, topic) {
    return `ch-${app}-${topic}`;
}

function getApplicationsFromAppsAndTopics(appsAndTopicCounts) {
    let apps = [];
    _.forEach(appsAndTopicCounts.apps, function(topics, app) {
        apps.push(app);
    });
    return apps;
}

// Build the required number of DIV containers, one to hold each chart (1 per topic)
function buildDivContainers(apps, appsAndTopicCounts) {
    let c = '';
    _.forEach(apps, (application) => {
        let topics = appsAndTopicCounts.apps[application];
        let tmp = '';
        for (i = 1; i <= topics.length; i++) {
            let div_id = getContainerId(application, topics[i-1]);
            tmp += `<div id="${div_id}" style="width:100%; height:400px;"></div>`;        
        }        
        c += tabContentTemplate(application, tmp);
    });
    return c;
}

// FIXME need to determine if unix millisecond time is OK or if we should convert to just the day?
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

// This takes our date of partitions and transforms it to a group of items in 
// a High Chart compatible "series".
function createSeriesFromTopicPartitions(topic_lag) {
    let lag_grouped_by_partition = _.groupBy(topic_lag, 'partition');
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
function buildChartsTopics(application, application_lag) {
    let transformed_data = [];
    let lag_by_topic = _.groupBy(application_lag, 'topic');
    // at this point, this is a group of lag items all grouped by topic inside a single application
    _.forEach(lag_by_topic, (topic_lag, topic) => {
        let partitions = createSeriesFromTopicPartitions(topic_lag);
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
    // zzzz
    //return `var myChart${index} = Highcharts.chart('ch-${index}', { 
    let div_id = getContainerId(application, topic);
    return `
    var myChart${index} = Highcharts.chart('${div_id}', { 
        title: {text: 'Consumer Lag - ${application}'},
        subtitle: {text: 'Topic: ${topic}'}, 
        yAxis: {title: {text: 'Lag amount'}}, 
        series:${JSON.stringify(series)} });`;
}

function tabButtonsTemplate(applications) {
    let output = '';
    _.forEach(applications, function(app) {
        output += `<button class="tablinks" onclick="openChart(event, '${app}')">${app}</button>`;
    });
    return output;
}

function tabContentTemplate(application, containers) {
    let output = '';
    output += `
        <div id="${application}" class="tabcontent">
            ${containers}
        </div>
    `;
    return output;
}

function tabsContentTemplate(lag_by_application) {
    let appsAndTopicCounts = appsAndTopicCount(lag_by_application);
    let apps = getApplicationsFromAppsAndTopics(appsAndTopicCounts);
    console.log('tabsContentTemplate apps=' + JSON.stringify(apps));
    return buildDivContainers(apps, appsAndTopicCounts);
}

// This will take our chart data and run it through a template to produce
// a series of JavaScript objects which create a new High Chart for each topic in an application
function transformChartDataToJavaScript(chart_topics) {
    let charts_as_javascript = '';
    _.forEach(chart_topics, function(value) {
        let application = value["application"];
        let topic = value["topic"];
        let partitions = value["partitions"];
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
    _.forEach(lag_by_application, function(value, application) {
        console.log('>> building chart for application=' + JSON.stringify(application));
        // NOTE: at this level, we are in an app. it contains an array of lag numbers, one per partition
        let chart_topics = buildChartsTopics(application, value);
        charts_as_javascript += transformChartDataToJavaScript(chart_topics);;
    });
    return charts_as_javascript;
}

module.exports = { groupDataByApplication, buildChartsAsJavaScript, tabButtonsTemplate, tabsContentTemplate };