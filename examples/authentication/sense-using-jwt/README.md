# Authentication: Qlik Sense JSON Web Token (JWT)

This example will show you how to connect to a Qlik Sense Enterprise server using
JSON Web Tokens (JWT) for authentication. This is useful when creating services
in a Node.js environment that runs outside of the Qlik Sense Enterprise deployment.

Please note that JWTs are signed using a private key. Failure to keep this key secret
will lead to a serious security breach as JWTs can be used to impersonate _anyone_ in
your Qlik Sense Enterprise deployment.

## Prerequisites

To run this example, you need to ...

* ... use Qlik Sense Enterprise version June 2017 or later
* ... generate a private/public key pair for JWT signing and verification:
  * `openssl genrsa -out private.key 1024`
  * `openssl req -new -x509 -key private.key -out public.key`
* ... setup a virtual proxy that uses JWT authentication

Once these prerequisites are fulfilled, modify the code to match your environment
(highlighted with comments in the example code).

## Runnable code

* [JWT](./jwt.js)

## Documentation

* [Qlik Sense Help: JWT authentication](http://help.qlik.com/en-US/sense/June2017/Subsystems/ManagementConsole/Content/JWT-authentication.htm)
* [Qlik Sense Help: Creating a virtual proxy](http://help.qlik.com/en-US/sense/June2017/Subsystems/ManagementConsole/Content/create-virtual-proxy.htm)
* [JSON Web Token](https://jwt.io/)

---

[Back to examples](/examples/README.md#runnable-examples)
