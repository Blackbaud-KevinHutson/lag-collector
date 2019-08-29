const log = require('./logger');
import _ from "lodash";

// Squash lagItems into a row per topic for each app, summing the lag across partitions
// This can be used for logging/alerting purposes for total lag per topic
export function logTotalLagForTopicByApp (lagItems :any) {
  let byConsumer = _.groupBy(lagItems, 'consumerName');
  return _.flatten(Object.keys(byConsumer)
    .map(consumerName => logConsumerLag(byConsumer[consumerName])));
}

function logConsumerLag (consumerLag :any) {
  let byTopic = _.groupBy(consumerLag, 'TOPIC');
  let summarizedLagItems :any = [];
  let consumerName = '';
  let lagTime = 0;
  _.each(Object.keys(byTopic), (topic :any) => {
    let totalLag = 0;
    let topicLagItems = byTopic[topic];
    _.each(topicLagItems, (item :any) => {
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

// module.exports = { logTotalLagForTopicByApp };
