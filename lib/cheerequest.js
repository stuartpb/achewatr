var cheerio = require("cheerio");
var request = require("request");
var Promise = Promise;

if (!Promise) {
  Promise = require("bluebird");
}

module.exports = function cheerequest(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(err, res, body) {
      if (err) return reject(err);
      if (res.statusCode != 200)
        return reject(new Error('status: '+res.statusCode));
      resolve(cheerio.load(body));
    });
  });
};
