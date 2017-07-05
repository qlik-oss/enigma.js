# Configuration

```javascript
const enigma = require('enigma.js');

const config = {};
enigma.create(config).open().then((global) => {
  //
});
```

## `config` object

The `config` object has the following parameters:

| Property | Type   | Optional | Description |
|----------|--------|----------|-------------|
| `schema` | Object | No | JSON containing the specification for the Qix API. Originates from an Engine build and is bound to a specific version of Engine |
| `url` | String | No | The URL |
| `delta` | Boolean | Yes | If set to `true`, delta protocol will be used which can reduce the bandwidth used, default is `true` |
| `mixins` | Array | Yes | Mixins to extend/augment the Engine API (see more on [Using mixins](mixins.md))
| `createSocket` | Function | In browser | A function to use when instantiating the WebSocket, mandatory for NodeJS |
| `Promise` | Promise | Yes | ES6-compatible Promise library, default is global `Promise` |
| `responseInterceptors` | Array | Yes | An array of objects containing `onFulfilled` and/or `onRejected` that can manipulate responses before reaching mixins and the end-user |
| `suspendOnClose` | Boolean | Yes | Set to true if the session should be suspended and not closed if the WebSocket is closed unexpectedly |

## SenseUtilities.buildUrl(sessionConfig)

The `sessionConfig` object has the following parameters:
| `host` | String | Yes | Default is `localhost` |
| `port` | Number | Yes | Default is `80` or `443` depending on HTTP protocol used |
| `secure` | Boolean | Yes | Set to `false` to use an unsecure WebSocket connection (`ws://`), default is `true` |
| `prefix` | String | Yes | Absolute base path to use when connecting, used for proxy prefixes |
| `route` | String | Yes | Initial route to open the WebSocket against, default is `app/engineData` |
| `urlParams` | Object | Yes | Additional parameters to be added to WebSocket URL |
| `subpath` | String | Yes | Subpath to use, used to connect to dataprepservice in a server environment |
| `identity` | String | Yes | Identity (session ID) to use |
| `ttl` | Number | Yes | A value in seconds that QIX Engine should keep the session alive after socket disconnect (only works if QIX Engine supports it) |

## Example using the browser

This example opens the app "AppId" in a Qlik Sense Enterprise environment located on `hostname.hostdomain.com`. It requires the user to already be authenticated.

```javascript
const enigma = require('enigma.js');
const SenseUtilities = require('enigma.js/dist/sense-utilities');
const schema = require('enigma.js/schemas/3.2/schema.json');
const appId = 'some-app.qvf';
const url = SenseUtilities.buildUrl({ appId, host: 'some.domain.com' });

const session = enigma.create({ schema, url });

session.on('notification:OnAuthenticationInformation', (authInfo) => {
  if(authInfo.mustAuthenticate) {
    location.href = authInfo.loginUri;
  }
});

session.open()
  .then((global) => global.openDoc(appId))
  .then((doc) => {});
```

## Example using NodeJS

This example opens the same app using the `ws` library (https://github.com/websockets/ws) and it uses the server certificates.

```javascript
const enigma = require('enigma.js');
const SenseUtilities = require('enigma.js/dist/sense-utilities');
const schema = require('enigma.js/schemas/3.2/schema.json');
const appId = 'some-app.qvf';
const url = SenseUtilities.buildUrl({ appId, host: 'some.domain.com' });
const certificateDir = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';

const config = {
  schema,
  url,
  createSocket: (url) => new WebSocket(url, {
    ca: [fs.readFileSync(path.resolve(certificateDir, 'root.pem'))],
    key: fs.readFileSync(path.resolve(certificateDir, 'client_key.pem')),
    cert: fs.readFileSync(path.resolve(certificateDir, 'client.pem')),
    headers: {
      'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`
    }
  }
}

enigma.create(config).open()
  .then((global) => global.openDoc(appId))
  .then((doc) => {});;
```
