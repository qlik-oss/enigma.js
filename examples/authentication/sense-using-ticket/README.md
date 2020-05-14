# Authentication: Qlik Sense ticket

This example will show you how you use the Qlik Sense Enterprise root certificates
and the QPS API to retrieve a QLIK Ticket for the specified user.

When using tickets, enigma.js will connect through the Qlik Sense Proxy that has a
limitation of 5 concurrent sessions per user (and some cool-down time per closed 
session as well).

Please note that this approach uses root certificates that can be used to impersonate
_anyone_ in your Qlik Sense Enterprise deployment, be careful. It also bypasses the
Qlik Sense Proxy authentication/load-balancing.

## Prerequisites

To run this example you need to export certificates from your Sense Enterprise
deployment, this is possible to do either via API or through the QMC (PEM format).

Once you have the certificates, place them in this folder and modify the runnable
code with the appropriate parameters in `./config.js` (comments in the example code).

## Runnable code

* [Certificates](./ticket.js)

## Documentation

* [Qlik Sense Help: Exporting certificates](http://help.qlik.com/en-US/sense/June2017/Subsystems/ManagementConsole/Content/export-certificates.htm)
* [Qlik Sense Help: Certificate architecture](http://help.qlik.com/en-US/sense/June2017/Subsystems/PlanningQlikSenseDeployments/Content/Deployment/Server-Security-Authentication-Certificate-Trust-Architecture.htm)

---

[Back to examples](/examples/README.md#runnable-examples)
