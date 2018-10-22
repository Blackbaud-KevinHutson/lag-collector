/*
Consumer List
The purpose of this file is to provide a pre-configured list of consumers to monitor

This format allows for consumers that may have a different consumer group name from CLIENT-ID.
lagcollector will feth lag using 'group_name`. 
It will attempt to match the results for CLIENT-ID with 'client_id_prefix'.
Example:
module.exports = [
    {'group_name': 'consumer1-prod-apps', 'client_id_prefix': 'consumer1'},
    {'group_name': 'consumer2', 'client_id_prefix': 'consumer2'}
];
*/
module.exports = [
    {'group_name': 'consumer1-prod-apps', 'client_id_prefix': 'consumer1'},
    {'group_name': 'consumer2', 'client_id_prefix': 'consumer2'}
];

