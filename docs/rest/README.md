# REST

The REST service in enigma.js provides a way to retrieve auto-generated REST APIs.

The generated APIs are based on three criterias:

* The service provides an OpenAPI definition.
* The service identifier, based on the URL to the service.
* The service API version.

## Configuration

See the dedicated [Configuration](configuration.md) page.

## Usage

```js
const enigma = require('enigma.js');
const config = {
  host: '127.0.0.1',
  port: '4848',
};

enigma.getService('rest', config).then((svc) => {
  // svc.rest.get('/foo')
});
```
