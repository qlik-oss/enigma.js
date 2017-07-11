# Changelog

## 1.3.1

- bug fix -essentially port back a fix from v2.0 such that engima marks the session as suspended at the place/point
           where the websocket is closed.


## 1.3.0

### Features

- Added QIX Engine API schema 12.20.0 (Sense Enterprise June 2017)

### Fixes

- Fixed an issue related to closing APIs while requests could be pending

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
