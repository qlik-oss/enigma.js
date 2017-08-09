# Interceptors: Retry aborted

This example will show you how to write an interceptor that automatically retries
aborted QIX method calls. The QIX Engine may abort calls at any moment depending
on other calls (like selections) that may cause current calculations to become
invalid.

## Runnable code

* [Retry aborted](./retry-aborted.js)

## Documentation

* [Interceptors](/docs/api.md#interceptors)

---

[Back to examples](/examples/README.md#runnable-examples)
