var sqlite3 = require('sqlite3').verbose();
var moment = require('moment');
var inserted = 0;

function openDatabase(dbFilePath) {
    let db = new sqlite3.Database(dbFilePath, (err) => {
        if(err) {
            console.log('opendatabase dbFilePath=' + dbFilePath + ' /err=' + err.message);
        }
    });
    return db;
}

function closeDatabase(db) {
    db.close((err) => {
        if(err) {
            console.log('closeDatabase:' + err.message);
        }
    });  
}

function save_lag(dbFilePath, value) {
    console.log('<< value=' + JSON.stringify(value));

    let topic = value["TOPIC"];
    if(topic && topic.length > 0) {
        save(dbFilePath, topic, value);
    } else {
        console.log("**** skipping header row b/c topic was empty");
    }
}

function save(dbFilePath, topic, value) {
    let db = openDatabase(dbFilePath);
    
    let consumer_name = value["consumer_name"];
    let group_name = value["CLIENT-ID"];
    let partition = value["PARTITION"];
    let lag = value["LAG"];
    let current_offset = value["CURRENT-OFFSET"];
    let log_end_offset = value["LOG-END-OFFSET"];

    let consumer_lag = lag === '-' ? 0 : lag;
    var now = moment().utc().valueOf();

    db.serialize(() => {
        let create_table_sql = "CREATE TABLE consumer (consumer_name, group_name TEXT, topic TEXT, partition INTEGER, current_offset INTEGER, log_end_offset INTEGER, lag INTEGER, lag_time INTEGER)";
        db.run(create_table_sql, (err) => {
            if(err) {
                console.log('create_table_sql:' + err.message);
            }
        })
        .prepare("INSERT INTO consumer VALUES (?,?,?,?,?,?,?,?)", (err) => {
            if(err) {
                console.log('prepare:' + err.message);
            }
        })
        .run(consumer_name, group_name, topic, partition, current_offset, log_end_offset, consumer_lag, now)
        .finalize((err) => {
            if(err) {
                console.log('finalize:' + err.message);
            }
        });
        inserted++;
        console.log('<<< inserted='+inserted);
    })
    .close((err) => {
        if(err) {
            console.log('closeDatabase:' + err.message);
        }
    });  
}

function query_lag(dbFilePath, cb) {   
    let db = openDatabase(dbFilePath);
   let sql = "SELECT rowid AS id, consumer_name, topic, group_name, partition, current_offset, log_end_offset, lag, lag_time FROM consumer";

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.log("query_lag err=" + JSON.stringify(err));
        }
        cb(rows);
    });
    closeDatabase(db);     
}
module.exports = { save_lag, query_lag };  
