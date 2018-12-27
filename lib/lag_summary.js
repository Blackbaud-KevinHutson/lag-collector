const log = require('./logger');
let _ = require('lodash');

// Squash lagItems into a row per topic for each app, summing the lag across partitions
// This can be used for logging/alerting purposes for total lag per topic
function logTotalLagForTopicByApp (lagItems) {
  let byConsumer = _.groupBy(lagItems, 'consumerName');
  return _.flatten(Object.keys(byConsumer)
    .map(consumerName => logConsumerLag(byConsumer[consumerName])));
}

function logConsumerLag (consumerLag) {
  let byTopic = _.groupBy(consumerLag, 'TOPIC');
  let summarizedLagItems = [];
  let consumerName = '';
  let lagTime = 0;
  _.each(Object.keys(byTopic), (topic) => {
    let totalLag = 0;
    let topicLagItems = byTopic[topic];
    _.each(topicLagItems, (item) => {
      if (!consumerName) {
        consumerName = item.consumerName;
      }
      if (!lagTime) {
        lagTime = item.lagTime;
      }
      totalLag = totalLag + Number(item.LAG);
    });
    summarizedLagItems.push({
      TOPIC: topic,
      consumerName: consumerName,
      TOTAL_TOPIC_LAG: totalLag,
      lagTime: lagTime
    });
    log.debug(`consumerName=${consumerName} topic=${topic} totalTopicLag=${totalLag} lagTime=${lagTime}`);
  });
  return summarizedLagItems;
}

module.exports = { logTotalLagForTopicByApp };
