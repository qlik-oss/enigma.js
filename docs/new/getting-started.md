# Getting started

[Back to overview](./README.md#overview)

---

Table of contents

- [Prerequisites](#prerequisites)
- [Usage](#usage)

---

## Prerequisites

Before continuing, make sure that you have these tools installed:

* Node.js >= 8.0
* Git bash if on Windows

And know of at least some these web technologies:

* JavaScript
* Promises
* Web sockets

[Back to top](#getting-started)

## Usage

First off, install enigma.js and a WebSocket library:

```sh
npm -S i enigma.js ws
```

Next, create a new `.js` file and put the following code into it:

```js
const enigma = require('enigma.js');
const WebSocket = require('ws');

// create a new session:
const session = enigma.create({
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

[Back to top](#getting-started)

---

[Back to overview](./README.md#overview)
