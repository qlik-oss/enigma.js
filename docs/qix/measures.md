# Measures

Measures are calculations used within generic objects and they are created from an expression composed of aggregation functions.

To retrieve a measure, you call the `getMeasure` method on the [app](apps.md).

```javascript
app.getMeasure( "measureId" ).then( ( measure ) => {
    // Continue working with the measure
} );
```


## Instance methods

This is a selection of commonly used methods on the `Measure` instance, you can find the complete reference in the Engine API reference.

**Engine API reference**
- Class: [GenericMeasure](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericMeasureClass/GenericMeasure-class.htm)
- Struct: [GenericMeasureLayout](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericMeasureLayout.htm)
- Struct: [GenericMeasureProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericMeasureProperties.htm)


### `measure.getLayout()`

Evaluates a measure and displays its properties, including the dynamic properties.

```javascript
measure.getLayout().then( ( layout ) => {
    // Got the layout
} );
```


### `measure.getProperties()`

Gets the properties of a measure.

Returns the identifier and the definition of the measure.

```javascript
measure.getProperties().then( ( properties ) => {
    // Got the properties
} );
```


### `measure.setProperties( properties )`

- `properties` - Object - The property structure.

Sets properties for a measure.

```javascript
measure.setProperties( properties ).then( ( properties ) => {
    // Properties was set
} );
```

## Listing measures

You can create a session object on the app to list the available measures.

```javascript
app.createSessionObject( {
    qMeasureListDef: {
        qShowReserved: false,
        qShowConfig: false
    }, qInfo: {
        qId: "MeasureList",
        qType: "MeasureList"
    }
} ).then( ( list ) => {
    return list.getLayout();
} ).then( ( listLayout ) => {
    return listLayout.qMeasureList.qItems;
} ).then( ( measureItems ) => {
   // Got the measure list
} );
```

**Engine API reference**
- Struct: [MeasureListDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/MeasureListDef.htm)
- Struct: [MeasureList](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/MeasureList.htm)


## Related methods

The following related methods are available on the [app](apps.md):

### `app.createMeasure( properties )`

- `properties` Object - See [GenericMeasureProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/AppClass/App-class-CreateMeasure-method.htm#GenericMeasureProperties) in Engine API.

Creates a master measure. A master measure can be used in many objects and several generic objects can contain the same measure.

```javascript
app.createMeasure().then( ( layout ) => {
    console.log( layout.myprop );
} );
```


### `app.getMeasure( id )`

- `id` - String - Identifier of the measure.

Returns the handle of the measure.

```javascript
app.getMeasure().then( ( measure ) => {
    // Continue working with the measure
} );
```


### `app.cloneMeasure( id )`

- `id` - String - Identifier of the measure to clone.

Clones a measure.

```javascript
app.cloneMeasure().then( ( measure ) => {
    // Continue working with the measure
} );
```


### `app.destroyMeasure( id )`

- `id` - String - Identifier of the measure to remove.

Removes a generic measure.

```javascript
app.destroyMeasureById().then( ( layout ) => {
    // Measure was destroyed
} );
```
