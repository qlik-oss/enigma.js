# Sessions

All [instances](instances.md) contains a `session` property that can be used to control the life cycle of the underlying WebSocket.

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
`session.close()` | Closes the WebSocket | A promise that resolves once the WebSocket is closed |
`session.suspend()` | Suspends the session | A promise that resolves once the session is suspended |
`session.resume([onlyIfAttached=false])` | Resumes a suspended session. If `onlyIfAttached` is set to true, resume will resolve only if the session can be re-attached. | A promise that resolves if the session is resumed (and rejects otherwise) |

## Events

### `closed` event

The `closed` event is sent when the WebSocket has been closed. A [CloseEvent](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) will be passed to the event listener.

```javascript
instance.session.on('closed', event => {
  // WebSocket was closed
});
```

### `notification` event

Notification events are sent when a JSONRPC notification is sent to enigma.js. These can be sent by for example [Qlik Sense Proxy Service (QPS)](https://help.qlik.com/en-US/sense-developer/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients.htm).

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

### `suspended` event

Called when the session is suspended. An `Object` containing the `initiator` of the suspension is passed to the event listener.

```javascript
instance.session.on('suspended', (data) => {
  // Session was suspended
  if (data.initiator === 'manual') {
    // The session was suspended due to a call to session.suspend()
  }

  if (data.initiator === 'network') {
    // The session was suspended due to a network problem
  }
});
```

### `resumed` event

Called when a session is resumed.

```javascript
instance.session.on('resumed', () => {
  // Session is resumed
});
```

### `traffic` events


1. Single direction

  Possible values: `traffic:sent`, `traffic:received`.

  ```javascript
  instance.session.on('traffic:sent', data => {
    // 'data' - JSONRPC request object
  });
  ```

  ```javascript
  instance.session.on('traffic:received', data => {
    // 'data' - JSONRPC response object
  });
  ```

2. All directions

 ```javascript
 instance.session.on('traffic:*', (direction, data) => {
   // 'direction' - the traffic direction, sent/received
   // 'data' - JSONRPC request or response, depending on direction
 });
 ```
