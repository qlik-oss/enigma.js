# API documentation

[Back to overview](./README.md#overview)

---

Table of contents

- [Configuration](#configuration)
  - [Mixins](#mixins)
  - [Interceptors](#interceptors)
- [`enigma.create(config)`](#enigmacreateconfig)
- [Session API](#session-api)
  - [`session.open()`](#sessionopen)
  - [`session.close()`](#sessionclose)
  - [`session.suspend()`](#sessionsuspend)
  - [`session.resume()`](#sessionresumeonlyifattachedfalse)
  - [Event: `opened`](#event-opened)
  - [Event: `closed`](#event-closed)
  - [Event: `suspended`](#event-suspended)
  - [Event: `resumed`](#event-resumed)
  - [Event: `notification:<name>`](#event-notificationname)
  - [Event: `notification:*`](#event-notification)
  - [Event: `traffic:sent`](#event-trafficsent)
  - [Event: `traffic:received`](#event-trafficreceived)
  - [Event: `traffic:*`](#event-traffic)
- [Generated API](#generated-api)
  - [Event: `changed`](#event-changed)
  - [Event: `closed`](#event-closed)
- [Sense utilities API](#sense-utilities-api)
  - [Configuration](#configuration-1)
  - [`SenseUtilities.buildUrl()`](#senseutilitiesbuildurlconfig)

---

## Configuration

This section describes the configuration object that is sent into [`enigma.create(config)`](#enigmacreateconfig).

| Property                | Type     | Optional   | Default   | Description |
|-------------------------|----------|------------|-----------|-------------|
| `schema`                | Object   | No         |           | Object containing the specification for the API to generate. Corresponds to a specific version of the QIX Engine API. |
| `url`                   | String   | No         |           | String containing a proper websocket URL to QIX Engine.
| `createSocket`          | Function | In browser |           | A function to use when instantiating the WebSocket, mandatory for Node.js. |
| `Promise`               | Promise  | Yes        | `Promise` | ES6-compatible Promise library. |
| `suspendOnClose`        | Boolean  | Yes        | `false`   | Set to `true` if the session should be suspended instead of closed when | `mixins`                | Array    | Yes        | `[]`      | Mixins to extend/augment the QIX Engine API. See [Mixins section](#mixins) for more information how each entry in this array should look like. |
| `interceptors`          | Array    | Yes        | `[]`      | Interceptors for augmenting responses before they are passed into mixins and end-users. See [Interceptors section](#interceptors) for more information how each entry in this array should look like. |
the websocket is closed. |
| `protocol`              | Object   | Yes        | `{}`      | An object containing additional JSON-RPC request parameters. |
| `protocol.delta`        | Boolean  | Yes        | `true`    | Set to `false` to disable the use of the bandwidth-reducing delta protocol. |

Example:

```js
const enigma = require('enigma.js');
const WebSocket = require('ws');
const bluebird = require('bluebird');
const schema = require('enigma.js/schemas/12.20.0.json');
const url = 'ws://localhost:9076/app';
const config = {
  schema,
  url,
  createSocket: url => new WebSocket(url),
  Promise: bluebird,
  suspendOnClose: true,
  mixins: [{ types: ['Global'], init: () => console.log('Mixin ran') }],
  protocol: { delta: false },
};
enigma.create(config).connect((global) => {
  // global === QIX global interface
});
```

[Back to top](#api-documentation)

### Mixins

See the separate [Mixins](./mixins.md#mixins) documentation.

### Interceptors

TODO: Write :)

## `enigma.create(config)`

Returns a [session](#session-api).

See [Configuration](#configuration) for the configuration options.

Example:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
const WebSocket = require('ws');
const config = {
  schema,
  url: 'ws://localhost:9076/app',
  createSocket: url => new WebSocket(url),
};
const session = enigma.create(config);
```

[Back to top](#api-documentation)

## Session API

You retrieve a session by calling [`enigma.create(config)`](#enigmacreateconfig).

### `session.open()`

Returns a promise.

Establishes the websocket against the configured URL. Eventually resolved with the
QIX global interface when the connection has been established.

Example:

```js
session.open().then((global) => {
  global.openDoc('my-document.qvf');
});
```

[Back to top](#api-documentation)

### `session.close()`

Returns a promise.

Closes the websocket and cleans up internal caches, also closes all the opened
models. Eventually resolved when the websocket has been closed.

Note: you need to manually invoke this when you want to close a session and
[`config.suspendOnClose`](#configuration) is `true`.

Example:

```js
session.close().then(() => console.log('Session was properly closed'));
```

[Back to top](#api-documentation)

### `session.suspend()`

Returns a promise.

Suspends the enigma.js session by closing the websocket and rejecting all method
calls until it has been resumed again.

Example:

```js
session.suspend().then(() => console.log('We are now suspended'));
```

[Back to top](#api-documentation)

### `session.resume([onlyIfAttached=false])`

Returns a promise.

Resume a previously suspended enigma.js session by re-creating the websocket and,
if possible, re-open the document as well as refreshing the internal caches. If
successful, `changed` events will be triggered on all generated APIs, and on
the ones it was unable to restore, the `closed` event will be triggered.

`onlyIfAttached` can be used to only allow resuming if the QIX Engine session
was reattached properly.

Eventually resolved when the websocket (and potentially the previously opened
document, and generated APIs) has been restored, rejected when it fails any
of those steps, or when `onlyIfAttached` is `true` and a new QIX Engine session
was created.

Example:

```js
// assuming suspended state:
doc.on('changed', () => console.log('Document was restored'));
object.on('changed', () => console.log('model1 was restored'));
sessionObject.on('closed', () => console.log('Session object could not be restored (new QIX Engine session)'));
session.resume().then(() => console.log('Session was properly resumed'));
```

[Back to top](#api-documentation)

### Event: `opened`

Handle opened state. This event is triggered whenever the websocket is connected and ready for
communication.

Example:

```js
session.on('opened', () => console.log('We are connected'));
```

### Event: `closed`

Handle closed state. This event is triggered when the underlying websocket is closed
and [`config.suspendOnClose`](#configuration) is `false`.

[Back to top](#api-documentation)

### Event: `suspended`

Handle suspended state. This event is triggered in two cases (listed below). It is
useful in scenarios where you for example want to block interaction in your application
until you are resumed again.

* If [`config.suspendOnClose`](#configuration) is `true` and there was a network disconnect (socked closed)
* If you ran [`session.suspend()`](#sessionsuspend)

Example:

```js
session.on('suspended', (evt) => console.log(evt.initiator));
```

The `evt.initiator` value is a string indicating what triggered the suspended state.
Possible values: `network`, `manual`.

[Back to top](#api-documentation)

### Event: `resumed`

Handle resumed state. This event is triggered when the session was properly resumed.
It is useful in scenarios where you for example can close blocking modal dialogs
and allow the user to interact with your application again.

[Back to top](#api-documentation)

### Event: `notification:<name>`

Handle a specific JSON-RPC notification event. These events depend on the product
you use QIX Engine from.

TODO: Insert links to Qlik help.

Example:

```js
session.on('notification:OnConnected', (data) => console.log(data));
``` 

[Back to top](#api-documentation)

### Event: `notification:*`

Handle all JSON-RPC notification events.

Example:

```js
session.on('notification:*', (eventName, data) => console.log(eventName, data));
``` 

[Back to top](#api-documentation)

### Event: `traffic:sent`

Handle outgoing websocket messages.

Generally used in debugging purposes.

Example:

```js
session.on('traffic:sent', (req) => console.log(req));
``` 

[Back to top](#api-documentation)

### Event: `traffic:received`

Handle incoming websocket messages.

Generally used in debugging purposes.

Example:

```js
session.on('traffic:received', (res) => console.log(res));
``` 

[Back to top](#api-documentation)

### Event: `traffic:*`

Handle all websocket messages.

Generally used in debugging purposes.

Example:

```js
session.on('traffic:*', (direction, msg) => console.log(direction, msg));
```

[Back to top](#api-documentation)

## Generated API

The API for generated APIs depends on the QIX Engine schema you pass into your
[Configuration](#configuration), and on what QIX struct the API has.

Read more: [Generic object model](./concepts.md#generic-object-model)

Example:

```js
global.openDoc('my-document.qvf').then((doc) => {
  doc.createObject({ qInfo: { qType: 'my-object' } }).then(api => /* do something with api */});
  doc.getObject('object-id').then(api => /* do something with api */});
  doc.getBookmark('bookmark-id').then(api => /* do something with api */});
});
```

[Back to top](#api-documentation)

### Event: `changed`

Handle changes on the API. The `changed` event is triggered whenever enigma.js
or QIX Engine has identified potential changes on the underlying properties
or hypercubes and you should re-fetch your data.

Example:

```js
api.on('changed', () => {
  api.getLayout().then(layout => /* do something with the new layout */);
});
```

[Back to top](#api-documentation)

### Event: `closed`

Handle closed API. The `closed` event is triggered whenever QIX Engine considers
an API closed. It usually means that it no longer exist in the QIX Engine document or 
session.

Example:

```js
api.on('closed', () => {
  /* do something in your application, perhaps route your user to an overview page */
});
```

[Back to top](#api-documentation)

## Sense utilities API

The Sense Utilities API is a standalone module delivered with enigma.js. It can be used
to generate Qlik Sense websocket URLs using a configuration, similar to how enigma.js
worked in version 1.

### Configuration

This section describes the configuration object that is sent into [`SenseUtilities.buildUrl(config)`](#senseutilitiesbuildurlconfig).

| Property     | Type     | Optional   | Default        | Description |
|--------------|----------|------------|----------------|-------------|
| `host`       | String   | Yes        | `localhost`    |             |
| `port`       | Number   | Yes        | `443` or `80`  | Default depends on `secure`. |
| `secure`     | Boolean  | Yes        | `true`         | Set to `false` to use an unsecure WebSocket connection (`ws://`). |
| `urlParams`  | Object   | Yes        | `{}`           | Additional parameters to be added to WebSocket URL. |
| `prefix`     | String   | Yes        |                | Absolute base path to use when connecting, used for proxy prefixes. |
| `route`      | String   | Yes        |                | Initial route to open the WebSocket against, default is `app/engineData`. |
| `subpath`    | String   | Yes        |                | Subpath to use, used to connect to dataprepservice in a server environment. |
| `identity`   | String   | Yes        |                | Identity (session ID) to use. |
| `ttl`        | Number   | Yes        |                | A value in seconds that QIX Engine should keep the session alive after socket disconnect (only works if QIX Engine supports it). |

[Back to top](#api-documentation)

### `SenseUtilities.buildUrl(config)`

Returns a string (websocket URL).

See [Configuration](#configuration-1) for the configuration options.

Example in browser:

```js
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
const SenseUtilities = require('enigma.js/sense-utilities');
const url = SenseUtilities.buildUrl(config);
const session = enigma.create({ schema, url });
```

[Back to top](#api-documentation)

---

[Back to overview](./README.md#overview)
