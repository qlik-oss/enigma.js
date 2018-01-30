import Session from './session';
import Schema from './schema';
import RPC from './rpc';
import SuspendResume from './suspend-resume';
import Intercept from './intercept';
import ApiCache from './api-cache';

/**
 * @typedef {Function} CreateWebSocket
 * @param {string} url The URL that should be used when instantiating the websocket.
 * @returns {Object} Returns an ES6-compatible WebSocket instance.
 */

/**
 * @typedef {object} Configuration
 * @param {object} schema Object containing the specification for the API to generate.
 *                        Corresponds to a specific version of the QIX Engine API.
 * @param {string} url String containing the QIX Engine websocket URL.
 * @param {CreateWebSocket} [createSocket] Optional in browsers. Function to invoke when
 *                                         instantiating websockets.
 * @param {Promise} [Promise] Optional when globally available. Should be an ES6-compatible
 *                            implementation of promise.
 * @param {boolean} [suspendOnClose=false] Whether to suspend the enigma.js session instead
 *                                         of closing it.
 * @param {Array} [mixins] An array of mixins to apply.
 * @param {Array} [requestInterceptors] An array of request interceptors to use.
 * @param {Array} [responseInterceptors] An array of response interceptors to use.
 * @param {object} [protocol] An object containing additional JSON-RPC request parameters.
 */

/**
* The enigma.js entry API.
*/
const enigma = {
  getSession(config) {
    const {
      createSocket,
      Promise,
      requestInterceptors,
      responseInterceptors,
      url,
    } = config;
    const apis = new ApiCache();
    const intercept = new Intercept({
      apis,
      Promise,
      request: requestInterceptors,
      response: responseInterceptors,
    });
    const rpc = new RPC({ createSocket, Promise, url });
    const suspendResume = new SuspendResume({ apis, Promise, rpc });
    const session = new Session({
      apis,
      config,
      intercept,
      rpc,
      suspendResume,
    });
    return session;
  },

  configureDefaults(config) {
    if (!config) {
      throw new Error('You need to supply a configuration.');
    }

    // eslint-disable-next-line no-restricted-globals
    if (!config.Promise && typeof Promise === 'undefined') {
      throw new Error('Your environment has no Promise implementation. You must provide a Promise implementation in the config.');
    }

    if (typeof config.createSocket !== 'function' && typeof WebSocket === 'function') {
      // eslint-disable-next-line no-undef
      config.createSocket = url => new WebSocket(url);
    }

    if (typeof config.suspendOnClose === 'undefined') {
      config.suspendOnClose = false;
    }

    config.protocol = config.protocol || {};
    config.protocol.delta = typeof config.protocol.delta !== 'undefined' ? config.protocol.delta : true;
    // eslint-disable-next-line no-restricted-globals
    config.Promise = config.Promise || Promise;
    config.mixins = config.mixins || [];
    config.definition = config.definition || new Schema(config);
  },

  /**
  * Function used to create a QIX session.
  * @since 2.0.0
  * @param {Configuration} config The configuration object for the QIX session.
  * @returns {Session} Returns a new QIX session.
  */
  create(config) {
    enigma.configureDefaults(config);
    config.mixins.forEach((mixin) => {
      config.definition.registerMixin(mixin);
    });
    return enigma.getSession(config);
  },
};

export default enigma;
