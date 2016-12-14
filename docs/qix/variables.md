# Variables

A variable is a container storing a static value or a calculation, for example a numeric or alphanumeric value and they provide an easy way of reusing complex expressions. Variables are stored in the app and defined either in the load script or by calling create methods. They can be used in expressions within the app, including measures, hypercubes and listobjects.

To retrieve a variable, you call any of the `getVariable` or the `getVariableById` methods on the [app](apps.md).

```javascript
app.getVariableById( "variableId" ).then( ( variable ) => {
    // Continue working with the variable
} );
```


## Instance methods

This is a selection of commonly used methods on the `Variable` instance, you can find the complete reference in the Engine API reference.

**Engine API reference**
- Class: [GenericVariable](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericVariableClass/GenericVariable-class.htm)
- Struct: [GenericVariableLayout](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericVariableLayout.htm)
- Struct: [GenericVariableProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericVariableProperties.htm)


### `variable.getLayout()`

Evaluates a variable and displays its properties including the dynamic properties.

```javascript
variable.getLayout().then( ( layout ) => {
    // Got the layout
} );
```


### `variable.getProperties()`

Gets the properties of a variable.

```javascript
variable.getProperties().then( ( properties ) => {
    // Got the properties
} );
```


### `variable.setProperties( properties )`

- `properties` Object - The property structure. See [GenericVariableProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericVariableClass/GenericVariable-class-SetProperties-method.htm#GenericVariableProperties) in Engine API.

Sets properties for a variable.

```javascript
variable.setProperties( properties ).then( ( properties ) => {
    // Properties was set
} );
```

## Listing variables

You can create a session object on the app to list the available variables.

```javascript
app.createSessionObject( {
    qVariableListDef: {
        qShowReserved: false,
        qShowConfig: false
    }, qInfo: {
        qId: "VariableList",
        qType: "VariableList"
    }
} ).then( ( list ) => {
    return list.getLayout();
} ).then( ( listLayout ) => {
    return listLayout.qVariableList.qItems;
} ).then( ( variableItems ) => {
   // Got the variable list
} );
```

**Engine API reference**
- Struct: [VariableListDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/VariableListDef.htm)
- Struct: [VariableList](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/VariableList.htm)


## Related methods

The following related methods are available on the [app](apps.md):

### `app.createVariableEx( properties )`

- `properties` Object - The property structure. See [GenericVariableProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/AppClass/App-class-CreateVariableEx-method.htm#GenericVariableProperties) in Engine API.

Creates a variable.

```javascript
app.createVariableEx().then( ( layout ) => {
    console.log( layout.myprop );
} );
```


### `app.getVariableById( id )`

- `id` - String - Identifier of the variable.

Gets the handle of a variable defined by its ID.

```javascript
app.getVariableById().then( ( variable ) => {
    // Continue working with the variable
} );
```

### `app.getVariableByName( name )`

- `name` - String - Name of the variable.

Gets the handle of a variable defined by its name.

```javascript
app.getVariableByName().then( ( layout ) => {
    console.log( layout.myprop );
} );
```

### `app.destroyVariableById( id )`

- `id` - String - Identifier of the variable.

Removes a variable defined by its ID.

```javascript
app.destroyVariableById().then( ( layout ) => {
    // Variable was destroyed
} );
```

### `app.destroyVariableByName( name )`

- `name` - String - Name of the variable.

Removes a variable defined by its name.

```javascript
app.destroyVariableByName().then( ( layout ) => {
    // Variable was destroyed
} );
```
