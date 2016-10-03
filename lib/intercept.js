var Interceptor = require('./interceptor');

function intercept(options) {
  var type = typeof options;

  switch (type) {
    case 'number': case 'object': break;
    default:
      throw new Error('You must pass options object or port number to socket.io-intercept');
  }

  if (type === 'number') {
    options = {port: options};
  }

  if (typeof options.port !== 'number') {
    throw new Error('The options object does not have a numeric port property');
  }

  return new Interceptor(options);
}

module.exports = intercept;
