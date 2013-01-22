/*global describe it*/

describe('app',function(){
  it('should compile and run', function(done){
    var app = require('../app.js')({});

    var server = app.listen(9999, function(err){
      if (err) throw err;
      else {
        server.close();
        done();
      }
    });
  });
});