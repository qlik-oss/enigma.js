# QIX

The QIX Service provides an API to communicate with a Qlik Sense (QIX) Engine. It can be used to build analytics tools, providing the full flexibility of the Engine API.

enigma.js can connect to any supported version of Qlik Sense by using the schema files located under `/schemas`. It can even maintain sessions to several instances at the same time. Current supported versions of Qlik Sense are based on the schemas included in the enigma.js version you use. The list of schemas can be [found here](../../schemas/qix).


**Note:** The documentation on this page only covers a subset of the full Engine API. For complete documentation of the Engine API, refer to [Engine API documentation](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/introducing-engine-API.htm).

## Content

- [Configuration](configuration.md)
- [Global](global.md)
    - [Apps](apps.md)
        - [Objects](objects.md)
        - [Fields](fields.md)
        - [Bookmarks](bookmarks.md)
        - [Dimensions](dimensions.md)
        - [Measures](measures.md)
        - [Variables](variables.md)
- [Instances](instances.md)
- [Session](session.md)
- [Mixins](mixins.md)


## Usage

```javascript
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/qix/3.2/schema.json');
const config = {
  schema,
  url: 'ws://localhost:4848/app',
};
enigma.create(config).open().then((global)) => {
  console.log('Got the global instance');

  global.openDoc('MyApp').then((app) => {
    console.log('Got the app instance');

    app.getObject('xyz123').then((obj) => {
      console.log('Got the object instance');

      obj.getLayout().then((layout) => {
        console.log('Got the object layout', layout);
      });
    });
  });
});
```

## Naming conventions

enigma.js uses camel casing (`getObject`) for method names, while Engine API uses Pascal casing (`GetObject`).

Parameters can be passed either by name through an object:

```javascript
enigma.create(config).open().then((global) => {
  return global.openDoc({ qDocName: 'MyApp' }).then((app) => {
    // Parameter passed by name through an object.
  });
});
```

or by position:

```javascript
enigma.create(config).open().then((global) => {
  return global.openDoc('MyApp').then((app) => {
    // Parameter passed by position.
  });
});
```

## Promises

All generated API methods return promises. In addition to the default values
of promises, we add these to all promises that is created from a method call.

### `promise.requestId`: The JSON-RPC request id

This id is a required parameter into some Engine methods for e.g. cancelling
ongoing calculations.

Example:

```javascript
const promise = myObject.getLayout();
global.cancelRequest(promise.requestId);
```

## Protocol

The client interacts with engine through an extended version of the JSON-RPC protocol. The engine returns handles

Request:

```json
{
  "handle": 1,
  "id": 10,
  "method": "CreateObject",
  "jsonrpc": "2.0",
  "params": [
    {
      "qMetaDef": {
        "title": "My new sheet",
        "description": ""
      },
      "qInfo": {
        "qId": "HvZvHV",
        "qType": "sheet"
      }
    }
  ]
}
```

Response:

```json
{
  "id": 10,
  "jsonrpc": "2.0",
  "result": {
    "qReturn": {
      "qType": "GenericObject",
      "qHandle": 4
    },
    "qInfo": {
      "qId": "HvZvHV",
      "qType": "sheet"
    }
  },
  "change": [1, 2, 4]
}
```

**Note:** In the example above, note the `change` parameter in the response. Those are the handles for the invalidated objects. They will not get another change until a GetLayout has been called on that handle.
