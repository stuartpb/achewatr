var http = require("http");
var url = require("url");
var XmlStream = require("xml-stream");

var blogs = [
  "raysmuckles", //Ray
  "rbeef", //Roast Beef
  "journeyintoreason", //Pat
  "orezscu", //Téodor
  "philippesblog", //Philippe
  "corneliusbear", //Mr. Bear
  "lyle151", //Lyle
  "mollysanders", //Molly
  "chrisonstad", //Chris
  "peterhcropes", //Nice Pete
  "emerillg" //Emeril
];

function itemDocumentFromEntry(entry) {
  //The document that will be added to the database.
  var item = {
    type: 'blog'};
  //title from the title element
  item.title = entry.title.$text;
  //date from the published element (not the updated tag)
  item.published = new Date(entry.published);
  //time offset
  var offset = entry.published.match(/([\+\-])(\d\d)\:?(\d\d)?$/);
  item.offsetmins = (offset[1] == '-' ? -1 : 1) *
    (60 * offset[2] + parseInt(offset[3],10));

  //content from the content tag
  if(entry.content.$text){
    //with the <div class="blogger-post-footer"> content tracker removed
    item.content = entry.content.$text
      .replace(/<div class="blogger-post-footer">.*?<\/div>/,'');
  } else {
    item.content = '';
  }

  //Grab the author name from the name tag of the author tag
  var arname = entry.author.name;
  //if it's not "me", save the name
    //(a few Nice Pete posts used 'Peter H. Cropes')
  if(arname!='me'){
    item.author = arname;
  }

  //Grab the path from the href of the link tag with rel="alternate"
  var location;
  //Search backwards through the link elements: will probably be the last one,
  //but handle the case where it's not
  for(var i = entry.link.length-1; i >= 0 && !location; --i){
    var link = entry.link[i];
    if (link.$.rel == 'alternate') {
      location = link.$.href;
    }
  }
  item._id = location;
  var urlobj = url.parse(location);
  item.path = urlobj.path.replace(/.html$/,'');

  //This works.
  //Is it efficient, airtight, or otherwise clean as could be? No.
  //Does it use what I've written without requiring a major refactor?
  //Why yes, yes it does!
  item.blog = urlobj.hostname.split('.',1)[0];

  return item;
}

function populateFromBlog(blogname,entryHandler,endcb) {
  // Request the RSS feed for the blog, containing every post ever made
  http.get({
    host: blogname+'.blogspot.com',
    path: '/atom.xml?max-results=65536'
  }, function(response) {
    var xml = new XmlStream(response);

    //Expect multiple link tags
    xml.collect('entry link');
    //Get the data from each entry:
    xml.on('updateElement: entry',entryHandler);
    xml.on('end',endcb);
  });
}

function onSuccess(cb){
  return function(err) {
    if (err) {
      throw err;
    } else {
      cb.apply(this,Array.prototype.slice.call(arguments,1));
    }
  };
}

module.exports = function(env,insert,finish){
  function entryHandler(entry){
    insert(itemDocumentFromEntry(entry));
  }
  function populateNextBlog(index){
    if (index < blogs.length) {
      console.log('Populating ' + blogs[index] + '...');
      populateFromBlog(blogs[index],
        entryHandler,
        function(){
          populateNextBlog(index+1);
        });
    } else {
      finish();
    }
  }
  populateNextBlog(0);
};
