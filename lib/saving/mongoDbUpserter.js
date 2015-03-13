var mongo = require('mongoskin');

module.exports = function(target) {
  var db, collection;
  var mongoUrl = target;

  function startup() {
    db = mongo.db(mongoUrl);
    collection = db.collection('items');
  }
  function insertFresh(item, cb){
    collection.insert(item, cb);
  }
  function upsert(item, cb){
    collection.update({_id: item._id},
      item, {upsert:true}, cb);
  }
  function finish(){
    db.close();
  }
  return {
    startup: startup,
    insert: upsert,
    insertFresh: insertFresh,
    finish: finish
  };
}
