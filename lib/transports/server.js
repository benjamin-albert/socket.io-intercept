
/**
 * Module dependencies.
 */

var parser = require('engine.io-parser');
var debug = require('debug')('socket.io-intercept:Mock');
var server = require('../engine').server;
var inherit = require('component-inherit');

var Transport = server.Transport;

/**
 * Export the constructor.
 */

module.exports = Mock;

/**
 * Mock transport
 *
 * @param {http.ServerRequest}
 * @api public
 */

function Mock (req) {
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

Mock.prototype.onRequest = function (req) {
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

inherit(Mock, Transport);


/**
 * Transport name
 *
 * @api public
 */

Mock.prototype.name = 'mock';

/**
 * Advertise upgrade support.
 *
 * @api public
 */

Mock.prototype.handlesUpgrades = false;

/**
 * Advertise framing support.
 *
 * @api public
 */

Mock.prototype.supportsFraming = true;

/**
 * Processes the incoming data.
 *
 * @param {String} encoded packet
 * @api private
 */

Mock.prototype.onData = function (data) {
  debug('received "%s"', data);
  Transport.prototype.onData.call(this, data);
};

/**
 * Writes a packet payload.
 *
 * @param {Array} packets
 * @api private
 */

Mock.prototype.send = function (packets) {
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

Mock.prototype.doClose = function (fn) {
  debug('closing');
  this.emitter.emit('close');

  if (fn) {
    fn();
  }
};
