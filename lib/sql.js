const { Observable, of } = require('rxjs');
var sqlite3 = require('sqlite3').verbose();
var moment = require('moment');
let databaseFileName = 'db_lag.sqlite3';
var inserted = 0;

// FIXME maybe just open/close the db yourself each time and don't export?
function openDatabase() {
//    let db = new sqlite3.Database(':memory:');
    let db = new sqlite3.Database(databaseFileName, (err) => {
        if(err) {
            console.log('opendatabase databaseFileName=' + databaseFileName + ' /err=' + err.message);
        }
    });
    // let db = new sqlite3.Database(':memory:', null, function(err, x) {
    //     console.log('hit the callback');
    // });
    // db.serialize(function() {
    //     // FIXME might need BIGINTfor lag, time?
    //     db.run("CREATE TABLE consumer (group_name TEXT, topic TEXT, partition INTEGER, current_offset INTEGER, log_end_offset INTEGER, lag INTEGER, lag_time INTEGER)");
    // });
    return db;
}

function closeDatabase(db) {
    db.close((err) => {
        if(err) {
            console.log('closeDatabase:' + err.message);
        }
    });  
}

function save_lag(value) {
    console.log('<< value=' + JSON.stringify(value));

    let topic = value["TOPIC"];
    if(topic && topic.length > 0) {
        save(topic, value);
    } else {
        console.log("**** skipping header row b/c topic was empty");
    }
}

function save(topic, value) {
    let db = openDatabase();
    //console.log('<< db=' + db);
    
    let consumer_name = value["consumer_name"];
    let group_name = value["CLIENT-ID"];
    let partition = value["PARTITION"];
    let lag = value["LAG"];
    let current_offset = value["CURRENT-OFFSET"];
    let log_end_offset = value["LOG-END-OFFSET"];
    // console.log('<< topic=' + JSON.stringify(topic));

    // FIXME this hyphen fix doesnt seem to be working
    // i'm still seeing `-` in the web page console
    let consumer_lag = lag === '-' ? 0 : lag;
    // console.log(">> doSql group_name=" + group_name +  "/topic=" + topic + " /partition=" + partition + " /lag=" + lag);
    //FIXME consider movinvg the timestamp to when it was captured (append to the filename of save_lag then pass it)
    var now = moment().utc().valueOf();

    //tmp
    let rows = [];

    db.serialize(() => {
        let create_table_sql = "CREATE TABLE consumer (consumer_name, group_name TEXT, topic TEXT, partition INTEGER, current_offset INTEGER, log_end_offset INTEGER, lag INTEGER, lag_time INTEGER)";
        db.run(create_table_sql, (err) => {
            if(err) {
                //console.log('create_table_sql:' + err.message);
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
        // .each("SELECT rowid AS id, topic, group_name, partition, current_offset, log_end_offset, lag, lag_time FROM consumer", function(err, row) {
        //     // .each("SELECT count(*) FROM consumer", function(err, row) {
        //         if (err) {
        //         console.log("query each err=" + err.message);
        //     }
        //     console.log('>> count ' + JSON.stringify(row));
        //    rows.push(row);
        // });     

  //      console.log('<<< rows='+rows.length);
    
        // var stmt = db.prepare("INSERT INTO consumer VALUES (?,?,?,?,?,?,?)");
        // stmt.run(group_name, topic, partition, current_offset, log_end_offset, lag, now);
        // stmt.finalize();     
        inserted++;
        console.log('<<< inserted='+inserted);
    })
    .close((err) => {
        if(err) {
            console.log('closeDatabase:' + err.message);
        }
    });  

    //return rows;
    //closeDatabase(db);     
}

function query_lag(cb) {   
    let db = openDatabase();
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
