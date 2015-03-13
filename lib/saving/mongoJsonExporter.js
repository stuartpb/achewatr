var fs = require('fs');

//A moderately hacky way of getting around the fact that
//MongoDB uses a non-compliant form of JSON to preserve its data types-
//this is loosely patterned after the functions from the MongoDB shell
function tojsonObject(x){
  var k, pairs = [];
  if(x instanceof Date){
    return 'ISODate('+JSON.stringify(x.toISOString())+')';
  }
  //We don't use arrays but I feel icky not handling this
  else if (Array.isArray(x)) {
    return '['+x.map(tojson).join(',')+']';
  }
  //Also this - even though if this function's processing a null
  //that's a pretty good sign something's gone wrong
  else if (x === null) {
    return 'null';
  }
  //There are a bunch of other specialcase types that could be handled here
  //(like ObjectID), but we don't handle them because the only special case
  //this setup script needs is for dates
  else {
    for(k in x){
      //use JSON.stringify for the key because that could only be a string
      //use tojson for the value because that could need to recursively
      //come back to special JSON handling
      pairs.push(JSON.stringify(k)+':'+tojson(x[k]));
    }
    return '{'+pairs.join(',')+'}';
  }
}

function tojson(x){
  //If it's an object we gotta use the spooky voodoo
  if(typeof x == 'object'){
    return tojsonObject(x);
  //non-object types can only ever be the same as their conformant JSON
  //representation
  } else {
    return JSON.stringify(x);
  }
}

module.exports = function(target) {
  var collection;
  function startup() {
    collection = fs.createWriteStream(target);
  }
  function insert(item, cb) {
    collection.write(tojson(item)+'\n',cb);
  }
  function finish() {
    collection.end();
    collection.destroySoon();
  }
  return {
    startup: startup,
    insert: insert,
    finish: finish
  };
};
