# Apps

An app is a container of data, and entities associated with the data. It has a load script that can combine data from different sources, for example Excel sheets and databases. Data is loaded into fields and tables, and associations are created between them.

Calculations on loaded data can be performed using generic objects containing hypercubes, listobjects and expressions. The generic objects are, together with other entities, persisted within the app.

In a Qlik Sense Enterprise environment, apps are stored in a database while they are stored as QVF files under _C:\Users\user name\Documents\Qlik\Sense\Apps_ in a Qlik Sense Desktop environment.

To retrieve an app, you can call the `openDoc` method on [global](global.md).

```javascript
global.openDoc( "docId" ).then( ( app ) => {
    // Continue working with the variable instance
} );
```


## Instance methods

This is a selection of commonly used methods, you can find a complete list in the Engine API reference.

**Engine API reference**
- Class: [App](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/AppClass/App-class.htm)
- Entity: [NxAppLayout](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/NxAppLayout.htm)
- Entity: [NxAppProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/NxAppProperties.htm)


### `app.setAppProperties( appProperties )`

- `appProperties` Object - application scoped properties

**Note:** In desktop mode, the `appProperties` structure can also contain dynamic properties.


### `app.getAppProperties()`

Returns a `Promise` which will be resolved with the app properties.

In a Qlik Sense Desktop environment, the returned structure can contain dynamic properties.
In a Qlik Sense Enterprise environment, only a few dynamic properties at app level are persisted. The persisted dynamic properties are the following:
- `modifiedDate`
- `published`
- `publishTime`
- `privileges`
- `description`
- `dynamicColor`


### `app.getAppLayout()`

Gets the evaluated properties of an app.


### `app.setScript( script )`

Sets the current load script.

- `script` String - Script content.

```javascript
const appName = "MyApp";
const scriptStr =
`LOAD * Inline [
Product,Cost
Water,1
];`;
return qix.openApp( appName ).then( ( app ) => {
     return app.setScript( scriptStr )
         .then( () => {
             return app.doReload();
         } )
         .then( () => {
             // Additional operations on the app
         } )
 } );
```


### `app.doReload()`

Reloads the current script set in an app.


## Related methods

The following methods are available on [global](global.md):

### `global.createApp`
**Syntax:** `global.createApp( appName )`

Creates an app with the given name. In a Qlik Sense Desktop environment, the name will also be the name of the QVF file and the same as `appId`. In a Qlik Sense Enterprise environment, the `appId` is generated and different from `appName`.

- `appName` String - Name of the app.

```javascript
global.createApp( appName ).then( ( app ) => {
    // App was created
    console.log( app.id );
} );
```

### `global.createSessionApp()`

Creates an empty session app. It is not persisted and cannot be saved. Everything created during a session app is non-persisted, for example objects and data connections.

```javascript
global.createSessionApp().then( ( app ) => {
    // App was created
} );
```

### `global.openDoc( appId )`

Opens an app and checks if the app needs to be migrated. If migration is needed, the app is migrated to the current version of Qlik Sense and then opened. If no migration is needed, the app is opened immediately.

- `appId` String - GUID in a Qlik Sense Enterprise environment. Path and name of the app in a Qlik Sense Desktop environment.

```javascript
global.openDoc( appId ).then( ( app ) => {
    // Continue working with app
} );
```

### `global.getDocList()`

Returns the list of apps. In a Qlik Sense Enterprise environment, only the apps available to the current user are returned. In a Qlik Sense Desktop environment, the apps located in _C:\Users\user name\Documents\Qlik\Sense\Apps_ are returned.

**Engine API reference**
- Entity: [DocListEntry](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/DocListEntry.htm)


```javascript
global.getDocList().then( ( appList ) => {
    // Got the app list
} );
```

### `global.deleteApp( appId )`

Deletes an app from the Qlik Sense repository or from the file system.

- `appId` String - GUID in a Qlik Sense Enterprise environment. Path and name of the app in a Qlik Sense Desktop environment.

```javascript
global.deleteApp( appId ).then( () => {
    // App was deleted
} );
```


## Saving changes


### Qlik Sense Desktop (does not apply for session apps)

After loading data, creating objects or making other changes to the app it needs to be saved in order to write the changes to the QVF file:

```javascript
global.openApp( appId ).then( ( app ) => {
    app.createObject( { /* ...objectProperties */ } ).then( () => {
        app.doSave();
    } );
} );
```


### Qlik Sense Enterprise

In a Qlik Sense Enterprise environment, changes will be saved automatically and does not require any method call.


