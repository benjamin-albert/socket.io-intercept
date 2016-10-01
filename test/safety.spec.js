var test = require('tape');
var http = require('http');
var request = require('superagent');
var intercept = require('../');

var PORT = 42653;

test('server that was NOT intercepted works as expected', function(t) {
  t.plan(1);

  PORT++;

  var io = require('socket.io')(PORT);

  testUnmockedServer(io, t);
});

test('server created by user that was NOT intercepted works as expected', function(t) {
  t.plan(1);

  PORT++;

  var server = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();
  });

  var io = require('socket.io')(server);

  server.listen(PORT);

  testUnmockedServer(io, t);
});

function testUnmockedServer(io, t) {
  // The point of this test is to make sure that we are
  // NOT mocking socket.io (and http server's listen)
  // so we make a real HTTP request.
  request
    .get('http://localhost:' + PORT)
    .end(function(err, res) {
      t.equal(res.status, 404, 'The expected status wes returnd');

      var client = require('socket.io-client')('http://localhost:' + PORT);
      client.on('connect', function() {
        client.disconnect();
        io.close();
        t.end();
      });
    });
}
