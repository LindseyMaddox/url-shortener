//if not a valid url, json will say error {"error":"This url is not on the database."}
//when you enter (OR CLICK ON) your shortened url, it will redirect to original site


var express = require('express');
var app = express();

app.get('/', function(req, res){
res.send("Please add url to end of root url to get your shortener. Example: https://shorten-your-url.herokuapp.com/new/https://google.com");
});

app.get('/new/:site', function(req, res){
  var valid_url_regex = "https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)"
  var valid_site = req.params.site.match(/valid_url_regex/);
  if(valid_site){
    var original_url = req.params.site;
    var parent_url = req.url;
    var data = { "original_url": original_url, "parent_url": parent_url };

  } else {
    var data = { "error":"Wrong url format. Please check your url again." }
  }

res.send(JSON.stringify(data, null, 2));
});

app.get('/:shortened_url', function(req,res){
  //find parent url by shortened url
})

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

app.listen(port, function () {
});
