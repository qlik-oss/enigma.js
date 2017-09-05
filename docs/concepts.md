# High-level concepts

[Back to overview](../README.md#readme)

---

Table of contents

- [Node.js versus browser](#nodejs-vs-browser)
- [Promises](#promises)
- [Authentication](#authentication)
- [Schemas, the QIX interface](#schemas-the-qix-interface)
- [Generic object model](#generic-object-model)
- [JSON-RPC protocol](#json-rpc-protocol)

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

All generated API methods returns a promise.

Read more:

* [Promises on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
* [`async`/`await` on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

[Back to top](#high-level-concepts)

## Authentication

enigma.js does not handle authentication due to the simple reason that different products and deployments
handle it differently. We do however provide a couple of examples for the more common use cases which you can
find on the link below.

Read more:

* [Authentication examples](../examples/authentication)
* [Qlik Sense Help: Authentication methods](http://help.qlik.com/en-US/sense/June2017/Subsystems/ManagementConsole/Content/authentication-methods.htm)
  
[Back to top](#high-level-concepts)

## Schemas, the QIX interface

enigma.js uses schemas to generate a programmatic interface against QIX Engine.
Below we will outline what a schema consists of, and what their purpose are.

An important note is that enigma.js normalizes the QIX method names into camelCasing,
while QIX Engine uses PascalCasing. `GetObject` in QIX Engine would be `getObject`
in enigma.js.

enigma.js allows you to invoke QIX methods by either using what is called 'position',
which is an array of parameters, or by name, using an object with key/value pairs.

Example of using the different parameters:

```js
doc.getObject('object-id');
doc.getObject({ qId: 'object-id' });
```

Read more:

* [Request object on Qlik Sense Help](http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/EngineAPI/Content/introducing-engine-API.htm)

[Back to top](#high-level-concepts)

### QIX classes, or structs

The classes is the [generic object](#generic-object-model) interfaces
describing the available QIX methods you may interact with for that type. Depending
on the schema version used, there may be a number of different classes available
(if you are curious, check the specific schema file you are using for the available
classes and methods). You generally create, retrieve, and remove these from the `Doc`
interface.

Read more:

* [Doc class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/AppClass/App-class.htm)
* [Field class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/FieldClass/Field-class.htm)
* [GenericBookmark class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/GenericBookmarkClass/GenericBookmark-class.htm)
* [GenericObject class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/GenericObjectClass/GenericObject-class.htm)
* [GenericDimension class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/GenericDimensionClass/GenericDimension-class.htm)
* [GenericMeasure class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/GenericMeasureClass/GenericMeasure-class.htm)
* [Global class](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/Classes/GlobalClass/Global-class.htm)

[Back to top](#high-level-concepts)

### QIX enums

The QIX Engine error codes have constants in the schema that you can use to
make your error handling code easier to read.

Read more:

* [Example of enums in 12.20.0](https://github.com/qlik-oss/enigma.js/blob/f45eb27de2f5d9af1ea99d6e1487cd62dda8fd73/schemas/12.20.0.json#L1188)

[Back to top](#high-level-concepts)

## Generic object model

This section will give you a brief overview how the generic object model works. See
the links at the end of this section for more in-depth information.

The QIX Engine uses what we call the generic object model within a document (also called app).

These generic objects all have unique identifiers, and can be interacted with using the QIX
interface schema methods.

Consider this:

A document, `document.qvf`, contains generic object properties, data, load scripts, etc. When
you want to interact with that content, you generally use the generic object model. Let's say
you want to interact with a generic object with id `my-object`:

```js
doc.getObject('my-object').then((api) => {
  // api is now an object with QIX interface methods for the GenericObject struct
});
```

When we do `getObject`, we will request a [_handle_](https://en.wikipedia.org/wiki/Handle_(computing))
for that object. Until that session is closed, QIX Engine will notify you of changes on that handle
every time it gets invalidated (either by changes related to the data model referenced in it, or property changes).

Note that these changes will only be triggered when QIX Engine changes the state from valid to invalid
on that handle:

```js
// bind 'changed' event to get notified when the state is invalid':
api.on('changed', () => console.log('The generic object changed'));
// `getLayout` will set the generic object state to 'valid' in QIX Engine,
// evaluating any hypercubes, expressions, etc. inside it:
api.getLayout().then(() => {
  // 'getProperties' will give you the underlying properties describing
  // the generic object layout, including the hypercube/expression sources etc.:
  api.getProperties().then((props) => {
    // modify some properties to you liking:
    props.someValue = true;
    // 'setProperties' will modify the generic object state from 'valid' to
    // 'invalid' in QIX Engine, causing a 'changed' event in enigma.js:
    api.setProperties(props).then(() => {
      // the 'changed' event handler above should now have been invoked
    });
  });
})
```

Read more:

* [Generic objects on Qlik Sense Help](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/GenericObject/overview-generic-object.htm)

[Back to top](#high-level-concepts)

## JSON-RPC protocol

QIX Engine uses JSON-RPC over websockets for communication. In short, it means the enigma.js gives you an API that will be translated into a JSON-RPC request object, and handle the JSON-RPC response sent back from QIX Engine, eventually back to you in a predictable format. Please see the links below for more details about the protocol.

Read more:

* [Qlik Engine API on Qlik Sense Help](http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/EngineAPI/Content/introducing-engine-API.htm)
* [JSON-RPC specification](http://www.jsonrpc.org/specification)

[Back to top](#high-level-concepts)

---

[Back to overview](../README.md#readme)
