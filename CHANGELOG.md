# Changelog

## Unreleased

## 0.12.1

- Documentation updates
- Fix issue when using delta and parallel calls to the same method on the same handle

## 0.12.0

- Don't send `outKey` to Engine
- Rename `notifications` to `listeners` in config
- Allow custom response interceptors

## 0.11.0

- Rename events
- Always resolve with an object when calling `getService("qix", cfg)`
- Converted docs from HTML to markdown

## 0.10.0

- Better defaults for QIX config

## 0.9.0

- Remove eval() usages in dev build
- Downgrade webpack to latest stable version (1.13.1)
- Generate static HTML docs from markdown files
- JSDoc updates
- Documentation updates
- json-patch as a dev-dependency
- Add QIX schema for Sense 3.0

## 0.8.3

- Fix: make sure to handle primitive patches and primitive values

## 0.8.2

- Fix: safely set all patchees

## 0.8.1

- Fix: safely set a primitive patch

## 0.8.0

- Feature: set `disableCache` to true and you will get a new Session
- BREAKING CHANGE: change `socket` configuration to `session`.
- BREAKING CHANGE: expose `createSocket` in session configuration.

## 0.7.4

- Fix: cache primitive patches

## 0.7.3

- Chore: update `json-patch` dependency

## 0.7.2

- Feature: handle patching of multiple properties when `delta` is truthy

## 0.7.1

- Feature: emit `session-created`

## 0.7.0

- Feature: Reject all outstanding resolvers `onError` and `onClose`
- Fix: update `buildUrl` to work on IE
- Feature: Use webpack 2
- Refactor: Move schemas to separate folder `schemas`
- Fix: Use the configured Promise library in `processDataInterceptor`
- Docs: Update documentation
- Feature: Listen on notifications via configuration
- BREAKING CHANGE: Separate error events e.g `error-socket` and `error-qix`

## 0.6.0

- BREAKING CHANGE: Updated mixin signature

## 0.5.4

- Fix: updated dependencies for moving to a github repository

## 0.5.3

- Fix: Better handling for json-patching primitive types

## 0.5.2

- Fix: Error interceptor had no access to configured Promise

## 0.5.1

- Fix: Event handler issue

## 0.5.0

- BREAKING CHANGE: Rename public api methods to registerService and getService

## 0.4.0

- BREAKING CHANGE: Categorized the config object

* @param {Function} config.Promise - The promise constructor.
* @param {Function} config.WebSocket - The websocket constructor.
* @param {Object} config.definition - The JSON object describing the api.
* @param {String} [config.appId] - The app id.
* @param {Boolean} [config.delta=true] - The flag to enable/disable delta handling.
* @param {Boolean} [config.isSecure=false] - If a secure websocket should be used.
* @param {Object} [config.mixins=[]] - An array of mixins.
* @param {Object} [config.socket] - The socket configuration.
* @param {String} [config.socket.host] - Host address.
* @param {Number} [config.socket.port] - Port to connect to.
* @param {Object} [config.socket.certificates] - Object containing certificates needed to connect to a server.
* @param {Object} [config.socket.headers] - Object containing headers needed to read from engine.
* @param {String} [config.socket.prefix] - The prefix to the path.
* @param {String} [config.socket.subpath] - The subpath.
* @param {String} [config.socket.route] - The route.
* @param {String} [config.socket.identity] - The identity.
* @param {String} [config.socket.reloadURI] - The reloadURI.
*
* @example
* import comm from "sensei-communication"
* comm.getServiceApi( "qix", config ).then(...)

- Rename the public api methods to addService and getServiceApi to be more future proof

## 0.3.0

- Feature: Added mixin capability
- API for getGlobalAndApp changed. Appname is now provided in the config parameter instead.

## 0.2.4

- Fix: error event when open promise is unresolved always triggers uncaught errors

## 0.2.1

- Fix: Race condition/memory leak in old event listeners

## 0.2.0

- Feature: Added support for cleaning up old models once the socket has been closed

## 0.1.3

- Fix: Remove babel from dependencies

## 0.1.2

- Fix: Remove postinstall

## 0.1.1

- Fix: Generate package instead of generating files on installation
- Fix: RPC onError could yield in unhandled exception

## 0.1.0

- Initial release
