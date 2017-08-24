const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
const WebSocket = require('ws');

let ConfiguredPromise = null;

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
  init(args) {
    // Any initialization code goes here.
    console.log(`My mixin is being initialized on type ${args.api.type} with id ${args.api.id}`);
    // Store the Promise constructor so we can use it later:
    ConfiguredPromise = args.config.Promise;
  },

  /**
  * Object literal containing methods that will be added to the API.
  * Already existing functions with the same name cannot be overridden.
  */
  extend: {
    /**
    * Simple tweeting function.
    * @returns {Promise} A promise that when resolved means this mixin method
    *                    has completed.
    */
    tweet() {
      console.log('This document is tweeting');
      return ConfiguredPromise.resolve();
    },

    /**
    * This function already exist on the doc API and will therefore cause an exception when creating
    * the API.
    *
    * Uncomment to see the error enigma.js will throw if you try to overwrite an existing method.
    */
    /* getObject: () => {
      console.log('trying to override but it will not work');
    } */
  },

  /**
  * Object literal containing methods that will be overwritten to already existing API methods.
  * An error is thrown if any of the specified methods does not exist.
  */
  override: {
    /**
    * Overriding the createObject function.
    * @param {Function} base This is the original function that is being overridden.
    * @param {*} params The parameter list. When parameters are passed by name, enigma.js
    *                     will add default values for parameters not supplied by the caller.
    * @returns {Promise} A promise that when resolved contains the newly created
    *                    object, or rejected if object couldn't be created.
    */
    createObject(base, ...params) {
      console.log('Creating object with params:', params);
      return base(...params);
    },
  },
};

const session = enigma.create({
  schema,
  mixins: [docMixin],
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});

session.open()
  .then(global => global.createSessionApp())
  .then(doc => doc.tweet().then(() => doc.createObject({ qInfo: { qType: 'custom-type' } })))
  .then(object => console.log(`Created object with type ${object.genericType} and id ${object.id}`))
  .catch((error) => {
    console.log('Something went wrong:', error);
    process.exit(1);
  })
  .then(() => session.close());
