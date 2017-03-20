# Configuration

This section describes all the publicly available configuration parameters that
can be used with the enigma.js REST service.

| Property | Type   | Optional | Description |
|----------|--------|----------|-------------|
| `Promise` | Function | If environment supports ES6 promises | An ES6-compatible Promise implementation. |
| `host` | String | No | The host to connect against. |
| `port` | String | Yes | The port to connect against, defaults to 80 for unsecure connections, 443 for secure connections. |
| `headers` | Object | Yes | Key/value of additional headers to send in each request. |
| `services` | Array | Yes | A list of service entries (see below) to retrieve APIs for. |
| `unsecure` | Boolean | Yes | Whether to use HTTP, defaults to `false` (HTTPS). |
| `certs` | Object | In a browser, required in Node.js when `unsecure` is `false` | The certificates to use when connecting securely. |
| `certs.ca` | Array | No | An array of root certificates to validate certificates against. |
| `certs.cert` | Buffer | No | The client certificate to use. |
| `certs.key` | Buffer | No | The client key to use. |
| `handleLog` | Function | Yes | Traffic log listener. |

## Service entries

When defining the `services` array, each entry should follow the below configuration. A service identifier is the part of the URL defining the entry point for that service. In for example `/api/hub/v0`, `hub` is the service identifier.

| Property | Type   | Optional | Description |
|----------|--------|----------|-------------|
| id | String | No | The service identifier. |
| version | String | If undefined, `url` needs to be defined | The version of the API to use, e.g. `v1`. |
| url | String | Not used if `version` is defined | The absolute path, for example `/api/service/spec.json` to the OpenAPI definition. |
 
