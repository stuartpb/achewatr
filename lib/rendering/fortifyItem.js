var moment = require('moment');
var blogInfo = require("../../data/bloginfo.json");

module.exports = function fortifyItem(doc){
  if(doc){
    doc.published = moment(doc.published);
    if (doc.type=="achewood") {
      doc.source = "Achewood";
      doc.banner = 'achewood';
      doc.url = '/achewood/date/' + doc.mdydate;
      doc.date = doc.published.format('ddd MM.DD.YYYY');
    } else if (doc.type == "raysplace") {
      doc.source = "Ray's Place";
      doc.banner = 'raysplace';
      doc.url = '/raysplace/date/' + doc.mdydate;
      doc.date = doc.published.format('ddd MM.DD.YYYY');
    } else if (doc.type == "blog") {
      doc.source = blogInfo[doc.blog].character;
      doc.banner = blogInfo[doc.blog].banner;
      doc.url = '/blogs/' + doc.blog + doc.path;

      //Set the UTC Offset, for local time formatting
      doc.published.utcOffset(doc.offsetmins);

      doc.date = doc.published.format('ddd MM.DD.YYYY');
      doc.time = doc.published.format('hh:mm A');
    }
  }
  return doc;
};
