const { parse } = require('./parse_lag');

describe('parseLag', () => {
  it('parse takes in lines of consumer lag and returns array of JSON lag items', done => {
    let expectedDate = 1487076708000;
    // Return a fixed timestamp for all dates. moment uses Date.now
    Date.now = jest.fn(() => expectedDate);
    // silence log
    console.log = jest.fn(() => null); // eslint-disable-line no-console

    /* eslint-disable */
    const lagData = `
      TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG CONSUMER-ID HOST CLIENT-ID
      topic1         1         4444         4444         0  consumer1 127.0.0.1/127.0.0.1 consumer1-123 
      topic2         2         5432         5455         23 consumer1 127.0.0.1/127.0.0.1 consumer1-123
      topic3         5         5491         5492         1  consumer2 127.0.0.1/127.0.0.1 consumer2-456
        `;
    /* eslint-enable */

    // note that '-prod-apps' suffix comes from lib/consumers.js configuration
    const expectedData = [
      {'CLIENT-ID': 'consumer1-123',
        'CONSUMER-ID': 'consumer1',
        'CURRENT-OFFSET': '4444',
        HOST: '127.0.0.1/127.0.0.1',
        LAG: '0',
        'LOG-END-OFFSET': '4444',
        PARTITION: '1',
        TOPIC: 'topic1',
        consumerName: 'consumer1-prod-apps',
        lagTime: expectedDate},
      {'CLIENT-ID': 'consumer1-123',
        'CONSUMER-ID': 'consumer1',
        'CURRENT-OFFSET': '5432',
        HOST: '127.0.0.1/127.0.0.1',
        LAG: '23',
        'LOG-END-OFFSET': '5455',
        PARTITION: '2',
        TOPIC: 'topic2',
        consumerName: 'consumer1-prod-apps',
        lagTime: expectedDate},
      {'CLIENT-ID': 'consumer2-456',
        'CONSUMER-ID': 'consumer2',
        'CURRENT-OFFSET': '5491',
        HOST: '127.0.0.1/127.0.0.1',
        LAG: '1',
        'LOG-END-OFFSET': '5492',
        PARTITION: '5',
        TOPIC: 'topic3',
        consumerName: 'consumer2',
        lagTime: expectedDate}
    ];

    function callback (data: any) {
      expect(data).toEqual(expectedData);
      done();
    }

    parse(lagData, callback);
  });
});
