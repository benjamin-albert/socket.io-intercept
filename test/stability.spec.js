var test = require('tape');
var http = require('http');
var request = require('superagent');
var intercept = require('../');

test('server that was NOT intercepted works as expected', function(t) {
  t.plan(1);

  var port = 42653;
  var io = require('socket.io')(port);

  // The point of this test is to make sure that we are
  // NOT mocking socket.io (and http server's listen)
  // so we make a real HTTP request.
  request
    .get('http://localhost:' + port)
    .end(function(err, res) {
      t.equal(res.status, 404, 'The expected status wes returnd');
      io.close();
      t.end();
    });
});
