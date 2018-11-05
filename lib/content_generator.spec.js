const { logTotalLagForTopicByApp } = require('./content_generator');

describe('logTotalLagForTopicByApp', () => {
  it('logTotalLagForTopicByApp should sum lag for a topic', () => {
    const lagForApp = [
      { TOPIC: 'topicA',
        PARTITION: '0',
        'CURRENT-OFFSET': '503',
        'LOG-END-OFFSET': '503',
        LAG: '0',
        'CONSUMER-ID': 'consumerA',
        HOST: '127.0.0.1/127.0.0.1',
        'CLIENT-ID': 'consumerA',
        lagTime: 1540221654538,
        consumerName: 'consumerA'},
      { TOPIC: 'topicA',
        PARTITION: '1',
        'CURRENT-OFFSET': '222',
        'LOG-END-OFFSET': '262',
        LAG: '40',
        'CONSUMER-ID': 'consumerA',
        HOST: '127.0.0.1/127.0.0.1',
        'CLIENT-ID': 'consumerA',
        lagTime: 1540221654538,
        consumerName: 'consumerA'},
      { TOPIC: 'topicB',
        PARTITION: '5',
        'CURRENT-OFFSET': '3000',
        'LOG-END-OFFSET': '3005',
        LAG: '5',
        'CONSUMER-ID': 'consumerA',
        HOST: '127.0.0.1/127.0.0.1',
        'CLIENT-ID': 'consumerA',
        lagTime: 1540221732721,
        consumerName: 'consumerA'}
    ];

    const expectedLagForApp = [
      { TOPIC: 'topicA',
        TOTAL_TOPIC_LAG: 40,
        lagTime: 1540221654538,
        consumerName: 'consumerA'},
      { TOPIC: 'topicB',
        TOTAL_TOPIC_LAG: 5,
        lagTime: 1540221654538,
        consumerName: 'consumerA'}
    ];

    const result = logTotalLagForTopicByApp(lagForApp);

    expect(result).toEqual(expectedLagForApp);
  });
});
