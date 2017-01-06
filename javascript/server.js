require('dotenv').config();
var express = require('express');
var app = express();
const bodyParser= require('body-parser');
var async = require("async");
var path = require('path');

app.use(express.static(path.resolve(__dirname + '/../public')));
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

const MongoClient = require('mongodb').MongoClient;
var mongo_login = process.env.MONGO_LAB_LOGIN;
var mongoUrl = "mongodb://" + mongo_login + "@ds133328.mlab.com:33328/shorten-your-url"
MongoClient.connect(mongoUrl, (err, db) => {
  if (err) throw err;
  var db = db;
  
  //only listen when db is open
   // set the port of our application
// process.env.PORT lets the port be set by Heroku
  
  app.listen(process.env.PORT || 8080, function () {
     console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);;
  });
  
   app.get('', function(req,res){
       var rootURL = req.protocol + '://' + req.get('host');
       res.render('index.ejs',{root: rootURL});
});
 
 app.get('/', function(req,res){
     var rootURL = req.protocol + '://' + req.get('host');
     res.render('index.ejs',{root: rootURL});
});

  app.get('/:shortened', function(req,res){
     var rootURL = req.protocol + '://' + req.get('host');
     var shortHash = req.params.shortened;
     findURLbyShortHash(shortHash, rootURL);

     function findURLbyShortHash(shortHash){
      db.collection('shortener_map').find(  {  shortHash: shortHash  }).toArray(function(err,items){
         if (err) throw err;
         if(items.length != 0){
             var longURL = items[0].urlRequest;
             res.redirect(longURL);
         } else {
           res.render("wrong.ejs", { root: rootURL, shortHash: shortHash });
         }
   });

}
  });
  
   app.get('/new/:site*', function(req, res){
    var fullUrlRequested = req.params.site + req.params[0];
    var valid = checkUrlValid(fullUrlRequested);
    if(valid){
           console.log(fullUrlRequested + " is a valid site");
           async.waterfall([
            function(callback){
                var status = "";
                db.collection('shortener_map').find(  {urlRequest: fullUrlRequested } ).toArray(function(err,items){
                  if (err) throw err;
                  //url is not in the database
                   if(items.length == 0){
                     status = "add";
                     callback(null,status);
                     //url in DB but need to add a short hash
                   } else if(items[0].urlRequest == fullUrlRequested && items[0].shortHash == null) {
                       status = "update";
                       callback(null,status);
                       //both url & short hash are in DB
                   }  else {
                        status = "in DB already";
                        callback(null,status);
                   }
                });
            },
            function(status, callback){
                if(status == "add"){
                    getShortHash(status, fullUrlRequested);
                } else if (status == "update"){
                    getShortHash(status, fullUrlRequested);
                } else {
                    var shortHash = findShortHashbyURL(fullUrlRequested, renderShortenedURL);
                 }
                callback(null, 'done');
                }
            ], function (err, status) {
               if(err){
                    console.log(err);
                } 
            });
        } else {
       var data = { "error":"Wrong url format. Please check your url again." };
            //immediately send response
            res.send(JSON.stringify(data, null, 2));
        }
     
function checkUrlValid(url){
      var fullUrlRequested = url;
      var validUrlTest = /https?:\/\/(www\.)?[\w\/\-\.\%\:\+\~\#\=\?]+/;
      var validSite = validUrlTest.test(fullUrlRequested);
      return validSite;
  }
  
 function getShortHash(status, urlRequest){
      async.waterfall([

         //start building from check if url in db
        function(callback){
          var randInt = Math.floor(Math.random() * (1000 - 1)) + 1;
            callback(null, randInt, status, urlRequest);
        },
        function(num, status,urlRequest,callback){
            var base62Values = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var result = "";
            
             while(num > 0) {
               var r = num % 62;  
               result+=base62Values[r];
               num = (num/62).floor;
            // arg1 now equals randInt
            callback(null, result,status,urlRequest);
             }
        },
        function(shortHash,status,urlRequest, callback){
          var exists = true;
             db.collection('shortener_map').find(  {shortHash: shortHash } ).toArray(function(err,items){
                     if (err) throw err;
                     if(items.length == 0){
                       exists = false;
                          callback(null, shortHash,urlRequest, status,exists);
                     } else {
                         console.log(items);
                         callback(null, shortHash,urlRequest, status,exists);
                     }
                 });
        },  function(shortHash,requested,status,exists, callback){
                if(exists == false && status == "add") {
                    addURLtoDB(requested,shortHash);
                    renderShortenedURL(shortHash);
                } else if(exists == false && status == "update"){
                    updateURLShortHashinDB(requested,shortHash);
                    renderShortenedURL(shortHash);
                } else {
                    console.log("Try again. The generated short hash, " + shortHash + " is already in the system");
                }
                callback(null,"done");
        }
    ], function (err, result) {
       if(err){
            console.log(err);
        }   
    });
 }   
        function renderShortenedURL(shortHash){
              var rootURL = req.protocol + '://' + req.get('host');
              var shortURL = rootURL + "/" + shortHash;
              
              var data = { "originalUrl": fullUrlRequested, "shortURL": shortURL };
              //this out put is required by fcc 
                res.send(JSON.stringify(data, null, 2));
             //preferred modification
             // res.render('lookup.ejs', {longURL: fullUrlRequested, shortURL: shortURL});
    
        }


        function findShortHashbyURL(url, renderHashCallback){
            db.collection('shortener_map').find(  {  urlRequest: url  }).toArray(function(err,items){
               if (err) throw err;
                 if(items.length != 0){
                  var shortHash = items[0].shortHash;
                  renderHashCallback(shortHash);
                }   
            });
        }   
    
        function addURLtoDB(requested, shortHash){
         //convert numbers to strings for DB consistency
         if(typeof shortHash !== 'string'){
             shortHash = shortHash.toString();
         }
         db.collection('shortener_map').insert({ urlRequest: requested, shortHash: shortHash }, function(err,result){
                 if (err) throw err;
                 console.log("saved the following record to the database:")
                 console.log(result.ops[0]);
            });
        }

        function updateURLShortHashinDB(requested,shortHash){
            //convert numbers to strings for DB consistency
             if(typeof shortHash !== 'string'){
                 shortHash = shortHash.toString();
             }
            db.collection('shortener_map').update ({ urlRequest: requested },{ $set: { shortHash: shortHash } }, function(err,record){
               if (err) throw err;
                console.log("updated the following record in the database:")
                console.log(record);
            });
        }

}); // end of get request
}); //end of connection

