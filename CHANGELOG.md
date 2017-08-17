# Changelog

## 2.0.0

This is a new major version and introduces some breaking changes. Please check the migration guide
and make sure you understand the impact on your application before upgrading.

See [migration guide](https://github.com/qlik-oss/enigma.js/blob/master/docs/migrate-v1.md).

### New features

- Interceptor concept publicly available. See [documentation](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#interceptors).
- Support for named QIX method parameters. See [documentation](https://github.com/qlik-oss/enigma.js/blob/master/docs/concepts.md#schemas-the-qix-interface).
- New optional module sense-utilities. See [documentation](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#sense-utilities-api).

### Notable changes

- No more product-specific configuration, 23 settings down to 8. See [documentation](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#configuration).
- Dropped enigma.js REST service. See [documentation](https://github.com/qlik-oss/enigma.js/blob/master/docs/migrate-v1.md#service-concept-dropped).
- File size is ~15 times smaller (around 7kb gzipped)
- Full control of session life-cycles. See [documentation](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#session-api).

## 1.2.1

- Bugfix related to suspend/resume, notification should be qSessionState (not qConnectedState).

## 1.2.0

### Features
- Suspend/Resume: It is now possible to suspend an resume qix sessions. See [session.md](https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/session.md#sessions).

## 1.1.1

### Features

- Logging (QIX/REST): It is now possible to (optionally) log traffic (request/response), this may be expanded to log other things in the future. See configuration entry `handleLog` for [QIX](docs/qix/configuration.md#config-object) and [REST](docs/rest/configuration.md#configuration).
- API types (QIX): All object APIs returned from enigma.js now exposes their generic type (e.g. `sheet`), and their "engine" type (e.g. `GenericObject`). They can be accessed using `api.genericType` and `api.type`.
- URL Parameters (QIX): You can now specify additional querystring parameters that should be added to the websocket URL by using `session.urlParams` configuration option. See [configuration documentation](docs/qix/configuration.md#configuration).
- New schema (QIX): A schema for version `3.2` has been added.
- Documentation (QIX): Added [documentation of the object API `.session` property](docs/qix/session.md), which (among other things) allows you to close apps.

### Deprecations

- Configuration (QIX): `config.session.reloadUri` in favor of `config.session.urlParams`.
- Configuration (QIX/REST): `config.unsecure` (default `false`) in favor of `config.secure` (default `true`).

## 1.1.0

Broken release. Do not use.

## 1.0.1

- Fix #5: Make / optional in prefix

## 1.0.0

Initial public release.
