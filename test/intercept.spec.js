'use strict';

var test = require('tape');
var http = require('http');
var intercept = require('../');

var PORT = 1337;

function preventUnmockedListen(t) {
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
  };
}

function testIntercept(io, t) {
  t.plan(2);

  var expectedObject = {unit: 'Testing'};
  var expectedMessage = 'works!';

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
}

test('intercept server created by socket.io', function(t) {
  preventUnmockedListen(t);

  intercept({port: PORT});

  var io = require('socket.io')(PORT);

  testIntercept(io, t);
});

test('intercept server created by user', function(t) {
  preventUnmockedListen(t);

  intercept({port: PORT});

  var server = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();

    t.end();
  });

  var io = require('socket.io')(server);

  server.listen(PORT);

  testIntercept(io, t);
});

test('The callback to server.listen() is called', function(t) {
  preventUnmockedListen(t);

  intercept({port: PORT});

  var server = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();

    t.end();
  });

  var io = require('socket.io')(server);

  server.listen(PORT, function() {
    t.ok(true, 'The callback to server.listen() was called');
    t.end();
  });
});

test('connect_error is emitted when intercepting without a server', function(t) {
  t.plan(1);

  var badPort = PORT + 1;

  intercept(badPort);

  var client = require('socket.io-client')('http://localhost:' + badPort + '/');
  client.on('connect_error', function(error) {
    t.equal(error.message, 'You are trying to intercept port ' + badPort + ' but there is no server listening on this port');
    client.disconnect();
    t.end();
  });
});

test('Extra request headers are sent', function(t) {
  t.plan(2);
  preventUnmockedListen(t);

  var opts = {
    extraHeaders: {
      'X-Custom-Header-For-My-Project': 'my-secret-access-token',
      'Cookie': 'user_session=NI2JlCKF90aE0sJZD9ZzujtdsUqNYSBYxzlTsvdSUe35ZzdtVRGqYFr0kdGxbfc5gUOkR9RGp20GVKza; path=/; expires=Tue, 07-Apr-2015 18:18:08 GMT; secure; HttpOnly'
    }
  };

  intercept(PORT);

  var io = require('socket.io')(PORT);
  io.on('connection', function(client) {
    var expectedHeaders = opts.extraHeaders;
    var headers = client.request.headers;

    for (var key in expectedHeaders) {
      if (expectedHeaders.hasOwnProperty(key)) {
        t.equal(headers[key], headers[key], 'The request header has ' + key);
      }
    }
  });

  var client = require('socket.io-client')('http://localhost:' + PORT + '/', opts);
  client.on('connect', function() {
    client.disconnect();
    t.end();
  });
});
