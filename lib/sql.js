var sqlite3 = require('sqlite3').verbose();

// FIXME maybe just open/close the db yourself each time and don't export?
function openDatabase() {
    return new sqlite3.Database(':memory:');
}

function closeDatabase(db) {
    db.close();  
}

function doSql(db) {
    db.serialize(function() {
        // might need BIGINT
      db.run("CREATE TABLE consumer_lag (group_name TEXT, lag INTEGER)");
     
      var stmt = db.prepare("INSERT INTO consumer_lag VALUES (?,?)");
      for (var i = 0; i < 10; i++) {
        // stmt.run("Ipsum " + i);
        stmt.run('foo', 3);
      }
      stmt.finalize();
     
    //   db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
        db.each("SELECT group_name, lag FROM consumer_lag", function(err, row) {
          console.log(row.id + ": " + row.info);
      });
    });     
}
module.exports = { openDatabase, closeDatabase, doSql };  
