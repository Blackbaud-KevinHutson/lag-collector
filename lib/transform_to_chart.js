let _ = require('lodash');
let moment = require('moment');
const settings = require('./settings');
let chartType = settings['chart.time.type'];

// Returns our data grouped by application
function groupDataByApplication (lagData) {
  let lagByGroup = _.groupBy(lagData, 'consumerName');
  // FIXME another undefined issue. fix it by hack for now
  delete lagByGroup.undefined;
  return lagByGroup;
}

function getContainerId (app, topic) {
  return `ch-${app}-${topic}`;
}

// FIXME need to determine if unix millisecond time is OK or if we should convert to just the day?
// Ideally, you'd do this in the database, but node sqlite3 doesnt seem to support date functions
function formatLagTime (value) {
  return chartType === 0 ? moment(value).format() : value;
}

// Simplify partitions to just what we want: lag and time
function reducePartitionsToDataPoints (partitions) {
  let reducedPartitions = [];
  _.forEach(partitions, (partitionLagItem) => {
    let lagTime = formatLagTime(partitionLagItem.lagTime);
    let lagValue = parseInt(partitionLagItem.LAG);
    reducedPartitions.push([lagTime, lagValue]);
  });
  return reducedPartitions;
}

// This takes our date of partitions and transforms it to a group of items in
// a High Chart compatible "series".
function createSeriesFromTopicPartitions (topicLag) {
  let lagGroupedByPartition = _.groupBy(topicLag, 'PARTITION');
  let items = [];
  _.forEach(lagGroupedByPartition, (partitions, partition) => {
    let reducedPartitions = reducePartitionsToDataPoints(partitions);
    // Create a series containing with a "data" object that High Chart wants
    let series = {series: [{data: reducedPartitions}]};
    items.push({
      PARTITION: partition,
      series: series
    });
  });
  return items;
}

// FIXME this is nice, it improves the data for us to tranform.
// but at this point it's still an intermediate format
// it feels like this could be merged into other functions??
// we have application and topic readily handy in a collection of applications
function buildChartsTopics (application, applicationLag) {
  let transformedData = [];
  let lagByTopic = _.groupBy(applicationLag, 'TOPIC');
  // at this point, this is a group of lag items all grouped by topic inside a single application
  _.forEach(lagByTopic, (topicLag, topic) => {
    let partitions = createSeriesFromTopicPartitions(topicLag);
    transformedData.push({
      APPLICATION: application,
      TOPIC: topic,
      PARTITIONS: partitions
    });
  });
  return transformedData;
}

// Given an divId to target the DOM node, populate template literal with data for our chart
// application - string
// topic - string
// series - an array of lag data points. See https://www.highcharts.com/docs/chart-concepts/series
function chartTemplate (application, topic, series) {
  let divId = getContainerId(application, topic);
  return `
      Highcharts.chart('${divId}', { 
        title: {text: 'Consumer Lag - ${application}'},
        subtitle: {text: 'Topic: ${topic}'}, 
        yAxis: {title: {text: 'Lag amount'}}, 
        series:${JSON.stringify(series)} });`;
}

// This will take our chart data and run it through a template to produce
// a series of JavaScript objects which create a new High Chart for each topic in an application
function transformChartDataToJavaScript (chartTopics) {
  let chartsAsJavaScript = '';
  _.forEach(chartTopics, function (value) {
    let application = value.APPLICATION;
    let topic = value.TOPIC;
    let partitions = value.PARTITIONS;
    let series = [];
    _.forEach(partitions, function (partition) {
      // FIXME p["series"]["series"][0] <- code smell. we don't seem to need to be nested this deep
      let partitionData = partition.series.series[0];
      Object.assign(partitionData, {name: `P${partition.PARTITION}`});
      series.push(partitionData);
    });

    chartsAsJavaScript = chartsAsJavaScript +
    chartTemplate(application, topic, series);
  });
  return chartsAsJavaScript;
}

function buildChartForApp (application, lagByApplication) {
  let chartsAsJavaScript = '';
  let chartTopics = buildChartsTopics(application, lagByApplication[application]);
  chartsAsJavaScript = chartsAsJavaScript + transformChartDataToJavaScript(chartTopics);
  return chartsAsJavaScript;
}

module.exports = { buildChartForApp, groupDataByApplication };
