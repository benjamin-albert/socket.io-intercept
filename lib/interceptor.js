
/**
 * Module dependencies.
 */

var Server = require('socket.io');
var Client = require('socket.io-client');
var http = require('http');

var interceptors = {};
var clientTransport = require('./transports/client')(interceptors);
var serverTransport = require('./transports/server');

var engin = require('./engine');
engin.client.transports.eventemitter = clientTransport;
engin.server.transports.eventemitter = serverTransport;

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
      cb && cb.apply(this, arguments);
    } else {
      listen.apply(this, arguments);
    }
  };
}

var opne = engin.client.prototype.open;
engin.client.prototype.open = function() {
  var interceptor = interceptors[this.port];
  if (interceptor) {
    this.transports = ['eventemitter'];
  }

  opne.apply(this, arguments);
};

function Interceptor(options) {
  var port = options.port;
  this.port = port;

  interceptors[port] = this;
}

Interceptor.prototype.createClient = function(opts) {
  opts = opts || {};
  opts.transports = ['eventemitter'];

  var port = this.port;
  if (!port) {
    return Client(opts);
  } else {
    return Client('http://localhost:' + port + '/', opts);
  }
};

Interceptor.prototype.createServer = function(opts) {
  return new Server(this.port, opts);
};

module.exports = Interceptor;
