# socket.io-intercept

socket.io-intercept is a socket.io mocking library for Node.js

socket.io-intercept can be used to test socket.io server and client modules.

For instance, if a module exposes a socket.io server, you can test that module in isolation.

# Install

```sh
$ npm install socket.io-intercept
```

## Use

The following example intercepts socket.io connections on port `3000` in your
spec (unit test).

```js
var intercept = require('socket.io-intercept');
// Make sure to call this before server.listen(port)
intercept({port: 3000});

// Require your socket.io application module.
require('./server');

// Install and use socket.io-client in your spec (unit test).
var client = require('socket.io-client')('http://localhost:3000/');
client.on('connect', function() {
  client.emit('event', function(message) {
     assert.equal(message, 'Cool!');
     client.disconnect(); // Don't forget to disconnect.
     assert.done(); // End the test.
  });
});
```

Once a socket.io server is intercepted:
* The client talks to the server (and vise-versa) in memory using the EventEmitter transport.
* Node.js will exit as soon as all clients disconnect (no need to close you're HTTP server).
* You can recreate you're app's socket.io server multiple times without having to introduce code that explicitly closes, and wait for the server to close before starting the next test.
* No port/addr in uses issues (You're socket.io app's HTTP server will **NOT** prevent a real server from binding on the port it's listening on).
