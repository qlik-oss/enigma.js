# Instances

When calling `getService` a QIX enigma.js service instance is returned. The `global` property of this instance is always accessible. This property can be used to call methods on the
[Global class](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GlobalClass/Global-class.htm).
Further instances with new methods to call are returned when you call methods such as `global.getObject`. The `object` instance is an instance of the
[GenericObject class](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericObjectClass/GenericObject-class.htm).

## Properties

### `session` property

The underlying session can be accessed from all instances. See [Session](session.md).

## Events

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
