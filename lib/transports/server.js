
/**
 * Module dependencies.
 */

var parser = require('engine.io-parser')
  , debug = require('debug')('engine:ws'),
  server = require('../engine').server,
  Transport = server.Transport;

/**
 * Export the constructor.
 */

module.exports = WebSocket;
/**
 * WebSocket transport
 *
 * @param {http.ServerRequest}
 * @api public
 */

function WebSocket (req) {
  Transport.call(this, req);
  var self = this;
  this.emitter = req.__emitter;

  this.emitter.on('client message', this.onData.bind(this));
  this.emitter.once('close', this.onClose.bind(this));

  this.writable = true;
  this.perMessageDeflate = null;
}

/**
 * Called with an incoming HTTP request.
 *
 * @param {http.ServerRequest} request
 * @api private
 */

Transport.prototype.onRequest = function (req) {
  var headers = {
    'Content-Type': 'application/octet-stream'
  };

  this.emit('headers', headers);

  var res = req.res;
  res.writeHead(200, headers);
  res.end();
};


/**
 * Inherits from Transport.
 */

WebSocket.prototype.__proto__ = Transport.prototype;

/**
 * Transport name
 *
 * @api public
 */

WebSocket.prototype.name = 'eventemitter';

/**
 * Advertise upgrade support.
 *
 * @api public
 */

WebSocket.prototype.handlesUpgrades = false;

/**
 * Advertise framing support.
 *
 * @api public
 */

WebSocket.prototype.supportsFraming = true;

/**
 * Processes the incoming data.
 *
 * @param {String} encoded packet
 * @api private
 */

WebSocket.prototype.onData = function (data) {
  debug('received "%s"', data);
  Transport.prototype.onData.call(this, data);
};

/**
 * Writes a packet payload.
 *
 * @param {Array} packets
 * @api private
 */

WebSocket.prototype.send = function (packets) {
  var self = this;
  packets.forEach(function(packet) {
    parser.encodePacket(packet, self.supportsBinary, function(data) {
      debug('writing "%s"', data);

      self.writable = false;

      setImmediate(function() {
        self.emitter.emit('server message', data);

        self.writable = true;
        self.emit('drain');
      });
    });
  });
};

/**
 * Closes the transport.
 *
 * @api private
 */

WebSocket.prototype.doClose = function (fn) {
  debug('closing');
  this.emitter.emit('close');
  fn && fn();
};
