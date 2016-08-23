var servers = {};

var client;
try {
  // NPM 3+
  client = require('engine.io-client');
} catch (e) {
  client = require('../node_modules/socket.io-client/node_modules/engine.io-client');
}

client.transports.eventemitter = require('./transports/client')(client, servers);

var engineIo;
try {
  // NPM 3+
  engineIo = require('engine.io');
} catch (e) {
  engineIo = require('../node_modules/socket.io/node_modules/engine.io');
}

engineIo.transports.eventemitter = require('./transports/server')(engineIo);
// console.log(engineIo);

var Server = require('socket.io');
var http = require('http');

var attach = Server.prototype.attach;
Server.prototype.attach = function(srv, opts) {
  // handle a port as a string
  if (Number(srv) == srv) {
    srv = Number(srv);
  }

  var io = this;
  if ('number' == typeof srv) {
    srv = servers[srv] = http.createServer(function(req, res) {
      res.writeHead(404);
      res.end();
    });
  } else {
    srv.listen = function (port, cb) {
      servers[port] = srv;
      cb && cb.apply(this, arguments);
    };
  }

  attach.call(io, srv, opts);

  return this;
};

// var engine;
// var bind = Server.prototype.bind;
// Server.prototype.bind = function(v) {
//   v = v.constructor;
//   console.log(v);
//   if (!engine) {
//     v.transports.eventemitter = require('./transports/server')(v);
//     engine = v;
//   }
//
//   bind.call(this, v);
// };

function tst() {
  var start = Date.now();
var io = require('socket.io')(80);

io.on('connection', function(socket) {
  console.log(socket.request.headers);
  socket.join('asdf');
  socket.on('foo', function(bar) {
    console.log(bar);
    io.to('asdf').emit('baz', {abc: 'def'});

    socket.disconnect();
    // socket
  });
});

var socket = intercept({ port: 80, hostname: 'sdfojsdifjsio.com' }).createClient();

var io = intercept({port: 80}).createServer();

var socket = require('socket.io-client')('http://127.0.0.1:80/', {
  transports: ['eventemitter']
});

console.log(socket.engine.port);

socket.on('connect', function (){
  var intr = setInterval(function() {
    socket.emit('foo', {bar: 'This is a test'});
  }, 1);

  socket.on('baz', function(abc) {
    console.log(abc);
  });

  socket.on('disconnect', function() {
    clearInterval(intr);console.log(Date.now()-start);tst();
  });
});


}
tst();
