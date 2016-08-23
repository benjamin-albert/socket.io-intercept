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

var io = require('socket.io')(80);

io.on('connection', function(socket) {
  console.log(socket.request.headers);
  socket.join('asdf');
  socket.on('foo', function(bar) {
    console.log(bar);
    io.to('asdf').emit('baz', {abc: 'def'});
    // socket
  });
});

function cli() {
var socket = require('socket.io-client')('http://127.0.0.1:80/', {
  transports: ['eventemitter']
});

socket.on('connect', function (){
  setInterval(function() {
    socket.emit('foo', {bar: 'This is a test'});
  }, 500);

  socket.on('baz', function(abc) {
    console.log(abc);
  });
});

}

cli();
cli();
