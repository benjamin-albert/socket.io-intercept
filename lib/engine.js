module.exports = {
  server: load(''),
  client: load('-client')
};

function load(type) {
  try {
    // NPM 3 flat layout
    return require('engine.io' + type);
  } catch (e) {
    // NPM 2 hierarchical layout
    return require('socket.io' + type + '/node_modules/engine.io' + type);
  }
}
