//
// ping.js - sends a set of http requests every once in a while and stores ping results in a mongodb

var request = require('request');
var Mongolian = require('mongolian');
var async = require('async');

//
// start - reads ping targets from db and starts the ping cycle.
// mongoConnectionString: the mongo url to connect to
exports.start = function(mongoConnectionString) {
  //
  // sends an http request and stores results in db.
  // db: the mongolian db object to use
  // targetId: the targetId to use when saving the results.
  // req: the request details (in the form of the 'request' module).
  // cb: function(err) - called after a response is received or an error.
  function ping(db, targetId, req, cb) {
    // send the request (store start time).
    var startTime = new Date();
    try {
      request(req, function(err, result) {
        var endTime = new Date();
        var latency = endTime.getTime() - startTime.getTime();
        var coll = db.collection('ping');
        
        // store record in mongo
        coll.save({
          timestamp: new Date(),
          target: targetId,
          request: req,
          statusCode: result.statusCode,
          latency: latency
        }, function(err) {
          if (err) console.log('error: ', req.url, err);
          else console.log('info: ' + req.url + ' ' + result.statusCode.toString() + ' ' + latency.toString() + 'ms');
          cb(null);
        });
      });
    } catch(e) {
      console.log('error: request ', req, '. error:', e.message);
      cb(null);
    }
  }

  //
  // pings all the targets specified in the 'pingTargets' mongo collection.
  // db: mongo connection
  // callback: function(err) - called after all targets have been pinged.
  function pingTargets(db, callback) {
    var pingTargets = db.collection('pingTargets');
    pingTargets.find().toArray(function(err, targets) {
      var pingFunctions = [];
      targets.forEach(function(t) {
        var targetId = t["_id"];
        delete t["_id"]; // we don't want the _id to appear in the request attributes.
        pingFunctions.push(function(cb) {
          console.log("info: request:", t);
          ping(db, targetId, t, cb);
        });
      });

      // send all ping requests in parallel.
      async.parallel(pingFunctions, function(err) {
        console.log('verbose: ping cycle complete');
        callback(null);
      });
    });
  }
  
  //
  // worker: pings all the targets and waits 5 seconds, then pings them again.
  (function worker() {
    var db = new Mongolian(mongoConnectionString);
    pingTargets(db, function() {
      console.log('verbose: waiting 5 seconds before the next ping');
      setTimeout(worker, 5000);
    });
  })();
};