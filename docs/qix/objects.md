# Objects

An object, or a generic object, binds to data using hypercubes, listobjects and expressions. It is represented by a JSON structure of properties.

A generic object has a hierarchic structure, a data structure and properties, and after it has been calculated, it also has a layout.


## Properties

Generic objects has properties in a structure that you define yourself. There are two kinds of properties:
- User defined: persisted by Qlik Sense and included as-is in the layout.
- QIX defined: validated by the Qlik engine and replaced in the output, that is the layout, by the calculated counterparts.


**Engine API reference**
- [Properties that can be set](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/GenericObject/PropertyLevel/properties-that-can-be-set.htm)
- [Properties that can be rendered](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/GenericObject/PropertyLevel/properties-that-can-be-rendered.htm) (layout)


### Expressions

There are different types of expressions. This section describes how to use the dynamic ones that can be put anywhere in the properties.

**Engine API reference**
- Entity: [StringExpression](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/StringExpression.htm)
- Entity: [ValueExpression](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/ValueExpression.htm)

```javascript
const properties = {
    myStringProp: {
        qStringExpression: {
            qExpr: "Avg(Sales)"
        }
    },
    myNumberProp: {
        qValueExpression: {
            qExpr: "Avg(Sales)"
        }
    }
};
```

This expression will be evaluated to:

```javascript
const layout = {
    myStringProp: "198.22",
    myNumberProp: 198.221456
};
```

**Note:** String expressions are not evaluated if the expression is surrounded by simple quotes.


### Hypercubes

Hypercubes are one of the core parts of the QIX Engine. They are built using properties and are used to perform calculations on data. Hypercubes represent extractions of the data loaded for apps, and are defined through the `HyperCubeDef`.

**Note:** Hypercube values are filtered by selections.

**Engine API reference**
- Entity: [HyperCubeDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/HyperCubeDef.htm)
- Entity: [HyperCube](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/HyperCube.htm)


### Listobjects

Listobjects are another core part of the QIX Engine. They are used to show data contained in fields.

When you receive the layout of a listobject, all values are rendered. If selections has been applied, the values in the listobject are not filtered, but instead marked as *selected*, *excluded*, *alternative* or *selected excluded*. Listobjects can also sort the values depending on this state.


**Engine API reference**
- Entity: [ListObjectDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/ListObjectDef.htm)
- Entity: [ListObject](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/ListObject.htm)


## Child objects

Generic objects can have children, which are also generic objects.

**Engine API reference**
- Entity: [ChildListDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/ChildListDef.htm)
- Entity: [ChildList](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/ChildList.htm)


## Instance methods

These are some commonly used methods on the `object` instance. For a complete reference, see https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericObjectClass/GenericObject-class.htm.

To retrieve an object instance you can call the `getObject` method on the [app](apps.md).

```javascript
app.getObject( "objectId" ).then( ( object ) => {
    // Continue working with the object
} );
```

This is a selection of commonly used methods, you can find a complete list in the Engine API reference.

**Engine API reference**
- Class: [GenericObject](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericObjectClass/GenericObject-class.htm)
- Entity: [GenericObjectProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericObjectProperties.htm)
- Entity: [GenericObjectLayout](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericObjectLayout.htm)


### `object.getLayout( id )`

Evaluates an object and displays its properties including the dynamic properties.

```javascript
object.getLayout().then( ( layout ) => {
    console.log( layout.myprop );
} );
```


### `object.getProperties( id )`

Returns the identifier, the type and the properties of the object.

Since it is not mandatory to set all properties when you define an object, properties that were not set may be returned.

**Note:** If the object contain soft properties, these are not returned by the `getProperties` method. Use the `getEffectiveProperties` method instead.

**Note:** If the object is linked to another object, the properties of the linking object are not returned by the `getProperties` method. Use the `getEffectiveProperties` method instead.

```javascript
object.getProperties().then( ( properties ) => {
    console.log( layout.myprop );
} );
```


### `object.setProperties( properties )`

- `properties` Object - The property structure.

Sets properties for a generic object.

```javascript
object.setProperties( properties ).then( () => {
    console.log( layout.myprop );
} );
```


### `object.applyPatches( patches[, softPatch] )`

- `patches` Array - Array of patches
- `softPatch` Boolean - If set to `true`, the properties to apply are not persistent, it is a soft patch. Default is `false`.

Applies a patch to the properties of an object. Allows an update to some of the properties. 

You can apply a patch to the properties of a generic object, that is not persistent. Such a patch is called a *soft patch*.

Properties that are not persistent are called *soft properties*. Once the engine session is over, soft properties are cleared.

**Note:** Soft properties apply only to generic objects.

**Tip:** Applying a patch takes less time than resetting all the properties.

```javascript
object.applyPatches( [{
    qOp: "replace",
    qPath: "/myprop",
    qValue: "new value"
}] ).then( () => {
     model.getLayout().then( ( layout ) => {
        console.log( layout.myprop );
    } );
} );
```


### `object.setFullPropertyTree( properties )`

- `properties` Object - The property structure.

