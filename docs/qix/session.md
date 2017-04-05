# Sessions

All [instances](instances.md) contains a `session` property that can be used to control the life cycle of the underlying WebSocket.

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
`session.close()` | Closes the WebSocket | A promise that resolves once the web socket is closed |

## Events

### `closed` event

The `closed` event is sent when the WebSocket has been closed. A [CloseEvent](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) will be passed to the event listener.

```javascript
instance.session.on('closed', event => {
  // WebSocket was closed
});
```

### `notification` event

Notification events are sent by the [Qlik Sense Proxy Service (QPS)](https://help.qlik.com/en-US/sense-developer/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients.htm).

**Note:** Notification events are triggered by the Proxy and are thus only available on Qlik Sense Enterprise.

A client can register event listeners in one of two ways:

1. Single event

   ```javascript
   instance.session.on('notification:OnAuthenticationInformation', params => {
     // QPS sent a OnAuthenticationInformation event
     // 'params' - detailed event information, see QPS documentation
   });
   ```

2. All events

   ```javascript
   instance.session.on('notification:*', (event, params) => {
     // QPS sent a notification event
     // 'event' - the name of the event
     // 'params' - detailed event information, see QPS documentation
   });
   ```

### `socket-error` event

Called when a WebSocket error occurs. An `Error` is passed to the event listener.

```javascript
instance.session.on('socket-error', error => {
  // WebSocket error occured
});
```
