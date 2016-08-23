var client;
try {
  // NPM 3+
  client = require('engine.io-client');
} catch (e) {
  client = require('../node_modules/socket.io-client/node_modules/engine.io-client');
}

exports.client = client;

var server;
try {
  // NPM 3+
  server = require('engine.io');
} catch (e) {
  try {
    server = require('../../../node_modules/socket.io/node_modules/engine.io');
  } catch (e) {
    server = require('../node_modules/socket.io/node_modules/engine.io');
  }
}

exports.server = server;
