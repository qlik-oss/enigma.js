# List Apps Example

NodeJS example that uses the QIX service to list apps. Requires Node > 4.0.0.

Run with:

```bash
npm install
node index.js
```

The example assumes it's run on the same machine as a Qlik Sense Enterprise installation. To run on another machine, export the certificates (http://help.qlik.com/en-US/sense/Subsystems/ManagementConsole/Content/export-certificates.htm), place them in a directory on the same machine where this example is run from and change the `certificateDir` variable to point to that directory. Also change the `session.host` and `session.port` variables to apropriate values.
