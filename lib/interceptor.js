
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
    interceptListen(srv, opts);
  }

  attach.call(this, srv, opts);

  return this;
};

function createServer(srv, opts) {
  var port = srv;
  var interceptor = interceptors[port];

  srv = http.createServer(function(req, res) {
    res.writeHead(404);
    res.end();
  });

  if (interceptor) {
    interceptor.server = srv;
  } else {
    srv.listen(port);
  }

  return srv;
}

function interceptListen(srv, opts) {
  var listen = srv.listen;

  srv.listen = function (port, cb) {
    var interceptor = interceptors[port];
    if (interceptor) {
      interceptor.server = srv;
      if (cb) {
        cb.apply(this, arguments);
      }
    } else {
      listen.apply(this, arguments);
    }
  };
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
