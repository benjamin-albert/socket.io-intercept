module.exports = {
  server: load('engine.io'),
  client: load('engine.io-client')
};

function load(moduleId) {
  try {
    // NPM 3 flat layout
    return require(moduleId);
  } catch (e) {
    // NPM 2 hierarchical layout
    return require('socket.io/node_modules/' + moduleId);
  }
}
