const { formattedTime } = require('./date_utils');

describe('date_utils', () => {
  it('formattedTime without a value returns current formatted time', () => {
    const time = formattedTime();
    expect(time).not.toBeNull();
  });

  it('formattedTime with a value returns supplied formatted time', () => {
    const time = formattedTime(1556219343256);
    expect(time).toEqual('2019-04-25T14:09:03-05:00');
  });
});
