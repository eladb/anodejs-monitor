
exports.listen = function(port, connection) {

  var Mongolian = require('mongolian');
  var express = require('express');
  var async = require('async');
  var static = require('node-static');
  var bson = require('mongodb').BSONPure;
  
  var app = express.createServer();
  app.use(express.bodyParser());

  var fileserver = new static.Server('./static');

  app.get('/targets', function(req, res) {
    var db = new Mongolian(connection);
    var targetsCollection = db.collection('pingTargets');
    targetsCollection.find().toArray(function(err, targets) {
      var result = [];
      targets.forEach(function(t) {
        t['pings_url'] = '/targets/' + t['_id'];
        delete t['_id'];
        result.push(t);
      });
      
      res.send(result);
    });
  });
  
  app.get('/targets/:id', function(req, res) {
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
  
  app.post('/targets', function(req, res) {
      var db = new Mongolian(connection);
      var pingTargets = db.collection('pingTargets');
      console.log('info: adding target:', req.body);
      pingTargets.save(req.body, function(err) {
          if (err) {
            res.send('error adding a new target: ' + JSON.stringify(err), 400);
            return;
          }
          
          res.redirect('/');
      });
  });
  
  app.delete('/targets/:tid', function(req, res) {
      console.log('info: deleting target with id', req.params.tid);
      var db = new Mongolian(connection);
      var pingTargets = db.collection('pingTargets');
      pingTargets.remove({ "_id": bson.ObjectID(req.params.tid) }, function(err) {
          if (err) {
            res.send(err, 400);
            return;
          }
          
          res.redirect('/');
      });
  });
  
  app.get(/.*/, function(req, res) {
    fileserver.serve(req, res);
  });

  app.listen(port);
};