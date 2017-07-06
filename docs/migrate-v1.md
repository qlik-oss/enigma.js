# Migrating from version 1.x

This document outlines how to update your application from enigma.js version 1.x to version 2.0.
The breaking changes are limited to configuration, fetching sessions, and package file structure.
All generated APIs from enigma.js should work just like in enigma.js version 1.

## Service concept dropped

In enigma.js version 1, there was a concept called "enigma.js services" which was
planned to be expanded with different modules supporting communication with a wide range
of Qlik back-end services. In enigma.js version 2 we are dropping this concept in an effort
to _streamline enigma.js for communicating against QIX engine(s)_.

The enigma.js REST service is no more, and we recommend using [swagger-js](https://github.com/swagger-api/swagger-js)
to accomplish the same by using a library that is streamlined for generating and providing
APIs based on OpenAPI/swagger definitions.

## Schemas

The `enigma.js/schemas` directory has been flattened. If you did this in enigma.js
version 1:

```js
const schema = require('enigma.js/schemas/qix/4.2.0/schema.json');
```

...you would do this in enigma.js version 2:

```js
const schema = require('enigma.js/schemas/4.2.0.json');
```

Read more:

* [All available schemas](../schemas)

## Configuration

The configuration has been revamped a lot in enigma.js version 2, to make it
easier to understand and predict. All configuration properties in `config.session`
has been removed from enigma.js, and can now be supplied into the new
[`SenseUtilities.buildUrl()`](./api.md#senseutilitiesbuildurlconfig) API if needed.

Read more:

* [enigma.js configuration](./api.md#configuration)
* [SenseUtilities configuration](./api.md#configuration-1)

## Entry API

Due to the service concept being dropped, the entry API for enigma.js has changed in version 2.

If you used enigma.js like this in version 1:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/4.2.0/schema.json');
const config = {
  host: 'localhost',
  port: 9076,
  appId: '123',
};
enigma.getService('qix', config).then((qix) => {
  // qix.global === QIX global interface
  // qix.app === QIX doc interface
});
```

It would look like this in enigma.js version 2:

```js
const enigma = require('enigma.js');
// schemas is flattened:
const schema = require('enigma.js/schemas/4.2.0.json');
// you are now in full control of the websocket URL:
const config = { url: 'ws://localhost:9076/app/123' };
enigma.create(config).connect().then((global) => {
  // global === QIX global interface
  global.openDoc('123').then((doc) => {
    // doc === QIX doc interface
  });
});
```

or if you are using Qlik Sense and want help building the URL:

```js
const enigma = require('enigma.js');
// sense-utilities is a new separate module for generating Sense-compatible URLs:
const SenseUtilities = require('enigma.js/sense-utilities');
// schemas is flattened:
const schema = require('enigma.js/schemas/4.2.0.json');
// you are now in full control of the websocket URL:
const config = {
  url: SenseUtilities.buildUrl({
    host: 'localhost',
    port: 9076,
    appId: '123',
    secure: false,
  }),
};
enigma.create(config).connect().then((global) => {
  // global === QIX global interface
  global.openDoc('123').then((doc) => {
    // doc === QIX doc interface
  });
});
```

Read more:

* [`enigma.create(config)`](./api.md#enigmacreateconfig)
* [`SenseUtilities.buildUrl(config)`](./api.md#senseutilitiesbuildurlconfig)

### Session cache and websockets

In enigma.js version 1, we tried to cache enigma.js sessions by storing them
using the generated URL as cache key. This caused tricky and hard-to-find bugs in some
scenarios and in enigma.js version 2, caching is left to the user of the library.
All calls to [`enigma.create()`](./api.md#enigmacreateconfig) will create a
_new_ enigma.js session (which will result in a new websocket as well).

Example of a URL-based cache:

```js
const sessions = {};

function getSession(url) {
  let session = sessions[url];
  if (!session) {
    session = enigma.create({ url });
    session.on('closed', () => delete sessions[url]);
    sessions[url] = session;
  }
  return session.connect();
}

getSession('ws://localhost:9076/app/123').then((global) => {
  // global === QIX global interface
});
```
