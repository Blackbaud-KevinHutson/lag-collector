const { groupDataByApplication } = require('./transform_to_chart');

describe('transform_to_chart', () => {
  it('groupDataByApplication', () => {
    const data1 = { consumer_name: '1', app1: 'test1' }
    const data2 = { consumer_name: '2', app2: 'test2' }
    
    const groupedData = groupDataByApplication([data1, data2])
    expect(groupedData).toEqual({ '1': [data1], '2': [data2] })
  })
})