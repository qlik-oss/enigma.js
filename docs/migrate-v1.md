# Migrating from version 1.x

[Back to overview](../README.md#readme)

This document outlines how to update your application from enigma.js version 1.x to version 2.0.
The breaking changes are mainly limited to configuration, fetching sessions, and package file structure.
All generated APIs from enigma.js should work just like in version 1.

---

Table of contents

- [Service concept dropped](#service-concept-dropped)
- [Schema directory flattened](#schema-directory-flattened)
- [Configuration overhaul](#configuration-overhaul)
- [Entry API changed](#entry-api-changed)
- [Session events](#session-events)
- [Session cache and websockets](#session-cache-and-websockets)
- [Mixin `init(args)` changed](#mixin-initargs-changed)
- [Trying to fetch non-existing objects](#trying-to-fetch-non-existing-objects)
- [Traffic logging](#traffic-logging)

---

## Service concept dropped

In enigma.js version 1, there was a concept called "enigma.js services" which was
planned to be expanded with different modules supporting communication with a wide range
of Qlik back-end services. In enigma.js version 2 this concept has been dropped in an effort
to _streamline enigma.js for communicating against QIX engine(s)_.

The enigma.js REST service is no longer available, and we recommend that you use [swagger-js](https://github.com/swagger-api/swagger-js)
to accomplish the same by using a library that is streamlined for generating and providing
APIs based on OpenAPI/swagger definitions.

[Back to top](#migrating-from-version-1x)

## Schema directory flattened

The `enigma.js/schemas` directory has been flattened. If you did this in enigma.js
version 1:

```js
const schema = require('enigma.js/schemas/qix/3.2/schema.json');
```

...you would do this in enigma.js version 2:

```js
const schema = require('enigma.js/schemas/3.2.json');
```

Read more:

* [All available schemas](../schemas)
* [Concept: Schemas](../docs/concepts.md#schemas-the-qix-interface)

[Back to top](#migrating-from-version-1x)

## Configuration overhaul

The configuration has been revamped a lot in enigma.js version 2, to make it
easier to understand and predict. All configuration properties in `config.session`
has been removed from enigma.js, and can now be supplied into the new
[`SenseUtilities.buildUrl()`](./api.md#senseutilitiesbuildurlconfig) API if needed.

Read more:

* [enigma.js configuration](./api.md#configuration)
* [SenseUtilities configuration](./api.md#configuration-1)

[Back to top](#migrating-from-version-1x)

## Entry API changed

Due to the service concept being dropped, the entry API for enigma.js has changed in version 2.

If you used enigma.js like this in version 1:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2/schema.json');
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
const schema = require('enigma.js/schemas/3.2.json');
// you are now in full control of the websocket URL:
const config = { schema, url: 'ws://localhost:9076/app/123' };
enigma.create(config).open().then((global) => {
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
const schema = require('enigma.js/schemas/3.2.json');
// configuration for sense-utilities module:
const urlConfig = { host: 'localhost', port: 9076, appId: '123', secure: false };
// you are now in full control of the websocket URL:
const config = { schema, url: SenseUtilities.buildUrl(urlConfig) };
enigma.create(config).open().then((global) => {
  // global === QIX global interface
  global.openDoc(config.appId).then((doc) => {
    // doc === QIX doc interface
  });
});
```

Read more:

* [`enigma.create(config)`](./api.md#enigmacreateconfig)
* [`SenseUtilities.buildUrl(config)`](./api.md#senseutilitiesbuildurlconfig)

[Back to top](#migrating-from-version-1x)

## Session events

In enigma.js version 1 you could send in a `config.listeners` object with event handlers
for different session events. We had to add this due to the automatic opening
of the socket when doing `enigma.getService()`.

In enigma.js version 2 we only open the websocket _when you are ready_.
This allows you to bind all events like you are used to, using `.on('event', fn)`.

If you did this in version 1:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/qix/3.2/schema.json');
const config = {
  schema,
  host: 'localhost',
  listeners: {
    'notification:OnAuthenticationInfo': () => {}
  },
};
enigma.getService('qix', config).then((qix) => {
  // qix.global === QIX global interface
});
```

...you would do this in version 2:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');
const config = { schema, url: 'ws://localhost/app/engineData' };
const session = enigma.create(config);
session.on('notification:OnAuthenticationInfo', () => {});
session.open().then((global) => {
  // global === QIX global interface
});
```

In addition to this, a few events were removed or renamed:

### `session-created`

You may instead use the [`opened`](./api.md#event-opened) event.

### `qix-error` (never documented)

You may instead look for `data.error` using the [`traffic:received`](./api.md#event-trafficreceived) event.

Example:

```js
session.on('traffic:received', (data) => {
  if (data.error) {
    // qix error occurred
  }
});
```

[Back to top](#migrating-from-version-1x)

## Session cache and websockets

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
    session = enigma.create({ schema, url });
    session.on('closed', () => delete sessions[url]);
    sessions[url] = session;
  }
  return session.open();
}

getSession('ws://localhost:9076/app/123').then((global) => {
  // global === QIX global interface
});
```

[Back to top](#migrating-from-version-1x)

## Mixin `init(args)` changed

The mixin API has been changed slightly to grant the mixin developer access
to the enigma.js configuration.

If your mixin looked like this in enigma.js version 1:

```js
const mixin = {
  init: function (args) {
    this.Promise = args.Promise;
  }
};
```

it would look like this in enigma.js version 2:

```js
const mixin = {
  init: function (args) {
    this.Promise = args.config.Promise;
  }
};
```

This allows the developer to access all properties sent into [`enigma.create()`](./api.md#enigmacreateconfig).
Keep in mind that to avoid potential configuration clashes in the future, use a namespace
in the enigma.js configuration for your mixin.

[Back to top](#migrating-from-version-1x)

## Trying to fetch non-existing objects

In enigma.js version 1 we never normalized the QIX Engine API in regards to fetching objects, which
caused the promise to be resolved with a null value:

```js
doc.getObject('non-existing-id').then((api) => {
  // api === null
  if (api) {
    // run your code using 'api'
  }
});
```

In version 2, it will be rejected:

```js
doc.getObject('non-existing-id').then((api) => {
  // run your code using 'api' safely
}).catch(err => console.log('Object did not exist'));
```

[Back to top](#migrating-from-version-1x)

## Traffic logging

In enigma.js version 1, you could log websocket traffic by sending in a `config.handleLog`
callback function. In version 2, this callback is replaced with
[`traffic:*`-events](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#event-trafficsent).

If you did this in version 1:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/qix/3.2/schema.json');
const config = {
  schema,
  host: 'localhost',
  handleLog: message => console.log(message),
};
enigma.getService('qix', config).then((qix) => {
  // qix.global === QIX global interface
});
```

...you would do this in version 2:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');
const config = { schema, url: 'ws://localhost/app/engineData' };
const session = enigma.create(config);
session.on('traffic:*', (direction, message) => console.log(direction, message));
session.open().then((global) => {
  // global === QIX global interface
});
```

[Back to top](#migrating-from-version-1x)

---

[Back to overview](../README.md#readme)
