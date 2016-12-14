# Fields

Fields are created when you load data into your app, that is when the script is loaded. The fields have unique names that can be used to retrieve metadata and to build hypercubes and listobjects. Fields are basically containers of data.


## Instance methods

The field instance has methods to mainly work with selections regarding that field.

To retrieve a field, you can call the `getField` method on the [app](apps.md).

```javascript
app.getField( "fieldName" ).then( ( field ) => {
    // Continue working with the field
} );
```

This is a selection of commonly used methods, you can find a complete list in the Engine API reference.

**Engine API reference**
- Class: [Field](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/FieldClass/Field-class.htm)


### `field.select( match[, softLock, excludedValuesMode] )`

- `match` String - Text to search for. Can contain wild cards or numeric search criteria.
- `softLock` Boolean - Optional. Set to `true` to ignore locks; in that case, locked fields can be selected. Default is `false`.
- `excludedValuesMode` Integer - Optional. Include excluded values in search.

Selects field values matching a search string.


### `field.clear()`

Clears any selections made in this field.


### `field.lock()`

Locks all selected values of this field.


### `field.unlock()`

Unlocks all selected values of this field.


## Listing fields

To list fields, you can create a session object on the app.

```javascript
app.createSessionObject( {
    qFieldListDef: {
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

**Engine API reference**
- Entity: [FieldListDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/FieldListDef.htm)
- Entity: [FieldList](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/FieldList.htm)


## Related methods

This section lists the following related method that is available on the [app](apps.md):


### `app.getField( name[, stateName] )`

- `name` String - Name of the field.
- `stateName` String - Optional. Name of the alternate state.

Returns a `Promise` which is resolved with a `field` instance.

```javascript
app.getField().then( ( field ) => {
    // Retrieved the field
} );
```
