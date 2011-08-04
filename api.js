//
// api.js - rest api for the monitoring service

//
// listen - start the api rest server on a specified port.
// port: the tcp port to use
// connection: the mongo url to bind to
exports.listen = function(port, connection) {
  var Mongolian = require('mongolian');
  var express = require('express');
  var async = require('async');
  var static = require('node-static');
  var bson = require('mongodb').BSONPure;

  var app = express.createServer();
  app.use(express.bodyParser());

  // we serve static files from ./static
  var fileserver = new static.Server('./static');

  //
  // helper function to query the ping targets collection
  // targetId: the ID of the target to find or null if you want all the targets.
  // callback: function(err, targets)
  function queryTargets(targetId, callback) {
    var db = new Mongolian(connection);
    var targetsCollection = db.collection('pingTargets');
    targetsCollection.find().toArray(function(err, targets) {
      if (err) {
        callback(err)
        return;
      }
    
      var result = [];
      targets.forEach(function(t) {
        t['pings_url'] = '/pings/' + t['_id'];
        t['id'] = t['_id'];
        delete t['_id'];
        result.push(t);
      });
      
      callback(null, result);
    });
  }

  //
  // REST api to retreive all ping targets
  app.get('/targets', function(req, res) {
    queryTargets(null, function(err, targets) {
      if (err) res.send(err, 500);
      else res.send(targets);
    });
  });
  
  //
  // REST api to retrieve a specific ping target
  app.get('/targets/:id', function(req, res) {
    queryTargets(req.params.id, function(err, targets) {
      if (err) res.send(err, 500);
      else {
        if (!targets || targets.length < 1) {
          res.send('target not found', 404);
          return;
        }
        
        res.send(targets[0]);
      }
    });
  });
  
  //
  // REST api to add a target
  app.post('/targets', function(req, res) {
      var db = new Mongolian(connection);
      var pingTargets = db.collection('pingTargets');
      console.log('info: adding target:', req.body);
      pingTargets.save(req.body, function(err) {
          if (err) {
            res.send('error adding a new target: ' + JSON.stringify(err), 400);
            return;
          }

          res.send('target added');
      });
  });
  
  //
  // REST api to delete a target
  app.delete('/targets/:tid', function(req, res) {
      console.log('info: deleting target with id', req.params.tid);
      var db = new Mongolian(connection);
      var pingTargets = db.collection('pingTargets');
      pingTargets.remove({ "_id": bson.ObjectID(req.params.tid) }, function(err) {
          if (err) {
            res.send(err, 400);
            return;
          }
          
          res.send('target deleted');
      });
  });
  
  //
  // REST api to retrieve the last 200 ping records for a target
  app.get('/pings/:id', function(req, res) {
    var tid = req.params.id;
    var db = new Mongolian(connection);
    var coll = db.collection('ping');
    
    coll.find({ target: bson.ObjectID(tid) }).sort({ "timestamp": -1 }).limit(200).toArray(function(err, pings) {
      var result = [];
      pings.forEach(function(p) {
        delete p['_id'];
        delete p['target'];
        result.push(p);
      });
      res.send(result);
    });
  });
  
  //
  // serve static files for all other URLs
  app.get(/.*/, function(req, res) {
    fileserver.serve(req, res);
  });

  // start listening
  app.listen(port);
};