let fs = require('fs');
let rimraf = require('rimraf');
//let file_utils = require('./file_utils');
const { data_store_files_expired, write_file, is_data_store_file_expired } = require('./file_utils');

describe('data_store_files_expired', () => {
  let testDirectory = 'testdata';

  beforeEach(() => {
    console.log('>>> BEFORE')
    fs.existsSync(testDirectory) || fs.mkdirSync(testDirectory);
  });

  it('data_store_files_expired non-expired files are not deleted', done => {
    let expectedDate = 1487076708000;
    // Return a fixed timestamp for all dates. moment uses Date.now
    Date.now = jest.fn(() => expectedDate)
    //jest.mock('./file_utils');
    //const foo = require('./file_utils');
    is_data_store_file_expired.mockImplementation(() => true);
    //let expireResponse = true;
    // file_utils.is_data_store_file_expired.mockResolvedValue(expireResponse);


    // mock this is_data_store_file_expired
//    console.log = jest.fn(() => null) // silence log

    // add 2 files..or should I mock the call to check the date of files in the dataStore?
// 2) if you mock, ensure you call delete x times
// otherwise, scan directory afterward with a new count

    function callback(data) {
      expect(data).toEqual(expectedData)
      done();
    }        

    write_file(directory, 'test1.json', JSON.stringify(['test']), (err) => {
      if (err) throw err;
      data_store_files_expired(callback);
    });
  
  })

  afterEach(() => {
    console.log('>>> AFTER')
    rimraf(testDirectory, () => {});
  });
})