const { logTotalLagForTopicByApp } = require('./lag_summary');

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
        consumerName: 'consumerA'},
      { TOPIC: 'topicA',
        PARTITION: '4',
        'CURRENT-OFFSET': '200',
        'LOG-END-OFFSET': '213',
        LAG: '13',
        'CONSUMER-ID': 'consumerB',
        HOST: '127.0.0.1/127.0.0.1',
        'CLIENT-ID': 'consumerB',
        lagTime: 1540221732733,
        consumerName: 'consumerB'},
      { TOPIC: 'topicA',
        PARTITION: '6',
        'CURRENT-OFFSET': '777',
        'LOG-END-OFFSET': '780',
        LAG: '3',
        'CONSUMER-ID': 'consumerB',
        HOST: '127.0.0.1/127.0.0.1',
        'CLIENT-ID': 'consumerB',
        lagTime: 1540221732733,
        consumerName: 'consumerB'}
    ];

    const expectedLagForApp = [
      { TOPIC: 'topicA',
        TOTAL_TOPIC_LAG: 40,
        lagTime: 1540221654538,
        consumerName: 'consumerA'},
      { TOPIC: 'topicB',
        TOTAL_TOPIC_LAG: 5,
        lagTime: 1540221654538,
        consumerName: 'consumerA'},
      { TOPIC: 'topicA',
        TOTAL_TOPIC_LAG: 16,
        lagTime: 1540221732733,
        consumerName: 'consumerB'}
    ];

    const result = logTotalLagForTopicByApp(lagForApp);

    expect(result).toEqual(expectedLagForApp);
  });
});
