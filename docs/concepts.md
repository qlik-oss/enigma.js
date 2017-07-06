# High-level concepts

[Back to overview](./README.md#overview)

---

Table of contents

- [Node.js versus browser](#nodejs-vs-browser)
- [Promises](#promises)
- [Authentication](#authentication)
- [JSON-RPC protocol](#json-rpc-protocol)
- [Generic object model](#generic-object-model)

---

## Node.js versus browser

enigma.js as a library can be used both in a Node.js environment, as well as in a browser. This enables you to build projects that are portable, and behaves similarly on top of enigma.js. But this compatibility also introduces a few differences in configuration that we explain more in detail under the [Configuration section](./api.md#configuration).

[Back to top](#high-level-concepts)

## Promises

Asynchronicity in the JavaScript world is commonly solved by using either promises or callbacks.

enigma.js makes heavy use of promises because we believe that it gives you several advantages compared to callbacks:

* cleaner code for the end-user,
* error handling can be deferred more easily,
* and is compatible with emerging standards (async/await).

All generated APIs from enigma.js returns a promise.

Read more: [Promises on MDN(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

[Back to top](#high-level-concepts)

## Authentication

enigma.js does not handle authentication due to the simple reason that different products and deployments
handle it differently. We do however provide a couple of examples for the more common use cases which you can
find on the link below.

Read more: [Authentication examples](../examples/authentication)
  
[Back to top](#high-level-concepts)

## JSON-RPC protocol

TODO:

* Explain briefly how it works, and perhaps links into Qlik help for further reading.

[Back to top](#high-level-concepts)

## Generic object model

TODO:

* Explain how handles and objects work against Engine, and how enigma.js helps by generating these APIs.

[Back to top](#high-level-concepts)

---

[Back to overview](./README.md#overview)
