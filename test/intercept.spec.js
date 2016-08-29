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
  beforeEach(t);

  intercept({port: PORT});

  var expecteObject = {unit: 'Testing'};
  var expectedMessage = 'works!';

  var io = require('socket.io')(PORT);
  io.on('connection', function(socket) {
    socket.emit('test1', function(object) {
      t.deepEqual(object, expecteObject, 'The expected object was passed');
    });

    socket.on('test2', function(message) {
      t.deepEqual(message, expectedMessage, 'The expected object was passed');
      t.end();
    });
  });

  var client = require('socket.io-client')('http://localhost:' + PORT + '/');
  client.on('connect', function() {
    client.emit('test2', expectedMessage);
  });

  client.on('test1', function(cb) {
    cb(expecteObject);
    client.disconnect();
  });
});
