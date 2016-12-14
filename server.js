var express = require('express');
var app = express();

app.get('/', function(req, res){
res.send("Please add url to end of root url to get your shortener");
});

app.get('/', function(req, res){
var original_url = req.url;

res.send("Please add url to end of root url to get your shortener");
});

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

app.listen(port, function () {
});
