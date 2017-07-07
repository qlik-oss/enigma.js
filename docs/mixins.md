# Mixins

[Back to API documentation](./api.md#mixins)

---

Table of contents

- [Introduction](#introduction)
- [API](#api)

---

## Introduction

The *mixin* concept allows you to add or overwrite QIX Engine API functionality. A mixin is basically a
JavaScript object with some of all of the properties shown in the [API](#api) below.

Generic types like for example `GenericObject`, `Doc`, `GenericBookmark`, are supported but also custom
`GenericObject` types such as `barchart`, `story` and `myCustomType`. An API will get both their
generic type as well as custom type mixins applied.

Mixins that are bound to several different types can find the current object type in the `customType`
or `type` members of the object. `this.type` would for instance return `GenericObject` and `this.customType`
would return `barchart`.

## API

```js
const docMixin = {
  /**
  * An array of strings specifying which api types this mixin applies to. It works with a single
  * string as well.
  */
  types: ['Doc'], // "Doc" type in QIX Engine is the document, also called app.

  /**
  * Initialization function. Called when an instance of the specified API(s) is created
  * before applying the mixins.
  * @param {Object} args - Object containing init parameters.
  * @param {Configuration} args.config - The enigma.js configuration.
  * @param {Object} args.api - The object instance that was just created.
  */
  init: (args) => {
    // Any initialization code goes here.
  },

  /**
  * Object literal containing methods that will be added to the API.
  * Already existing functions with the same name cannot be overridden.
  */
  extend: {
    /**
    * Simple tweeting function.
    */
    tweet: () => {
      console.log('This document is tweeting');
    },

    /**
    * This function already exist on the doc API and will therefore cause an exception when creating
    * the API.
    */
    getObject: () => {
      console.log('trying to override but it will not work');
    }
  },

  /**
  * Object literal containing methods that will be overwritten to already existing API methods.
  * An error is thrown if any of the specified methods does not exist.
  */
  override: {
    /**
    * Overriding the getObject function.
    * @param {Function} base - This is the original function that is being overridden.
    *                          Can be used in the override.
    * @param {*} params - The parameter list. When parameters are passed by name, enigma.js
    *                     will add default values for parameters not supplied by the caller.
    * @returns {Promise<Object|null>} A promise that when resolved contains the object asked
    *                                 for or null if object doesn't exist.
    */
    getObject: (base, ...params) => {
      // e.g. get object from cache, if exist and return a resolved promise, otherwise do this:
      return base(params);
    }
  }
};

const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
enigma
  .create({ schema, mixins: [docMixin], url: 'ws://localhost:9076/app/' })
  .open()
  .then(global => global.openDoc('my-document.qvf'))
  .then(doc => doc.tweet());
```

---

[Back to API documentation](./api.md#api-documentation)
