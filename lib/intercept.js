/**
 * Module dependencies.
 */

var Interceptor = require('./interceptor');


/**
 * Intercept Socket.IO server.
 *
 * @param {number} options - The port of the server to intercept.
 * @param {number} options.port - The port of the server to intercept.
 */
function intercept(options) {
  switch (typeof options) {
    case 'number':
      options = {port: options};
      break;
    case 'object': break;
    default:
      throw new Error('You must pass options object or port number to socket.io-intercept');
  }

  if (typeof options.port !== 'number') {
    throw new Error('The options object does not have a numeric port property');
  }

  return new Interceptor(options);
}

/**
 * Module exports.
 */
module.exports = intercept;
