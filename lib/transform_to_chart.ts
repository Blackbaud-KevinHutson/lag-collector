import _ from "lodash";
const settings = require('./settings');
let chartType = settings['chart.time.type'];
const dateUtils = require('./date_utils');

// Returns our data grouped by application
export function groupDataByApplication (lagData :any) {
  let lagByGroup = _.groupBy(lagData, 'consumerName');
  // FIXME another undefined issue. fix it by hack for now
  delete lagByGroup.undefined;
  return lagByGroup;
}

function getContainerId (app :any, topic :any) {
  return `ch-${app}-${topic}`;
}

function formatLagTime (value :any) {
  return chartType === 0 ? dateUtils.formattedTime(value) : value;
}

// Simplify partitions to just what we want: lag and time
function reducePartitionsToDataPoints (partitions :any) {
  let reducedPartitions :any = [];
  _.forEach(partitions, (partitionLagItem) => {
    let lagTime = formatLagTime(partitionLagItem.lagTime);
    let lagValue = parseInt(partitionLagItem.LAG);
    reducedPartitions.push([lagTime, lagValue]);
  });
  return reducedPartitions;
}

// This takes our date of partitions and transforms it to a group of items in
// a High Chart compatible "series".
function createSeriesFromTopicPartitions (topicLag :any) {
  let lagGroupedByPartition = _.groupBy(topicLag, 'PARTITION');
  let items :any = [];
  _.forEach(lagGroupedByPartition, (partitions :any, partition :any) => {
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
function buildChartsTopics (application :any, applicationLag :any) {
  let transformedData :any = [];
  let lagByTopic = _.groupBy(applicationLag, 'TOPIC');
  // at this point, this is a group of lag items all grouped by topic inside a single application
  _.forEach(lagByTopic, (topicLag :any, topic :any) => {
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
function chartTemplate (application :any, topic :any, series :any) {
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
function transformChartDataToJavaScript (chartTopics :any) {
  let chartsAsJavaScript = '';
  _.forEach(chartTopics, function (value :any) {
    let application = value.APPLICATION;
    let topic = value.TOPIC;
    let partitions = value.PARTITIONS;
    let series :any = [];
    _.forEach(partitions, function (partition :any) {
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

export function buildChartForApp (application :any, lagByApplication :any) {
  let chartsAsJavaScript = '';
  let chartTopics = buildChartsTopics(application, lagByApplication[application]);
  chartsAsJavaScript = chartsAsJavaScript + transformChartDataToJavaScript(chartTopics);
  return chartsAsJavaScript;
}

// module.exports = { buildChartForApp, groupDataByApplication };
