![](enigma.png)

[![CircleCI](https://circleci.com/gh/qlik-oss/enigma.js.svg?style=shield)](https://circleci.com/gh/qlik-oss/enigma.js)
[![Coverage Status](https://img.shields.io/coveralls/qlik-oss/enigma.js/master.svg)](https://coveralls.io/github/qlik-oss/enigma.js)

enigma.js is a library that helps you communicate with Qlik QIX Engine. Examples of use may be building your own browser-based analytics tools, back-end services, or command-line scripts.

---

- [Getting started](#getting-started)
- [High-level concepts](./docs/concepts.md#high-level-concepts)
- [API documentation](./docs/api.md#api-documentation)
- [API documentation for v1.x](https://github.com/qlik-oss/enigma.js/tree/v1.x/docs#overview)
- [Migrating from v1.x](./docs/migrate-v1.md#migrating-from-version-1x)
- [Contributing](./.github/CONTRIBUTING.md#contributing-to-enigmajs)
- [Releasing](./.github/CONTRIBUTING.md#releasing)
- [Runnable examples](./examples/README.md#runnable-examples)

---

## Getting started

### Prerequisites

Before continuing, make sure that you have these tools installed:

* Node.js >= 4.0
* Git bash if on Windows

And know of at least some of these web technologies:

* JavaScript
* Promises
* Websockets

### Schemas

enigma.js use schemas as a source when generating the QIX Engine API. The exact
version of the schema you need is based on the QIX Engine version you want to
communicate with, as well as what you plan on using in the QIX Engine API.

Keep in mind that before version `12.20.0` the schema version corresponds to the
Qlik Sense Enterprise version, and from `12.20.0` and forward, the schema version
is mapped to the QIX Engine API version.

Read more:

* [High-level concepts: Schemas](./docs/concepts.md#schemas-the-qix-interface) for more information about how they work.
* [schemas/](/schemas) for the available schemas.

### Usage

First off, install enigma.js and a WebSocket library:

```sh
npm i -S enigma.js ws
```

Next, create a new file called `my-file.js` and put the following code into it:

```js
const enigma = require('enigma.js');
const WebSocket = require('ws');
const schema = require('enigma.js/schemas/12.20.0.json');

// create a new session:
const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});

// bind traffic events to log what is sent and received on the socket:
session.on('traffic:sent', data => console.log('sent:', data));
session.on('traffic:received', data => console.log('received:', data));

// open the socket and eventually receive the QIX global API, and then close
// the session:
session.open()
  .then((/*global*/) => console.log('We are connected!'))
  .then(() => session.close())
  .then(() => console.log('Session closed'))
  .catch(err => console.log('Something went wrong :(', err));
```

And then run it:

```sh
node my-file.js
```

You may need to adjust the code so the URL points towards your running QIX Engine.

![/getting-started.gif](/getting-started.gif)
  
You may also use a service like [unpkg](https://unpkg.com/#/) to test enigma.js directly in your browser without using Node.js for development purposes.  

Create a HTML file `index.html` and insert the following example content:

```html
<script src="https://unpkg.com/enigma.js/enigma.min.js"></script>
<script>
  fetch('https://unpkg.com/enigma.js/schemas/12.34.11.json')
    .then(response => response.json())
    .then(schema => {
      const session = enigma.create({
        schema,
        // Change the url to point to your QIX instance
        url: 'ws://localhost:9076/app/engineData',
        createSocket: url => new WebSocket(url)
      })

      session.open()
        .then(global => global.engineVersion())
        .then(result => document.body.innerHTML = result.qComponentVersion)
        .then(() => session.close())
    });
</script>
```
