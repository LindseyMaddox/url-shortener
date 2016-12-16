var express = require('express');
var app = express();
const bodyParser= require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;

var mongoUrl = "mongodb://llmaddox:herokumary4git@ds133328.mlab.com:33328/shorten-your-url"
MongoClient.connect(mongoUrl, (err, db) => {
  if (err) throw err;
  var db = db;
   // set the port of our application
  // process.env.PORT lets the port be set by Heroku
  //only listen when db is open
  var port = process.env.PORT || 8080;
  
  app.listen(port, function () {
    console.log('listening on' + port);
  });
  
 app.get('/', function(req,res){
     res.render('index.ejs');
});

  app.get('/:shortened', function(req,res){
     var shortHash = req.params.shortened;
     var longURL =  findURLbyShortHash(shortHash,longURL);

     function findURLbyShortHash(shortHash,longURL){
      db.collection('shortener_map').find(  {  shortHash: +shortHash  }).toArray(function(err,items){
         if (err) throw err;
         if(items.length != 0){
             longURL = items[0].urlRequest;
             res.redirect(longURL);
         } else {
           res.render("wrong.ejs", {shortHash: shortHash });
         }
   });

}
  });
   
  app.get('/new/:site*', function(req, res){
    var fullUrlRequested = req.params.site + req.params[0];
    var valid = checkUrlValid(fullUrlRequested);
     function processShortHash(shortHash){
              var rootURL = req.protocol + '://' + req.get('host');
              var shortURL = rootURL + "/" + shortHash;
              var data = { "originalUrl": fullUrlRequested, "shortened url": shortURL };
              res.send(JSON.stringify(data, null, 2));
       }
     if(valid){
       console.log(fullUrlRequested + " is a valid site");
       var shortURL =  checkIfURLinDB(fullUrlRequested, processShortHash);
     } else {
       var data = { "error":"Wrong url format. Please check your url again." };
        //immediately send response
        res.send(JSON.stringify(data, null, 2));
     }
   
  });

function checkUrlValid(url){
      var fullUrlRequested = url;
      var validUrlTest = /https?:\/\/(www\.)?[\w\/\-\.\%\:\+\~\#\=\?]+/;
      var validSite = validUrlTest.test(fullUrlRequested);
      return validSite;
  }
  
function checkIfURLinDB(requested, callback){
      //check to see if we already have a record for that request
      //AND check to see if there is a shortened url
        var shortHash = 321;//getRandomInt(1,1000);
         db.collection('shortener_map').find(  { $or: [ {urlRequest: requested }, {shortHash: shortHash} ] }).toArray(function(err,items){
          if (err) throw err;
           if(items.length == 0){
             console.log("not in DB. adding");
             addURLtoDB(requested, shortHash);
             callback(shortHash);
           } else if(items[0].urlRequest != null && items[0].shortHash == null) {
                updateURLShortHashinDB(requested,shortHash);
                //we're setting the shorthash to the valued passed, so we don't need to change it
                //before running the callback
                callback(shortHash);
           } else if(items[0].urlRequest != requested && items[0].shortHash != null) {
             console.log("just a test for now. Short hash is in db and it's");
             console.log(items[0].shortHash);
             shortHash = 5;
             console.log("reset short hash for callback check. Now: " + shortHash);
             callback(shortHash);
             //may need another callback here. this part doesn't work so far;
              /*var non_unique_hash = true
             while(non_unique_hash == true){
               var shortHash = getRandomInt(1,1000);
                   db.collection('shortener_map').find(  { shortHash: shortHash }).toArray(function(err,items){
                     if (err) throw err;
                     if(items == null){
                       addURLtoDB(requested, shortHash);
                       non_unique_hash = false;
                       console.log("we made it to false, so we're calling the callback");
                                    callback(shortHash);
                     }
                   });
             }*/
           }  else {
        //     this record is already in DB so no action needed
            callback(shortHash);
           }
         });
         
}

 function addURLtoDB(requested, shortHash){

     db.collection('shortener_map').insert(
       { urlRequest: requested, shortHash: shortHash }, function(err,result){
         if (err) throw err;
         console.log("saved to database");
       });
}

 function updateURLShortHashinDB(requested,shortHash){
     db.collection('shortener_map').update ({ urlRequest: requested },{ $set: { shortHash: shortHash } }, function(err,record){
       if (err) throw err;
       console.log("shortened hash for " + requested + "updated to " + shortHash);
   });
}
  
  
}); //end of connection

function getRandomInt(min,max){
  return Math.random() * (max - min) + min;

}
