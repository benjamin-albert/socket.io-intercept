var Interceptor = require('./interceptor');

function intercept(options) {
  if (typeof options !== 'object') {
    throw new Error('You must pass an object to socket.io-intercept');
  }

  options.port = Number(options.port);

  return new Interceptor(options);
}

module.exports = intercept;
