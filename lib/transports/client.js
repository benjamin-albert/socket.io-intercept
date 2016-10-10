/**
 * Module dependencies.
 */
var supertest = require('supertest');
var parser = require('engine.io-parser');
var inherit = require('component-inherit');
var Emitter = require('component-emitter');
var debug = require('debug')('engine.io-client:websocket');
var client = require('../engine').client;
var Transport = client.Transport;
var interceptors;

/**
 * Module exports.
 */

module.exports = function(i) {
  interceptors = i;
  return WS;
};

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS (opts) {
  this.perMessageDeflate = opts.perMessageDeflate;

  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'eventemitter';

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  this.emitter = new Emitter();
  this.addEventListeners();

  var self = this;
  var request = supertest(function(req, res) {
    var interceptor = interceptors[self.port];
    if (!interceptor.server) {
      res.end();

      return self.onError('You are trying to intercept port ' + self.port + ' but there is no server listening on this port');
    }

    req.__emitter = self.emitter;
    self.onOpen();

    interceptor.server.emit('request', req, res);
  });

  request = request.get(this.path);
  request.query(this.query);

  debug('supertest open %s: %s', this.method, this.uri);

  if (this.extraHeaders) {
    for (var i in this.extraHeaders) {
      if (this.extraHeaders.hasOwnProperty(i)) {
        request.set(i, this.extraHeaders[i]);
      }
    }
  }

  request
    .expect(200)
    .end(function(err, res) {
      if (err) {
        return self.onError(err);
      }
    });
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function () {
  var self = this;
  var emitter = this.emitter;

  emitter.on('server message', function(data) {
    self.onData(data);
  });

  emitter.on('close', function() {
    self.onClose();
  });
};

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function (packets) {
  var self = this;
  this.writable = false;

  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  var total = packets.length;
  for (var i = 0, l = total; i < l; i++) {
    encode(packets[i]);
  }

  function encode(packet) {
    parser.encodePacket(packet, true /*supportsBinary*/, function (data) {
      self.emitter.emit('client message', data);
      if (--total === 0) {
        done();
      }
    });
  }

  function done () {
    self.emit('flush');

    // fake drain
    // defer to next tick to allow Socket to clear writeBuffer
    setTimeout(function () {
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function () {
  this.emitter.emit('close');
};