Sets the properties of:

- a generic object
- the children of a generic object
- the bookmarks or embedded snapshots of a generic object

```javascript
object.setFullPropertyTree( properties ).then( () => {
    console.log( layout.myprop );
} );cd
```

**Tip:** This function is useful to set properties in a parent-child hierarchy with one single call, allowing undo / redo operations to work as expected.


### `object.createChild( properties )`

- `properties` Object - The property structure.

Creates a child object of another generic object. The instance can be retrieved using `app.getObject( childId )` or `object.getChild( childId )`.

```javascript
object.createChild( properties ).then( ( childObject ) => {
    // Continue working with the child object
} );
```


### `object.getHyperCubeData( properties )`

- `path` String - Path to the hypercube within the property structure.
- `pages` Array - Array of pages to retrieve.

Gets the values of a chart, table, or scatter plot. It is possible to retrieve specific pages of data.

**Note:** This method does not apply to stacked tables.

```javascript
object.getHyperCubeData( "/qHyperCubeDef", [{
    qTop: 0,
    qLeft: 0,
    qWidth: 10, // Number of columns
    qHeight: 1000 // Number of rows
}] ).then( function ( dataPages ) {
    console.log( dataPages );
} );
```


### `object.getListObjectData( path, pages )`

- `path` String - Path to the listobject within properties.
- `pages` Array - Array of pages to retrieve.

Gets the values of a list object.

```javascript
object.getListObjectData( "/qListObjectDef", [{
    qTop: 0,
    qLeft: 0,
    qWidth: 10, // Number of columns
    qHeight: 1000 // Number of rows
}] ).then( function ( dataPages ) {
    console.log( dataPages );
} );
```


### `object.selectHyperCubeValues( path, dimNo, values, toggleMode )`

- `path` String - Path of the hypercube within properties.
- `dimNo` Integer - Dimension number or index to select. Dimension numbers/index start from 0.
- `values` Object - An array of field numbers to select.
- `toggleMode` Boolean - Set to true to toggle selections.

Selects values in one dimension. These values are identified by their element numbers.

**Note:** This method applies to charts, tables and scatter plots.

```javascript
object.selectHyperCubeValues( properties ).then( () => {
    // Selection was successful
} );
```


### `object.selectListObjectValues( path, values, toggleMode, softLock )`

- `path` String - Path of the hypercube within properties.
- `values` Object - An array of field numbers to select.
- `toggleMode` Boolean - Set to true to toggle selections.
- `softLock` Boolean (optional) - Set to true to ignore locks; in that case, locked fields can be selected.

Makes single selections in dimensions

**Note:** This method applies only to list objects.

```javascript
object.selectListObjectValues( properties ).then( () => {
    // Selection was successful
} );
```

## Listing objects

To list objects, you can create a session object on the app. The example below creates a session object that lists objects of type `FieldList`.

```javascript
app.createSessionObject( {
    qGenericObjectListDef: {
        qShowSystem: false,
        qShowHidden: false,
        qShowSrcTables: true,
        qShowSemantic: true,
        qShowDerivedFields: true
    }, qInfo: {
        qId: "FieldList",
        qType: "FieldList"
    }
} ).then( ( list ) => {
    return list.getLayout();
} ).then( ( listLayout ) => {
    return listLayout.qFieldList.qItems;
} ).then( ( fieldItems ) => {
   // Got the field list
} );
```

## Related methods

This section lists commonly used methods that are available on the [app](apps.md).


### `app.createObject( properties )`

- `properties` Object - The property structure.

Creates an object using the specified properties. Hypercubes, listobjects and expressions are typical contents of the properties.

Returns a `Promise` that is resolved with an object instance.

**Note:** You can create objects that are linked to other objects. The linking object is defined in the properties of the linked object (in `qExtendsId`). The linked object has the same properties as the linking object. The linking object cannot be a session object.


```javascript
app.createObject( {
    qInfo: {
        qId: "my-unique-id",
        qType: "my-type"
    },
    myprop: "xyz"
} ).then( ( object ) => {
    // Could continue with the object instance
} );
```

**Note:** If you do not specify your own ID in `qInfo.qId`, a unique ID will be automatically generated. `qInfo.qType` is optional but recommended as it simplifies listing objects.


### `app.createSessionObject( properties )`

- `properties` Object - The property structure.

Creates a session object. Session objects are temporary objects that are persisted when the session is closed.

**Note:** You can create objects that are linked to other objects. The linking object is defined in the properties of the linked object (in `qExtendsId`). The linked object has the same properties as the linking object. The linking object cannot be a session object.

```javascript
 app.createSessionObject( {
     myprop: "xyz"
 } ).then( ( object ) => {
     // Continue working with the object instance
 } );
```

### `app.getObject( id )`

- `id` String - The id of the object to get.

Returns the type of the object and the corresponding handle.


### `app.destroyObject( id )`

- `id` String - The id of the object to delete.

Removes an object from the app. If the object has any children, these are removed as well.


### `app.destroySessionObject( id )`

- `id` String - The id of the session object to delete.

Removes a session object from the session.
