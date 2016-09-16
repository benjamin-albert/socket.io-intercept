'use strict';

var test = require('tape');
var http = require('http');
var intercept = require('../');

var PORT = 1337;

function beforeEach(t) {
  var server = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();

    t.end(new Error('Transport was not mocked'));
  });

  server.listen(PORT);

  var end = t.end;
  t.end = function() {
    server.close();
    end.apply(this, arguments);
  }
}

test('intercept server created by socket.io', function(t) {
  t.plan(2);

  beforeEach(t);

  intercept({port: PORT});

  var expectedObject = {unit: 'Testing'};
  var expectedMessage = 'works!';

  var io = require('socket.io')(PORT);
  io.on('connection', function(client){
    client.emit('test1', expectedMessage);

    client.on('test2', function(cb) {
      cb(expectedObject);
    });
  });

  var client = require('socket.io-client')('http://localhost:' + PORT + '/');
  client.on('connect', function() {
    client.on('test1', function(message) {
      t.deepEqual(message, expectedMessage, 'The expected message was passed');

      client.emit('test2', function(object) {
        t.deepEqual(object, expectedObject, 'The expected object was passed in the ake');
        client.disconnect();
        t.end();
      });
    });

  });
});
