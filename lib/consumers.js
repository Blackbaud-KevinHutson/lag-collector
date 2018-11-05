/*
Consumer List
The purpose of this file is to provide a pre-configured list of consumers to monitor

This format allows for consumers that may have a different consumer group name from CLIENT-ID.
lag-collector will feth lag using 'groupName`.
It will attempt to match the results for CLIENT-ID with 'clientIdPrefix'.
Example:
module.exports = [
    {'groupName': 'consumer1-prod-apps', 'clientIdPrefix': 'consumer1'},
    {'groupName': 'consumer2', 'clientIdPrefix': 'consumer2'}
];
*/
module.exports = [
  {groupName: 'consumer1-prod-apps', clientIdPrefix: 'consumer1'},
  {groupName: 'consumer2', clientIdPrefix: 'consumer2'},
  {groupName: 'webster', clientIdPrefix: 'webster'}
];
