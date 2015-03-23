var url = require('url');

module.exports = function getLocationForSource(name) {
  function achewoodSearchUrl(query){
    return url.format({
      protocol: 'http:',
      host: 'www.ohnorobot.com',
      pathname: '/index.pl',
      query: {
        comic: '636',
        s: query
      }
    });
  }

  var parsed = url.parse(name, true);

  if(parsed.hostname == 'achewood.com' ||
    parsed.hostname == 'www.achewood.com'){
    if (parsed.pathname == '/index.php') {
      if(parsed.query.date) {
        return '/achewood/date/' + parsed.query.date;
      } else {
        //note redirecting to a redirect page like this is a bad idea
        return '/latest?type=achewood';
      }
    } else if (parsed.pathname == '/raysplace.php') {
      if(parsed.query.date) {
        return '/raysplace/date/' + parsed.query.date;
      } else {
        //note redirecting to a redirect page like this is a bad idea
        return '/latest?type=raysplace';
      }
    } else if (parsed.pathname == '/list.php'){
      return '/list';
    } else {
      return achewoodSearchUrl(name);
    }
  } else if (/^[a-zA-Z0-9\-]+\.blogspot\.com$/.test(parsed.hostname)){
    var blog = parsed.hostname.slice(0,parsed.hostname.indexOf('.'));
    var path = parsed.path.replace(/\.html$/,'');
    return '/blogs/' + blog + path;
  } else {
    return achewoodSearchUrl(name);
  }
};
