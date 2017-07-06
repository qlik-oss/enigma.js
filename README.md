![](enigma.png)

[![CircleCI](https://circleci.com/gh/qlik-oss/enigma.js.svg?style=shield)](https://circleci.com/gh/qlik-oss/enigma.js)
[![Greenkeeper badge](https://badges.greenkeeper.io/qlik-oss/enigma.js.svg)](https://greenkeeper.io/)

enigma.js is a library that communicates with Qlik QIX Engine.
You can use it to build your own analytics tools or Node.js services that for example
performs CRUD (create, read, update and delete) operations on Qlik documents.

---

* [Getting started](#getting-started)
* [Documentation](./docs/README.md#overview)
* [Documentation for v1.x](https://github.com/qlik-oss/enigma.js/tree/v1.x/docs#overview)
* [Migrating from v1.x](./docs/migrate-v1.md)
* [Contributing](./.github/CONTRIBUTING.md)

---

## Getting started

### Prerequisites

Before continuing, make sure that you have these tools installed:

* Node.js >= 4.0
* Git bash if on Windows

And know of at least some these web technologies:

* JavaScript
* Promises
* Web sockets

### Usage

First off, install enigma.js and a WebSocket library:

```sh
npm -S i enigma.js ws
```

Next, create a new file called `my-file.js` and put the following code into it:

```js
const enigma = require('enigma.js');
const WebSocket = require('ws');
const schema = require('enigma.js/schemas/12.20.0.json');

// create a new session:
const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app',
  createSocket: url => new WebSocket(url),
});

// bind traffic events to log what is sent and received on the socket:
session.on('traffic:sent', data => console.log('sent:', data));
session.on('traffic:received', data => console.log('received:', data));

// open the socket and eventually receive the QIX global API:
session.open().then((global) => {
  console.log('We are connected!');
  process.exit(0);
}).catch(err => console.log('Something went wrong :(', err));
```

And then run it:

```sh
node my-file.js
```

You may need to adjust the code so the URL points towards your running QIX Engine.
