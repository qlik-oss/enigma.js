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
- [Mixins](mixins.md)


## Usage

```javascript
const enigma = require('enigma.js');
const qixSchema = require('./node_modules/enigma.js/schemas/qix/3.1/schema.json');
const config = {
  schema: qixSchema,
  session: {
      host: location.hostname
  }
};
enigma.getService('qix', config).then((qix) => {
  const g = qix.global;
  console.log('Got the global instance');

  g.openApp('MyApp').then((app) => {
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
Parameter names in the Engine API are often prefixed with a `q`, like `qName`, while in enigma.js they are just called `name`.

**Note:** This does not apply for properties and layout such as `qHyperCubeDef` where the `q`-prefix has a special meaning.

## Instances

When calling `getService` a QIX enigma.js service instance is returned. The `global` property of this instance is always accessible. This property can be used to call methods on the
[Global class](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GlobalClass/Global-class.htm).
Further instances with new methods to call are returned when you call methods such as `global.getObject`. The `object` instance is an instance of the
[GenericObject class](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericObjectClass/GenericObject-class.htm).

## Instance events

With the exception of `global`, instances emit the following general events:

### `changed` event

Called when the instance has been changed.

```javascript
instance.on('changed', () => {
  // Instance was changed
});
```

### `closed` event

Called when the instance has been closed. This happens when the instance is deleted or when the session is closed.

```javascript
instance.on('closed', () => {
  // Instance was destroyed or session has expired
});
```

## Properties and layout

Properties can be seen as instructions on how the engine should do calculations, and the layout represents the results of these calculations. The layout that is used to display data in for example tables and charts.

Properties prefixed with `q`, such as `qId` and `qHyperCubeDef`, have a special meaning for the engine. Properties without the `q`-prefix are _dynamic properties_ which will just return the value in the layout.

### States

Generic objects can be in either of these three states:

* **Invalid** - When something relating to the object's data has changed, it will be set to an invalid state. Either it's a change on the data model (typically a selection) or a property has been changed with a SetProperties command.
* **Validating** - When an object is invalid and a GetLayout of the object is invoked it will start a validation process and the state of the object will be set to Validating.
* **Valid** -When the validation of the object is finished the object's state is set to Valid which means that the layout asked for in the GetLayout command now can be returned.

## Protocol

The client interacts with engine through an extended version of the JSON-RPC protocol. The engine returns handles

Request:
```
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
```
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
