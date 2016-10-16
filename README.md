# Socket.IO Intercept

Socket.IO Intercept is a Socket.IO mocking library for Node.js

Socket.IO Intercept can be used to test Socket.IO server and client modules.

For instance, if a module exposes a Socket.IO server, you can test that module in isolation.

# Install

```sh
$ npm install socket.io-intercept --save-dev
```

## Use

The following example intercepts Socket.IO connections on port `3000` in your
spec (unit test).

```js
var intercept = require('socket.io-intercept');
// Make sure to call this before server.listen(port)
// Intercept connections on port 3000
intercept(3000);

// Require your socket.io application that listens on port 3000.
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

Once a Socket.IO server is intercepted:

* The client talks to the server (and vise-versa) in memory.
* Node.js will exit as soon as all clients disconnect (no need to close your HTTP server).
* You can recreate your app's Socket.IO server multiple times without having to introduce code that explicitly closes, and wait for the server to close before starting the next test.
* `server.listen(port)` becomes synchronous (no need add a callback for `server.listen()` in your app's module).
* No port/addr in use issues (Your Socket.IO app's HTTP server will **NOT** prevent a real server from binding on the port it's listening on).

# Goals
The main goal of Socket.IO Intercept is to make it easy to test your application code against the **real version of Socket.IO** (or socket.io-client) your app is using.

This approach offers the following advantages over other libraries that are alternative test friendly implementations of Socket.IO:

* 100% Socket.IO API consistency (**All of Socket.IO's features are supported**).
* **Less existing code refactoring** and smaller learning curve (once you call `intercept(port)` you use [socket.io](https://www.npmjs.com/package/socket.io) and [socket.io-client](https://www.npmjs.com/package/socket.io-client) the same way you are use to).
* If the Socket.IO team add a new feature you most likely **won't have to wait for this project to implement that feature properly**.
* When you decide to update Socket.IO **your tests can give you more meaningful insight** (in most cases without having to update this library).

Another important design goal of Socket.IO Intercept is to provide the bare minimum you need to start testing your code, and therefor providing a simple way for the user to start testing there code.

Once your application start growing and becomes more complex Socket.IO Intercept expects to be used along side (or as a dependency) of other libraries that provide more powerful tools and syntactic sugar.

# Minimum requirements

* Node.js version 0.12 or greater.
* Socket.IO version 1.4.5 or greater.
* Socket.IO Client version 1.4.5 or greater.

If you require support for older versions of Socket.IO or Node.js please open an issue (or even better a pull request).

# Development

Running unit tests:
```sh
$ npm test
```

Linting the code:

```sh
$ npm run lint
```

Generating code coverage reports:
```sh
$ npm run cover
```
