# Overview

The enigma.js documentation is separated into three sections:

- To get started using enigma.js, see the getting started section below.
- Explanations around authentication in a browser or via header authentication can be found in the [Authentication](authentication.md) section.
- For technical documentation around how to use the different services, see the [Services](#services) section.

In addition, the technical details around the top-level API are described below.

## Getting started

enigma.js is a framework that communicates with Qlik Sense backend services. It can be used in the browser or in a Node.js environment, acting as an SDK by doing CRUD (create, read, update and delete) operations on apps and entities. You can also use it to build your own analytics tools or to build your own Node.js service.

Before you start, you will need to:

- install Node.js from the [Node.js](https://nodejs.org) website
- have a Qlik Sense Enterprise (or desktop) running, preferably on your local machine
- have experience of working with promises

**Note:** enigma.js uses promises extensively, so you are highly recommended to read up on them on for example [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

## Top-level API

enigma.js exposes an API for consuming backend services that are configured with settings.

### `getService( name[, config] )`

| Property | Type   | Description |
|----------|--------|-------------|
| `name`   | String | Name of the service. See the service section for alternatives. |
| `config` | Object | Service configuration, see docs for respective service. |

Returns an enigma.js service used to communicate with backend services.

## Usage

enigma.js can be used in CommonJS, AMD, and vanilla browser (global) formats. Install it by running:

```sh
npm install --save enigma.js
```

Basic usage is to pull in the library, call `getService` and start using the API of the returned service.

```javascript
const enigma = require('enigma.js');

enigma.getService('<Service Name>', { /* Service config */ }).then((serviceInstance) => {
  // Continue working with the instance
}, (err) => {
  // There was an error getting the service
});
```

## Services

- [The QIX service](qix/README.md)
