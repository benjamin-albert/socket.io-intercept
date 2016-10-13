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
    var self = this;
    var args = arguments;
    server.close(function() {
      end.apply(self, args);
    });
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

test('Socket.IO namespaces work as expected', function(t) {
  t.plan(2);

  preventUnmockedListen(t);

  intercept({port: PORT});

  var io = require('socket.io')(PORT);

  var adminConnections = 0;
  io.of('/admin').on('connection', function(s) {
    adminConnections++;
  });

  var chatConnections = 0;
  io.of('/chat').on('connection', function() {
    chatConnections++;
    t.equal(adminConnections, 1, 'The expected admin connections accourd');
    t.equal(chatConnections, 1, 'The expected chat connections accourd');
  });

  var adminClient = require('socket.io-client')('http://localhost:' + PORT + '/admin');
  adminClient.on('connect', function() {


    var chatClient = require('socket.io-client')('http://localhost:' + PORT + '/chat');

      adminClient.disconnect();
    chatClient.on('connect', function() {
      chatClient.disconnect();
      t.end();
    });
  });
});

function createTestServer(t) {
  preventUnmockedListen(t);

  intercept({port: PORT});

  var server = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();

    t.end();
  });

  require('socket.io')(server);

  return server;
}

test('The callback to server.listen() is called', function(t) {
  var server = createTestServer(t);

  t.deepEqual(server.address(), null, 'this.address() returns null before calling listen');

  server.listen(PORT, function() {
    t.deepEqual(this.address(), { address: '::', family: 'IPv6', port: PORT }, 'this.address() returns the expected object');
    t.end();
  });
});

test('The callback to server.listen() is called when passed a bind address', function(t) {
  var server = createTestServer(t);

  t.deepEqual(server.address(), null, 'this.address() returns null before calling listen');

  server.listen(PORT, 'example.com', function() {
    t.deepEqual(this.address(), { address: '::', family: 'IPv6', port: PORT }, 'this.address() returns the expected object');
    t.end();
  });
});

test('The server listening event is emitted', function(t) {
  var server = createTestServer(t);

  server.on('listening', function() {
    t.deepEqual(this.address(), { address: '::', family: 'IPv6', port: PORT }, 'this.address() returns the expected object');
    t.end();
  });

  server.listen(PORT);
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

test('Listening on the same intercepted port more than once throws', function(t) {
  intercept(PORT);

  var server = http.createServer(function() {});
  var io = require('socket.io')(server);
  server.listen(PORT);

  server = http.createServer(function() {})
    .on('error', function(err) {
      t.ok(err instanceof Error, 'An error was provided');
      t.equal(err.message, 'listen EADDRINUSE :::1337, Call intercepted(...) before listening on this port again');
      t.equal(err.code, 'EADDRINUSE', 'The error has the expected code');
      t.equal(err.errno, 'EADDRINUSE', 'The error has the expected errno');
      t.equal(err.syscall, 'listen', 'The error has the expected syscall');
      t.equal(err.port, 1337, 'The error has the expected port');
      t.end();
    })
    .on('listening', function() {
      t.end(new Error('Listening on the same intercepted port more than once should throws'));
    });

  io = require('socket.io')(server);
  server.listen(PORT);
});

test('intercept() throws when passed invalid arguments', function(t) {
  var expectedMessage = 'You must pass options object or port number to socket.io-intercept';
  var expectedBadObjectMsg =  'The options object does not have a numeric port property';
  try {
    intercept();
    throw new Error('Calling intercept() without arguments should throw');
  } catch (e) {
    t.equal(e.message, expectedMessage, 'Passing undefined to intercept() throws the expected error');
  }

  try {
    intercept(function() {});
    throw new Error('Calling intercept() with a function as the first argument should throw');
  } catch (e) {
    t.equal(e.message, expectedMessage, 'Passing a function as the first argument to intercept() throws the expected error');
  }

  try {
    intercept('abc');
    throw new Error('Calling intercept() with a String as the first argument should throw');
  } catch (e) {
    t.equal(e.message, expectedMessage, 'Passing a String as the first argument to intercept() throws the expected error');
  }

  try {
    intercept({ loem: 'ipsum', dolor: 'sit' });
    throw new Error('Calling intercept() with object that does not have a port propery should throw');
  } catch (e) {
    t.equal(e.message, expectedBadObjectMsg, 'The options object does not have a numeric port property');
  }

  try {
    intercept(/[0-9]/);
    throw new Error('Calling intercept() with a RegExp as the first argument should throw');
  } catch (e) {
    t.equal(e.message, expectedBadObjectMsg, 'The options object does not have a numeric port property');
  }

  t.end();
});
