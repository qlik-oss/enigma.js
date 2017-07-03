# QIX Schemas

This folder contains schema files used by the QIX service. You should include the 
schema file from the folder matching your Qlik Sense version. 

Note that calling `global.getProductVersion()` will from version `3.0` and onward
return the version of QIX Engine and not the Qlik Sense. For example, Qlik Sense `3.1`
returns `4.10.0`.

From 12.20.0 and forward, the schema version should be mapped to the QIX Engine
API version, rather than a specific Qlik product release.
