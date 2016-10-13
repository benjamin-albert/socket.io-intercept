
/**
 * Module dependencies.
 */

var Server = require('socket.io');
var Client = require('socket.io-client');
var http = require('http');

var interceptors = {};
var clientTransport = require('./transports/client')(interceptors);
var serverTransport = require('./transports/server');

var engine = require('./engine');
engine.client.transports.mock = clientTransport;
engine.server.transports.mock = serverTransport;

var attach = Server.prototype.attach;

Server.prototype.attach =
Server.prototype.listen = function(srv, opts) {
  // handle a port as a string
  if (Number(srv) == srv) {
    srv = Number(srv);
  }

  if ('number' == typeof srv) {
    srv = createServer(srv, opts);
  } else {
    interceptListen(srv);
  }

  attach.call(this, srv, opts);

  return this;
};

function createServer(srv, opts) {
  var port = srv;

  srv = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();
  });

  interceptListen(srv);

  srv.listen(port);

  return srv;
}

function interceptListen(srv) {
  var listen = srv.listen;

  srv.listen = function (port, address, cb) {
    if (typeof address === 'function') {
      cb = address;
    }

    var interceptor = interceptors[port];
    if (interceptor && interceptor.server) {
      return srv.emit('error', createListenError(port));
    }

    if (interceptor) {
      interceptor.server = srv;

      srv.address = function() {
        return { address: '::', family: 'IPv6', port: port };
      };

      srv.emit('listening');
      if (cb) {
        cb.call(srv);
      }
    } else {
      listen.apply(this, arguments);
    }
  };
}

function createListenError(port) {
  var original = ':::' + port + ', Call intercepted(...) before listening on this port again';
  var syscall = 'listen';
  var errname = 'EADDRINUSE';
  var message = syscall + ' ' + errname + ' ' + original;

  var e = new Error(message);
  e.code = errname;
  e.errno = errname;
  e.syscall = syscall;
  e.port = 1337;

  return e;
}

var opne = engine.client.prototype.open;
engine.client.prototype.open = function() {
  var interceptor = interceptors[this.port];
  if (interceptor) {
    this.transports = ['mock'];
  }

  opne.apply(this, arguments);
};

function Interceptor(options) {
  var port = options.port;
  this.port = port;

  interceptors[port] = this;
}

module.exports = Interceptor;
