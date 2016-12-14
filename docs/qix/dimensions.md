# Dimensions

Dimensions are created from fields in the data and defines on what field values calculations should be done.


## Instance methods

To retrieve a dimension, call the `getDimension` method on the [app](apps.md).

```javascript
app.getDimension( "dimensionId" ).then( ( dimension ) => {
    // Continue working with the dimension
} );
```

This is a selection of commonly used methods, you can find a complete list in the Engine API reference.

**Engine API reference**
- Class: [GenericDimension](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericDimensionClass/GenericDimension-class.htm)
- Struct: [GenericDimensionLayout](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericDimensionLayout.htm)
- Struct: [GenericDimensionProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericDimensionProperties.htm)


### `dimension.getLayout()`

Evaluates a dimension and displays its properties, including the dynamic properties.

```javascript
dimension.getLayout().then( ( layout ) => {
    // Got the layout
} );
```


### `dimension.getProperties()`

Gets the properties of the dimension.

Returns the identifier and the definition of the dimension.

```javascript
dimension.getProperties().then( ( properties ) => {
    // Got the properties
} );
```


### `dimension.setProperties()`

Sets properties for the dimension.

```javascript
dimension.setProperties( properties ).then( ( properties ) => {
    // Properties was set
} );
```


## Listing dimensions

You can list dimensions by creating a session object on the app.

```javascript
app.createSessionObject( {
    qDimensionListDef: {
        qShowReserved: false,
        qShowConfig: false
    }, qInfo: {
        qId: "DimensionList",
        qType: "DimensionList"
    }
} ).then( ( list ) => {
    return list.getLayout();
} ).then( ( listLayout ) => {
    return listLayout.qDimensionList.qItems;
} ).then( ( dimensionItems ) => {
   // Got the dimension list
} );
```

**Engine API reference**
- Struct: [DimensionListDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/DimensionListDef.htm)
- Struct: [DimensionList](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/DimensionList.htm)


## Related methods

The following related methods are available on the [app](apps.md):

### `app.createDimension( properties )`

- `properties` Object - See [GenericDimensionProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/AppClass/App-class-CreateDimension-method.htm#GenericDimensionProperties) in Engine API.

Creates a master dimension that can be used in several objects. Several generic objects can contain the same dimension.

```javascript
app.createDimension().then( ( layout ) => {
    console.log( layout.myprop );
} );
```


### `app.getDimension( id )`

- `id` - String - Identifier of the dimension.

Returns the handle of the dimension.

```javascript
app.getDimension().then( ( dimension ) => {
    // Continue working with the dimension
} );
```


### `app.cloneDimension( id )`

- `id` - String - Identifier of the dimension to clone.

Clones a dimension.

```javascript
app.cloneDimension().then( ( dimension ) => {
    // Continue working with the dimension
} );
```


### `app.destroyDimension( id )`

- `id` - String - Identifier of the dimension to remove.

Removes a dimension.

```javascript
app.destroyDimensionById().then( ( layout ) => {
    // Dimension was destroyed
} );
```
