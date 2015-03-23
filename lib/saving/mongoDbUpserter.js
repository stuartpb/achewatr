var mongo = require('promised-mongo');

module.exports = function(target) {
  var db, collection;
  var mongoUrl = target;

  function startup() {
    db = mongo(mongoUrl);
    collection = db.collection('items');
  }
  function insertFresh(item){
    return collection.insert(item);
  }
  function upsert(item){
    return collection.update({_id: item._id},
      item, {upsert:true});
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
};
