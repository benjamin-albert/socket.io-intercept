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
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }

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

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  var self = this;
  this.emitter = new Emitter();
  this.addEventListeners();

  var request = supertest(function(request, response) {
    var interceptor = interceptors[self.port];
    if (!interceptor) {
      return self.onError(new Error('Connection refused'));
    }

    request.__emitter = self.emitter;
    self.onOpen();
    interceptor.server.emit('request', request, response);
  });

  request = request.get(this.path);
  request.query(this.query);

  try {
    debug('xhr open %s: %s', this.method, this.uri);

    if (this.extraHeaders) {
      for (var i in this.extraHeaders) {
        if (this.extraHeaders.hasOwnProperty(i)) {
          request.set(i, this.extraHeaders[i]);
        }
      }
    }

    if ('POST' === this.method) {
      request.set('Content-type', 'text/plain;charset=UTF-8');
    }

    request
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return self.onError(err);
        }
      });

    debug('xhr data %s', this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function () {
      self.onError(e);
    }, 0);
    return;
  }
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
    (function (packet) {
      parser.encodePacket(packet, self.supportsBinary, function (data) {
        // Sometimes the websocket has already been closed but the browser didn't
        // have a chance of informing us about it yet, in that case send will
        // throw an error
        try {
          self.emitter.emit('client message', data);
        } catch (e) {
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
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
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function () {
  Transport.prototype.onClose.call(this);
  delete interceptors[this.port];
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function () {
  if (typeof this.emitter !== 'undefined') {
    this.emitter.emit('close');
  }
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function () {
  return true;
};
