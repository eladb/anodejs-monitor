var request = require('request');
var Mongolian = require('mongolian');
var async = require('async');

exports.start = function(mongoConnectionString) {

  function ping(db, targetId, req, cb) {
    // send the request (store start time).
    var startTime = new Date();
    try {
      request(req, function(err, result) {
        var endTime = new Date();
        var latency = endTime.getTime() - startTime.getTime();
        var coll = db.collection('ping');
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

  function pingTargets(db, callback) {
    var pingTargets = db.collection('pingTargets');
    pingTargets.find().toArray(function(err, targets) {
      var pingFunctions = [];
      targets.forEach(function(t) {
        var targetId = t["_id"];
        delete t["_id"];
        pingFunctions.push(function(cb) {
          console.log("info: request:", t);
          ping(db, targetId, t, cb);
        });
      });

      async.parallel(pingFunctions, function(err) {
        console.log('verbose: ping cycle complete');
        callback(null);
      });
    });
  }
  
  (function worker() {
    var db = new Mongolian(mongoConnectionString);
    pingTargets(db, function() {
      console.log('verbose: waiting 5 seconds before the next ping');
      setTimeout(worker, 5000);
    });
  })();
};