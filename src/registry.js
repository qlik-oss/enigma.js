import extend from 'extend';
import KeyValueCache from './cache';

/* istanbul ignore next */
const assign = Object.assign || extend; // N.B Don't use deep in extend


/**
* Entry point for registry definitions. Pre-defined service definitions that allows you to connect
* and communicate with API endpoints can be added.
*/
class Registry {
  /**
  * Create a Registry object.
  */
  constructor() {
    this.services = new KeyValueCache();
  }

  /**
  * Registers a registry service definition with a given key.
  * @function Registry#registerService
  * @param {String} key Key to associate the defined service.
  * @param {Function} fn Function that sets up and connects you to an endpoint.
  */
  registerService(key, fn) {
    this.services.add(key, fn);
  }

  /**
  * Gets the API for a service endpoint.
  * @function Registry#getService
  * @param {String} key Key defining which registry definition to retrieve.
  * @param {...Object} configs Object literal containing connect parameters
  *                            for the requested endpoint. Look in each
  * service definition for more info.
  * @returns {Promise<Object>} A promise containing an instance for the requested
  *                            API if resolved, else an error is thrown.
  */
  getService(key, ...configs) {
    const config = assign({}, ...configs);
    const fn = this.services.get(key);
    return fn(config);
  }
}

export default Registry;
