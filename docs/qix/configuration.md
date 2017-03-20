# Configuration

```js
const enigma = require('enigma.js');

const config = {};
enigma.getService('qix', config).then((qix) => {
  //
});
```

## `config` object

The `config` object has the following parameters:

| Property | Type   | Optional | Description |
|----------|--------|----------|-------------|
| `schema` | Object | No | JSON containing the specification for the Qix API. Originates from an Engine build and is bound to a specific version of Engine |
| `appId` | String | Yes | Identifier for an app, if the Engine is running in a Qlik Sense Desktop environment, it is the name of the app including the full path -- omit to only get the global object |
| `noData` | Boolean | Yes | If set to `true`, the app will be opened without data, default is `false` |
| `delta` | Boolean | Yes | If set to `true`, delta protocol will be used which can reduce the bandwidth used, default is `true` |
| `mixins` | Array | Yes | Mixins to extend/augment the Engine API (see more on [Using mixins](mixins.md))
| `createSocket` | Function | In browser | A function to use when instantiating the WebSocket, mandatory for NodeJS |
| `Promise` | Promise | Yes | ES6-compatible Promise library, default is global `Promise` |
| `listeners` | Object | Yes | Key-value map of listeners that will be registered, listeners can be notifications (of the form `notification:OnSessionClosed`) or session events, read more about notifications that may be bound on https://help.qlik.com/en-US/sense-developer/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients.htm |
| `session` | Object | Yes | Session-specific parameters |
| `session.host` | String | Yes | Default is `localhost` |
| `session.port` | Number | Yes | Default is `80` or `443` depending on HTTP protocol used |
| `session.unsecure` | Boolean | Yes | Set to `true` to use an unsecure WebSocket connection (`ws://`), default is `false` |
| `session.prefix` | String | Yes | Absolute base path to use when connecting, used for proxy prefixes |
| `session.route` | String | Yes | Initial route to open the WebSocket against, default is `app/engineData` |
| `session.reloadURI` | String | Yes | URI which the browser can use to refresh the page after the WebSocket connection has been established |
| `session.subpath` | String | Yes | Subpath to use, used to connect to dataprepservice in a server environment |
| `session.identity` | String | Yes | Identity (session ID) to use |
| `session.disableCache` | String | Yes | Disable caching of sessions, set to `true` to create a new session every time |
| `handleLog` | Function | Yes | Traffic log listener. |

**Note:** Notifications are triggered by the Proxy and are thus only available on Qlik Sense Enterprise.

## `qix` object

The `qix` object retrieved when calling `getService('qix', config).then((qix) => {})` has the following properties:

* `qix.global` Object - The global instance
* `qix.app` Object (optional) - The opened app instance if `config.session.appId` was specified.


## Example using the browser

This example opens the app "AppId" in a Qlik Sense Enterprise environment located on `hostname.hostdomain.com`. It requires the user to already be authenticated.

```javascript
const schema = require('<path-to-schemas>/3.2/schema.json');

const config = {
  schema,
  appId: 'AppId',
  session: {
    host: 'hostname.hostdomain.com'
  },
  listeners: {
    'notification:OnAuthenticationInformation': (authInfo) => {
      if(authInfo.mustAuthenticate) {
        location.href = authInfo.loginUri;
      }
    }
  }
}
```

## Example using NodeJS

This example opens the same app using the `ws` library (https://github.com/websockets/ws) and it uses the server certificates.

```javascript
const schema = require('<path-to-schemas>/3.2/schema.json');
const certificateDir = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';
const config = {
  schema: schema,
  appId: 'AppId',
  session: {
    host: 'hostname.hostdomain.com'
  },
  createSocket: (url, sessionConfig) => {
    return new WebSocket(url, {
      ca: [fs.readFileSync(path.resolve(certificateDir, 'root.pem'))],
      key: fs.readFileSync(path.resolve(certificateDir, 'client_key.pem')),
      cert: fs.readFileSync(path.resolve(certificateDir, 'client.pem')),
      headers: {
        'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`
      }
    });
  }
}
```

The `X-Qlik-User` header contains the unique user ID of the authenticated user. The header has the following format:

```javascript
const userDirectory = 'MyUserDir';
const userID = 'MyId';
const wsOptions = {
  // ...
  headers: {
    "X-Qlik-User": `UserDirectory=${userDirectory};UserId=${userID}`
  }
};
```

Both `userDirectory` and `userID` must be URL-encoded representations of UTF-8 values.
